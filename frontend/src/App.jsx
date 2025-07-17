import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Favorites from "./pages/Favorites";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import api from "./services/axios";
import { FavoritesProvider } from './context/FavoritesContext';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      });
    }
  }, []);

  return (
    <FavoritesProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute user={user} />}>
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/favorites" element={<Favorites user={user} />} />
            <Route path="/profile" element={<Profile user={user} />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </FavoritesProvider>
  );
}

export default App;
