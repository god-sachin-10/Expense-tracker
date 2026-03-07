/* ==============================
   TRANSACTIONS.JS
   ============================== */

let currentUser = null;
let editingId = null;
let filterState = { dateFrom: '', dateTo: '', category: 'all', type: 'all' };

function initTransactionsPage() {
    currentUser = authGuard();
    if (!currentUser) return;
    populateSidebarUser(currentUser);
    initSidebar();
    renderTransactionsTable();
    initModal();
    initFilters();
}

// ── Modal ──────────────────────────────
function initModal() {
    const overlay = document.getElementById('txnModal');
    const addBtn = document.getElementById('addTxnBtn');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('txnForm');
    const typeBtns = document.querySelectorAll('.type-btn');

    if (addBtn) addBtn.addEventListener('click', () => openModal());
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal());
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });

    // Type toggle
    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    form.addEventListener('submit', handleFormSubmit);

    // Default date to today
    const dateInput = document.getElementById('txnDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
}

function openModal(txn = null) {
    editingId = txn ? txn.id : null;
    const overlay = document.getElementById('txnModal');
    const title = document.getElementById('modalTitle');
    const typeBtns = document.querySelectorAll('.type-btn');

    title.textContent = txn ? 'Edit Transaction' : 'Add Transaction';
    document.getElementById('txnTitle').value = txn ? txn.title : '';
    document.getElementById('txnAmount').value = txn ? txn.amount : '';
    document.getElementById('txnCategory').value = txn ? txn.category : 'Food';
    document.getElementById('txnDate').value = txn ? txn.date : new Date().toISOString().split('T')[0];
    document.getElementById('txnDescription').value = txn ? (txn.description || '') : '';

    typeBtns.forEach(b => b.classList.remove('active'));
    const activeType = txn ? txn.type : 'expense';
    document.querySelector(`.type-btn.${activeType}`)?.classList.add('active');

    overlay.classList.add('open');
}

function closeModal() {
    document.getElementById('txnModal').classList.remove('open');
    editingId = null;
}

function handleFormSubmit(e) {
    e.preventDefault();
    const typeBtns = document.querySelectorAll('.type-btn');
    const activeType = [...typeBtns].find(b => b.classList.contains('active'))?.dataset.type || 'expense';

    const data = {
        userId: currentUser.id,
        title: document.getElementById('txnTitle').value.trim(),
        amount: parseFloat(document.getElementById('txnAmount').value),
        type: activeType,
        category: document.getElementById('txnCategory').value,
        date: document.getElementById('txnDate').value,
        description: document.getElementById('txnDescription').value.trim()
    };

    if (!data.title || isNaN(data.amount) || data.amount <= 0 || !data.date) {
        alert('Please fill in all required fields with valid values.'); return;
    }

    if (editingId) { Transactions.update(editingId, data); }
    else { Transactions.add(data); }

    closeModal();
    renderTransactionsTable();
}

// ── Filters ────────────────────────────
function initFilters() {
    document.getElementById('filterFrom')?.addEventListener('change', e => { filterState.dateFrom = e.target.value; renderTransactionsTable(); });
    document.getElementById('filterTo')?.addEventListener('change', e => { filterState.dateTo = e.target.value; renderTransactionsTable(); });
    document.getElementById('filterCat')?.addEventListener('change', e => { filterState.category = e.target.value; renderTransactionsTable(); });
    document.getElementById('filterType')?.addEventListener('change', e => { filterState.type = e.target.value; renderTransactionsTable(); });
    document.getElementById('clearFilters')?.addEventListener('click', () => {
        filterState = { dateFrom: '', dateTo: '', category: 'all', type: 'all' };
        document.getElementById('filterFrom').value = '';
        document.getElementById('filterTo').value = '';
        document.getElementById('filterCat').value = 'all';
        document.getElementById('filterType').value = 'all';
        renderTransactionsTable();
    });
}

// ── Render Table ──────────────────────
function renderTransactionsTable() {
    const list = Transactions.filter(currentUser.id, filterState);
    const tbody = document.getElementById('txnTableBody');
    const count = document.getElementById('txnCount');
    if (count) count.textContent = `${list.length} transaction${list.length !== 1 ? 's' : ''}`;

    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><i class="fa-solid fa-receipt"></i><p>No transactions found. Add one to get started!</p></div></td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(t => `
    <tr class="fade-in">
      <td>
        <div style="font-weight:600;font-size:0.875rem;">${escHtml(t.title)}</div>
        ${t.description ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${escHtml(t.description)}</div>` : ''}
      </td>
      <td>${formatDate(t.date)}</td>
      <td><span class="badge badge-category"><i class="fa-solid ${CATEGORY_ICONS[t.category] || 'fa-tag'} fa-xs"></i> ${t.category}</span></td>
      <td><span class="badge badge-${t.type}">${t.type === 'income' ? '↑ Income' : '↓ Expense'}</span></td>
      <td class="amount-${t.type}" style="font-size:1rem;">${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount)}</td>
      <td>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-secondary btn-icon" onclick="editTxn('${t.id}')" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn btn-sm btn-danger btn-icon"   onclick="deleteTxn('${t.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');
}

function editTxn(id) {
    const txn = Transactions.getForUser(currentUser.id).find(t => t.id === id);
    if (txn) openModal(txn);
}

function deleteTxn(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        Transactions.delete(id);
        renderTransactionsTable();
    }
}

function escHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
}
