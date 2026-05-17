import React, { useState, useEffect } from 'react';

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  city: string;
  state: string;
  price: string;
  category_name?: string;
  remaining_capacity: number;
}

interface DiscoveryProps {
  onSelectEvent: (id: number) => void;
  isActive?: boolean;
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

const getCategoryColor = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('music')) return '#a855f7'; // Purple
  if (cat.includes('comedy')) return '#f43f5e'; // Rose
  if (cat.includes('college')) return '#3b82f6'; // Blue
  if (cat.includes('tech')) return '#10b981'; // Emerald
  if (cat.includes('party')) return '#f59e0b'; // Amber
  if (cat.includes('function')) return '#6366f1'; // Indigo
  if (cat.includes('food')) return '#ef4444'; // Red
  return 'rgba(255,255,255,0.2)';
};

const getEventImage = (title: string, category: string) => {
  const text = `${title} ${category}`.toLowerCase();
  if (text.includes('music') || text.includes('concert')) return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800';
  if (text.includes('comedy')) return 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80&w=800';
  if (text.includes('college') || text.includes('fest')) return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800';
  if (text.includes('tech') || text.includes('summit')) return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800';
  if (text.includes('party') || text.includes('club')) return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
  if (text.includes('function') || text.includes('gala')) return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800';
  if (text.includes('food')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=800';
  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
};

const Discovery: React.FC<DiscoveryProps> = ({ onSelectEvent, isActive }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [citySearch, setCitySearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/categories/');
      const data = await res.json();
      setCategories(data);
    } catch (err) { console.error(err); }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      let url = ${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/events/';
      const params = new URLSearchParams();
      if (citySearch) params.append('search', citySearch);
      if (selectedCategory) params.append('category', selectedCategory);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await fetch(url);
      let data = await response.json();
      if (data.results) data = data.results;
      setEvents(data);
    } catch (err: any) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchCategories();
    fetchEvents();
  }, []);

  useEffect(() => {
    if (isActive) fetchEvents();
  }, [selectedCategory, isActive]);

  // Group events by category
  const groupedEvents = events.reduce((acc: any, event) => {
    const cat = event.category_name || 'Others';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(event);
    return acc;
  }, {});

  const isAdmin = localStorage.getItem('user_role') === 'admin';

  return (
    <div className={`discovery-grid-layout ${isAdmin ? 'admin-oversight-mode' : ''}`} style={{ 
        width: '100%', 
        height: '100%', 
        overflowY: 'auto', 
        padding: '2rem 0',
        position: 'relative'
    }}>
      {isAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.05) 1px, transparent 1px)', backgroundSize: '30px 30px', zIndex: 0 }} />
      )}

      <div className="discovery-header" style={{ marginBottom: '2rem', textAlign: 'center', padding: '0 2rem', position: 'relative', zIndex: 1 }}>
        <h1 style={{ 
            fontSize: isAdmin ? '4rem' : '3.5rem', 
            marginBottom: '1rem', 
            background: isAdmin ? 'linear-gradient(to right, #06b6d4, #6366f1)' : 'var(--gradient-3)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
            letterSpacing: isAdmin ? '-0.05em' : 'normal'
        }}>
          {isAdmin ? 'Global Experience Oversight' : 'Explore Your Next Experience'}
        </h1>
        
        {/* Modern Search Bar */}
        <div style={{ maxWidth: '700px', margin: '2rem auto', position: 'relative' }}>
          <input 
            type="text" 
            placeholder={isAdmin ? "Monitor specific events or creators..." : "Search events, cities, or locations..."} 
            value={citySearch} 
            onChange={(e) => setCitySearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchEvents()}
            style={{ 
                width: '100%', 
                padding: '1.2rem 2rem', 
                paddingRight: '6rem',
                borderRadius: '3rem', 
                background: 'rgba(255,255,255,0.05)', 
                border: isAdmin ? '1px solid #06b6d4' : '1px solid var(--border)', 
                color: 'white',
                fontSize: '1.1rem',
                backdropFilter: 'blur(10px)',
                boxShadow: isAdmin ? '0 10px 40px rgba(6, 182, 212, 0.2)' : '0 10px 30px rgba(0,0,0,0.2)'
            }}
          />
          <button 
            onClick={fetchEvents}
            className="btn-primary" 
            style={{ 
                position: 'absolute', 
                right: '0.5rem', 
                top: '0.5rem', 
                bottom: '0.5rem', 
                width: 'auto', 
                padding: '0 2rem', 
                borderRadius: '2.5rem',
                background: isAdmin ? '#06b6d4' : 'var(--primary)',
                border: 'none',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
            }}
          >
            Search
          </button>
        </div>

        {/* Category Pills */}
        <div className="category-pills" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <button 
                onClick={() => setSelectedCategory('')}
                style={{ 
                    padding: '0.6rem 1.5rem', 
                    borderRadius: '2rem', 
                    background: selectedCategory === '' ? 'var(--gradient-1)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                }}
            >
                All Experiences
            </button>
            {categories.map(cat => (
                <button 
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id.toString())}
                    style={{ 
                        padding: '0.6rem 1.5rem', 
                        borderRadius: '2rem', 
                        background: selectedCategory === cat.id.toString() ? 'var(--gradient-1)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border)',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {cat.name}
                </button>
            ))}
        </div>
      </div>

      <div className="discovery-content animate-fadeIn">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>Loading experiences...</div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <p style={{ textAlign: 'center', padding: '5rem', fontSize: '1.5rem', opacity: 0.5 }}>No events found. Try a different search!</p>
        ) : (
          Object.keys(groupedEvents).map(category => (
            <div key={category} className="category-section" style={{ marginBottom: '4rem' }}>
              <div style={{ padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '2rem', margin: 0 }}>{category}</h2>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
                <span style={{ opacity: 0.5 }}>{groupedEvents[category].length} events</span>
              </div>
              
              <div className="horizontal-scroll-container" style={{ padding: '0 2rem', overflowX: 'auto', display: 'flex', gap: '2rem', paddingBottom: '1rem' }}>
                {groupedEvents[category].map((event: Event) => {
                  const isToday = event.date.includes('2026-04-27');
                  const mockViewers = Math.floor(Math.random() * 50) + 12;
                  
                  return (
                    <div key={event.id} className="creative-event-card" style={{ minWidth: '350px', maxWidth: '350px' }} onClick={() => onSelectEvent(event.id)}>
                      <div className="card-image-wrapper">
                        <img src={getEventImage(event.title, event.category_name || '')} alt={event.title} />
                        <div className="card-category-badge" style={{ background: getCategoryColor(event.category_name || ''), color: 'white', border: 'none' }}>
                            {event.category_name || 'General'}
                        </div>
                        
                        {isToday && (
                          <div className="live-status-badge">
                            <span className="pulsing-dot"></span>
                            LIVE NOW
                          </div>
                        )}

                        <div className="card-viewers-badge">👥 {mockViewers} viewing</div>
                        <div className="card-price-overlay">₹{event.price}</div>
                      </div>
                      <div className="card-info">
                        <h3>{event.title}</h3>
                        <div className="card-meta">
                          <span>📅 {event.date}</span>
                          <span>🕒 {formatTime(event.time)}</span>
                          <span style={{ color: '#fb923c', fontWeight: 'bold' }}>🪑 {event.remaining_capacity} left</span>
                        </div>
                        <p className="card-description">{event.description.substring(0, 80)}...</p>
                        <button className="view-details-btn">Get Tickets &rarr;</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Discovery;
