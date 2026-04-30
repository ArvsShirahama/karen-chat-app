import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoom, getMessages, sendMessage, setupSupabaseSubscription } from '../services/api';

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadRoomData = async () => {
      try {
        setLoading(true);
        const [roomData, messagesData] = await Promise.all([
          getRoom(roomId),
          getMessages(roomId),
        ]);
        setRoom(roomData);
        setMessages(messagesData);
        
        const userRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/auth/profile/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          localStorage.setItem('user', JSON.stringify(userData));
        }
      } catch (error) {
        console.error('Error loading room:', error);
        setError('Failed to load room. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    };
    loadRoomData();
    
    // Set up realtime subscription
    const cleanup = setupSupabaseSubscription({
      onNewMessage: (newMessageData) => {
        if (newMessageData.room_id === parseInt(roomId)) {
          setMessages((prev) => {
            // Check if message already exists
            if (prev.some((m) => m.id === newMessageData.id)) {
              return prev;
            }
            return [...prev, {
              id: newMessageData.id,
              content: newMessageData.content,
              sender: {
                id: newMessageData.sender_id,
                username: newMessageData.sender_username,
              },
              created_at: newMessageData.created_at,
            }];
          });
        }
      },
    });

    return () => cleanup();
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const message = await sendMessage(roomId, newMessage.trim());
      
      // Optimistically add message
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;

  if (loading) {
    return <div className="loading">Loading chat...</div>;
  }

  if (error) {
    return (
      <div className="chat-container">
        <div className="chat-header">
          <button onClick={() => navigate('/')}>← Back</button>
          <h3>Error</h3>
        </div>
        <div className="empty-state">
          <h3>Something went wrong</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={() => navigate('/')}>← Back</button>
        <h3>{room?.name || 'Chat Room'}</h3>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender.id === currentUserId ? 'own' : 'other'}`}
            >
              {message.sender.id !== currentUserId && (
                <div className="sender">{message.sender.username}</div>
              )}
              <div>{message.content}</div>
              <div className="time">{formatTime(message.created_at)}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="message-input-container">
        <input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button type="submit" disabled={sending || !newMessage.trim()}>
          {sending ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default ChatRoom;
