import React, { useState, useEffect } from 'react';

interface EventDetailsProps {
  eventId: number;
  onBack: () => void;
}

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0]);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const getEventImage = (title: string, category: string) => {
  const text = `${title} ${category}`.toLowerCase();
  
  if (text.includes('music') || text.includes('concert') || text.includes('dance') || text.includes('k-pop')) 
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1200';
  
  if (text.includes('comedy') || text.includes('standup') || text.includes('laugh') || text.includes('show')) 
    return 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80&w=1200';

  if (text.includes('college') || text.includes('university') || text.includes('campus') || text.includes('student') || text.includes('fest')) 
    return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1200';

  if (text.includes('tech') || text.includes('summit') || text.includes('startup') || text.includes('ai') || text.includes('expo')) 
    return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=1200';

  if (text.includes('party') || text.includes('club') || text.includes('dj') || text.includes('night')) 
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200';

  if (text.includes('function') || text.includes('gala') || text.includes('ceremony') || text.includes('event')) 
    return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200';
  
  if (text.includes('food') || text.includes('biryani') || text.includes('drinks')) 
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1200';
  
  if (text.includes('sport') || text.includes('marathon') || text.includes('run') || text.includes('fitness')) 
    return 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=1200';
  
  if (text.includes('flower') || text.includes('garden') || text.includes('culture') || text.includes('heritage')) 
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=1200';

  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1200';
};

const EventDetails: React.FC<EventDetailsProps> = ({ eventId, onBack }) => {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Booking state
  const [selectedTicketType, setSelectedTicketType] = useState<number | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const res = await fetch(`http://localhost:8000/api/events/${eventId}/`, { headers });
      if (!res.ok) throw new Error('Failed to load event details');
      const data = await res.json();
      setEvent(data);
      if (data.ticket_types && data.ticket_types.length > 0) {
        setSelectedTicketType(data.ticket_types[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const handleBook = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert("Please log in to book tickets.");
      return;
    }
    
    setBookingLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      // 1. Create Booking
      const bookingRes = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/bookings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          event: event.id,
          ticket_type: selectedTicketType,
          quantity: quantity
        })
      });
      
      const bookingData = await bookingRes.json();
      if (!bookingRes.ok) throw new Error(bookingData.error || 'Failed to book ticket');
      
      if (bookingData.status === 'confirmed') {
        setSuccessMsg(`Ticket Confirmed! Your ID is ${bookingData.digital_ticket_id}`);
        setBookingLoading(false);
        return;
      }
      
      // 2. Automate Mock Payment Verification (No popups)
      const verifyRes = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/payments/verify-payment/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: `order_mock_${bookingData.id}`, // the backend expects this for mock
          razorpay_payment_id: 'pay_mock_direct',
          razorpay_signature: 'mock_signature'
        })
      });
      
      if (verifyRes.ok) {
        setSuccessMsg('Booking Confirmed! 🚀 (Mock Payment Processed)');
        fetchEvent(); 
      } else {
        throw new Error('Verification failed');
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // Removed handleStripePay as per user request to revert to simple mock mode

  if (loading) return <div style={{padding: '2rem', color: 'white'}}>Loading Event...</div>;
  if (!event) return <div style={{padding: '2rem', color: 'white'}}>Event not found</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', color: 'white', maxHeight: '95vh', overflowY: 'auto', width: '100%', zIndex: 10 }}>
      <button onClick={onBack} style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.1)', padding: '0.5rem 1rem', borderRadius: '4px', border: 'none', color: 'white', cursor: 'pointer' }}>&larr; Back to Discovery</button>
      
      <div className="glass-panel" style={{ padding: '0', borderRadius: '2rem', overflow: 'hidden' }}>
        <div style={{ width: '100%', height: '300px', overflow: 'hidden', position: 'relative' }}>
            <img 
                src={getEventImage(event.title, event.category_name || '')} 
                alt={event.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                {event.category_name || 'Event'}
            </div>
        </div>
        
        <div style={{ padding: '2rem' }}>
            <h1 style={{ margin: '0 0 1rem 0', fontSize: '2.5rem' }}>{event.title}</h1>
            <p style={{ opacity: 0.8 }}>📅 {event.date} at {formatTime(event.time)}</p>
            <p style={{ opacity: 0.8 }}>📍 {event.location}, {event.city}</p>
            
            {event.average_rating > 0 && (
              <p style={{ color: '#fbbf24', fontWeight: 'bold' }}>⭐ {event.average_rating.toFixed(1)} / 5</p>
            )}
            
            <div style={{ marginTop: '2rem' }}>
              <h3>About this event</h3>
              <p style={{ lineHeight: '1.6' }}>{event.description}</p>
            </div>
            
            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '2rem 0' }} />
            
            <h3>Book Tickets</h3>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            {successMsg && <p style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '0.5rem' }}>{successMsg}</p>}
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '1rem' }}>
              <select 
                value={selectedTicketType || ''} 
                onChange={(e) => setSelectedTicketType(Number(e.target.value))}
                style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
              >
                {event.ticket_types?.map((tt: any) => (
                  <option key={tt.id} value={tt.id} style={{color: 'black'}}>
                    {tt.name} - ₹{tt.price} ({tt.quantity_available} left)
                  </option>
                ))}
              </select>
              
              <input 
                type="number" 
                min="1" 
                max="10" 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', width: '80px' }}
              />
              
              <button 
                onClick={handleBook} 
                disabled={bookingLoading || !selectedTicketType}
                style={{ padding: '0.75rem 2rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {bookingLoading ? 'Processing...' : 'Book Ticket'}
              </button>
            </div>

            {event.ratings && event.ratings.length > 0 && (
              <div style={{ marginTop: '3rem' }}>
                <h4>Attendee Reviews</h4>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                    {event.ratings.map((r: any) => (
                    <div key={r.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontWeight: 'bold' }}>{r.user_name}</span>
                            <span style={{ color: '#fbbf24' }}>{'⭐'.repeat(r.score)}</span>
                        </div>
                        <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>{r.feedback}</p>
                    </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
