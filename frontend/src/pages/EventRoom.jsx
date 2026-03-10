import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { ArrowLeft, Users, MessageSquare, Send, MonitorPlay } from 'lucide-react';

const EventRoom = () => {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  
  const [eventData, setEventData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');
  const [participants, setParticipants] = useState(0); // Approximate
  
  const messagesEndRef = useRef(null);

  // Fetch Event Details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/events/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setEventData(data);
        } else {
          navigate('/'); // redirect if not found
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvent();
  }, [id, token, navigate]);

  // Socket setup
  useEffect(() => {
    if (!socket || !eventData) return;

    socket.emit('join_event', id);
    setParticipants(prev => prev + 1);

    // Listeners
    socket.on('participant_joined', () => {
      setParticipants(prev => prev + 1);
    });

    socket.on('event_sync', (data) => {
      if (data.type === 'chat') {
        setMessages(prev => [...prev, data]);
      } else if (data.type === 'announcement') {
        // System message or admin announcement
        setMessages(prev => [...prev, { ...data, system: true }]);
      }
    });

    return () => {
      socket.emit('leave_event', id);
      socket.off('participant_joined');
      socket.off('event_sync');
    };
  }, [socket, id, eventData]);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socket) return;
    
    const msgData = {
      eventId: id,
      type: 'chat',
      message: `${user.name}: ${inputMsg}`
    };
    
    // Broadcast via socket
    socket.emit('sync_event_update', msgData);
    
    // Add locally to sender
    setMessages(prev => [...prev, { message: msgData.message, type: 'chat', timestamp: new Date() }]);
    setInputMsg('');
  };

  const syncAdminAnnouncement = () => {
    if (!socket || user.role !== 'admin') return;
    const msgData = { eventId: id, type: 'announcement', message: 'Admin synchronized the presentation view.' };
    socket.emit('sync_event_update', msgData);
    setMessages(prev => [...prev, { message: 'You synchronized the presentation view.', system: true }]);
  };

  if (!eventData) return <div className="flex-center" style={{ height: '100vh' }}>Loading Event Room...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Top Bar */}
      <div style={{ 
        padding: '16px 24px', background: 'rgba(15, 23, 42, 0.9)', 
        borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{eventData.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '0.875rem' }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} className="pulse-dot"></span>
              LIVE
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.875rem' }}>
          <Users size={16} />
          <span>{participants} Viewers</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Stage (Stream / Presentation) */}
        <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
            <MonitorPlay size={64} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>Waiting for stream source...</p>
            
            {user.role === 'admin' && (
              <button onClick={syncAdminAnnouncement} className="btn-primary" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)' }}>
                Force Sync Viewers
              </button>
            )}
          </div>
        </div>

        {/* Chat / Interaction Panel */}
        <div style={{ width: '350px', borderLeft: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <MessageSquare size={18} />
            Live Chat
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '20px' }}>
                Welcome to the live chat!
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className="animate-fade-in" style={{ 
                background: msg.system ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.05)', 
                border: msg.system ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
                padding: '10px 14px', borderRadius: '12px', fontSize: '0.875rem',
                color: msg.system ? 'var(--accent-primary)' : 'var(--text-primary)'
              }}>
                {msg.message}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)' }}>
            <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                className="input-field" 
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Say something..." 
                style={{ borderRadius: '20px' }}
              />
              <button type="submit" style={{ 
                background: 'var(--accent-primary)', border: 'none', color: 'white',
                width: '40px', height: '40px', borderRadius: '50%',
                display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer'
              }}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <style>{`
        .pulse-dot { animation: pulse 2s infinite; }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
};

export default EventRoom;
