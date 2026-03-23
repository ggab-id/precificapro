import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, saveCalculation, getCalculationByProduct } from '../utils/db';
import {
  calcCostPerUnit, calcIdealPrice, getPsychologicalPrices,
  calcPerSaleBreakdown, POSITIONING, fmtBRL, fmtPct
} from '../utils/pricing';
import { useToast } from '../components/Toast';

const STEPS = ['Produto', 'Custos', 'Posicionamento', 'Resultado'];

export default function CalculatorPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const products = useMemo(() => getProducts(user.id), [user.id]);

  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState(searchParams.get('product') || '');
  const [fixedCosts, setFixedCosts] = useState({ tools: '', hosting: '', other: '' });
  const [variableCosts, setVariableCosts] = useState({ traffic: '', copyDesign: '', other: '' });
  const [expectedSales, setExpectedSales] = useState(50);
  const [positioning, setPositioning] = useState('premium');
  const [desiredMargin, setDesiredMargin] = useState(60);
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [saved, setSaved] = useState(false);

  const product = products.find(p => p.id === productId);

  // Load existing calculation
  useEffect(() => {
    if (productId) {
      const existing = getCalculationByProduct(productId);
      if (existing) {
        setFixedCosts(existing.fixedCosts || { tools: '', hosting: '', other: '' });
        setVariableCosts(existing.variableCosts || { traffic: '', copyDesign: '', other: '' });
        setExpectedSales(existing.expectedSales || 50);
        setPositioning(existing.positioning || 'premium');
        setDesiredMargin(existing.desiredMargin || 60);
        setSelectedPrice(existing.suggestedPrice || null);
      }
    }
  }, [productId]);

  // Core calculations
  const costData = useMemo(() => calcCostPerUnit({ fixedCosts, variableCosts, expectedSales }), [fixedCosts, variableCosts, expectedSales]);
  const priceData = useMemo(() => {
    if (!product) return null;
    return calcIdealPrice({
      costPerUnit: costData.costPerUnit,
      desiredMargin,
      platformFee: product.platformFee,
      affiliateFee: product.affiliateFee,
    });
  }, [costData.costPerUnit, desiredMargin, product]);

  const psychoPrices = useMemo(() => {
    if (!priceData || !product) return [];
    return getPsychologicalPrices(priceData.idealPrice, product.platformFee, product.affiliateFee, costData.costPerUnit);
  }, [priceData, product, costData.costPerUnit]);

  const currentPrice = selectedPrice || (priceData?.idealPrice || 0);
  const breakdown = useMemo(() => {
    if (!product || !currentPrice) return null;
    return calcPerSaleBreakdown({
      price: currentPrice,
      platformFee: product.platformFee,
      affiliateFee: product.affiliateFee,
      costPerUnit: costData.costPerUnit,
    });
  }, [currentPrice, product, costData.costPerUnit]);

  const setFix = (k, v) => setFixedCosts(f => ({ ...f, [k]: v }));
  const setVar = (k, v) => setVariableCosts(f => ({ ...f, [k]: v }));

  const handlePositioning = (pos) => {
    setPositioning(pos);
    setDesiredMargin(POSITIONING[pos].margin);
  };

  const handleSave = () => {
    if (!productId) return;
    const calc = {
      userId: user.id,
      productId,
      positioning,
      fixedCosts,
      variableCosts,
      expectedSales,
      desiredMargin,
      minPrice: priceData?.minPrice,
      idealPrice: priceData?.idealPrice,
      suggestedPrice: selectedPrice || priceData?.idealPrice,
      marginPerSale: breakdown?.profit,
      marginPercent: breakdown?.marginPct,
    };
    saveCalculation(calc);
    setSaved(true);
    toast('Cálculo salvo com sucesso!', 'success');
  };

  const canNext = () => {
    if (step === 0) return !!productId;
    if (step === 1) return costData.costPerUnit >= 0;
    return true;
  };

  const Stepper = () => (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div className="step-item">
            <div className={`step-circle ${i === step ? 'active' : i < step ? 'done' : 'inactive'}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`step-label ${i === step ? 'active' : ''}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">🧮 Calculadora de Precificação</h1>
          <p className="page-subtitle">Descubra o preço ideal para seu produto digital.</p>
        </div>
      </div>

      <Stepper />

      {/* Step 0 — Product */}
      {step === 0 && (
        <div className="card fade-in" style={{ maxWidth: 560 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Qual produto você quer precificar?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Selecione um produto existente ou crie um novo.
          </p>

          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Nenhum produto cadastrado ainda.</p>
              <button className="btn btn-primary" onClick={() => navigate('/produtos?new=1')}>
                + Criar produto primeiro
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => setProductId(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', borderRadius: 'var(--radius-sm)',
                    background: productId === p.id ? 'var(--accent-dim)' : 'var(--bg-card2)',
                    border: `2px solid ${productId === p.id ? 'var(--accent)' : 'var(--border)'}`,
                    color: 'var(--text-primary)', fontSize: 14, cursor: 'pointer',
                    transition: 'all 0.2s', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 24 }}>
                    {{ 'Curso online': '🎓', 'Mentoria': '🎯', 'E-book': '📚', 'Workshop': '🛠️', 'Assinatura': '♾️' }[p.type] || '📦'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.type} · {p.platform} ({p.platformFee}%)</div>
                  </div>
                  {productId === p.id && <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1 — Costs */}
      {step === 1 && (
        <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Fixed costs */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 4 }}>Custos Fixos Mensais</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Gastos que você tem todo mês independente das vendas.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'tools', label: 'Ferramentas (plataforma, e-mail, etc.)', placeholder: '350' },
                  { key: 'hosting', label: 'Hospedagem / domínio', placeholder: '80' },
                  { key: 'other', label: 'Outros fixos', placeholder: '0' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <div className="form-input-prefix">
                      <span>R$</span>
                      <input
                        className="form-input" type="number" min="0" step="0.01"
                        placeholder={f.placeholder}
                        value={fixedCosts[f.key]}
                        onChange={e => setFix(f.key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Variable costs */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 4 }}>Custos Variáveis (por lançamento)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>Gastos relacionados ao lançamento e produção.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { key: 'traffic', label: 'Tráfego pago', placeholder: '2000' },
                  { key: 'copyDesign', label: 'Copy / Designer / Edição', placeholder: '500' },
                  { key: 'other', label: 'Outros variáveis', placeholder: '0' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label className="form-label">{f.label}</label>
                    <div className="form-input-prefix">
                      <span>R$</span>
                      <input
                        className="form-input" type="number" min="0" step="0.01"
                        placeholder={f.placeholder}
                        value={variableCosts[f.key]}
                        onChange={e => setVar(f.key, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="form-group">
                <label className="form-label">Vendas mínimas esperadas (para rateio dos fixos)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <input
                    type="range" className="slider" min="1" max="500" step="1"
                    value={expectedSales} onChange={e => setExpectedSales(parseInt(e.target.value))}
                  />
                  <div style={{
                    background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                    borderRadius: 8, padding: '6px 14px', minWidth: 60, textAlign: 'center',
                    fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--accent)',
                  }}>
                    {expectedSales}
                  </div>
                </div>
                <span className="form-hint">Quantas vendas você precisa fazer para o lançamento ser viável?</span>
              </div>
            </div>
          </div>

          {/* Cost summary sidebar */}
          <div style={{ position: 'sticky', top: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ borderTop: '2px solid var(--accent)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 16, color: 'var(--text-secondary)' }}>
                RESUMO DE CUSTOS
              </h3>
              {[
                { label: 'Total fixos/mês', value: fmtBRL(costData.totalFixed), color: 'var(--blue)' },
                { label: 'Total variáveis', value: fmtBRL(costData.totalVariable), color: 'var(--purple)' },
                { label: 'Custo total', value: fmtBRL(costData.totalCosts), color: 'var(--orange)' },
                { label: 'Custo por unidade', value: fmtBRL(costData.costPerUnit), color: 'var(--accent)', big: true },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 0',
                  borderBottom: item.big ? 'none' : '1px solid var(--border-light)',
                  marginTop: item.big ? 8 : 0,
                  borderTop: item.big ? '2px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{
                    fontFamily: item.big ? 'var(--font-display)' : 'inherit',
                    fontSize: item.big ? 22 : 14,
                    fontWeight: 700, color: item.color,
                  }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 10, padding: '12px 14px', fontSize: 12, color: 'var(--accent)' }}>
              💡 <strong>Dica:</strong> Inclua TODOS os custos, incluindo o seu tempo — isso garante que o preço final será realmente lucrativo.
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Positioning */}
      {step === 2 && (
        <div className="fade-in" style={{ maxWidth: 700 }}>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 6 }}>Como você quer posicionar seu produto?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
              O posicionamento define a margem mínima e a percepção de valor no mercado.
            </p>
            <div className="positioning-grid">
              {Object.entries(POSITIONING).map(([key, pos]) => (
                <button
                  key={key}
                  onClick={() => handlePositioning(key)}
                  className={`positioning-card ${positioning === key ? `selected-${key}` : ''}`}
                  style={{ textAlign: 'left' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{pos.emoji}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {pos.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{pos.desc}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: pos.color }}>
                    Margem: {pos.margin}%+
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 4 }}>Margem desejada</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
              Ajuste fino — o posicionamento preenche um valor padrão, mas você pode personalizar.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <input
                type="range" className="slider" min="10" max="95" step="1"
                value={desiredMargin} onChange={e => setDesiredMargin(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <div style={{
                background: 'var(--accent-dim)', border: '1px solid var(--accent)',
                borderRadius: 10, padding: '8px 16px', minWidth: 70, textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--accent)' }}>
                  {desiredMargin}%
                </div>
              </div>
            </div>
            {product && priceData && (
              <div style={{
                marginTop: 16, padding: '12px 14px', background: 'var(--bg-card2)',
                borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)',
              }}>
                Com {desiredMargin}% de margem + {product.platformFee}% plataforma
                {product.affiliateFee > 0 ? ` + ${product.affiliateFee}% afiliados` : ''}:&nbsp;
                <strong style={{ color: 'var(--accent)' }}>
                  preço mínimo de {fmtBRL(priceData.idealPrice)}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — Results */}
      {step === 3 && priceData && product && (
        <div className="fade-in">
          {/* Ideal price */}
          <div className="card" style={{ marginBottom: 20, borderTop: '2px solid var(--accent)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>
                  Precificação de: <span style={{ color: 'var(--accent)' }}>{product.name}</span>
                </h2>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preço Mínimo</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--red)' }}>
                      {fmtBRL(priceData.minPrice)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>abaixo = prejuízo</div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Preço Ideal</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--accent)' }}>
                      {fmtBRL(priceData.idealPrice)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>com {desiredMargin}% margem</div>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(`/simulador?product=${productId}&price=${selectedPrice || Math.round(priceData.idealPrice)}`)}
                >
                  🚀 Simular Lançamento
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saved}
                >
                  {saved ? '✅ Salvo' : '💾 Salvar'}
                </button>
              </div>
            </div>
          </div>

          {/* Psychological prices */}
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 6 }}>
              🧠 Preços com Gatilho Psicológico
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
              Valores estratégicos que aumentam a conversão. Clique para selecionar.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {psychoPrices.map(pp => (
                <button
                  key={pp.price}
                  onClick={() => setSelectedPrice(pp.price)}
                  style={{
                    padding: '16px', borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${selectedPrice === pp.price ? 'var(--accent)' : 'var(--border)'}`,
                    background: selectedPrice === pp.price ? 'var(--accent-dim)' : 'var(--bg-card2)',
                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: pp.isLoss ? 'var(--red)' : selectedPrice === pp.price ? 'var(--accent)' : 'var(--text-primary)', marginBottom: 4 }}>
                    {fmtBRL(pp.price)}
                  </div>
                  <div style={{ fontSize: 12, color: pp.diff >= 0 ? 'var(--accent)' : 'var(--orange)' }}>
                    {pp.label} do ideal
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Margem: {pp.marginPct.toFixed(1)}%
                  </div>
                  {pp.isLoss && <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 2 }}>⚠️ Abaixo do custo</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Per-sale breakdown */}
          {breakdown && (
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 16 }}>
                📊 Detalhamento por Venda — {fmtBRL(currentPrice)}
              </h3>
              {breakdown.isLoss && (
                <div style={{ background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>
                  ⚠️ <strong>Atenção:</strong> Este preço gera prejuízo de {fmtBRL(Math.abs(breakdown.profit))} por venda.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {[
                  { label: 'Preço de venda', value: fmtBRL(breakdown.price), color: 'var(--text-primary)' },
                  { label: `(-) Plataforma (${product.platformFee}%)`, value: `- ${fmtBRL(breakdown.platformValue)}`, color: 'var(--red)' },
                  { label: `(-) Afiliados (${product.affiliateFee}%)`, value: `- ${fmtBRL(breakdown.affiliateValue)}`, color: 'var(--orange)' },
                  { label: '(-) Custo por unidade', value: `- ${fmtBRL(breakdown.costPerUnit)}`, color: 'var(--yellow)' },
                  { label: '(=) Lucro líquido', value: fmtBRL(breakdown.profit), color: breakdown.isLoss ? 'var(--red)' : 'var(--accent)', big: true },
                  { label: 'Margem líquida', value: fmtPct(breakdown.marginPct), color: breakdown.marginPct < 0 ? 'var(--red)' : breakdown.marginPct < 30 ? 'var(--yellow)' : 'var(--accent)', big: true },
                ].map(row => (
                  <div key={row.label} style={{
                    background: 'var(--bg-card2)', borderRadius: 8, padding: '12px 14px',
                    border: row.big ? `1px solid ${row.color}30` : '1px solid var(--border-light)',
                  }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{row.label}</div>
                    <div style={{
                      fontFamily: row.big ? 'var(--font-display)' : 'inherit',
                      fontSize: row.big ? 22 : 15,
                      fontWeight: 700, color: row.color,
                    }}>{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
        <button
          className="btn btn-ghost"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ← Anterior
        </button>
        {step < STEPS.length - 1 ? (
          <button
            className="btn btn-primary"
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
          >
            Próximo →
          </button>
        ) : (
          <button className="btn btn-primary" onClick={handleSave} disabled={saved}>
            {saved ? '✅ Salvo!' : '💾 Salvar cálculo'}
          </button>
        )}
      </div>
    </div>
  );
}
