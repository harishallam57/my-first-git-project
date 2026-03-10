import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Pages Placeholder
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import EventRoom from './pages/EventRoom';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  
  return children;
};

// Main Routing logic
const AppRouter = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        
        {/* Dashboards routing */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              {user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />}
            </ProtectedRoute>
          } 
        />
        
        {/* Live Event Viewer */}
        <Route 
          path="/event/:id" 
          element={
            <ProtectedRoute>
              <EventRoom />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
