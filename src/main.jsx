import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  Download,
  Filter,
  PieChart,
  Plus,
  Search,
  Trash2,
  WalletCards,
} from 'lucide-react';
import './styles.css';

const currency = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
});

const initialTransactions = [
  { id: 1, date: '2026-07-02', merchant: 'Whole Foods', category: 'Groceries', type: 'expense', amount: 92 },
  { id: 2, date: '2026-07-03', merchant: 'Rent', category: 'Housing', type: 'expense', amount: 1850 },
  { id: 3, date: '2026-07-04', merchant: 'Spotify', category: 'Subscriptions', type: 'expense', amount: 12 },
  { id: 4, date: '2026-07-05', merchant: 'Metro Card', category: 'Transport', type: 'expense', amount: 48 },
  { id: 5, date: '2026-07-06', merchant: 'Client Retainer', category: 'Income', type: 'income', amount: 4200 },
  { id: 6, date: '2026-07-06', merchant: 'Blue Bottle', category: 'Dining', type: 'expense', amount: 18 },
  { id: 7, date: '2026-07-07', merchant: 'Electric Utility', category: 'Utilities', type: 'expense', amount: 136 },
  { id: 8, date: '2026-07-08', merchant: 'Pharmacy', category: 'Health', type: 'expense', amount: 34 },
  { id: 9, date: '2026-07-08', merchant: 'Bookshop', category: 'Personal', type: 'expense', amount: 27 },
  { id: 10, date: '2026-07-09', merchant: 'Farmers Market', category: 'Groceries', type: 'expense', amount: 41 },
];

const categoryColors = {
  Housing: '#1b4d89',
  Groceries: '#2f855a',
  Subscriptions: '#805ad5',
  Transport: '#2c7a7b',
  Dining: '#c05621',
  Utilities: '#b7791f',
  Health: '#c53030',
  Personal: '#5a67d8',
  Income: '#047857',
};

const categoryOptions = [
  'Housing',
  'Groceries',
  'Dining',
  'Transport',
  'Utilities',
  'Subscriptions',
  'Health',
  'Personal',
  'Income',
];

function App() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [form, setForm] = useState({
    merchant: '',
    amount: '',
    category: 'Groceries',
    type: 'expense',
    date: new Date().toISOString().slice(0, 10),
  });

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((transaction) => {
        const matchesQuery = `${transaction.merchant} ${transaction.category}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesCategory = category === 'All' || transaction.category === category;
        return matchesQuery && matchesCategory;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [category, query, transactions]);

  const stats = useMemo(() => {
    const income = transactions
      .filter((transaction) => transaction.type === 'income')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const expenses = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((total, transaction) => total + transaction.amount, 0);
    const dailyAverage = expenses / 30;
    const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
    return { income, expenses, balance: income - expenses, dailyAverage, savingsRate };
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const totals = transactions
      .filter((transaction) => transaction.type === 'expense')
      .reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {});

    return Object.entries(totals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const weeklySpending = useMemo(() => {
    const recentDates = [...new Set(transactions.map((transaction) => transaction.date))]
      .sort()
      .slice(-7);

    return recentDates.map((date) => ({
      date,
      amount: transactions
        .filter((transaction) => transaction.date === date && transaction.type === 'expense')
        .reduce((total, transaction) => total + transaction.amount, 0),
    }));
  }, [transactions]);

  const maxDay = Math.max(...weeklySpending.map((day) => day.amount), 1);
  const maxCategory = Math.max(...categoryTotals.map((item) => item.amount), 1);

  function addTransaction(event) {
    event.preventDefault();
    const amount = Number(form.amount);

    if (!form.merchant.trim() || !amount || amount <= 0) {
      return;
    }

    setTransactions((current) => [
      {
        id: crypto.randomUUID(),
        merchant: form.merchant.trim(),
        amount,
        category: form.category,
        type: form.type,
        date: form.date,
      },
      ...current,
    ]);

    setForm((current) => ({ ...current, merchant: '', amount: '' }));
  }

  function deleteTransaction(id) {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id));
  }

  function exportCsv() {
    const rows = [
      ['Date', 'Merchant', 'Category', 'Type', 'Amount'],
      ...transactions.map((transaction) => [
        transaction.date,
        transaction.merchant,
        transaction.category,
        transaction.type,
        transaction.amount,
      ]),
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Dashboard overview">
        <div>
          <p className="eyebrow">Personal finance</p>
          <h1>Expense dashboard</h1>
        </div>
        <button className="icon-button text-button" type="button" onClick={exportCsv}>
          <Download size={18} />
          Export CSV
        </button>
      </section>

      <section className="summary-grid" aria-label="Financial summary">
        <MetricCard label="Net balance" value={currency.format(stats.balance)} icon={<WalletCards />} tone="blue" />
        <MetricCard label="Income" value={currency.format(stats.income)} icon={<ArrowUpCircle />} tone="green" />
        <MetricCard label="Expenses" value={currency.format(stats.expenses)} icon={<ArrowDownCircle />} tone="red" />
        <MetricCard label="Savings rate" value={`${stats.savingsRate}%`} icon={<PieChart />} tone="gold" />
      </section>

      <section className="workspace">
        <div className="analytics-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">This month</p>
              <h2>Spending patterns</h2>
            </div>
            <p className="average-pill">{currency.format(stats.dailyAverage)} / day</p>
          </div>

          <div className="chart-grid">
            <div className="chart-block">
              <h3>Last 7 active days</h3>
              <div className="bar-chart" aria-label="Daily expense bar chart">
                {weeklySpending.map((day) => (
                  <div className="bar-column" key={day.date}>
                    <div className="bar-value">{currency.format(day.amount)}</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ height: `${Math.max((day.amount / maxDay) * 100, 8)}%` }}
                      />
                    </div>
                    <span>{new Date(`${day.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-block">
              <h3>By category</h3>
              <div className="category-bars">
                {categoryTotals.map((item) => (
                  <div className="category-row" key={item.name}>
                    <div className="category-label">
                      <span className="swatch" style={{ background: categoryColors[item.name] }} />
                      <span>{item.name}</span>
                      <strong>{currency.format(item.amount)}</strong>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${(item.amount / maxCategory) * 100}%`,
                          background: categoryColors[item.name],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <form className="entry-panel" onSubmit={addTransaction}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Add record</p>
              <h2>New transaction</h2>
            </div>
            <Plus size={22} />
          </div>

          <label>
            Merchant
            <input
              value={form.merchant}
              onChange={(event) => setForm({ ...form, merchant: event.target.value })}
              placeholder="Coffee, salary, rent..."
            />
          </label>

          <label>
            Amount
            <input
              inputMode="decimal"
              min="0"
              step="0.01"
              type="number"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              placeholder="0.00"
            />
          </label>

          <div className="split-fields">
            <label>
              Category
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {categoryOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input
                type="date"
                value={form.date}
                onChange={(event) => setForm({ ...form, date: event.target.value })}
              />
            </label>
          </div>

          <div className="segmented-control" aria-label="Transaction type">
            <button
              className={form.type === 'expense' ? 'active' : ''}
              type="button"
              onClick={() => setForm({ ...form, type: 'expense' })}
            >
              Expense
            </button>
            <button
              className={form.type === 'income' ? 'active' : ''}
              type="button"
              onClick={() => setForm({ ...form, type: 'income', category: 'Income' })}
            >
              Income
            </button>
          </div>

          <button className="primary-button" type="submit">
            <Plus size={18} />
            Add transaction
          </button>
        </form>
      </section>

      <section className="transactions-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Ledger</p>
            <h2>Transactions</h2>
          </div>
          <div className="filters">
            <label className="search-field">
              <Search size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search"
                aria-label="Search transactions"
              />
            </label>
            <label className="select-field">
              <Filter size={17} />
              <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter category">
                <option>All</option>
                {categoryOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="transaction-table">
          <div className="table-row table-head">
            <span>Date</span>
            <span>Merchant</span>
            <span>Category</span>
            <span>Amount</span>
            <span aria-label="Actions" />
          </div>
          {filteredTransactions.map((transaction) => (
            <div className="table-row" key={transaction.id}>
              <span className="date-cell">
                <CalendarDays size={16} />
                {new Date(`${transaction.date}T00:00:00`).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <strong>{transaction.merchant}</strong>
              <span className="category-chip" style={{ '--chip-color': categoryColors[transaction.category] }}>
                {transaction.category}
              </span>
              <span className={transaction.type === 'income' ? 'income-value' : 'expense-value'}>
                {transaction.type === 'income' ? '+' : '-'}
                {currency.format(transaction.amount)}
              </span>
              <button
                className="delete-button"
                type="button"
                onClick={() => deleteTransaction(transaction.id)}
                aria-label={`Delete ${transaction.merchant}`}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, icon, tone }) {
  return (
    <article className={`metric-card ${tone}`}>
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

createRoot(document.getElementById('root')).render(<App />);
