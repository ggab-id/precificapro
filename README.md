# 💰 PrecificaPro

> Calculadora de Precificação + Simulador de Lançamento para Infoprodutores

---

## 🚀 Como rodar o projeto

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Instalação

```bash
# 1. Entre na pasta do projeto
cd precificapro

# 2. Instale as dependências
npm install

# 3. Rode o servidor de desenvolvimento
npm start

# 4. Acesse no navegador
# http://localhost:3000
```

---

## 🔑 Usuários de teste

| E-mail | Senha | Perfil |
|---|---|---|
| usuario@precificapro.com | 123456 | Usuário com dados de exemplo |
| demo@precificapro.com | demo | Conta demo vazia |

---

## 🏗️ Estrutura do projeto

```
precificapro/
├── public/
│   └── index.html
├── src/
│   ├── context/
│   │   └── AuthContext.js       # Autenticação e sessão do usuário
│   ├── utils/
│   │   ├── db.js                # Banco de dados localStorage
│   │   └── pricing.js           # Toda a lógica de cálculo de preços
│   ├── components/
│   │   ├── Sidebar.js           # Navegação lateral + mobile
│   │   └── Toast.js             # Notificações
│   ├── pages/
│   │   ├── LoginPage.js         # Login + Cadastro
│   │   ├── DashboardPage.js     # Visão geral e KPIs
│   │   ├── ProductsPage.js      # Gestão de produtos
│   │   ├── CalculatorPage.js    # Calculadora (3 etapas)
│   │   ├── SimulatorPage.js     # Simulador de lançamento
│   │   ├── HistoryPage.js       # Histórico de cálculos e simulações
│   │   └── SettingsPage.js      # Configurações de perfil
│   ├── App.js                   # Rotas e layout protegido
│   ├── index.css                # Design system completo
│   └── index.js                 # Entry point
└── package.json
```

---

## ✨ Funcionalidades do MVP

### 🧮 Calculadora de Precificação (4 etapas)
1. **Produto** — Seleção do produto a precificar
2. **Custos** — Fixos mensais + variáveis por lançamento + slider de vendas mínimas
3. **Posicionamento** — Básico / Premium / Ultra-premium com margem ajustável
4. **Resultado** — Preço mínimo, ideal e 5 sugestões com gatilho psicológico (R$197, R$297, etc.) + detalhamento por venda

### 🚀 Simulador de Lançamento
- 3 cenários simultâneos: **Pessimista** (½ conv.) / **Realista** / **Otimista** (2× conv.)
- Slider de preço com recálculo em tempo real
- Indicador visual de meta atingida ou não
- Gráfico comparativo de faturamento × lucro
- **Calculadora reversa**: "Quantos leads preciso para bater minha meta?"
- Cálculo de custo de tráfego por cenário (com CPL)

### 📦 Gestão de Produtos
- Cadastro com tipo, plataforma, taxa e comissão de afiliados
- Cards com atalhos diretos para calculadora e simulador

### 📋 Histórico
- Todas as precificações e simulações salvas
- Reabertura direto nas ferramentas

### 📊 Dashboard
- KPIs: produtos, precificações, simulações, meta mensal
- Produto com melhor margem
- Última simulação
- Ações rápidas

---

## 🔧 Fórmulas utilizadas

### Preço ideal
```
Preço = Custo por Unidade ÷ (1 - Margem% - TaxaPlataforma% - ComissãoAfiliado%)
```

### Custo por unidade
```
Custo/Unidade = (Total Fixos Mensais ÷ Vendas Esperadas) + (Total Variáveis ÷ Vendas Esperadas)
```

### Lucro por venda
```
Lucro = Preço - (Preço × TaxaPlataforma%) - (Preço × Afiliado%) - CustoUnidade
```

### Simulação de cenário
```
Vendas = Leads × (Conversão × Multiplicador)
Faturamento Bruto = Vendas × Preço
Lucro = Faturamento - Plataforma - Afiliados - (Vendas × CustoUnidade) - CustoTráfego
```

### Calculadora reversa
```
LeadsNecessários = Meta ÷ (ConversãoDecimal × LucroPorVenda - CPL)
```

---

## 🗃️ Banco de dados

O projeto usa **localStorage** como banco de dados, sem necessidade de backend. Os dados são organizados em:
- `users` — contas de usuário (senha em texto simples, apenas para demo)
- `products` — produtos cadastrados por usuário
- `calculations` — precificações salvas
- `simulations` — simulações de lançamento salvas

Para **produção real**, substituir `db.js` por chamadas a uma API (Supabase, Firebase, etc.).

---

## 🎨 Design System

- **Tema**: Dark com acentos verde-limão (`#00e5a0`)
- **Fonte display**: Syne (títulos e números)
- **Fonte corpo**: DM Sans
- **Cores**: sistema de variáveis CSS em `index.css`
- **Responsivo**: mobile-first com sidebar → bottom nav no mobile

---

## 🔮 Próximas versões (roadmap)

- [ ] Comparativo de preços de mercado por nicho
- [ ] Sugestão de posicionamento com IA
- [ ] Calculadora de parcelamento (12x R$47 vs à vista R$497)
- [ ] Exportar relatório em PDF
- [ ] Modo agência (gerenciar múltiplos clientes)
- [ ] Integração com Hotmart/Kiwify para dados reais de conversão
- [ ] Alertas de margem abaixo do recomendado

---

## 📄 Dependências principais

| Pacote | Versão | Uso |
|---|---|---|
| react | 18.2 | Framework UI |
| react-router-dom | 6.21 | Roteamento |
| recharts | 2.10 | Gráficos |
| lucide-react | 0.303 | Ícones |

---

*Desenvolvido como MVP para validação de produto. Licença MIT.*
