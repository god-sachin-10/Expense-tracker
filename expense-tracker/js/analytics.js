/* ==============================
   ANALYTICS.JS
   ============================== */

let analyticsUser = null;
let charts = {};

function initAnalyticsPage() {
    analyticsUser = authGuard();
    if (!analyticsUser) return;
    populateSidebarUser(analyticsUser);
    initSidebar();
    renderAllCharts();
}

function renderAllCharts() {
    renderMonthlyChart();
    renderCategoryChart();
    renderIncomeExpenseChart();
    renderWeeklyChart();
}

const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } },
        tooltip: {
            backgroundColor: 'rgba(15,22,41,0.95)',
            titleColor: '#f1f5f9',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
                label: ctx => ' ₹' + ctx.parsed.y?.toLocaleString('en-IN') || ' ₹' + ctx.parsed.toLocaleString('en-IN')
            }
        }
    }
};

// Monthly Spending — Bar Chart
function renderMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;
    const monthly = Transactions.monthlyData(analyticsUser.id, 6);

    if (charts.monthly) charts.monthly.destroy();
    charts.monthly = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: monthly.map(m => m.label),
            datasets: [
                {
                    label: 'Income',
                    data: monthly.map(m => m.income),
                    backgroundColor: 'rgba(16,185,129,0.7)',
                    borderColor: '#10b981',
                    borderWidth: 2,
                    borderRadius: 8,
                },
                {
                    label: 'Expense',
                    data: monthly.map(m => m.expense),
                    backgroundColor: 'rgba(239,68,68,0.7)',
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    borderRadius: 8,
                }
            ]
        },
        options: {
            ...CHART_DEFAULTS,
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#64748b', callback: v => '₹' + v.toLocaleString('en-IN') }
                },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
        }
    });
}

// Category Breakdown — Doughnut
function renderCategoryChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const breakdown = Transactions.categoryBreakdown(analyticsUser.id);
    const labels = Object.keys(breakdown);
    const values = Object.values(breakdown);

    if (charts.category) charts.category.destroy();

    if (labels.length === 0) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data yet', canvas.width / 2, canvas.height / 2);
        return;
    }

    charts.category = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: CATEGORY_COLORS.slice(0, labels.length),
                borderColor: '#0a0e1a',
                borderWidth: 3,
                hoverOffset: 8,
            }]
        },
        options: {
            ...CHART_DEFAULTS,
            cutout: '65%',
            plugins: {
                ...CHART_DEFAULTS.plugins,
                tooltip: {
                    ...CHART_DEFAULTS.plugins.tooltip,
                    callbacks: {
                        label: ctx => ` ${ctx.label}: ₹${ctx.parsed.toLocaleString('en-IN')}`
                    }
                }
            }
        }
    });
}

// Income vs Expense — Line Chart
function renderIncomeExpenseChart() {
    const canvas = document.getElementById('lineChart');
    if (!canvas) return;
    const monthly = Transactions.monthlyData(analyticsUser.id, 6);

    if (charts.line) charts.line.destroy();
    charts.line = new Chart(canvas, {
        type: 'line',
        data: {
            labels: monthly.map(m => m.label),
            datasets: [
                {
                    label: 'Income',
                    data: monthly.map(m => m.income),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16,185,129,0.12)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 5,
                },
                {
                    label: 'Expense',
                    data: monthly.map(m => m.expense),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239,68,68,0.08)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ef4444',
                    pointRadius: 5,
                }
            ]
        },
        options: {
            ...CHART_DEFAULTS,
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#64748b', callback: v => '₹' + v.toLocaleString('en-IN') }
                },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
        }
    });
}

// Weekly Chart — Bar
function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    const weeks = Transactions.weeklyData(analyticsUser.id);

    if (charts.weekly) charts.weekly.destroy();
    charts.weekly = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: weeks.map(w => w.label),
            datasets: [
                {
                    label: 'Income',
                    data: weeks.map(w => w.income),
                    backgroundColor: 'rgba(16,185,129,0.5)',
                    borderColor: '#10b981', borderWidth: 2, borderRadius: 6,
                },
                {
                    label: 'Expense',
                    data: weeks.map(w => w.expense),
                    backgroundColor: 'rgba(239,68,68,0.5)',
                    borderColor: '#ef4444', borderWidth: 2, borderRadius: 6,
                }
            ]
        },
        options: {
            ...CHART_DEFAULTS,
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', callback: v => '₹' + v.toLocaleString('en-IN') } },
                x: { grid: { display: false }, ticks: { color: '#64748b' } }
            }
        }
    });
}
