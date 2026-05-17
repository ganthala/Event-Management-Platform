import React, { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import Discovery from './components/Discovery';
import EventDetails from './components/EventDetails';
import BookingsList from './components/BookingsList';
import OrganizerDashboard from './components/OrganizerDashboard';
import NearbyEvents from './components/NearbyEvents';
import AdminDashboard from './components/AdminDashboard';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('access_token'));
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('user_role'));
  const [view, setView] = useState<'auth' | 'discovery' | 'event' | 'bookings' | 'organizer' | 'nearby' | 'admin'>(
    !!localStorage.getItem('access_token') ? 'discovery' : 'auth'
  );
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  useEffect(() => {
    // Check initial auth state on load just in case it changes
    setIsAuthenticated(!!localStorage.getItem('access_token'));
    setUserRole(localStorage.getItem('user_role'));
  }, []);

  const handleSelectEvent = (id: number) => {
    setSelectedEventId(id);
    setView('event');
  };

  const handleBackToDiscovery = () => {
    setSelectedEventId(null);
    setView('discovery');
  };

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      // Logout logic
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
      setView('auth');
      alert('Logged out successfully');
    } else {
      // Toggle login view
      if (view === 'auth') setView('discovery');
      else setView('auth');
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

      {view === 'auth' && <AuthForm onAuthSuccess={() => { 
        setIsAuthenticated(true); 
        setUserRole(localStorage.getItem('user_role'));
        setView('discovery'); 
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
