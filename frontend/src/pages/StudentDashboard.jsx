import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { Calendar, PlayCircle, CheckCircle, Ticket } from 'lucide-react';

const StudentDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(data.events || []);
      setRegisteredIds(data.registeredEventIds || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegister = async (eventId) => {
    try {
      const res = await fetch(`http://localhost:3000/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setRegisteredIds([...registeredIds, eventId]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'live') return '#ef4444';
    if (status === 'upcoming') return '#eab308';
    return '#10b981';
  };

  return (
    <Layout title="Student Dashboard">
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
        Discover and join live interactive sessions.
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <Ticket size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>No events available</h3>
          <p>Check back later for upcoming sessions.</p>
        </div>
      ) : (
        <div className="grid-cols-1 md:grid-cols-3">
          {events.map(ev => {
            const isRegistered = registeredIds.includes(ev.id);
            
            return (
              <div key={ev.id} className="glass-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: getStatusColor(ev.status) }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.1)', padding: '4px 12px', 
                    borderRadius: '12px', fontSize: '0.75rem', 
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: getStatusColor(ev.status), fontWeight: 'bold'
                  }}>
                    {ev.status}
                  </span>
                  {isRegistered && (
                    <span style={{ 
                      background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', 
                      borderRadius: '12px', fontSize: '0.75rem', 
                      color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      <CheckCircle size={12} /> Registered
                    </span>
                  )}
                </div>
                
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '8px' }}>{ev.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ev.description}
                </p>
                
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} />
                  {new Date(ev.start_time).toLocaleString()}
                </div>
                
                <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                  {!isRegistered && ev.status !== 'ended' ? (
                    <button onClick={() => handleRegister(ev.id)} style={{ 
                      flex: 1, padding: '8px', background: 'var(--accent-primary)', 
                      color: 'white', border: 'none', 
                      borderRadius: '6px', cursor: 'pointer'
                    }}>
                      Register Now
                    </button>
                  ) : null}
                  
                  {isRegistered && ev.status === 'live' && (
                    <button onClick={() => navigate(`/event/${ev.id}`)} style={{ 
                      flex: 1, padding: '8px', background: 'rgba(239, 68, 68, 0.1)', 
                      color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', 
                      borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                    }}>
                      <PlayCircle size={16} /> Join Live Session
                    </button>
                  )}
                  
                  {isRegistered && ev.status === 'upcoming' && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', width: '100%', padding: '8px' }}>
                      Waiting to start...
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default StudentDashboard;
