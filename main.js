/**
 * ANNADAAN CONNECT — MAIN JAVASCRIPT
 * js/main.js
 * Handles: navbar, toast, NGO list, alert form, NGO toggle
 */

const API_BASE = 'http://localhost:3000/api';

/* ===== NAVBAR SCROLL ===== */
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 40);
});

/* ===== HAMBURGER MENU ===== */
const hamburger = document.getElementById('hamburger');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    if (!links) return;
    links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '64px';
    links.style.right = '24px';
    links.style.background = '#FDF6ED';
    links.style.padding = '20px';
    links.style.borderRadius = '16px';
    links.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
  });
}

/* ===== TOAST NOTIFICATION ===== */
function showToast(msg, isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = msg;
  toast.style.background = isError ? '#C0392B' : '#3A7D44';
  toast.querySelector('.toast-icon').textContent = isError ? '❌' : '✅';
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 4000);
}

/* ===== LOAD NGO CARDS (homepage) ===== */
async function loadNGOs() {
  const ngoList = document.getElementById('ngoList');
  const ngoCheckGrid = document.getElementById('ngoCheckGrid');
  if (!ngoList && !ngoCheckGrid) return;

  try {
    const res = await fetch(`${API_BASE}/ngos`);
    const data = await res.json();
    const ngos = data.ngos || [];

    // Sidebar NGO cards
    if (ngoList) {
      if (ngos.length === 0) {
        ngoList.innerHTML = '<p style="color:rgba(255,255,255,0.6);">No NGOs registered yet.</p>';
      } else {
        ngoList.innerHTML = ngos.map(n => `
          <div class="ngo-card">
            <div class="ngo-card-icon">🤝</div>
            <div class="ngo-card-info">
              <h4>${escapeHtml(n.ngo_name)}</h4>
              <p>${escapeHtml(n.city)}</p>
            </div>
            <div class="ngo-badge">Active</div>
          </div>
        `).join('');
      }
    }

    // NGO checkbox grid in alert form
    if (ngoCheckGrid) {
      const icons = ['🏠','🌿','❤️','🍛','🙏','⭐','🌟','💛'];
      ngoCheckGrid.innerHTML = ngos.map((n, i) => `
        <div class="ngo-opt sel" onclick="toggleNgo(this)" data-id="${n.id}">
          <div class="ngo-icon">${icons[i % icons.length]}</div>
          <div class="ngo-name">${escapeHtml(n.ngo_name)}</div>
          <div class="ngo-area">${escapeHtml(n.city)}</div>
        </div>
      `).join('') || `
        <div class="ngo-opt sel" onclick="toggleNgo(this)" data-id="1">
          <div class="ngo-icon">🏠</div>
          <div class="ngo-name">Robin Hood Army</div>
          <div class="ngo-area">Delhi / Mumbai</div>
        </div>
        <div class="ngo-opt" onclick="toggleNgo(this)" data-id="2">
          <div class="ngo-icon">🌿</div>
          <div class="ngo-name">Feeding India</div>
          <div class="ngo-area">Pan India</div>
        </div>
        <div class="ngo-opt" onclick="toggleNgo(this)" data-id="3">
          <div class="ngo-icon">❤️</div>
          <div class="ngo-name">No Food Waste</div>
          <div class="ngo-area">South India</div>
        </div>
      `;
    }
  } catch (err) {
    console.warn('Could not load NGOs from API. Showing defaults.', err);
    if (ngoList) ngoList.innerHTML = showDefaultNGOCards();
    if (ngoCheckGrid) ngoCheckGrid.innerHTML = showDefaultNGOCheckboxes();
  }
}

function showDefaultNGOCards() {
  const defaults = [
    { icon:'🏠', name:'Robin Hood Army', city:'Delhi / Mumbai' },
    { icon:'🌿', name:'Feeding India',   city:'Pan India' },
    { icon:'❤️', name:'No Food Waste',   city:'South India' },
    { icon:'🍛', name:'Roti Bank',        city:'Delhi NCR' },
  ];
  return defaults.map(n => `
    <div class="ngo-card">
      <div class="ngo-card-icon">${n.icon}</div>
      <div class="ngo-card-info"><h4>${n.name}</h4><p>${n.city}</p></div>
      <div class="ngo-badge">Active</div>
    </div>
  `).join('');
}

function showDefaultNGOCheckboxes() {
  return `
    <div class="ngo-opt sel" onclick="toggleNgo(this)" data-id="0"><div class="ngo-icon">🏠</div><div class="ngo-name">Robin Hood Army</div><div class="ngo-area">Delhi/Mumbai</div></div>
    <div class="ngo-opt" onclick="toggleNgo(this)" data-id="0"><div class="ngo-icon">🌿</div><div class="ngo-name">Feeding India</div><div class="ngo-area">Pan India</div></div>
    <div class="ngo-opt" onclick="toggleNgo(this)" data-id="0"><div class="ngo-icon">❤️</div><div class="ngo-name">No Food Waste</div><div class="ngo-area">South India</div></div>
    <div class="ngo-opt" onclick="toggleNgo(this)" data-id="0"><div class="ngo-icon">🍛</div><div class="ngo-name">Roti Bank</div><div class="ngo-area">Delhi NCR</div></div>
    <div class="ngo-opt" onclick="toggleNgo(this)" data-id="0"><div class="ngo-icon">🙏</div><div class="ngo-name">Akshaya Patra</div><div class="ngo-area">Pan India</div></div>
    <div class="ngo-opt" onclick="toggleNgo(this)" data-id="0"><div class="ngo-icon">⭐</div><div class="ngo-name">Local NGO</div><div class="ngo-area">Auto-detect</div></div>
  `;
}

/* ===== NGO CHECKBOX TOGGLE ===== */
function toggleNgo(el) { el.classList.toggle('sel'); }

/* ===== ALERT FORM SUBMIT ===== */
const alertForm = document.getElementById('alertForm');
if (alertForm) {
  alertForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name     = document.getElementById('nf-name').value.trim();
    const phone    = document.getElementById('nf-phone').value.trim();
    const event    = document.getElementById('nf-event').value;
    const datetime = document.getElementById('nf-datetime').value;
    const venue    = document.getElementById('nf-venue').value.trim();
    const qty      = document.getElementById('nf-qty').value;
    const foodtype = document.getElementById('nf-foodtype').value;
    const message  = document.getElementById('nf-msg').value.trim();

    // Get selected NGO IDs
    const selectedNgos = [...document.querySelectorAll('.ngo-opt.sel')]
      .map(el => el.getAttribute('data-id'))
      .filter(id => id && id !== '0');

    if (!name || !phone || !event || !venue || !qty || !foodtype) {
      showToast('⚠️ Please fill all required fields!', true);
      return;
    }

    const btn = alertForm.querySelector('.notify-submit');
    btn.innerHTML = '<span class="spinner"></span> Sending Alert...';
    btn.disabled = true;

    const payload = { name, phone, event_type: event, event_datetime: datetime, venue, quantity: qty, food_type: foodtype, message, ngo_ids: selectedNgos };

    try {
      const res = await fetch(`${API_BASE}/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('🎉 Alert sent! NGOs will contact you within 30 minutes.');
        alertForm.reset();
        document.querySelectorAll('.ngo-opt').forEach(el => el.classList.add('sel'));
      } else {
        showToast(data.message || 'Failed to send alert. Try again.', true);
      }
    } catch (err) {
      showToast('⚠️ Server not reachable. Please try again later.', true);
    } finally {
      btn.innerHTML = '<span>📨</span> Send Alert to NGOs Now';
      btn.disabled = false;
    }
  });
}

/* ===== PASSWORD TOGGLE ===== */
function togglePass(fieldId, btn) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  if (field.type === 'password') { field.type = 'text'; btn.textContent = '🙈'; }
  else { field.type = 'password'; btn.textContent = '👁'; }
}

/* ===== HELPERS ===== */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  loadNGOs();
});
