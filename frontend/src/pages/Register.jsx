import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // 1. Register user
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // 2. Automatically log them in after
      const loginRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const loginData = await loginRes.json();
      if (loginRes.ok) {
        login(loginData.user, loginData.token);
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '24px' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="flex-center" style={{ 
            width: '64px', height: '64px', 
            borderRadius: '50%', background: 'rgba(236, 72, 153, 0.2)',
            margin: '0 auto 16px', border: '1px solid var(--accent-secondary)'
          }}>
            <UserPlus size={32} color="var(--accent-secondary)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Join the event platform</p>
        </div>
        
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required 
              placeholder="John Doe"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              placeholder="john@example.com"
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              placeholder="Min 6 characters"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label className="input-label">Role</label>
            <select 
              className="input-field" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{ appearance: 'none' }}
            >
              <option value="student" style={{ color: 'black' }}>Student</option>
              <option value="admin" style={{ color: 'black' }}>Admin</option>
            </select>
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', background: 'linear-gradient(90deg, var(--accent-secondary), var(--accent-primary))' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: 'bold' }}>Log In</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
