import React, { useState, useEffect } from 'react';

const getEventImage = (title: string, category: string) => {
  const text = `${title} ${category}`.toLowerCase();
  
  if (text.includes('music') || text.includes('concert') || text.includes('dance') || text.includes('k-pop') || text.includes('singing')) 
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800';
  
  if (text.includes('comedy') || text.includes('standup') || text.includes('laugh') || text.includes('show')) 
    return 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80&w=800';

  if (text.includes('college') || text.includes('university') || text.includes('campus') || text.includes('fest')) 
    return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800';

  if (text.includes('tech') || text.includes('summit') || text.includes('startup') || text.includes('ai') || text.includes('expo')) 
    return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800';

  if (text.includes('party') || text.includes('club') || text.includes('dj') || text.includes('night') || text.includes('dance')) 
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';

  if (text.includes('function') || text.includes('gala') || text.includes('ceremony') || text.includes('event')) 
    return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800';
  
  if (text.includes('food') || text.includes('biryani') || text.includes('drinks') || text.includes('dinner')) 
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800';
  
  if (text.includes('sport') || text.includes('marathon') || text.includes('run') || text.includes('fitness')) 
    return 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800';
  
  if (text.includes('flower') || text.includes('garden') || text.includes('culture') || text.includes('heritage')) 
    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=800';

  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
};

const BookingsList: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState<Record<number, { score: number, feedback: string, loading: boolean }>>({});
  const [showTicket, setShowTicket] = useState<any>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/bookings/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      let data = await res.json();
      if (data.results) data = data.results;
      setBookings(data);
      
      const initialRatings: any = {};
      data.forEach((b: any) => {
        initialRatings[b.id] = { score: 5, feedback: '', loading: false };
      });
      setRatingData(initialRatings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this booking? You will be fully refunded.")) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/bookings/${id}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');
      
      alert(data.status || 'Booking cancelled successfully. Refund initiated.');
      fetchBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRemove = async (id: number) => {
    if (!window.confirm("Remove this booking from your history?")) return;
    
    try {
      const res = await fetch(`http://localhost:8000/api/bookings/${id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to remove booking');
      
      fetchBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRate = async (booking: any) => {
    const data = ratingData[booking.id];
    if (!data) return;

    setRatingData(prev => ({ ...prev, [booking.id]: { ...prev[booking.id], loading: true } }));
    
    try {
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/ratings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          event: booking.event_details.id,
          score: data.score,
          feedback: data.feedback
        })
      });
      
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || resData[0] || 'Failed to submit rating');
      
      alert("Thank you for your feedback!");
      setRatingData(prev => ({ ...prev, [booking.id]: { ...prev[booking.id], feedback: '', loading: false, submitted: true } }));
    } catch (err: any) {
      if (err.message.includes("already rated")) {
          setRatingData(prev => ({ ...prev, [booking.id]: { ...prev[booking.id], loading: false, submitted: true } }));
          alert("You have already submitted feedback for this event!");
      } else {
          alert(err.message);
          setRatingData(prev => ({ ...prev, [booking.id]: { ...prev[booking.id], loading: false } }));
      }
    }
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter(b => {
    if (!b.event_details) return true; // Keep deleted events in history/upcoming depending on your choice, let's put them in past usually, or assume upcoming
    const eventDate = new Date(b.event_details.date);
    return eventDate >= now;
  });

  const pastBookings = bookings.filter(b => {
    if (!b.event_details) return false;
    const eventDate = new Date(b.event_details.date);
    return eventDate < now;
  });

  const renderBookingCard = (b: any, isPast: boolean) => (
    <div key={b.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '0', borderRadius: '2rem', overflow: 'hidden', marginBottom: '2rem' }}>
      <div style={{ height: '150px', width: '100%', overflow: 'hidden' }}>
        <img 
            src={getEventImage(b.event_details?.title || '', b.event_details?.category_name || '')} 
            alt={b.event_details?.title || 'Event'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div style={{ padding: '0 2rem 2rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>{b.event_details?.title || 'Deleted Event'}</h3>
            <p style={{ opacity: 0.7, marginBottom: '1rem' }}>📍 {b.event_details?.location || 'N/A'}, {b.event_details?.city || ''}</p>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span style={{ padding: '0.25rem 0.75rem', background: 'rgba(255,255,255,0.1)', borderRadius: '1rem' }}>🎟️ {b.ticket_type_details?.name || 'Ticket'} x {b.quantity}</span>
              <span style={{ padding: '0.25rem 0.75rem', background: b.status === 'confirmed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)', color: b.status === 'confirmed' ? '#10b981' : '#f43f5e', borderRadius: '1rem', fontWeight: 'bold' }}>
                {b.status.toUpperCase()}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>₹{b.total_price}</p>
            <p style={{ fontSize: '0.75rem', opacity: 0.5 }}>Ticket ID: {b.digital_ticket_id?.split('-')[0]}</p>
          </div>
        </div>

        {/* ONLY SHOW FEEDBACK FOR PAST CONFIRMED EVENTS */}
        {isPast && b.status === 'confirmed' && b.event_details && (
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            {ratingData[b.id]?.submitted ? (
                <p style={{ color: '#10b981', margin: 0, fontWeight: 'bold' }}>✅ Feedback submitted! Thank you.</p>
            ) : (
                <>
                    <h4 style={{ marginBottom: '1rem' }}>Rate your experience</h4>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      <select 
                        value={ratingData[b.id]?.score || 5} 
                        onChange={(e) => setRatingData(prev => ({ ...prev, [b.id]: { ...prev[b.id], score: Number(e.target.value) } }))}
                        style={{ padding: '0.5rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid var(--border)', color: 'white' }}
                      >
                        {[5, 4, 3, 2, 1].map(s => <option key={s} value={s} style={{color: 'black'}}>{'⭐'.repeat(s)} ({s})</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="How was the event?"
                        value={ratingData[b.id]?.feedback || ''}
                        onChange={(e) => setRatingData(prev => ({ ...prev, [b.id]: { ...prev[b.id], feedback: e.target.value } }))}
                        style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#0f172a', border: '1px solid var(--border)', color: 'white', minWidth: '150px' }}
                      />
                      <button 
                        onClick={() => handleRate(b)}
                        disabled={ratingData[b.id]?.loading}
                        style={{ width: 'auto', padding: '0.5rem 1.5rem', background: 'var(--gradient-1)', border: 'none', borderRadius: '0.5rem', color: 'white', fontWeight: 'bold' }}
                      >
                        {ratingData[b.id]?.loading ? '...' : 'Submit'}
                      </button>
                    </div>
                </>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          {b.status === 'confirmed' ? (
            <button 
              onClick={() => handleCancel(b.id)}
              style={{ width: 'auto', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid #f43f5e', padding: '0.5rem 1.5rem', borderRadius: '0.5rem' }}
            >
              Cancel Ticket
            </button>
          ) : (
            <button 
              onClick={() => handleRemove(b.id)}
              style={{ width: 'auto', background: 'rgba(255, 255, 255, 0.05)', color: 'white', border: '1px solid var(--border)', padding: '0.5rem 1.5rem', borderRadius: '0.5rem' }}
            >
              Remove from History
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) return <div style={{padding: '2rem', color: 'white'}}>Loading Bookings...</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'white', maxHeight: '95vh', overflowY: 'auto', width: '100%', zIndex: 10 }}>
      <h2 style={{ marginBottom: '3rem', fontSize: '2.5rem', background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>My Bookings Dashboard</h2>
      
      {bookings.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ fontSize: '1.2rem', opacity: 0.6 }}>You haven't booked any events yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
          
          {/* LEFT SIDE: UPCOMING EVENTS */}
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              ⏳ Upcoming Experiences
            </h3>
            {upcomingBookings.length === 0 ? (
                <p style={{ opacity: 0.5 }}>No upcoming events.</p>
            ) : (
                upcomingBookings.map(b => renderBookingCard(b, false))
            )}
          </div>

          {/* RIGHT SIDE: PAST EVENTS & FEEDBACK */}
          <div>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '2rem', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              ✅ Past Events & Feedback
            </h3>
            {pastBookings.length === 0 ? (
                <p style={{ opacity: 0.5 }}>No past events.</p>
            ) : (
                pastBookings.map(b => renderBookingCard(b, true))
            )}
          </div>

        </div>
      )}

      {/* EXPLORE MORE SECTION */}
      <div className="glass-panel" style={{ marginTop: '5rem', padding: '4rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', background: 'var(--gradient-3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Explore Your Next Experience
        </h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.6, marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem auto' }}>
          Don't stop here! There are hundreds of amazing events happening around you. Find your next favorite memory today.
        </p>
        <button 
          onClick={() => window.location.reload()} // App.tsx handles the actual view switch, but a reload or simple state change is needed if not passing setter
          style={{ width: 'auto', padding: '1rem 3rem', fontSize: '1.1rem', fontWeight: 'bold', background: 'var(--gradient-1)', border: 'none', borderRadius: '3rem', color: 'white', cursor: 'pointer', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)' }}
        >
          Discover More Events
        </button>
      </div>
    </div>
  );
};

export default BookingsList;
