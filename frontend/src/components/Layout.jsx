import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LayoutDashboard } from 'lucide-react';

const Layout = ({ children, title }) => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{ 
        padding: '16px 24px', 
        borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="flex-center" style={{ 
            width: '40px', height: '40px', 
            borderRadius: '8px', 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' 
          }}>
            <LayoutDashboard size={20} color="white" />
          </div>
          <span style={{ fontWeight: 'bold', fontSize: '1.25rem', letterSpacing: '-0.025em' }}>
            EventSync Engine
          </span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right', display: 'none' }}>
            <div style={{ fontWeight: '600' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role}
            </div>
          </div>
          
          <button 
            onClick={logout}
            style={{ 
              background: 'transparent', border: '1px solid var(--glass-border)',
              color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container animate-fade-in" style={{ flex: 1, padding: '32px 24px' }}>
        {title && (
          <h1 style={{ 
            fontSize: '2rem', fontWeight: 'bold', marginBottom: '24px',
            background: 'linear-gradient(90deg, var(--text-primary), var(--text-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {title}
          </h1>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;
