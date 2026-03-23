import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, getCalculations, getSimulations } from '../utils/db';
import { fmtBRL } from '../utils/pricing';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const products = useMemo(() => getProducts(user.id), [user.id]);
  const calculations = useMemo(() => getCalculations(user.id), [user.id]);
  const simulations = useMemo(() => getSimulations(user.id), [user.id]);

  // Best margin product
  const bestMargin = useMemo(() => {
    if (!calculations.length) return null;
    return calculations.reduce((best, c) => (c.marginPercent || 0) > (best?.marginPercent || 0) ? c : best, null);
  }, [calculations]);

  const bestMarginProduct = products.find(p => p.id === bestMargin?.productId);

  // Latest simulation
  const latestSim = simulations[0];
  const latestSimProduct = products.find(p => p.id === latestSim?.productId);

  const posLabel = { basic: 'Básico', premium: 'Premium', ultra: 'Ultra-premium' };
  const posBadge = { basic: 'badge-green', premium: 'badge-blue', ultra: 'badge-purple' };

  const quickActions = [
    { icon: '📦', label: 'Novo produto', action: () => navigate('/produtos?new=1'), color: 'var(--accent)' },
    { icon: '🧮', label: 'Calcular preço', action: () => navigate('/calculadora'), color: 'var(--blue)' },
    { icon: '🚀', label: 'Simular lançamento', action: () => navigate('/simulador'), color: 'var(--purple)' },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Olá, {user.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Aqui está o resumo do seu negócio digital.</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/calculadora')}>
          + Nova Precificação
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="stat-card" style={{ borderTop: '2px solid var(--accent)' }}>
          <div className="stat-label">Produtos</div>
          <div className="stat-value">{products.length}</div>
          <div className="stat-sub">cadastrados</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid var(--blue)' }}>
          <div className="stat-label">Precificações</div>
          <div className="stat-value">{calculations.length}</div>
          <div className="stat-sub">calculadas</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid var(--purple)' }}>
          <div className="stat-label">Simulações</div>
          <div className="stat-value">{simulations.length}</div>
          <div className="stat-sub">de lançamento</div>
        </div>
        <div className="stat-card" style={{ borderTop: '2px solid var(--orange)' }}>
          <div className="stat-label">Meta Mensal</div>
          <div className="stat-value" style={{ fontSize: 20 }}>
            {user.monthlyGoal ? fmtBRL(user.monthlyGoal) : '—'}
          </div>
          <div className="stat-sub">
            <span
              onClick={() => navigate('/configuracoes')}
              style={{ color: 'var(--accent)', cursor: 'pointer', fontSize: 12 }}
            >
              {user.monthlyGoal ? 'Editar meta' : 'Definir meta →'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Products list */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Seus Produtos</h2>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/produtos')}>
              Ver todos →
            </button>
          </div>

          {products.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <div className="empty-title">Nenhum produto ainda</div>
                <div className="empty-desc">Crie seu primeiro produto para começar a precificar.</div>
                <button className="btn btn-primary" onClick={() => navigate('/produtos?new=1')}>
                  + Criar produto
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: 0 }}>
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Tipo</th>
                      <th>Preço Calc.</th>
                      <th>Margem</th>
                      <th>Posição</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(p => {
                      const calc = calculations.find(c => c.productId === p.id);
                      return (
                        <tr key={p.id}>
                          <td className="primary">{p.name}</td>
                          <td>{p.type}</td>
                          <td style={{ color: 'var(--accent)', fontWeight: 700 }}>
                            {calc ? fmtBRL(calc.suggestedPrice || calc.idealPrice) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td>
                            {calc ? (
                              <span style={{ color: calc.marginPercent < 0 ? 'var(--red)' : calc.marginPercent < 30 ? 'var(--yellow)' : 'var(--accent)' }}>
                                {calc.marginPercent?.toFixed(1)}%
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td>
                            {calc ? (
                              <span className={`badge ${posBadge[calc.positioning] || 'badge-muted'}`}>
                                {posLabel[calc.positioning] || '—'}
                              </span>
                            ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => navigate(`/calculadora?product=${p.id}`)}
                                title="Calculadora"
                              >🧮</button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => navigate(`/simulador?product=${p.id}`)}
                                title="Simulador"
                              >🚀</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Quick actions */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 14, color: 'var(--text-secondary)' }}>
              AÇÕES RÁPIDAS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map(a => (
                <button
                  key={a.label}
                  onClick={a.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-card2)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: 14, fontWeight: 500,
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left', width: '100%',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.color = a.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  {a.label}
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Best margin */}
          {bestMargin && bestMarginProduct && (
            <div className="card" style={{ borderTop: '2px solid var(--accent)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                🏆 Melhor Margem
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{bestMarginProduct.name}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Preço</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
                    {fmtBRL(bestMargin.suggestedPrice || bestMargin.idealPrice)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Margem</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>
                    {bestMargin.marginPercent?.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Latest simulation */}
          {latestSim && latestSimProduct && (
            <div className="card" style={{ borderTop: '2px solid var(--blue)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 10 }}>
                🚀 Última Simulação
              </div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{latestSimProduct.name}</div>
              {latestSim.scenarios && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Cenário Realista</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--blue)' }}>
                      {fmtBRL(latestSim.scenarios.realistic?.grossRevenue)}
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Lucro Líquido</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)' }}>
                      {fmtBRL(latestSim.scenarios.realistic?.netProfit)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
