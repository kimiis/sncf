import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirection de la racine vers home */}
        <Route path="/" element={<Navigate to="/home" />} />
        
        {/* Pages publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Page principale accessible à tous */}
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;
