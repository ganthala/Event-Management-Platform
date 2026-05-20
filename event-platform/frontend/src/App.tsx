import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import Discovery from './components/Discovery';
import EventDetails from './components/EventDetails';
import BookingsList from './components/BookingsList';
import OrganizerDashboard from './components/OrganizerDashboard';
import NearbyEvents from './components/NearbyEvents';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('access_token'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('user_role'));
  const [view, setView] = useState<'auth' | 'discovery' | 'event' | 'bookings' | 'organizer' | 'nearby' | 'admin'>(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const isAdmin = localStorage.getItem('is_admin') === 'true' || role === 'admin';
    if (token) {
      return isAdmin ? 'admin' : 'discovery';
    }
    return 'auth';
  });
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(profileData => {
        const isAdmin = !!(profileData.is_staff || profileData.is_superuser || profileData.role === 'admin');
        const userRole = isAdmin ? 'admin' : (profileData.role || 'attendee');
        
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('is_admin', isAdmin ? 'true' : 'false');
        localStorage.setItem('username', profileData.username);
        
        setUserRole(userRole);
        if (isAdmin && location.pathname !== '/dashboard/admin') {
          setView('admin');
          navigate('/dashboard/admin');
        }
      })
      .catch(err => {
        console.error("Profile sync failed:", err);
      });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('user_role');
    const isAdmin = localStorage.getItem('is_admin') === 'true' || role === 'admin';
    
    setIsAuthenticated(!!token);
    setUserRole(role);

    if (location.pathname === '/dashboard/admin') {
      if (token && isAdmin) {
        setView('admin');
      } else {
        navigate('/', { replace: true });
        setView(token ? 'discovery' : 'auth');
      }
    } else {
      if (view === 'admin') {
        navigate('/dashboard/admin');
      }
    }
  }, [location.pathname, view, navigate]);

  const handleSelectEvent = (id: number) => {
    setSelectedEventId(id);
    setView('event');
  };

  const handleBackToDiscovery = () => {
    setSelectedEventId(null);
    setView('discovery');
    navigate('/');
  };

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      // Logout logic
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      localStorage.removeItem('is_admin');
      localStorage.removeItem('username');
      setIsAuthenticated(false);
      setUserRole(null);
      setView('auth');
      navigate('/');
      alert('Logged out successfully');
    } else {
      // Toggle login view
      if (view === 'auth') {
        setView('discovery');
        navigate('/');
      } else {
        setView('auth');
        navigate('/');
      }
    }
  };

  return (
    <>
      <div style={{ position: 'absolute', top: '1rem', right: '2rem', zIndex: 1000, display: 'flex', gap: '1rem' }}>
        {isAuthenticated && userRole === 'admin' && view !== 'admin' && (
          <button 
            style={{ width: 'auto', padding: '0.5rem 1rem', background: '#dc2626', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '4px'}}
            onClick={() => setView('admin')}
          >
            🛡️ Admin Panel
          </button>
        )}

        {isAuthenticated && userRole === 'organizer' && view !== 'organizer' && (
          <button 
            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'var(--gradient-1)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '4px'}}
            onClick={() => setView('organizer')}
          >
            Organizer Panel
          </button>
        )}

        {isAuthenticated && userRole !== 'organizer' && userRole !== 'admin' && view !== 'bookings' && (
          <button 
            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.8)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '4px'}}
            onClick={() => setView('bookings')}
          >
            My Bookings
          </button>
        )}

        {isAuthenticated && userRole !== 'organizer' && userRole !== 'admin' && view !== 'nearby' && (
          <button 
            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(239, 68, 68, 0.8)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '4px'}}
            onClick={() => setView('nearby')}
          >
            📍 Near My Location
          </button>
        )}
        
        {isAuthenticated && (view === 'bookings' || view === 'nearby') && (
          <button 
            style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '4px'}}
            onClick={() => setView('discovery')}
          >
            Back to Map
          </button>
        )}

        <button 
          style={{ width: 'auto', padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border)', color: 'white', cursor: 'pointer', borderRadius: '4px'}}
          onClick={handleAuthButtonClick}
        >
          {isAuthenticated ? 'Logout' : (view === 'auth' ? 'Back to App' : 'Login / Register')}
        </button>
      </div>

      {view === 'auth' && <AuthForm onAuthSuccess={(token, role) => { 
        setIsAuthenticated(true); 
        setUserRole(role);
        const isAdmin = localStorage.getItem('is_admin') === 'true' || role === 'admin';
        if (isAdmin) {
          setView('admin');
          navigate('/dashboard/admin');
        } else {
          setView('discovery');
          navigate('/');
        }
      }} />}
      
      {/* Persist Discovery Map in background to maintain filters and map position */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: view === 'discovery' ? 1 : 0, 
        zIndex: view === 'discovery' ? 5 : -1, 
        pointerEvents: view === 'discovery' ? 'auto' : 'none' 
      }}>
        <Discovery onSelectEvent={handleSelectEvent} isActive={view === 'discovery'} />
      </div>
      
      {view === 'bookings' && (
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <BookingsList />
        </div>
      )}

      {view === 'organizer' && (
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <OrganizerDashboard onBack={handleBackToDiscovery} />
        </div>
      )}

      {view === 'nearby' && (
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <NearbyEvents onSelectEvent={handleSelectEvent} />
        </div>
      )}

      {view === 'admin' && (
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <AdminDashboard onBack={handleBackToDiscovery} />
        </div>
      )}
      
      {view === 'event' && selectedEventId && (
        <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>
          <EventDetails eventId={selectedEventId} onBack={handleBackToDiscovery} />
        </div>
      )}
    </>
  );
}

export default App;
