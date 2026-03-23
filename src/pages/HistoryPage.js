import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, getCalculations, getSimulations, deleteSimulation } from '../utils/db';
import { fmtBRL, fmtPct } from '../utils/pricing';
import { useToast } from '../components/Toast';

export default function HistoryPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('calculations');

  const products = useMemo(() => getProducts(user.id), [user.id]);
  const calculations = useMemo(() => getCalculations(user.id), [user.id]);
  const simulations = useMemo(() => getSimulations(user.id), [user.id]);

  const getProduct = (id) => products.find(p => p.id === id);

  const posLabel = { basic: '🟢 Básico', premium: '🔵 Premium', ultra: '🟣 Ultra-premium' };
  const posBadge = { basic: 'badge-green', premium: 'badge-blue', ultra: 'badge-purple' };

  const handleDeleteSim = (id) => {
    if (!window.confirm('Excluir esta simulação?')) return;
    deleteSimulation(id);
    toast('Simulação excluída.', 'info');
    window.location.reload();
  };

  const fmtDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 Histórico</h1>
          <p className="page-subtitle">Todos os cálculos e simulações salvos.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--bg-card2)', borderRadius: 'var(--radius-sm)', padding: 4, width: 'fit-content', marginBottom: 24 }}>
        {[
          { key: 'calculations', label: `🧮 Precificações (${calculations.length})` },
          { key: 'simulations', label: `🚀 Simulações (${simulations.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', border: 'none', cursor: 'pointer',
              borderRadius: 6, fontSize: 13, fontWeight: 600,
              background: tab === t.key ? 'var(--bg-card)' : 'transparent',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: tab === t.key ? 'var(--shadow)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Calculations tab */}
      {tab === 'calculations' && (
        calculations.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🧮</div>
              <div className="empty-title">Nenhuma precificação salva</div>
              <div className="empty-desc">Use a calculadora para precificar seu produto e salvar o resultado.</div>
              <button className="btn btn-primary" onClick={() => navigate('/calculadora')}>
                → Ir para Calculadora
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {calculations.map(c => {
              const prod = getProduct(c.productId);
              return (
                <div key={c.id} className="card card-hover">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {prod?.name || 'Produto removido'}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {c.positioning && (
                          <span className={`badge ${posBadge[c.positioning] || 'badge-muted'}`} style={{ fontSize: 11 }}>
                            {posLabel[c.positioning] || c.positioning}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmtDate(c.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                    <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Preço Sugerido</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>
                        {fmtBRL(c.suggestedPrice || c.idealPrice)}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Margem Líquida</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: (c.marginPercent || 0) < 0 ? 'var(--red)' : 'var(--accent)' }}>
                        {fmtPct(c.marginPercent || 0)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    {prod && (
                      <>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => navigate(`/calculadora?product=${c.productId}`)}
                        >
                          🧮 Recalcular
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => navigate(`/simulador?product=${c.productId}&price=${Math.round(c.suggestedPrice || c.idealPrice)}`)}
                        >
                          🚀 Simular
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Simulations tab */}
      {tab === 'simulations' && (
        simulations.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🚀</div>
              <div className="empty-title">Nenhuma simulação salva</div>
              <div className="empty-desc">Use o simulador de lançamento para criar e salvar cenários.</div>
              <button className="btn btn-primary" onClick={() => navigate('/simulador')}>
                → Ir para Simulador
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {simulations.map(s => {
              const prod = getProduct(s.productId);
              const r = s.scenarios?.realistic;
              return (
                <div key={s.id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>
                        {prod?.name || 'Produto removido'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {fmtDate(s.createdAt)} · {s.expectedLeads?.toLocaleString('pt-BR')} leads · {s.conversionRate}% conversão
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Preço simulado</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--accent)' }}>{fmtBRL(s.price)}</div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSim(s.id)} title="Excluir">🗑️</button>
                    </div>
                  </div>

                  {r && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {[
                        { sc: s.scenarios.pessimistic, label: '😰 Pessimista', color: 'var(--red)' },
                        { sc: s.scenarios.realistic, label: '🎯 Realista', color: 'var(--blue)' },
                        { sc: s.scenarios.optimistic, label: '🚀 Otimista', color: 'var(--accent)' },
                      ].map(({ sc, label, color }) => sc && (
                        <div key={label} style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color, marginBottom: 2 }}>
                            {fmtBRL(sc.grossRevenue)}
                          </div>
                          <div style={{ fontSize: 11, color: sc.netProfit < 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                            Lucro: {fmtBRL(sc.netProfit)}
                          </div>
                          <span style={{
                            display: 'inline-block', marginTop: 4,
                            fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100,
                            background: sc.reachesGoal ? 'rgba(0,229,160,0.2)' : 'var(--red-dim)',
                            color: sc.reachesGoal ? 'var(--accent)' : 'var(--red)',
                          }}>
                            {sc.reachesGoal ? '✅ Meta' : '❌ Meta'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {prod && (
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/simulador?product=${s.productId}&price=${Math.round(s.price)}`)}
                      >
                        🚀 Abrir no Simulador
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
