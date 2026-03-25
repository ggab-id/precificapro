import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    if (mode === 'login') {
      const result = login(form.email, form.password);
      if (result.error) { setError(result.error); setLoading(false); return; }
      navigate('/dashboard');
    } else {
      if (!form.name.trim()) { setError('Informe seu nome.'); setLoading(false); return; }
      if (!form.email.trim()) { setError('Informe seu e-mail.'); setLoading(false); return; }
      if (form.password.length < 4) { setError('Senha deve ter ao menos 4 caracteres.'); setLoading(false); return; }
      const result = register(form.name, form.email, form.password);
      if (result.error) { setError(result.error); setLoading(false); return; }
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-base)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: -200, right: -200,
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,229,160,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -200, left: -200,
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,142,247,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.5s ease' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'var(--accent)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, marginBottom: 16,
            boxShadow: '0 0 40px var(--accent-glow)',
          }}>💰</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800 }}>
            Precifica<span style={{ color: 'var(--accent)' }}>Pro</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
            Precifique com estratégia. Lucre com inteligência.
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-card2)',
            borderRadius: 'var(--radius-sm)',
            padding: 4,
            marginBottom: 28,
          }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px', border: 'none', cursor: 'pointer',
                  borderRadius: 6, fontSize: 14, fontWeight: 600,
                  background: mode === m ? 'var(--bg-card)' : 'transparent',
                  color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'all 0.2s',
                  boxShadow: mode === m ? 'var(--shadow)' : 'none',
                }}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Seu nome</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="João Silva"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  autoFocus
                />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                className="form-input"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoFocus={mode === 'login'}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
            </div>

            {error && (
              <div style={{
                background: 'var(--red-dim)', border: '1px solid var(--red)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? '⏳ Aguarde...' : mode === 'login' ? '🚀 Entrar' : '✨ Criar minha conta'}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
