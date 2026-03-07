/* ==============================
   APP.JS — Dashboard Logic
   ============================== */

let dashUser = null;

function initDashboard() {
    dashUser = authGuard();
    if (!dashUser) return;
    populateSidebarUser(dashUser);
    initSidebar();
    renderDashboard();
}

function renderDashboard() {
    const summary = Transactions.summary(dashUser.id);
    const recent = Transactions.filter(dashUser.id, {}).slice(0, 7);
    const budgetStatuses = Budgets.status(dashUser.id);
    const monthSummary = Transactions.currentMonthSummary(dashUser.id);

    // Stat cards
    animateValue('totalBalance', 0, summary.balance, 800);
    animateValue('totalIncome', 0, summary.income, 800);
    animateValue('totalExpense', 0, summary.expense, 800);

    // Month subtext
    const el = document.getElementById('monthExpense');
    if (el) el.textContent = `This month: ${formatCurrency(monthSummary.expense)}`;

    // Budget alert
    const alertBox = document.getElementById('budgetAlert');
    if (alertBox && budgetStatuses.length > 0) {
        const exceeded = budgetStatuses.filter(b => b.exceeded);
        if (exceeded.length > 0) {
            alertBox.className = 'alert alert-danger';
            alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>
        <span>⚠️ Budget exceeded for: <strong>${exceeded.map(b => b.category).join(', ')}</strong>. 
        <a href="budget.html" style="color:inherit;text-decoration:underline;">View Budgets →</a></span>`;
            alertBox.classList.remove('hidden');
        } else if (budgetStatuses.some(b => b.pct >= 80)) {
            alertBox.className = 'alert alert-warning';
            alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>
        <span>Approaching budget limit in some categories. 
        <a href="budget.html" style="color:inherit;text-decoration:underline;">Check Budgets →</a></span>`;
            alertBox.classList.remove('hidden');
        } else {
            alertBox.classList.add('hidden');
        }
    }

    // Recent transactions
    const tbody = document.getElementById('recentTxns');
    if (!tbody) return;

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No transactions yet. <a href="transactions.html">Add your first one →</a></p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = recent.map((t, i) => `
    <tr class="fade-in delay-${Math.min(i + 1, 4)}">
      <td>
        <div class="d-flex align-center gap-2">
          <div style="width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${t.type === 'income' ? 'var(--income-bg)' : 'var(--expense-bg)'};color:${t.type === 'income' ? 'var(--income)' : 'var(--expense)'};flex-shrink:0;">
            <i class="fa-solid ${CATEGORY_ICONS[t.category] || 'fa-tag'} fa-sm"></i>
          </div>
          <div>
            <div style="font-weight:600;font-size:0.875rem;">${t.title}</div>
            ${t.description ? `<div style="font-size:0.75rem;color:var(--text-muted);">${t.description.slice(0, 32)}${t.description.length > 32 ? '…' : ''}</div>` : ''}
          </div>
        </div>
      </td>
      <td>${formatRelative(t.date)}</td>
      <td><span class="badge badge-category"><i class="fa-solid ${CATEGORY_ICONS[t.category] || 'fa-tag'} fa-xs"></i> ${t.category}</span></td>
      <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Income' : 'Expense'}</span></td>
      <td class="amount-${t.type}" style="font-size:0.95rem;">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
    </tr>`).join('');

    // Mini donut chart on dashboard
    renderMiniChart(Transactions.categoryBreakdown(dashUser.id));
    renderMiniMonthlyChart(Transactions.monthlyData(dashUser.id, 4));
}

// ── Number Counter Animation ──────────
function animateValue(id, start, end, duration) {
    const el = document.getElementById(id);
    if (!el) return;
    const negative = end < 0;
    const absEnd = Math.abs(end);
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = start + (absEnd - start) * ease;
        el.textContent = (negative ? '-' : '') + formatCurrency(current);
        if (progress < 1) requestAnimationFrame(update);
        else el.textContent = (negative ? '-' : '') + formatCurrency(absEnd);
    }
    requestAnimationFrame(update);
}

let miniCharts = {};

function renderMiniChart(breakdown) {
    const canvas = document.getElementById('miniCategoryChart');
    if (!canvas) return;
    const labels = Object.keys(breakdown);
    const values = Object.values(breakdown);
    if (miniCharts.cat) miniCharts.cat.destroy();
    if (labels.length === 0) return;
    miniCharts.cat = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: CATEGORY_COLORS.slice(0, labels.length), borderColor: '#0a0e1a', borderWidth: 2, hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '60%',
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 14, padding: 12 } },
                tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')}` } }
            }
        }
    });
}

function renderMiniMonthlyChart(monthly) {
    const canvas = document.getElementById('miniMonthlyChart');
    if (!canvas) return;
    if (miniCharts.monthly) miniCharts.monthly.destroy();
    miniCharts.monthly = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: monthly.map(m => m.label),
            datasets: [
                { label: 'Income', data: monthly.map(m => m.income), backgroundColor: 'rgba(16,185,129,0.6)', borderRadius: 6 },
                { label: 'Expense', data: monthly.map(m => m.expense), backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, boxWidth: 14 } } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', callback: v => '₹' + v / 1000 + 'k' } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
        }
    });
}
