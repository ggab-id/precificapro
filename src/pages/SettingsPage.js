import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name || '', monthlyGoal: user.monthlyGoal || '' });
  const [saved, setSaved] = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const handleSave = () => {
    if (!form.name.trim()) { toast('Informe seu nome.', 'error'); return; }
    updateProfile({ name: form.name, monthlyGoal: parseFloat(form.monthlyGoal) || 0 });
    setSaved(true);
    toast('Perfil atualizado!', 'success');
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Configurações</h1>
          <p className="page-subtitle">Gerencie seu perfil e preferências.</p>
        </div>
      </div>

      <div style={{ maxWidth: 560 }}>
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 20 }}>Perfil</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Seu nome</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="João Silva"
              />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" value={user.email} disabled style={{ opacity: 0.5 }} />
              <span className="form-hint">O e-mail não pode ser alterado.</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 8 }}>Meta Mensal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            Usada no Simulador para indicar se um cenário atinge ou não seu objetivo.
          </p>
          <div className="form-group">
            <label className="form-label">Meta de faturamento mensal (R$)</label>
            <div className="form-input-prefix">
              <span>R$</span>
              <input
                className="form-input"
                type="number" min="0" step="1000"
                placeholder="Ex: 10000"
                value={form.monthlyGoal}
                onChange={e => set('monthlyGoal', e.target.value)}
              />
            </div>
          </div>
          {form.monthlyGoal > 0 && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--accent-dim)', borderRadius: 8, fontSize: 13, color: 'var(--accent)' }}>
              🎯 Sua meta é de <strong>R$ {parseFloat(form.monthlyGoal).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/mês</strong>.
              Continue firme!
            </div>
          )}
        </div>

        <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saved}>
          {saved ? '✅ Salvo!' : '💾 Salvar configurações'}
        </button>
      </div>
    </div>
  );
}
