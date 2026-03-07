/* ==============================
   BUDGET.JS
   ============================== */

let budgetUser = null;

function initBudgetPage() {
    budgetUser = authGuard();
    if (!budgetUser) return;
    populateSidebarUser(budgetUser);
    initSidebar();
    renderBudgets();
    initBudgetForm();
}

function initBudgetForm() {
    const form = document.getElementById('budgetForm');
    if (!form) return;
    form.addEventListener('submit', e => {
        e.preventDefault();
        const category = document.getElementById('budgetCategory').value;
        const amount = parseFloat(document.getElementById('budgetAmount').value);
        if (!category || isNaN(amount) || amount <= 0) { alert('Enter a valid category and amount.'); return; }
        Budgets.set(budgetUser.id, category, amount);
        form.reset();
        renderBudgets();
    });
}

function renderBudgets() {
    const container = document.getElementById('budgetsContainer');
    const alertBox = document.getElementById('budgetAlerts');
    if (!container) return;

    const statuses = Budgets.status(budgetUser.id);
    const exceeded = statuses.filter(b => b.exceeded);

    // Alert Banner
    if (alertBox) {
        if (exceeded.length > 0) {
            alertBox.className = 'alert alert-danger';
            alertBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>
        <span>Budget exceeded for: <strong>${exceeded.map(b => b.category).join(', ')}</strong>! Review your spending.</span>`;
            alertBox.classList.remove('hidden');
        } else if (statuses.some(b => b.pct >= 80)) {
            alertBox.className = 'alert alert-warning';
            alertBox.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i>
        <span>You're approaching your budget limit in some categories. Monitor your spending.</span>`;
            alertBox.classList.remove('hidden');
        } else if (statuses.length > 0) {
            alertBox.className = 'alert alert-success';
            alertBox.innerHTML = `<i class="fa-solid fa-circle-check"></i>
        <span>All budgets are on track! Keep it up.</span>`;
            alertBox.classList.remove('hidden');
        } else {
            alertBox.classList.add('hidden');
        }
    }

    if (statuses.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-piggy-bank"></i><p>No budgets set yet. Add one above to get started.</p></div>`;
        return;
    }

    container.innerHTML = statuses.map(b => {
        const barClass = b.pct >= 100 ? 'danger' : b.pct >= 80 ? 'caution' : 'safe';
        const pctDisplay = Math.min(b.pct, 100).toFixed(0);
        return `
    <div class="budget-card fade-in">
      <div class="budget-card-header">
        <div>
          <div style="font-weight:700;font-size:1rem;">${b.category === 'overall' ? '📊 Overall Monthly' : '<i class="fa-solid ' + (CATEGORY_ICONS[b.category] || 'fa-tag') + '"></i> ' + b.category}</div>
          <div class="category">${b.category === 'overall' ? 'Total expenses this month' : 'Category budget'}</div>
        </div>
        <div class="d-flex gap-2 align-center">
          ${b.exceeded ? '<span class="badge badge-expense"><i class="fa-solid fa-triangle-exclamation fa-xs"></i> Exceeded</span>' : ''}
          <button class="btn btn-sm btn-secondary btn-icon" onclick="deleteBudget('${b.id}')" title="Delete budget"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar ${barClass}" style="width:${pctDisplay}%"></div>
      </div>
      <div class="budget-amounts">
        <span class="spent">Spent: ${formatCurrency(b.spent)}</span>
        <span class="total">Budget: ${formatCurrency(b.amount)} (${pctDisplay}%)</span>
      </div>
      <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">
        Remaining: <span style="color:${b.exceeded ? 'var(--expense)' : 'var(--income)'};font-weight:600;">${formatCurrency(Math.max(0, b.amount - b.spent))}</span>
        ${b.exceeded ? ' <span style="color:var(--expense);">(₹' + (b.spent - b.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) + ' over budget)</span>' : ''}
      </div>
    </div>`;
    }).join('');
}

function deleteBudget(id) {
    if (confirm('Delete this budget?')) {
        Budgets.delete(id);
        renderBudgets();
    }
}
