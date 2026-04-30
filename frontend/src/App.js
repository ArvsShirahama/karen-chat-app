import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import { getCurrentUser } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await getCurrentUser();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <header className="header">
          <h1>💬 Karen Chat</h1>
          {user && (
            <button onClick={handleLogout}>Logout</button>
          )}
        </header>
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                user ? <RoomList /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/login" 
              element={
                !user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/register" 
              element={
                !user ? <Register onLogin={handleLogin} /> : <Navigate to="/" />
              } 
            />
            <Route 
              path="/room/:roomId" 
              element={
                user ? <ChatRoom /> : <Navigate to="/login" />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
