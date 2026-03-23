import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/dashboard', icon: '⚡', label: 'Dashboard' },
  { path: '/produtos', icon: '📦', label: 'Produtos' },
  { path: '/calculadora', icon: '🧮', label: 'Calculadora' },
  { path: '/simulador', icon: '🚀', label: 'Simulador' },
  { path: '/historico', icon: '📋', label: 'Histórico' },
  { path: '/configuracoes', icon: '⚙️', label: 'Configurações' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const SidebarContent = () => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: '24px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>💰</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
              Precifica<span style={{ color: 'var(--accent)' }}>Pro</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Para Infoprodutores
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map(item => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              <span>{item.label}</span>
              {active && <div style={{ marginLeft: 'auto', width: 3, height: 16, borderRadius: 2, background: 'var(--accent)' }} />}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--blue))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--bg-base)',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sair"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 16, cursor: 'pointer', padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ⬅
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
      }} className="hide-mobile">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: 56,
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        zIndex: 300,
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }} className="show-mobile">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>
          Precifica<span style={{ color: 'var(--accent)' }}>Pro</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 22, cursor: 'pointer' }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 290,
            background: 'rgba(0,0,0,0.7)',
            display: 'none',
          }}
          className="show-mobile"
          onClick={() => setMobileOpen(false)}
        />
      )}
      {mobileOpen && (
        <aside style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 260,
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          zIndex: 295,
          display: 'none',
        }} className="show-mobile">
          <SidebarContent />
        </aside>
      )}

      {/* Bottom nav for mobile */}
      <nav style={{
        display: 'none',
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        zIndex: 200,
        padding: '8px 4px',
        justifyContent: 'space-around',
      }} className="show-mobile">
        {NAV.slice(0, 5).map(item => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                background: 'none', border: 'none', cursor: 'pointer',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 10, fontWeight: active ? 600 : 400,
                padding: '4px 8px', borderRadius: 8,
                minWidth: 56,
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          .show-mobile { display: flex !important; }
        }
        @media (min-width: 769px) {
          .show-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
