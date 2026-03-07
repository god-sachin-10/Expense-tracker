/* ==============================
   AUTH.JS — Authentication Logic
   ============================== */

// SHA-256 password hash using crypto-js (loaded via CDN)
function hashPassword(password) {
    return CryptoJS.SHA256(password).toString();
}

// Guard all protected pages — call on page load
function authGuard() {
    if (!Session.isLoggedIn()) {
        window.location.href = 'index.html';
        return null;
    }
    return Session.get();
}

// Populate sidebar user info
function populateSidebarUser(user) {
    const nameEl = document.getElementById('sidebarUserName');
    const emailEl = document.getElementById('sidebarUserEmail');
    const avatarEl = document.getElementById('sidebarAvatar');
    if (nameEl) nameEl.textContent = user.name;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
}

// Register
function register(name, email, password) {
    if (!name || !email || !password) return { ok: false, msg: 'All fields are required.' };
    if (password.length < 6) return { ok: false, msg: 'Password must be at least 6 characters.' };
    if (Users.findByEmail(email)) return { ok: false, msg: 'An account with this email already exists.' };

    const user = Users.add({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashPassword(password)
    });
    Session.set({ id: user.id, name: user.name, email: user.email });
    return { ok: true };
}

// Login
function login(email, password) {
    const user = Users.findByEmail(email);
    if (!user) return { ok: false, msg: 'No account found with this email.' };
    if (user.password !== hashPassword(password)) return { ok: false, msg: 'Incorrect password.' };
    Session.set({ id: user.id, name: user.name, email: user.email });
    return { ok: true };
}

// Logout
function logout() {
    Session.clear();
    window.location.href = 'index.html';
}

// Show form error
function showAuthError(formId, msg) {
    const el = document.getElementById(formId + '_error');
    if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function hideAuthError(formId) {
    const el = document.getElementById(formId + '_error');
    if (el) el.classList.add('hidden');
}

// ── Init Auth Page ──────────────────────
function initAuthPage() {
    if (Session.isLoggedIn()) { window.location.href = 'dashboard.html'; return; }

    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Toggle password visibility
    document.querySelectorAll('.toggle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const isText = input.type === 'text';
            input.type = isText ? 'password' : 'text';
            btn.classList.toggle('fa-eye', isText);
            btn.classList.toggle('fa-eye-slash', !isText);
        });
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            hideAuthError('login');
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const result = login(email, password);
            if (result.ok) { window.location.href = 'dashboard.html'; }
            else { showAuthError('login', result.msg); }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            hideAuthError('register');
            const name = document.getElementById('regName').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const password = document.getElementById('regPassword').value;
            const confirm = document.getElementById('regConfirm').value;
            if (password !== confirm) { showAuthError('register', 'Passwords do not match.'); return; }
            const result = register(name, email, password);
            if (result.ok) { window.location.href = 'dashboard.html'; }
            else { showAuthError('register', result.msg); }
        });
    }
}

// ── Sidebar mobile toggle ─────────────
function initSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (!sidebar) return;

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            if (overlay) overlay.classList.toggle('open');
        });
    }
    if (overlay) {
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
}
