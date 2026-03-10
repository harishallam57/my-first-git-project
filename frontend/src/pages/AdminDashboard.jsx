import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, Calendar, PlayCircle, CheckCircle } from 'lucide-react';

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', start_time: '' });
  
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newEvent)
      });
      if (res.ok) {
        setShowModal(false);
        setNewEvent({ title: '', description: '', start_time: '' });
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/events/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) fetchEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    if (status === 'live') return '#ef4444'; // red
    if (status === 'upcoming') return '#eab308'; // yellow
    return '#10b981'; // green
  };

  return (
    <Layout title="Admin Dashboard">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your events and broadcast live sessions.</p>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlusCircle size={18} />
          Create Event
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading events...</div>
      ) : events.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <Calendar size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3>No events found</h3>
          <p>Create your first event to get started.</p>
        </div>
      ) : (
        <div className="grid-cols-1 md:grid-cols-3">
          {events.map(ev => (
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
                {ev.status === 'upcoming' && (
                  <button onClick={() => updateStatus(ev.id, 'live')} style={{ 
                    flex: 1, padding: '8px', background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', 
                    borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                  }}>
                    <PlayCircle size={16} /> Go Live
                  </button>
                )}
                {ev.status === 'live' && (
                  <>
                    <button onClick={() => navigate(`/event/${ev.id}`)} style={{ 
                      flex: 1, padding: '8px', background: 'var(--accent-primary)', 
                      color: 'white', border: 'none', 
                      borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                    }}>
                       Broadcast Room
                    </button>
                    <button onClick={() => updateStatus(ev.id, 'ended')} style={{ 
                      flex: 1, padding: '8px', background: 'rgba(255, 255, 255, 0.1)', 
                      color: 'white', border: '1px solid var(--glass-border)', 
                      borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px'
                    }}>
                       End
                    </button>
                  </>
                )}
                {ev.status === 'ended' && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={16} color="#10b981" /> Event Completed
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Setup for Create Event */}
      {showModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', 
          zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' 
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Title</label>
                <input required type="text" className="input-field" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Description</label>
                <textarea required className="input-field" rows={3} value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label className="input-label">Start Time</label>
                <input required type="datetime-local" className="input-field" value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" className="btn-primary">Create Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
