import React, { useState, useEffect } from 'react';

const HighDensityPulseChart: React.FC<{ data: Record<string, number>, color: string, label: string, eventTitle: string }> = ({ data, color, label, eventTitle }) => {
    const sortedDates = Object.keys(data).sort(); 
    const values = sortedDates.map(d => data[d]);
    const max = Math.max(...values, 1);
    
    return (
        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1.2rem', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#06b6d4' }}>{eventTitle}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: color }}>{values.reduce((a, b) => a + b, 0)}</div>
                    <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>TOTAL</div>
                </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', paddingBottom: '25px', position: 'relative' }}>
                {sortedDates.map(d => (
                    <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                        <div 
                            title={`${d}: ${data[d]} members`}
                            style={{ 
                                width: '100%', 
                                background: color, 
                                height: `${(data[d]/max) * 100}%`, 
                                borderRadius: '4px 4px 0 0',
                                transition: 'all 0.5s ease-out',
                                boxShadow: `0 4px 15px ${color === '#06b6d4' ? 'rgba(6, 182, 212, 0.3)' : (color === '#ef4444' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)')}`,
                                position: 'relative'
                            }} 
                        >
                            <div style={{ position: 'absolute', top: '-18px', width: '100%', textAlign: 'center', fontSize: '0.65rem', fontWeight: 'bold', color: color }}>
                                {data[d]}
                            </div>
                        </div>
                        <span style={{ position: 'absolute', bottom: '-20px', fontSize: '0.55rem', opacity: 0.3, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                            {d.split('-').slice(1).join('/')}
                        </span>
                    </div>
                ))}
                {sortedDates.length === 0 && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1, fontSize: '0.8rem' }}>
                        NO ACTIVITY
                    </div>
                )}
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'attendees' | 'organizers'>('attendees');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
    const [selectedUserForModal, setSelectedUserForModal] = useState<any>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/users/admin/stats/', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            });
            const data = await response.json();
            setStats(data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        if (!window.confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`)) return;
        try {
            const res = await fetch('http://localhost:8000/api/users/admin/stats/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ user_id: userId })
            });
            const data = await res.json();
            if (data.status === 'success') fetchStats();
        } catch (err) { console.error(err); }
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#020617' }}>
            <div className="loader"></div>
        </div>
    );

    const filteredUsers = (activeTab === 'attendees' ? stats?.attendees : stats?.organizers)?.filter((u: any) => 
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <div style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', padding: '2rem' }}>
            {/* CLEAN ADMIN HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                        Admin Terminal
                    </h1>
                    <p style={{ opacity: 0.5, marginTop: '0.5rem' }}>Full Control & Advanced Moderation</p>
                </div>
                <button onClick={onBack} className="btn-secondary" style={{ width: 'auto', padding: '0.8rem 1.5rem', borderRadius: '1rem' }}>
                    ← Back to App
                </button>
            </div>

            {/* PLATFORM METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Total Users', value: stats?.summary?.total_users, color: '#6366f1', icon: '👥' },
                    { label: 'Live Events', value: stats?.summary?.total_events, color: '#ec4899', icon: '🔥' },
                    { label: 'Total Bookings', value: stats?.summary?.total_bookings, color: '#10b981', icon: '🎫' },
                    { label: 'Revenue/GMV', value: `₹${stats?.summary?.total_revenue || '1.2M'}`, color: '#f59e0b', icon: '💰' }
                ].map((stat, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ fontSize: '2rem', background: `${stat.color}22`, padding: '1rem', borderRadius: '1rem' }}>{stat.icon}</div>
                        <div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.5, textTransform: 'uppercase' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: stat.color }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* TAB CONTROLS & SEARCH */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '0.4rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button 
                        onClick={() => { setActiveTab('attendees'); setExpandedUserId(null); }}
                        style={{ padding: '0.6rem 1.5rem', borderRadius: '0.8rem', border: 'none', background: activeTab === 'attendees' ? '#6366f1' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Attendees ({stats?.summary?.total_attendees})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('organizers'); setExpandedUserId(null); }}
                        style={{ padding: '0.6rem 1.5rem', borderRadius: '0.8rem', border: 'none', background: activeTab === 'organizers' ? '#6366f1' : 'transparent', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Organizers ({stats?.summary?.total_organizers})
                    </button>
                </div>
                <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1.5rem', borderRadius: '1rem', color: '#fff', width: '350px', outline: 'none' }}
                />
            </div>

            {/* USERS LIST (MODERN GRID) */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredUsers.map((user: any) => (
                    <div key={user.id} className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: expandedUserId === user.id ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.1)' }}>
                        <div 
                            onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                            style={{ padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 0.5fr', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(45deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {user.username[0].toUpperCase()}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{user.username}</div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>{user.email}</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                {activeTab === 'attendees' ? `${user.events_attended.length} Events Booked` : `${user.events_organized.length} Events Hosted`}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: user.is_active ? '#10b981' : '#ef4444' }} />
                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: user.is_active ? '#10b981' : '#ef4444' }}>
                                    {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '1.2rem' }}>
                                {expandedUserId === user.id ? '▴' : '▾'}
                            </div>
                        </div>

                        {expandedUserId === user.id && (
                            <div style={{ padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '3rem' }}>
                                    {/* USER STATS */}
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem' }}>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>TOTAL {activeTab === 'attendees' ? 'SPENT' : 'REVENUE'}</div>
                                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10b981' }}>₹{activeTab === 'attendees' ? user.total_spent : user.total_revenue}</div>
                                        </div>
                                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem' }}>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>ACCOUNT STATUS</div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(user.id, user.is_active); }}
                                                style={{ marginTop: '0.5rem', width: '100%', padding: '0.8rem', borderRadius: '0.6rem', border: 'none', background: user.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: user.is_active ? '#ef4444' : '#10b981', cursor: 'pointer', fontWeight: 'bold' }}
                                            >
                                                {user.is_active ? 'DEACTIVATE USER' : 'ACTIVATE USER'}
                                            </button>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedUserForModal(user); }}
                                            className="btn-primary" 
                                            style={{ padding: '1rem', borderRadius: '1rem' }}
                                        >
                                            📊 VIEW FULL AUDIT
                                        </button>
                                    </div>

                                    {/* ACTIVITY OVERVIEW CHART */}
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1.5rem' }}>
                                        <div style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Recent Performance Pulse</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                            <HighDensityPulseChart data={user.activity_by_day || {}} color="#6366f1" label="Booking Growth" eventTitle="Overall Activity" />
                                            <HighDensityPulseChart data={user.cancelled_activity_by_day || {}} color="#ef4444" label="Churn Activity" eventTitle="Cancellations" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* HISTORY MODAL (FULL AUDIT) */}
            {selectedUserForModal && (
                <div onClick={() => setSelectedUserForModal(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
                    <div 
                        className="glass-panel" 
                        style={{ maxWidth: '1000px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', position: 'relative' }} 
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '2rem' }}>{selectedUserForModal.username}'s History</h2>
                                <p style={{ opacity: 0.5 }}>Comprehensive Audit Log by Event</p>
                            </div>
                            <button onClick={() => setSelectedUserForModal(null)} className="btn-secondary" style={{ width: 'auto' }}>Close Audit</button>
                        </div>

                        <div style={{ display: 'grid', gap: '2rem' }}>
                            {(activeTab === 'attendees' ? selectedUserForModal.events_attended : selectedUserForModal.events_organized).map((ev: any, idx: number) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: '#6366f1' }}>{ev.title}</h3>
                                            <div style={{ fontSize: '0.8rem', opacity: 0.5 }}>Event Date: {ev.date}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10b981' }}>
                                                {activeTab === 'attendees' ? `₹${ev.total_price_paid}` : `${ev.tickets_sold} Sold`}
                                            </div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.4 }}>{activeTab === 'attendees' ? `${ev.total_quantity} Tickets` : `${ev.bookings_count} Bookings`}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                        <HighDensityPulseChart data={ev.daily_history || {}} color="#6366f1" label="Daily Sales Pulse" eventTitle={ev.title} />
                                        <HighDensityPulseChart data={ev.cancelled_history || {}} color="#ef4444" label="Cancellation Pulse" eventTitle={ev.title} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
