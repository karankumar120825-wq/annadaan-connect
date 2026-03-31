/**
 * ANNADAAN CONNECT — AUTH JAVASCRIPT
 * js/auth.js
 * Handles: register, login, role toggle
 */

const API_BASE = window.API_BASE || 'http://localhost:3000/api';

/* ===== ROLE SELECTION (register page) ===== */
function selectRole(role) {
  const eventBtn = document.getElementById('role-event');
  const ngoBtn   = document.getElementById('role-ngo');
  const ngoField = document.getElementById('ngo-name-group');
  const roleHidden = document.getElementById('reg-role');

  if (eventBtn) eventBtn.classList.toggle('selected', role === 'event');
  if (ngoBtn)   ngoBtn.classList.toggle('selected', role === 'ngo');
  if (ngoField) ngoField.style.display = role === 'ngo' ? 'block' : 'none';
  if (roleHidden) roleHidden.value = role;
}

/* ===== REGISTER FORM ===== */
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const regError   = document.getElementById('regError');
    const regSuccess = document.getElementById('regSuccess');
    hideMessages(regError, regSuccess);

    const fname    = document.getElementById('reg-fname').value.trim();
    const lname    = document.getElementById('reg-lname').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const phone    = document.getElementById('reg-phone').value.trim();
    const city     = document.getElementById('reg-city').value;
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;
    const role     = document.getElementById('reg-role').value;
    const ngoName  = document.getElementById('reg-ngo') ? document.getElementById('reg-ngo').value.trim() : '';

    // Validations
    if (!fname || !lname || !email || !phone || !city || !password || !confirm) {
      return showFormError(regError, 'Please fill in all required fields.');
    }
    if (!isValidEmail(email)) {
      return showFormError(regError, 'Please enter a valid email address.');
    }
    if (password.length < 8) {
      return showFormError(regError, 'Password must be at least 8 characters long.');
    }
    if (password !== confirm) {
      return showFormError(regError, 'Passwords do not match.');
    }
    if (role === 'ngo' && !ngoName) {
      return showFormError(regError, 'Please enter your NGO / Organization name.');
    }

    const btn = document.getElementById('regBtn');
    setLoading(btn, true, 'Creating Account...');

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: fname, last_name: lname, email, phone, city, password, role, ngo_name: ngoName })
      });
      const data = await res.json();

      if (res.ok) {
        showFormSuccess(regSuccess, '🎉 Account created! Redirecting to login...');
        showToast('Welcome to Annadaan Connect! 🙏');
        setTimeout(() => { window.location.href = 'login.html'; }, 1800);
      } else {
        showFormError(regError, data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      showFormError(regError, '⚠️ Server not reachable. Please start the backend server.');
    } finally {
      setLoading(btn, false, 'Create Account');
    }
  });
}

/* ===== LOGIN FORM ===== */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const loginError   = document.getElementById('loginError');
    const loginSuccess = document.getElementById('loginSuccess');
    hideMessages(loginError, loginSuccess);

    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
      return showFormError(loginError, 'Please enter your email and password.');
    }

    const btn = document.getElementById('loginBtn');
    setLoading(btn, true, 'Logging In...');

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok) {
        // Store session info
        localStorage.setItem('ac_user', JSON.stringify({ name: data.user.first_name, role: data.user.role, id: data.user.id }));
        showFormSuccess(loginSuccess, `Welcome back, ${data.user.first_name}! Redirecting...`);
        showToast(`Logged in as ${data.user.first_name} 🙏`);
        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
      } else {
        showFormError(loginError, data.message || 'Invalid email or password.');
      }
    } catch (err) {
      showFormError(loginError, '⚠️ Server not reachable. Please start the backend server.');
    } finally {
      setLoading(btn, false, 'Login');
    }
  });
}

/* ===== HELPERS ===== */
function showFormError(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function showFormSuccess(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideMessages(...els) {
  els.forEach(el => { if (el) el.style.display = 'none'; });
}

function setLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading ? `<span class="spinner"></span>${text}` : text;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ===== PASSWORD TOGGLE (if not already in main.js) ===== */
if (typeof togglePass === 'undefined') {
  window.togglePass = function(fieldId, btn) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.type = field.type === 'password' ? 'text' : 'password';
    btn.textContent = field.type === 'password' ? '👁' : '🙈';
  };
}
