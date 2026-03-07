/* ==============================
   STORAGE.JS — LocalStorage Helpers
   ============================== */

const KEYS = {
  USERS: 'et_users',
  SESSION: 'et_session',
  TRANSACTIONS: 'et_transactions',
  BUDGETS: 'et_budgets',
};

// ── Users ──────────────────────────────
const Users = {
  getAll() { return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]'); },
  save(users) { localStorage.setItem(KEYS.USERS, JSON.stringify(users)); },
  findByEmail(email) { return this.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()); },
  findById(id) { return this.getAll().find(u => u.id === id); },
  add(user) {
    const users = this.getAll();
    user.id = 'u_' + Date.now();
    user.createdAt = new Date().toISOString();
    users.push(user);
    this.save(users);
    return user;
  }
};

// ── Session ─────────────────────────────
const Session = {
  get() { return JSON.parse(localStorage.getItem(KEYS.SESSION) || 'null'); },
  set(user) { localStorage.setItem(KEYS.SESSION, JSON.stringify(user)); },
  clear() { localStorage.removeItem(KEYS.SESSION); },
  isLoggedIn() { return !!this.get(); }
};

// ── Transactions ─────────────────────────
const Transactions = {
  getAll() { return JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS) || '[]'); },
  save(txns) { localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(txns)); },

  getForUser(userId) {
    return this.getAll().filter(t => t.userId === userId);
  },

  add(txn) {
    const all = this.getAll();
    txn.id = 't_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    txn.createdAt = new Date().toISOString();
    all.unshift(txn);
    this.save(all);
    return txn;
  },

  update(id, updates) {
    const all = this.getAll();
    const idx = all.findIndex(t => t.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }; this.save(all); }
  },

  delete(id) {
    const all = this.getAll().filter(t => t.id !== id);
    this.save(all);
  },

  // Filter transactions for a user
  filter(userId, { dateFrom, dateTo, category, type } = {}) {
    let list = this.getForUser(userId);
    if (dateFrom) list = list.filter(t => t.date >= dateFrom);
    if (dateTo) list = list.filter(t => t.date <= dateTo);
    if (category && category !== 'all') list = list.filter(t => t.category === category);
    if (type && type !== 'all') list = list.filter(t => t.type === type);
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },

  // Summary for user
  summary(userId) {
    const list = this.getForUser(userId);
    const income = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, count: list.length };
  },

  // Monthly aggregation (last N months)
  monthlyData(userId, nMonths = 6) {
    const list = this.getForUser(userId);
    const months = [];
    const now = new Date();
    for (let i = nMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const txns = list.filter(t => t.date.startsWith(key));
      const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      months.push({ key, label, income, expense });
    }
    return months;
  },

  // Current month summary
  currentMonthSummary(userId) {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const list = this.getForUser(userId).filter(t => t.date.startsWith(key));
    const income = list.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = list.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expense, balance: income - expense, count: list.length };
  },

  // Category breakdown (expenses)
  categoryBreakdown(userId) {
    const list = this.getForUser(userId).filter(t => t.type === 'expense');
    const map = {};
    list.forEach(t => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return map;
  },

  // Weekly data
  weeklyData(userId) {
    const list = this.getForUser(userId);
    const weeks = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - (i * 7) - now.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];
      const txns = list.filter(t => t.date >= startStr && t.date <= endStr);
      const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      weeks.push({ label: `Week ${4 - i}`, income, expense, startStr, endStr, txns });
    }
    return weeks;
  }
};

// ── Budgets ──────────────────────────────
const Budgets = {
  getAll() { return JSON.parse(localStorage.getItem(KEYS.BUDGETS) || '[]'); },
  save(budgets) { localStorage.setItem(KEYS.BUDGETS, JSON.stringify(budgets)); },

  getForUser(userId) { return this.getAll().filter(b => b.userId === userId); },

  set(userId, category, amount) {
    const all = this.getAll();
    const idx = all.findIndex(b => b.userId === userId && b.category === category);
    if (idx !== -1) { all[idx].amount = amount; }
    else { all.push({ id: 'b_' + Date.now(), userId, category, amount }); }
    this.save(all);
  },

  delete(id) {
    this.save(this.getAll().filter(b => b.id !== id));
  },

  // Check budget status for current month
  status(userId) {
    const budgets = this.getForUser(userId);
    const catBreak = Transactions.categoryBreakdown(userId);
    // Also check overall
    const monthSummary = Transactions.currentMonthSummary(userId);
    return budgets.map(b => {
      const spent = b.category === 'overall' ? monthSummary.expense : (catBreak[b.category] || 0);
      const pct = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
      return { ...b, spent, pct, exceeded: spent > b.amount };
    });
  }
};

// ── Formatting Helpers ──────────────────
function formatCurrency(amount, symbol = '₹') {
  return symbol + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelative(dateStr) {
  const now = new Date();
  const then = new Date(dateStr + 'T00:00:00');
  const diff = Math.floor((now - then) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(dateStr);
}

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Fuel', 'Shopping', 'Entertainment', 'Health', 'Education', 'Other'];
const CATEGORY_ICONS = {
  Food: 'fa-utensils', Travel: 'fa-plane', Bills: 'fa-file-invoice',
  Fuel: 'fa-gas-pump', Shopping: 'fa-shopping-bag', Entertainment: 'fa-film',
  Health: 'fa-heart-pulse', Education: 'fa-graduation-cap', Other: 'fa-tag'
};
const CATEGORY_COLORS = [
  '#dc2626', '#ef4444', '#f97316', '#d97706', '#16a34a', '#0891b2', '#7c3aed', '#db2777', '#64748b'
];
