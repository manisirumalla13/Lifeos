import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  DollarSign,
  PieChart,
  Tag,
  Calendar,
  Download,
  Trash2,
  Target,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const FINANCES_KEY = 'lifeos_finances_';
const BUDGET_KEY = 'lifeos_budget_';

export default function Finances({ session }) {
  const userId = session?.user?.id;
  const [transactions, setTransactions] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(2500);
  const [savingsGoal, setSavingsGoal] = useState({ name: 'Emergency Fund', target: 5000, current: 1200 });

  // Form states
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!userId) return;
    try {
      const raw = localStorage.getItem(FINANCES_KEY + userId);
      if (raw) setTransactions(JSON.parse(raw));
      else {
        // Seed default initial transactions
        const seed = [
          { id: '1', type: 'income', amount: 3200, title: 'Primary Income', category: 'Salary', date: '2026-11-01' },
          { id: '2', type: 'expense', amount: 850, title: 'Apartment Rent', category: 'Housing', date: '2026-11-02' },
          { id: '3', type: 'expense', amount: 120, title: 'Groceries & Produce', category: 'Food', date: '2026-11-05' },
          { id: '4', type: 'expense', amount: 45, title: 'Cloud & AI Subscriptions', category: 'Tech', date: '2026-11-08' },
        ];
        setTransactions(seed);
        localStorage.setItem(FINANCES_KEY + userId, JSON.stringify(seed));
      }

      const savedBudget = localStorage.getItem(BUDGET_KEY + userId);
      if (savedBudget) setMonthlyBudget(Number(savedBudget));
    } catch (_) {}
  }, [userId]);

  const saveTransactions = (items) => {
    setTransactions(items);
    localStorage.setItem(FINANCES_KEY + userId, JSON.stringify(items));
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const newTx = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      title: title.trim(),
      category,
      date,
    };

    saveTransactions([newTx, ...transactions]);
    setTitle('');
    setAmount('');
  };

  const handleDelete = (id) => {
    saveTransactions(transactions.filter((t) => t.id !== id));
  };

  // Calculations
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const budgetUsedPct = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpense / monthlyBudget) * 100)) : 0;

  // Category breakdown for expenses
  const categories = ['Food', 'Housing', 'Tech', 'Learning', 'Health', 'General', 'Transport'];
  const categoryAmounts = categories.map((cat) =>
    transactions
      .filter((t) => t.type === 'expense' && t.category === cat)
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const doughnutData = {
    labels: categories,
    datasets: [
      {
        data: categoryAmounts.map((a) => (a > 0 ? a : 0)),
        backgroundColor: [
          '#ec4899',
          '#8b5cf6',
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#64748b',
          '#06b6d4',
        ],
        borderWidth: 0,
      },
    ],
  };

  const exportFinances = () => {
    let csv = 'data:text/csv;charset=utf-8,ID,Date,Type,Title,Category,Amount\n';
    transactions.forEach((t) => {
      csv += `${t.id},${t.date},${t.type},"${t.title.replace(/"/g, '""')}",${t.category},${t.amount}\n`;
    });
    const uri = encodeURI(csv);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `LifeOS_Finances_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page active">
      {/* Top Window Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="window-dots">
            <span className="window-dot red" />
            <span className="window-dot yellow" />
            <span className="window-dot green" />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            LifeOS // Finance & Resource Horizon
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={exportFinances}
            className="secondary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', padding: '6px 14px' }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Futuristic Glowing Financial Horizon Wave */}
      <div className="card glass" style={{ marginBottom: 24, padding: '18px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={18} color="#00f2fe" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>Asset Trajectory & Outflow Wave</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 700 }}>
            Savings Velocity: {savingsRate}%
          </span>
        </div>
        <svg width="100%" height="70" viewBox="0 0 600 70" preserveAspectRatio="none" style={{ filter: 'drop-shadow(0 0 10px rgba(0, 242, 254, 0.4))' }}>
          <defs>
            <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,50 Q100,10 200,35 T400,20 T600,30 L600,70 L0,70 Z"
            fill="url(#waveGrad1)"
          />
          <path
            d="M0,50 Q100,10 200,35 T400,20 T600,30"
            fill="none"
            stroke="#00f2fe"
            strokeWidth="2.5"
          />
          <path
            d="M0,60 Q120,30 240,48 T480,32 T600,45 L600,70 L0,70 Z"
            fill="url(#waveGrad2)"
          />
          <path
            d="M0,60 Q120,30 240,48 T480,32 T600,45"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ marginBottom: 25 }}>
        <div className="stat-card glass">
          <div className="stat-icon-wrapper green" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <ArrowUpRight size={24} />
          </div>
          <div className="stat-info">
            <h4>${totalIncome.toLocaleString()}</h4>
            <p>Total Inflow</p>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <ArrowDownRight size={24} />
          </div>
          <div className="stat-info">
            <h4>${totalExpense.toLocaleString()}</h4>
            <p>Total Outflow</p>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper purple">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h4>${netSavings.toLocaleString()}</h4>
            <p>Net Savings ({savingsRate}% rate)</p>
          </div>
        </div>

        <div className="stat-card glass">
          <div className="stat-icon-wrapper blue">
            <Target size={24} />
          </div>
          <div className="stat-info">
            <h4>{budgetUsedPct}%</h4>
            <p>Monthly Budget (${monthlyBudget})</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 25, marginBottom: 25 }}>
        {/* Record Transaction Form */}
        <div className="card glass">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={18} color="var(--accent-purple)" /> Record Movement
          </h3>

          <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 10, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 12 }}>
              <button
                type="button"
                onClick={() => setType('expense')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 10,
                  border: 'none',
                  background: type === 'expense' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  color: type === 'expense' ? '#ef4444' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Expense
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 10,
                  border: 'none',
                  background: type === 'income' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: type === 'income' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Income
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Description (e.g. AWS Hosting, Books, Coffee)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount ($)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="Salary">Salary</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--card-border)',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>

            <button type="submit" className="primary-btn" style={{ justifyContent: 'center', marginTop: 6 }}>
              <Plus size={18} /> Record {type === 'income' ? 'Income' : 'Expense'}
            </button>
          </form>
        </div>

        {/* Expense Category Breakdown Chart */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 15 }}>
            Outflow Breakdown by Category
          </h3>
          <div style={{ flex: 1, minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {totalExpense === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No expense data recorded yet.</p>
            ) : (
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 12 } } },
                  },
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="card glass">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: 15 }}>
          Ledger Archive
        </h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No transactions logged.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transactions.slice(0, 15).map((t) => {
              const isIncome = t.type === 'income';
              return (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: isIncome ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isIncome ? 'var(--accent-emerald)' : '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isIncome ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {t.category} • {t.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: isIncome ? 'var(--accent-emerald)' : '#ef4444',
                      }}
                    >
                      {isIncome ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="secondary-btn danger"
                      style={{ padding: '6px 8px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

