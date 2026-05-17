import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to update map view when coordinates change
const MapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 13);
    }, [center, map]);
    return null;
};
const getEventImage = (title: string, category: string) => {
  const text = `${title} ${category}`.toLowerCase();
  if (text.includes('music') || text.includes('concert')) return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800';
  if (text.includes('comedy')) return 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?auto=format&fit=crop&q=80&w=800';
  if (text.includes('college') || text.includes('fest')) return 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800';
  if (text.includes('tech') || text.includes('summit')) return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800';
  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let h = parseInt(hours);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
};

// Helper component to handle manual clicks on the map
const MapEvents: React.FC<{ onLocationSelect: (lat: number, lon: number) => void }> = ({ onLocationSelect }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const OrganizerDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [events, setEvents] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'events' | 'analytics'>('events');
  const [showForm, setShowForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  
  const [selectedEventStats, setSelectedEventStats] = useState<any>(null);
  const [statsEventName, setStatsEventName] = useState('');

  const [formData, setFormData] = useState({
    title: '', description: '', date: '', time: '18:00:00',
    location: '', city: '', state: 'Karnataka', price: '0',
    capacity: '100', category: '',
    latitude: '', longitude: ''
  });

  const [isGeocoding, setIsGeocoding] = useState(false);

  const geocodeAddress = async () => {
    if (!formData.location || !formData.city) {
        alert("Please enter a Venue Name and City first!");
        return;
    }
    
    setIsGeocoding(true);
    try {
      const query = `${formData.location}, ${formData.city}`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon
        }));
      } else {
        const cityQuery = `${formData.city}`;
        const cityRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(cityQuery)}&limit=1`);
        const cityData = await cityRes.json();
        
        if (cityData && cityData.length > 0) {
            setFormData(prev => ({
                ...prev,
                latitude: cityData[0].lat,
                longitude: cityData[0].lon
            }));
        } else {
            alert("❌ Could not find this location. Please check the spelling.");
        }
      }
    } catch (err) {
      console.error("Geocoding failed", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [catRes, eventRes, analyticRes] = await Promise.all([
        fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/categories/', { headers }),
        fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/events/?mine=true', { headers }),
        fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/analytics/', { headers })
      ]);
      const catData = await catRes.json();
      setCategories(catData);
      let eventData = await eventRes.json();
      if (eventData.results) eventData = eventData.results;
      setEvents(eventData);
      const analyticData = await analyticRes.json();
      setAnalytics(analyticData);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchEventSpecificStats = async (eventId: number, eventTitle: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/analytics/?event_id=${eventId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedEventStats(data);
      setStatsEventName(eventTitle);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const url = editingEventId ? `http://localhost:8000/api/events/${editingEventId}/` : ${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/events/';
      const method = editingEventId ? 'PATCH' : 'POST';
      
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity) || 0,
        category: parseInt(formData.category) || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) { setShowForm(false); setEditingEventId(null); fetchData(); }
      else {
        const errData = await res.json();
        alert('Error: ' + JSON.stringify(errData));
      }
    } catch (err) { alert('Failed to save event'); }
  };

  const handleEdit = (event: any) => {
    setEditingEventId(event.id);
    setFormData({
      title: event.title, 
      description: event.description || '', 
      date: event.date, 
      time: event.time,
      location: event.location || '', 
      city: event.city || '', 
      state: event.state || '',
      price: event.price.toString(), 
      capacity: event.capacity.toString(), 
      category: event.category ? event.category.toString() : '',
      latitude: event.latitude ? event.latitude.toString() : '',
      longitude: event.longitude ? event.longitude.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://localhost:8000/api/events/${id}/`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'white' }}>Loading Dashboard...</div>;

  return (
    <div className="organizer-layout" style={{ height: '100%', overflowY: 'auto', padding: '2rem', color: 'white' }}>
      {/* Header section... same as before */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ fontSize: '3rem', margin: 0, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Control Center
          </h1>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={() => setView('events')} className={view === 'events' ? 'view-tab active' : 'view-tab'}>My Events</button>
            <button onClick={() => setView('analytics')} className={view === 'analytics' ? 'view-tab active' : 'view-tab'}>Global Performance</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onBack} className="btn-secondary" style={{ width: 'auto' }}>&larr; Back</button>
            <button onClick={() => { 
                setEditingEventId(null); 
                setFormData({ title: '', description: '', date: '', time: '18:00:00', location: '', city: '', state: '', price: '0', capacity: '100', category: '' });
                setShowForm(true); 
            }} className="btn-primary" style={{ width: 'auto' }}>+ New Event</button>
        </div>
      </div>

      {view === 'analytics' && analytics && (
        <div className="analytics-view animate-fadeIn" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
            <div className="left-stats">




                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3>Itemized Performance Audit</h3>
                    <div style={{ marginTop: '2rem', display: 'grid', gap: '1rem' }}>
                        <div className="event-row-header" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.5fr', padding: '0 1.5rem', opacity: 0.5, fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <span>Event Name</span>
                            <span>Revenue</span>
                            <span>Members</span>
                            <span>Rating</span>
                            <span></span>
                        </div>
                        {analytics.event_breakdown.map((e: any) => (
                            <div key={e.id} className="event-row-analytic" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 0.5fr', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1.2rem', alignItems: 'center' }}>
                                <span style={{ fontWeight: 'bold' }}>{e.title}</span>
                                <span style={{ color: '#10b981' }}>₹{e.revenue.toLocaleString()}</span>
                                <span style={{ color: '#a855f7' }}>{e.members} m</span>
                                <span style={{ color: '#fbbf24' }}>⭐ {e.rating}</span>
                                <button onClick={() => fetchEventSpecificStats(e.id, e.title)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>📊</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


        </div>
      )}

      {view === 'events' && (
        <div className="events-section animate-fadeIn">
            <h2 style={{ marginBottom: '1.5rem' }}>
                Experiences Managed by <span style={{ color: 'var(--primary)' }}>@{localStorage.getItem('username') || 'Organizer'}</span> ({events.length})
            </h2>
            <div className="organizer-event-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                {events.map(event => (
                <div key={event.id} className="creative-event-card">
                    <div className="card-image-wrapper">
                        <img src={getEventImage(event.title, event.category_name || '')} alt={event.title} />
                        <div className="card-category-badge">{event.category_name || 'General'}</div>
                        <div className="card-price-overlay">₹{event.price}</div>
                    </div>
                    <div className="card-info">
                        <h3>{event.title}</h3>
                        <div className="card-meta">
                            <span>📅 {event.date}</span>
                            <span>🕒 {formatTime(event.time)}</span>
                            <span style={{ color: '#fb923c', fontWeight: 'bold' }}>🪑 {event.remaining_capacity} Vacant</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                            <button onClick={() => handleEdit(event)} className="btn-edit" style={{ flex: 1 }}>Edit</button>
                            <button onClick={() => fetchEventSpecificStats(event.id, event.title)} className="btn-edit" style={{ flex: 1, background: 'rgba(45, 212, 191, 0.1)', borderColor: 'rgba(45, 212, 191, 0.3)', color: '#2dd4bf' }}>📊 Stats</button>
                            <button onClick={() => handleDelete(event.id)} className="btn-delete" style={{ width: 'auto' }}>🗑️</button>
                        </div>
                    </div>
                </div>
                ))}
            </div>
        </div>
      )}

      {/* PER-EVENT DETAILED STATS MODAL */}
      {selectedEventStats && (
        <div className="modal-overlay" onClick={() => setSelectedEventStats(null)}>
            <div className="modal-content glass-panel animate-fadeIn" style={{ maxWidth: '900px', width: '90%', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }} onClick={e => e.stopPropagation()}>
                <div className="modal-left">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ margin: 0 }}>{statsEventName} Performance</h2>
                        <button onClick={() => setSelectedEventStats(null)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>Close</button>
                    </div>

                    <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <div className="stat-card glass-panel" style={{ padding: '1rem' }}>
                            <span className="stat-label">Isolated Revenue</span>
                            <span className="stat-value" style={{ fontSize: '1.3rem' }}>₹{selectedEventStats.summary.total_revenue.toLocaleString()}</span>
                        </div>
                        <div className="stat-card glass-panel" style={{ padding: '1rem' }}>
                            <span className="stat-label">Member Involved</span>
                            <span className="stat-value" style={{ fontSize: '1.3rem' }}>{selectedEventStats.summary.total_members}</span>
                        </div>
                        <div className="stat-card glass-panel" style={{ padding: '1rem' }}>
                            <span className="stat-label">Quality Score</span>
                            <span className="stat-value" style={{ fontSize: '1.3rem' }}>⭐ {selectedEventStats.engagement.avg_rating.toFixed(1)}</span>
                        </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                        <h4 style={{ marginBottom: '1.5rem' }}>Members Participated (X) vs Date (Y)</h4>
                        <div className="chart-container" style={{ display: 'grid', gap: '1rem' }}>
                            {selectedEventStats.history.map((h: any, i: number) => {
                                const maxH = Math.max(...selectedEventStats.history.map((x: any) => x.count), 1);
                                return (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 40px', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{h.day}</span>
                                        <div style={{ height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div className="chart-bar-horizontal" style={{ width: `${(h.count / maxH) * 100}%`, height: '100%', background: 'var(--gradient-3)', borderRadius: '4px', transition: 'width 1s ease-out' }}></div>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{h.count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="modal-right">
                    <h3 style={{ marginBottom: '1.5rem' }}>Review Comments</h3>
                    <div style={{ display: 'grid', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                        {selectedEventStats.review_feed.length === 0 ? (
                            <p style={{ opacity: 0.5, textAlign: 'center', padding: '2rem' }}>No reviews yet.</p>
                        ) : (
                            selectedEventStats.review_feed.map((r: any) => (
                                <div key={r.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '1rem', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 'bold' }}>@{r.user}</span>
                                        <span style={{ color: '#fbbf24' }}>⭐ {r.score}</span>
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>"{r.feedback}"</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ marginBottom: '2rem' }}>{editingEventId ? 'Edit Experience' : 'Publish New Experience'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Experience Title</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Mega Music Concert" />
              </div>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Description</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe your amazing event..." style={{ width: '100%', minHeight: '100px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.8rem', color: 'white', padding: '1rem' }} />
              </div>

              <div className="form-group">
                <label>Date</label>
                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              
              <div className="form-group">
                <label>Time (24-Hour Format)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select 
                    required 
                    value={formData.time.split(':')[0]} 
                    onChange={e => setFormData({...formData, time: `${e.target.value}:${formData.time.split(':')[1] || '00'}:00`})}
                    style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.8rem', color: 'white' }}
                  >
                    <option value="" disabled style={{color: 'black'}}>Hour</option>
                    {[...Array(24)].map((_, i) => (
                        <option key={i} value={i.toString().padStart(2, '0')} style={{color: 'black'}}>
                            {i.toString().padStart(2, '0')}
                        </option>
                    ))}
                  </select>
                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>:</span>
                  <select 
                    required 
                    value={formData.time.split(':')[1] || '00'} 
                    onChange={e => setFormData({...formData, time: `${formData.time.split(':')[0] || '18'}:${e.target.value}:00`})}
                    style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.8rem', color: 'white' }}
                  >
                    {['00', '15', '30', '45'].map(m => (
                        <option key={m} value={m} style={{color: 'black'}}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Base Price (₹)</label>
                <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>

              <div className="form-group">
                <label>Capacity</label>
                <input type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <label style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>Venue & Map Location</label>
                    {formData.latitude && (
                        <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '1rem' }}>
                            📍 Location Pinned
                        </span>
                    )}
                </div>
                
                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* ROW 1: VENUE */}
                    <input 
                        required 
                        value={formData.location} 
                        onChange={e => setFormData({...formData, location: e.target.value})} 
                        placeholder="Venue Name (e.g. Palace Grounds)" 
                        style={{ width: '100%' }}
                    />
                    
                    {/* ROW 2: CITY & STATE */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City" />
                        <input required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} placeholder="State" />
                    </div>

                    {/* ROW 3: SEARCH BUTTON */}
                    <button 
                        type="button" 
                        onClick={geocodeAddress}
                        disabled={isGeocoding}
                        style={{ 
                            width: '100%',
                            padding: '0.8rem',
                            background: isGeocoding ? 'rgba(255,255,255,0.1)' : 'rgba(99, 102, 241, 0.1)', 
                            color: isGeocoding ? 'white' : 'var(--primary)', 
                            border: '1px solid var(--primary)', 
                            borderRadius: '0.8rem', 
                            cursor: isGeocoding ? 'default' : 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold'
                        }}
                    >
                        {isGeocoding ? 'Searching Map...' : '🔍 Find Venue on Map'}
                    </button>
                </div>

                {/* INTERACTIVE MAP PICKER - MOVED BELOW */}
                <div style={{ height: '350px', width: '100%', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)', background: '#0f172a', position: 'relative', zIndex: 1 }}>
                    <MapContainer 
                        center={[parseFloat(formData.latitude) || 20.5937, parseFloat(formData.longitude) || 78.9629]} 
                        zoom={formData.latitude ? 15 : 4} 
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {formData.latitude && formData.longitude && (
                            <>
                                <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} />
                                <MapUpdater center={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} />
                            </>
                        )}
                        <MapEvents onLocationSelect={(lat, lon) => {
                            setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lon.toString() }));
                        }} />
                    </MapContainer>
                </div>
                <small style={{ opacity: 0.6, display: 'block', marginTop: '0.8rem', textAlign: 'center' }}>
                    Click the button above to auto-search, or **click the map directly** to place a pin.
                </small>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Category</label>
                <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '0.8rem', color: 'white' }}>
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingEventId ? 'Update Experience' : 'Publish Experience'}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
