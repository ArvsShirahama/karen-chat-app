import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRooms, createRoom } from '../services/api';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getMyRooms();
      setRooms(data);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    setCreating(true);
    try {
      const room = await createRoom(newRoomName);
      setNewRoomName('');
      navigate(`/room/${room.id}`);
    } catch (error) {
      console.error('Error creating room:', error);
      alert('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleEnterRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  if (loading) {
    return <div className="loading">Loading rooms...</div>;
  }

  return (
    <div>
      <form onSubmit={handleCreateRoom} className="create-room-form">
        <input
          type="text"
          placeholder="New room name..."
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          disabled={creating}
        />
        <button type="submit" disabled={creating || !newRoomName.trim()}>
          {creating ? 'Creating...' : 'Create'}
        </button>
      </form>

      <div className="room-list">
        {rooms.length === 0 ? (
          <div className="empty-state">
            <h3>No rooms yet</h3>
            <p>Create your first chat room above!</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="room-item"
              onClick={() => handleEnterRoom(room.id)}
            >
              <h3>{room.name}</h3>
              <p>Created by {room.created_by.username}</p>
              {room.members_count > 0 && (
                <span className="badge">{room.members_count} members</span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RoomList;
