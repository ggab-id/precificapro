// db.js — Local storage database for PrecificaPro
// Simulates a real database with localStorage persistence

const DB_KEY = 'precificapro_db';

const initialData = {
  users: [
    {
      id: 'u1',
      name: 'Usuário Demo',
      email: 'usuario@precificapro.com',
      password: '123456',
      monthlyGoal: 15000,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'u2',
      name: 'Demo Pro',
      email: 'demo@precificapro.com',
      password: 'demo',
      monthlyGoal: 30000,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ],
  products: [
    {
      id: 'p1',
      userId: 'u1',
      name: 'Curso de Edição no Celular',
      type: 'Curso online',
      description: 'Do zero ao profissional editando só com o celular',
      platform: 'Hotmart',
      platformFee: 9.9,
      affiliateFee: 30,
      createdAt: '2024-01-10T00:00:00Z',
    },
    {
      id: 'p2',
      userId: 'u1',
      name: 'Mentoria 1:1 Marketing Digital',
      type: 'Mentoria',
      description: 'Mentoria individual para escalar o negócio digital',
      platform: 'Kiwify',
      platformFee: 7.9,
      affiliateFee: 0,
      createdAt: '2024-01-15T00:00:00Z',
    },
  ],
  calculations: [
    {
      id: 'c1',
      userId: 'u1',
      productId: 'p1',
      positioning: 'premium',
      fixedCosts: { tools: 350, hosting: 80, other: 70 },
      variableCosts: { traffic: 2000, copyDesign: 500, other: 200 },
      expectedSales: 50,
      desiredMargin: 60,
      minPrice: 97,
      idealPrice: 197,
      suggestedPrice: 197,
      marginPerSale: 78.4,
      marginPercent: 39.8,
      createdAt: '2024-01-20T00:00:00Z',
    },
  ],
  simulations: [
    {
      id: 's1',
      userId: 'u1',
      productId: 'p1',
      price: 197,
      monthlyGoal: 15000,
      expectedLeads: 1000,
      conversionRate: 2,
      cpl: 3.5,
      launchDays: 7,
      scenarios: {
        pessimistic: { conversion: 1, sales: 10, grossRevenue: 1970, netProfit: 784, margin: 39.8, reachesGoal: false },
        realistic: { conversion: 2, sales: 20, grossRevenue: 3940, netProfit: 1568, margin: 39.8, reachesGoal: false },
        optimistic: { conversion: 4, sales: 40, grossRevenue: 7880, netProfit: 3136, margin: 39.8, reachesGoal: false },
      },
      createdAt: '2024-01-21T00:00:00Z',
    },
  ],
};

export function getDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(raw);
  } catch {
    return initialData;
  }
}

export function saveDB(data) {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
}

export function resetDB() {
  localStorage.setItem(DB_KEY, JSON.stringify(initialData));
  return initialData;
}

// Auth
export function loginUser(email, password) {
  const db = getDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  if (!user) return null;
  const { password: _, ...safeUser } = user;
  return safeUser;
}

export function registerUser(name, email, password) {
  const db = getDB();
  if (db.users.find(u => u.email === email)) return { error: 'E-mail já cadastrado.' };
  const newUser = {
    id: `u${Date.now()}`,
    name,
    email,
    password,
    monthlyGoal: 0,
    createdAt: new Date().toISOString(),
  };
  db.users.push(newUser);
  saveDB(db);
  const { password: _, ...safeUser } = newUser;
  return { user: safeUser };
}

export function updateUser(userId, updates) {
  const db = getDB();
  const idx = db.users.findIndex(u => u.id === userId);
  if (idx === -1) return null;
  db.users[idx] = { ...db.users[idx], ...updates };
  saveDB(db);
  const { password: _, ...safeUser } = db.users[idx];
  return safeUser;
}

// Products
export function getProducts(userId) {
  const db = getDB();
  return db.products.filter(p => p.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function saveProduct(product) {
  const db = getDB();
  const idx = db.products.findIndex(p => p.id === product.id);
  if (idx >= 0) {
    db.products[idx] = product;
  } else {
    db.products.push({ ...product, id: `p${Date.now()}`, createdAt: new Date().toISOString() });
  }
  saveDB(db);
  return getProducts(product.userId);
}

export function deleteProduct(productId, userId) {
  const db = getDB();
  db.products = db.products.filter(p => p.id !== productId);
  db.calculations = db.calculations.filter(c => c.productId !== productId);
  db.simulations = db.simulations.filter(s => s.productId !== productId);
  saveDB(db);
  return getProducts(userId);
}

// Calculations
export function getCalculations(userId) {
  const db = getDB();
  const products = db.products.filter(p => p.userId === userId).map(p => p.id);
  return db.calculations.filter(c => products.includes(c.productId) || c.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getCalculationByProduct(productId) {
  const db = getDB();
  const calcs = db.calculations.filter(c => c.productId === productId);
  return calcs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

export function saveCalculation(calc) {
  const db = getDB();
  const idx = db.calculations.findIndex(c => c.id === calc.id);
  if (idx >= 0) {
    db.calculations[idx] = calc;
  } else {
    db.calculations.push({ ...calc, id: `c${Date.now()}`, createdAt: new Date().toISOString() });
  }
  saveDB(db);
}

// Simulations
export function getSimulations(userId) {
  const db = getDB();
  const products = db.products.filter(p => p.userId === userId).map(p => p.id);
  return db.simulations.filter(s => products.includes(s.productId) || s.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getSimulationByProduct(productId) {
  const db = getDB();
  const sims = db.simulations.filter(s => s.productId === productId);
  return sims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

export function saveSimulation(sim) {
  const db = getDB();
  const idx = db.simulations.findIndex(s => s.id === sim.id);
  if (idx >= 0) {
    db.simulations[idx] = sim;
  } else {
    db.simulations.push({ ...sim, id: `s${Date.now()}`, createdAt: new Date().toISOString() });
  }
  saveDB(db);
}

export function deleteSimulation(simId) {
  const db = getDB();
  db.simulations = db.simulations.filter(s => s.id !== simId);
  saveDB(db);
}
