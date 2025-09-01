// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Rooms from './pages/Rooms';
import MyBookings from './pages/MyBookings';
import AdminRooms from './pages/AdminRooms';
import AdminBookings from './pages/AdminBookings';
import AdminUsers from './pages/AdminUsers';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import About from './pages/About';


export default function App() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top navigation on every page */}
      <NavBar />

      {/* Page content */}
      <main className="flex-1">
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} /> 
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated user pages */}
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Admin-only pages */}
          <Route
            path="/admin/rooms"
            element={
              <ProtectedRoute role="Admin">
                <AdminRooms />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute role="Admin">
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute role="Admin">
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* 404 fallback — must be last */}
          <Route path="*" element={<div className="container-p py-10">Sidan finns inte.</div>} />
        </Routes>
      </main>

      {/* Global footer */}
      <Footer />
    </div>
  );
}
