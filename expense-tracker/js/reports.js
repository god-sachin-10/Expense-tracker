/* ==============================
   REPORTS.JS — Fixed Version
   ============================== */

let reportsUser = null;
let reportMode = 'monthly'; // 'monthly' | 'weekly'

function initReportsPage() {
  reportsUser = authGuard();
  if (!reportsUser) return;
  populateSidebarUser(reportsUser);
  initSidebar();

  // Mode toggle
  document.getElementById('btnMonthly')?.addEventListener('click', () => setReportMode('monthly'));
  document.getElementById('btnWeekly')?.addEventListener('click', () => setReportMode('weekly'));

  document.getElementById('btnExportCSV')?.addEventListener('click', exportCSV);
  document.getElementById('btnExportPDF')?.addEventListener('click', exportPDF);

  renderReport();
}

function setReportMode(mode) {
  reportMode = mode;
  document.querySelectorAll('.report-mode-btn').forEach(b => {
    b.classList.toggle('btn-primary', b.dataset.mode === mode);
    b.classList.toggle('btn-secondary', b.dataset.mode !== mode);
  });
  renderReport();
}

function renderReport() {
  if (reportMode === 'monthly') renderMonthlyReport();
  else renderWeeklyReport();
}

// ── Monthly Report ─────────────────────
function renderMonthlyReport() {
  const monthly = Transactions.monthlyData(reportsUser.id, 6);
  const container = document.getElementById('reportContent');
  if (!container) return;

  const rows = monthly.map(m => {
    const balance = m.income - m.expense;
    const savingsRate = m.income > 0 ? ((balance / m.income) * 100).toFixed(1) : '0.0';
    return `<tr>
      <td style="font-weight:600;">${m.label}</td>
      <td class="amount-income">${formatCurrency(m.income)}</td>
      <td class="amount-expense">${formatCurrency(m.expense)}</td>
      <td class="${balance >= 0 ? 'amount-income' : 'amount-expense'}">${formatCurrency(balance)}</td>
      <td>${savingsRate}%</td>
    </tr>`;
  }).join('');

  const totalIncome = monthly.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const totalBalance = totalIncome - totalExpense;

  container.innerHTML = `
    <div class="report-summary">
      <div class="report-stat">
        <div class="val amount-income">${formatCurrency(totalIncome)}</div>
        <div class="lbl">Total Income (6mo)</div>
      </div>
      <div class="report-stat">
        <div class="val amount-expense">${formatCurrency(totalExpense)}</div>
        <div class="lbl">Total Expenses (6mo)</div>
      </div>
      <div class="report-stat">
        <div class="val ${totalBalance >= 0 ? 'amount-income' : 'amount-expense'}">${formatCurrency(totalBalance)}</div>
        <div class="lbl">Net Savings (6mo)</div>
      </div>
      <div class="report-stat">
        <div class="val" style="color:var(--cyan)">${totalIncome > 0 ? ((totalBalance / totalIncome) * 100).toFixed(1) : 0}%</div>
        <div class="lbl">Savings Rate</div>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Balance</th><th>Savings %</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="text-center" style="color:var(--text-muted);padding:24px;">No data available</td></tr>'}</tbody>
      </table>
    </div>`;
}

// ── Weekly Report ──────────────────────
function renderWeeklyReport() {
  const weeks = Transactions.weeklyData(reportsUser.id);
  const container = document.getElementById('reportContent');
  if (!container) return;

  const rows = weeks.map(w => {
    const balance = w.income - w.expense;
    return `<tr>
      <td style="font-weight:600;">${w.label}</td>
      <td style="font-size:0.78rem;color:var(--text-muted);">${w.startStr} → ${w.endStr}</td>
      <td class="amount-income">${formatCurrency(w.income)}</td>
      <td class="amount-expense">${formatCurrency(w.expense)}</td>
      <td class="${balance >= 0 ? 'amount-income' : 'amount-expense'}">${formatCurrency(balance)}</td>
    </tr>`;
  }).join('');

  const totalIncome = weeks.reduce((s, w) => s + w.income, 0);
  const totalExpense = weeks.reduce((s, w) => s + w.expense, 0);

  container.innerHTML = `
    <div class="report-summary">
      <div class="report-stat"><div class="val amount-income">${formatCurrency(totalIncome)}</div><div class="lbl">Total Income (4wk)</div></div>
      <div class="report-stat"><div class="val amount-expense">${formatCurrency(totalExpense)}</div><div class="lbl">Total Expenses (4wk)</div></div>
      <div class="report-stat"><div class="val ${totalIncome - totalExpense >= 0 ? 'amount-income' : 'amount-expense'}">${formatCurrency(totalIncome - totalExpense)}</div><div class="lbl">Net Balance</div></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Week</th><th>Period</th><th>Income</th><th>Expenses</th><th>Balance</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="5" class="text-center" style="color:var(--text-muted);padding:24px;">No data available</td></tr>'}</tbody>
      </table>
    </div>`;
}

// ── CSV Export ─────────────────────────
function exportCSV() {
  const txns = Transactions.getForUser(reportsUser.id);
  if (!txns || txns.length === 0) { alert('No transactions to export.'); return; }

  const header = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Description'];
  const rows = txns.map(t => [
    `"${t.date}"`,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${t.type}"`,
    `"${t.category}"`,
    `"${t.amount}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`
  ]);

  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `expense_report_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 100);
}

// ── PDF Export ─────────────────────────
function exportPDF() {
  // Enhanced constructor check
  const { jsPDF } = window.jspdf || {};
  const constructor = jsPDF || window.jsPDF;

  if (!constructor) {
    alert('PDF library (jsPDF) not found. Check your script tags.');
    return;
  }

  const doc = new constructor({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const user = Users.findById(reportsUser.id) || reportsUser;

  // ── Header (Red) ──────────────────────
  doc.setFillColor(185, 28, 28);
  doc.rect(0, 0, 210, 42, 'F');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense Tracker Report', 14, 18);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(254, 202, 202);
  doc.text(`Account: ${user.name} (${user.email})`, 14, 27);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 34);

  // ── Summary ───────────────────────────
  const summary = Transactions.summary(reportsUser.id);
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, 55);

  const sumData = [
    ['Total Income', `Rs. ${summary.income.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ['Total Expenses', `Rs. ${summary.expense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ['Net Balance', `Rs. ${summary.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`],
    ['Total Transactions', summary.count.toString()],
  ];
  let y = 62;
  doc.setFontSize(10);
  sumData.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
    doc.text(label + ':', 14, y);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 30, 30);
    doc.text(value, 80, y);
    y += 8;
  });

  // ── Transaction Table ─────────────────
  y += 8;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Transaction History', 14, y);
  y += 6;

  // Table header
  doc.setFillColor(220, 38, 38);
  doc.rect(14, y, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const cols = [14, 35, 80, 110, 140, 165];
  ['Date', 'Title', 'Category', 'Type', 'Amount', ''].forEach((h, i) => doc.text(h, cols[i] + 2, y + 5.5));
  y += 8;

  const txns = Transactions.getForUser(reportsUser.id).slice(0, 60);

  if (txns.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('No transactions recorded yet.', 14, y + 10);
  } else {
    txns.forEach((t, idx) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
        // Reset font for new page
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
      }
      const even = idx % 2 === 0;
      doc.setFillColor(even ? 255 : 248, even ? 255 : 248, even ? 255 : 248);
      doc.rect(14, y, 182, 7, 'F');
      doc.setTextColor(50, 50, 50);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      doc.text(t.date || '', cols[0] + 2, y + 5);
      doc.text((t.title || '').slice(0, 22), cols[1] + 2, y + 5);
      doc.text(t.category || '', cols[2] + 2, y + 5);
      doc.text(t.type || '', cols[3] + 2, y + 5);

      const amtStr = (t.type === 'income' ? '+' : '-') + ' Rs.' + (t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
      doc.setTextColor(t.type === 'income' ? 22 : 185, t.type === 'income' ? 163 : 28, t.type === 'income' ? 74 : 28);
      doc.text(amtStr, cols[4] + 2, y + 5);
      y += 7;
    });
  }

  // ── Footer ────────────────────────────
  doc.setTextColor(180, 180, 180);
  doc.setFontSize(8);
  doc.text('Expense Tracker App — Confidential Report', 105, 290, { align: 'center' });

  // ── FORCED DOWNLOAD FIX ────────────────
  const filename = `expense_report_${new Date().toISOString().slice(0, 10)}.pdf`;
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup to prevent memory leaks
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}