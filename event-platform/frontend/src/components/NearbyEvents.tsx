import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon path issues with Webpack/Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to update map view when coordinates change
const MapUpdater: React.FC<{ center: { lat: number, lon: number } }> = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center.lat && center.lon) {
            map.setView([center.lat, center.lon], 13);
            map.invalidateSize();
        }
    }, [center, map]);
    return null;
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

interface NearbyEventsProps {
  onSelectEvent: (id: number) => void;
}

const NearbyEvents: React.FC<NearbyEventsProps> = ({ onSelectEvent }) => {
  const [nearbyEvents, setNearbyEvents] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [radius, setRadius] = useState<number>(50);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  const fetchNearbyEvents = async (lat: number, lon: number, rad: number) => {
    setLoadingNearby(true);
    try {
      const res = await fetch(`http://localhost:8000/api/events/nearby/?lat=${lat}&lon=${lon}&radius=${rad}`);
      const data = await res.json();
      setNearbyEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingNearby(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setUserLocation([lat, lon]);
          fetchNearbyEvents(lat, lon, radius);
        },
        (err) => {
          setLocationError('Please enable location permissions to see events near you.');
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  }, []);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value);
    setRadius(newRadius);
    if (userLocation) {
        fetchNearbyEvents(userLocation[0], userLocation[1], newRadius);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', color: 'white', maxHeight: '95vh', overflowY: 'auto', width: '100%', zIndex: 10 }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '3rem', background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>
        📍 Happening Near You
      </h2>
      <p style={{ textAlign: 'center', opacity: 0.7, marginBottom: '2rem' }}>Discover amazing experiences within {radius}km of your current location.</p>
      
      {/* RADIUS SLIDER */}
      <div style={{ maxWidth: '600px', margin: '0 auto 3rem auto', background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontWeight: 'bold' }}>Search Radius</span>
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{radius} km</span>
        </div>
        <input 
            type="range" 
            min="5" 
            max="200" 
            step="5"
            value={radius} 
            onChange={handleRadiusChange}
            style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
        />
      </div>

      {locationError && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: '#fbbf24', fontSize: '1.2rem', marginBottom: '1rem' }}>⚠️ {locationError}</p>
            <p style={{ opacity: 0.6 }}>Check your browser's address bar to manually allow location access, then refresh the page.</p>
        </div>
      )}
      
      {loadingNearby && !userLocation && (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
            <div className="pulsing-dot" style={{ display: 'inline-block', width: '20px', height: '20px', marginRight: '1rem' }}></div>
            <span style={{ fontSize: '1.2rem' }}>Scanning your area...</span>
        </div>
      )}
      
      {!locationError && userLocation && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: '600px' }}>
          
          {/* LEFT: INTERACTIVE MAP */}
          <div style={{ borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--border)', background: '#0f172a' }}>
            <MapContainer center={userLocation} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapUpdater center={userLocation} />
              {/* User Location Indicator - RED */}
              <Marker 
                position={userLocation} 
                icon={L.divIcon({
                    className: 'user-marker',
                    html: '<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })}
              >
                <Popup><b>📍 You are here</b></Popup>
              </Marker>
              <Circle center={userLocation} radius={radius * 1000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.05, weight: 1 }} />
              
              {/* Event Markers */}
              {nearbyEvents.map(event => event.latitude && event.longitude && (
                <Marker key={event.id} position={[event.latitude, event.longitude]}>
                  <Popup className="custom-popup">
                    <div style={{ width: '200px' }}>
                        <img 
                            src={getEventImage(event.title, event.category_name || '')} 
                            alt={event.title}
                            style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }}
                        />
                        <strong style={{ fontSize: '1.1rem', display: 'block', marginBottom: '4px' }}>{event.title}</strong>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>
                            📅 {event.date}<br/>
                            📍 {event.location || event.city}
                        </div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>{(event.description || '').substring(0, 60)}...</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>₹{event.price}</span>
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelectEvent(event.id);
                                }}
                                style={{
                                    background: 'var(--gradient-1)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}
                            >
                                Details
                            </button>
                        </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* RIGHT: EVENT CARDS */}
          <div style={{ overflowY: 'auto', paddingRight: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {loadingNearby && (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Updating list...</div>
            )}
            
            {!loadingNearby && nearbyEvents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'white' }}>No Events Found Nearby 📍</h3>
                    <p style={{ fontSize: '1.1rem', opacity: 0.7, marginBottom: '1.5rem' }}>
                        We couldn't find any events within **{radius}km** of your current location.
                    </p>
                    <div style={{ background: 'rgba(251, 146, 60, 0.1)', padding: '1rem', borderRadius: '0.8rem', border: '1px solid rgba(251, 146, 60, 0.2)', fontSize: '0.9rem', color: '#fb923c', textAlign: 'left' }}>
                        <strong>Why can't I see my event?</strong>
                        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.2rem' }}>
                            <li style={{ marginBottom: '0.4rem' }}><b>Radius:</b> Increase the <b>Search Radius</b> slider above to <b>200km</b>.</li>
                            <li><b>Coordinates:</b> Make sure you clicked <b>"Find on Map"</b> in the Organizer Dashboard so your event is pinned!</li>
                        </ul>
                    </div>
                </div>
            )}
            
            {!loadingNearby && nearbyEvents.length > 0 && nearbyEvents.map(event => (
              <div key={event.id} className="glass-panel" onClick={() => onSelectEvent(event.id)} style={{ display: 'flex', gap: '1.5rem', padding: '1rem', borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ width: '140px', height: '140px', flexShrink: 0, borderRadius: '0.5rem', overflow: 'hidden', position: 'relative' }}>
                  <img src={getEventImage(event.title, event.category_name || '')} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: 'var(--gradient-1)', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 'bold' }}>
                      {event.category_name || 'General'}
                  </div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ fontSize: '1.4rem', margin: '0 0 0.5rem 0', color: 'white', lineHeight: '1.2' }}>{event.title}</h3>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '1.2rem' }}>₹{event.price}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.8rem' }}>
                      <span>📅 {event.date}</span>
                      <span style={{ color: '#fb923c', fontWeight: 'bold' }}>📍 {event.city}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, lineHeight: '1.4' }}>{(event.description || '').substring(0, 100)}...</p>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '0.6rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
                          View Details &rarr;
                      </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyEvents;
