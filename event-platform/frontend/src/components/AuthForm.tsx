import React, { useState } from 'react';

interface AuthFormProps {
  onAuthSuccess: (token: string, role: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('attendee');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? 'login/' : 'register/';
    const body = isLogin 
      ? { username, password } 
      : { username, password, email, role };

    try {
      const response = await fetch(`http://localhost:8000/api/users/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          
          // Fetch user profile to get role
          const profileRes = await fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/users/profile/', {
            headers: { 'Authorization': `Bearer ${data.access}` }
          });
          const profileData = await profileRes.json();
          const userRole = profileData.role || 'attendee';
          localStorage.setItem('user_role', userRole);
          localStorage.setItem('username', profileData.username);
          
          onAuthSuccess(data.access, userRole);
        } else {
          setIsLogin(true);
          setError('Registration successful! Please login.');
        }
      } else {
        setError(data.detail || data.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Connection failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-mesh"></div>
      <div className="blob"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      <div className="auth-wrapper">
        <div className="auth-visual">
          <div className="auth-visual-content">
            <h2>{isLogin ? 'Sign In' : 'Sign Up'}</h2>
            <p>
              {isLogin 
                ? 'Access your event dashboard' 
                : 'Start your journey with us today'}
            </p>
          </div>
          <div style={{ position: 'absolute', bottom: '3rem', left: '3rem', fontSize: '0.8rem', opacity: 0.6 }}>
            © 2026 EVENT PLATFORM
          </div>
        </div>

        <div className="auth-form-container">
          <div className="auth-header" style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', WebkitTextFillColor: 'white' }}>
              {isLogin ? 'Login' : 'Register'}
            </h1>
            <p style={{ fontSize: '0.9rem' }}>Please enter your credentials.</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} autoComplete="off">
            {!isLogin && (
              <div className="input-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  placeholder="Email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  autoComplete="off"
                />
              </div>
            )}

            <div className="input-group">
              <label>Username</label>
              <input 
                type="text" 
                placeholder="Username"
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="Password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                autoComplete="new-password"
              />
            </div>

            {!isLogin && (
              <div className="input-group">
                <label>Join as</label>
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="attendee">Attendee (Find events)</option>
                  <option value="organizer">Organizer (Create events)</option>
                </select>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="switch-mode" style={{ textAlign: 'left', marginTop: '2rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Sign Up' : 'Log In'}
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthForm;
