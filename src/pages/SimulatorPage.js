import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, getCalculationByProduct, saveSimulation } from '../utils/db';
import { calcSimulationScenarios, fmtBRL, fmtPct } from '../utils/pricing';
import { useToast } from '../components/Toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function SimulatorPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const products = useMemo(() => getProducts(user.id), [user.id]);

  const [productId, setProductId] = useState(searchParams.get('product') || products[0]?.id || '');
  const [price, setPrice] = useState(parseFloat(searchParams.get('price')) || 197);
  const [monthlyGoal, setMonthlyGoal] = useState(user.monthlyGoal || 10000);
  const [expectedLeads, setExpectedLeads] = useState(1000);
  const [conversionRate, setConversionRate] = useState(2);
  const [cpl, setCpl] = useState(3.5);
  const [saved, setSaved] = useState(false);
  const [sliderPrice, setSliderPrice] = useState(price);

  const product = products.find(p => p.id === productId);

  useEffect(() => {
    if (productId) {
      const calc = getCalculationByProduct(productId);
      if (calc?.suggestedPrice || calc?.idealPrice) {
        const p = calc.suggestedPrice || calc.idealPrice;
        setPrice(Math.round(p));
        setSliderPrice(Math.round(p));
      }
    }
  }, [productId]);

  const costPerUnit = useMemo(() => {
    if (!productId) return 0;
    const calc = getCalculationByProduct(productId);
    return calc?.costPerUnit || 0;
  }, [productId]);

  const scenarios = useMemo(() => {
    if (!product) return null;
    return calcSimulationScenarios({
      price: sliderPrice,
      expectedLeads,
      conversionRate,
      cpl,
      platformFee: product.platformFee,
      affiliateFee: product.affiliateFee,
      costPerUnit,
      monthlyGoal,
    });
  }, [sliderPrice, expectedLeads, conversionRate, cpl, product, costPerUnit, monthlyGoal]);

  const handleSave = () => {
    if (!productId || !scenarios) return;
    saveSimulation({
      userId: user.id,
      productId,
      price: sliderPrice,
      monthlyGoal,
      expectedLeads,
      conversionRate,
      cpl,
      scenarios: {
        pessimistic: scenarios.pessimistic,
        realistic: scenarios.realistic,
        optimistic: scenarios.optimistic,
      },
    });
    setSaved(true);
    toast('Simulação salva!', 'success');
  };

  const scenarioConfig = [
    { key: 'pessimistic', label: 'Pessimista', icon: '😰', color: 'var(--red)', desc: '½ da conversão' },
    { key: 'realistic', label: 'Realista', icon: '🎯', color: 'var(--blue)', desc: 'conversão estimada' },
    { key: 'optimistic', label: 'Otimista', icon: '🚀', color: 'var(--accent)', desc: '2× a conversão' },
  ];

  const chartData = scenarios ? scenarioConfig.map(s => ({
    name: s.label,
    faturamento: scenarios[s.key].grossRevenue,
    lucro: Math.max(scenarios[s.key].netProfit, 0),
    color: s.color,
  })) : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ color: p.fill }}>
            {p.name}: {fmtBRL(p.value)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🚀 Simulador de Lançamento</h1>
          <p className="page-subtitle">Simule cenários realistas e descubra o que precisa para bater sua meta.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saved || !scenarios}>
          {saved ? '✅ Salvo' : '💾 Salvar Simulação'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Inputs */}
        <div style={{ position: 'sticky', top: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20 }}>⚙️ Parâmetros</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Produto</label>
                <select
                  className="form-input"
                  value={productId}
                  onChange={e => { setProductId(e.target.value); setSaved(false); }}
                >
                  <option value="">Selecione...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Meta de faturamento</label>
                <div className="form-input-prefix">
                  <span>R$</span>
                  <input
                    className="form-input" type="number" min="0" step="100"
                    value={monthlyGoal}
                    onChange={e => { setMonthlyGoal(parseFloat(e.target.value) || 0); setSaved(false); }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Leads esperados no lançamento</label>
                <input
                  className="form-input" type="number" min="1"
                  value={expectedLeads}
                  onChange={e => { setExpectedLeads(parseInt(e.target.value) || 1); setSaved(false); }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Taxa de conversão estimada (%)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    type="range" className="slider" min="0.1" max="20" step="0.1"
                    value={conversionRate}
                    onChange={e => { setConversionRate(parseFloat(e.target.value)); setSaved(false); }}
                    style={{ flex: 1 }}
                  />
                  <div style={{
                    background: 'var(--blue-dim)', border: '1px solid var(--blue)',
                    borderRadius: 8, padding: '4px 10px', fontFamily: 'var(--font-display)',
                    fontWeight: 700, color: 'var(--blue)', minWidth: 54, textAlign: 'center',
                  }}>
                    {conversionRate}%
                  </div>
                </div>
                <span className="form-hint">Média do mercado: 1–3%</span>
              </div>

              <div className="form-group">
                <label className="form-label">CPL — Custo por Lead (R$) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>opcional</span></label>
                <div className="form-input-prefix">
                  <span>R$</span>
                  <input
                    className="form-input" type="number" min="0" step="0.1"
                    placeholder="0"
                    value={cpl}
                    onChange={e => { setCpl(parseFloat(e.target.value) || 0); setSaved(false); }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Price slider */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 4 }}>💰 Ajustar Preço</h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Arraste para ver o impacto nos cenários em tempo real.</p>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: 'var(--accent)' }}>
                {fmtBRL(sliderPrice)}
              </span>
            </div>
            <input
              type="range" className="slider"
              min={Math.max(10, Math.round(price * 0.5))}
              max={Math.round(price * 2.5)}
              step={10}
              value={sliderPrice}
              onChange={e => { setSliderPrice(parseInt(e.target.value)); setSaved(false); }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <span>{fmtBRL(Math.max(10, Math.round(price * 0.5)))}</span>
              <span>{fmtBRL(Math.round(price * 2.5))}</span>
            </div>
            {sliderPrice !== price && (
              <button
                className="btn btn-ghost btn-sm btn-full"
                style={{ marginTop: 10 }}
                onClick={() => setSliderPrice(price)}
              >
                ↩ Restaurar original ({fmtBRL(price)})
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {!product ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">🚀</div>
                <div className="empty-title">Selecione um produto</div>
                <div className="empty-desc">Escolha o produto e preencha os parâmetros para ver os cenários.</div>
              </div>
            </div>
          ) : scenarios ? (
            <>
              {/* 3 scenario cards */}
              <div className="scenario-grid">
                {scenarioConfig.map(sc => {
                  const data = scenarios[sc.key];
                  return (
                    <div key={sc.key} className={`scenario-card ${sc.key}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: 20 }}>{sc.icon}</span>
                          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, marginLeft: 6, color: sc.color }}>
                            {sc.label}
                          </span>
                        </div>
                        <span style={{
                          background: data.reachesGoal ? 'rgba(0,229,160,0.2)' : 'var(--red-dim)',
                          color: data.reachesGoal ? 'var(--accent)' : 'var(--red)',
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        }}>
                          {data.reachesGoal ? '✅ Meta atingida' : '❌ Abaixo da meta'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                        Conversão: <strong style={{ color: sc.color }}>{data.conversion.toFixed(1)}%</strong> · {data.sales} vendas
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Faturamento Bruto', value: fmtBRL(data.grossRevenue), color: sc.color },
                          { label: '(-) Plataforma + Afiliados', value: `- ${fmtBRL(data.platformCut + data.affiliateCut)}`, color: 'var(--text-muted)' },
                          { label: '(-) Custos totais', value: `- ${fmtBRL(data.totalCosts)}`, color: 'var(--text-muted)' },
                          { label: '(=) Lucro Líquido', value: fmtBRL(data.netProfit), color: data.netProfit >= 0 ? sc.color : 'var(--red)', big: true },
                        ].map(row => (
                          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                            <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                            <span style={{ fontFamily: row.big ? 'var(--font-display)' : 'inherit', fontSize: row.big ? 18 : 13, fontWeight: row.big ? 800 : 600, color: row.color }}>
                              {row.value}
                            </span>
                          </div>
                        ))}
                        <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Margem líquida</span>
                            <span style={{ fontWeight: 700, color: data.margin < 0 ? 'var(--red)' : sc.color }}>
                              {fmtPct(data.margin)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chart */}
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20 }}>
                  📊 Comparativo Visual
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} barGap={4}>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="faturamento" name="Faturamento" radius={[4,4,0,0]} maxBarSize={60}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} opacity={0.7} />
                      ))}
                    </Bar>
                    <Bar dataKey="lucro" name="Lucro Líquido" radius={[4,4,0,0]} maxBarSize={60}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Reverse calculator */}
              <div className="card" style={{ borderTop: '2px solid var(--purple)' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 6 }}>
                  🔄 Calculadora Reversa
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
                  Quantos leads você precisa para bater sua meta de <strong style={{ color: 'var(--accent)' }}>{fmtBRL(monthlyGoal)}</strong>?
                </p>
                <div className="scenario-grid">
                  {scenarioConfig.map(sc => {
                    const needed = scenarios.leadsNeeded[sc.key];
                    const trafficCost = needed !== Infinity && cpl > 0 ? needed * cpl : null;
                    return (
                      <div key={sc.key} style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: 16, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>{sc.icon}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{sc.label}</div>
                        {needed === Infinity ? (
                          <div style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600 }}>Meta inatingível com esses dados</div>
                        ) : (
                          <>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: sc.color }}>
                              {needed.toLocaleString('pt-BR')}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>leads necessários</div>
                            {trafficCost !== null && (
                              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--orange)' }}>
                                💸 Tráfego: {fmtBRL(trafficCost)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {scenarios.totalTrafficCost > 0 && (
                  <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 8, fontSize: 13, color: 'var(--accent)' }}>
                    💡 Com {expectedLeads.toLocaleString('pt-BR')} leads a R${cpl}/lead, seu custo de tráfego seria de&nbsp;
                    <strong>{fmtBRL(scenarios.totalTrafficCost)}</strong>.
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
