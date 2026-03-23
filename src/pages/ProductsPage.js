import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProducts, saveProduct, deleteProduct } from '../utils/db';
import { useToast } from '../components/Toast';

const EMPTY = {
  id: null, name: '', type: 'Curso online', description: '',
  platform: 'Hotmart', platformFee: 9.9, affiliateFee: 0,
};
const TYPES = ['Curso online', 'Mentoria', 'E-book', 'Workshop', 'Assinatura', 'Outro'];
const PLATFORMS = [
  { name: 'Hotmart', fee: 9.9 },
  { name: 'Kiwify', fee: 7.9 },
  { name: 'Eduzz', fee: 9.9 },
  { name: 'Monetizze', fee: 9.9 },
  { name: 'Outro', fee: 0 },
];

export default function ProductsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState(() => getProducts(user.id));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (searchParams.get('new')) {
      setForm({ ...EMPTY });
      setShowModal(true);
    }
  }, [searchParams]);

  const filtered = useMemo(() =>
    products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [products, search]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePlatform = (name) => {
    const p = PLATFORMS.find(x => x.name === name);
    set('platform', name);
    if (p) set('platformFee', p.fee);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast('Informe o nome do produto.', 'error'); return; }
    const prod = { ...form, userId: user.id, id: form.id || null };
    const updated = saveProduct(prod);
    setProducts(updated);
    toast(form.id ? 'Produto atualizado!' : 'Produto criado!', 'success');
    setShowModal(false);
  };

  const handleEdit = (p) => {
    setForm({ ...p });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Excluir este produto? Cálculos e simulações vinculados também serão removidos.')) return;
    const updated = deleteProduct(id, user.id);
    setProducts(updated);
    toast('Produto excluído.', 'info');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Produtos</h1>
          <p className="page-subtitle">Gerencie seus produtos digitais e infoprodutos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm({ ...EMPTY }); setShowModal(true); }}>
          + Novo Produto
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          className="form-input"
          style={{ maxWidth: 340 }}
          placeholder="🔍 Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">{search ? 'Nenhum resultado' : 'Nenhum produto ainda'}</div>
            <div className="empty-desc">
              {search ? 'Tente outra busca.' : 'Crie seu primeiro produto para começar a precificar com estratégia.'}
            </div>
            {!search && (
              <button className="btn btn-primary" onClick={() => { setForm({ ...EMPTY }); setShowModal(true); }}>
                + Criar produto
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(p => (
            <div key={p.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 15, marginBottom: 4 }}>{p.name}</div>
                  <span className="badge badge-muted">{p.type}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(p)} title="Editar">✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)} title="Excluir">🗑️</button>
                </div>
              </div>

              {p.description && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{p.description}</p>
              )}

              <div className="divider" style={{ margin: '4px 0' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Plataforma</div>
                  <div style={{ fontWeight: 600 }}>{p.platform}</div>
                  <div style={{ fontSize: 11, color: 'var(--orange)' }}>{p.platformFee}% taxa</div>
                </div>
                <div style={{ background: 'var(--bg-card2)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>Afiliados</div>
                  <div style={{ fontWeight: 600 }}>{p.affiliateFee > 0 ? `${p.affiliateFee}%` : 'Sem afiliados'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>comissão</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/calculadora?product=${p.id}`)}
                >
                  🧮 Calcular
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/simulador?product=${p.id}`)}
                >
                  🚀 Simular
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>
                {form.id ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
              >✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nome do produto *</label>
                <input
                  className="form-input" placeholder="Ex: Curso de Marketing Digital"
                  value={form.name} onChange={e => set('name', e.target.value)} autoFocus
                />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Tipo</label>
                  <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Plataforma</label>
                  <select className="form-input" value={form.platform} onChange={e => handlePlatform(e.target.value)}>
                    {PLATFORMS.map(p => <option key={p.name}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Descrição curta (opcional)</label>
                <input
                  className="form-input" placeholder="Descreva brevemente seu produto..."
                  maxLength={150} value={form.description} onChange={e => set('description', e.target.value)}
                />
                <span className="form-hint">{form.description.length}/150</span>
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Taxa da plataforma (%)</label>
                  <input
                    className="form-input" type="number" step="0.1" min="0" max="100"
                    value={form.platformFee} onChange={e => set('platformFee', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Comissão de afiliados (%)</label>
                  <input
                    className="form-input" type="number" step="1" min="0" max="80"
                    placeholder="0" value={form.affiliateFee}
                    onChange={e => set('affiliateFee', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>
                {form.id ? '💾 Salvar alterações' : '✨ Criar produto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
