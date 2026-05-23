const API = 'http://localhost:3000/api';

// LOADER
(function () {

  const fill = document.getElementById('loaderFill');
  const loader = document.getElementById('loader');

  if (!fill || !loader) return;

  let w = 0;

  const iv = setInterval(() => {

    w += Math.random() * 18;

    if (w >= 100) {
      w = 100;
      clearInterval(iv);
    }

    fill.style.width = w + '%';

  }, 80);

  window.addEventListener('load', () => {

    setTimeout(() => {

      fill.style.width = '100%';

      setTimeout(() => {
        loader.classList.add('fade-out');
      }, 400);

    }, 600);

  });

})();

// NAVBAR SCROLL
window.addEventListener('scroll', () => {

  const nav = document.getElementById('navbar');

  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }

});

// PAGE SWITCH
function showPage(page) {

  ['login', 'register', 'dashboard'].forEach(p => {

    const el = document.getElementById(p + '-page');

    if (el) {
      el.classList.add('hidden-page');
    }

  });

  const main = document.getElementById('main-page');

  // MAIN PAGE
  if (page === 'main') {

    if (main) {
      main.style.display = '';
    }

    document.body.style.overflow = 'auto';

    return;
  }

  // HIDE MAIN PAGE
  if (main) {
    main.style.display = 'none';
  }

  const t = document.getElementById(page + '-page');

  if (t) {
    t.classList.remove('hidden-page');
  }

  // LOGIN & REGISTER
  if (page === 'login' || page === 'register') {

    document.body.style.overflow = 'hidden';

  } else {

    // DASHBOARD
    document.body.style.overflow = 'auto';

  }

}

// TOGGLE PASSWORD
function toggleEye(id, btn) {

  const inp = document.getElementById(id);

  if (!inp) return;

  const isPass = inp.type === 'password';

  inp.type = isPass ? 'text' : 'password';

  btn.style.opacity = isPass ? '0.9' : '0.4';

}

// ALERTS
function showAlert(id, msg, type = 'error') {

  const el = document.getElementById(id);

  if (!el) return;

  el.textContent = msg;

  el.className = 'login-alert ' + type;

}

function hideAlert(id) {

  const el = document.getElementById(id);

  if (el) {
    el.className = 'login-alert hidden';
  }

}

// TOAST
let toastTimer;

function showToast(msg, type = '') {

  const t = document.getElementById('toast');

  if (!t) return;

  t.textContent = msg;

  t.className = 'toast show ' + type;

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {

    t.className = 'toast';

  }, 3200);

}

// PASSWORD STRENGTH
const regPass = document.getElementById('reg-password');

if (regPass) {

  regPass.addEventListener('input', () => {

    const v = regPass.value;

    const fill = document.getElementById('strengthFill');
    const lbl = document.getElementById('strengthLabel');

    if (!fill || !lbl) return;

    let s = 0;

    if (v.length >= 6) s++;
    if (v.length >= 10) s++;
    if (/[A-Z]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-z0-9]/.test(v)) s++;

    const lvls = [
      { pct: '0%', color: '#e0e0e0', label: '—' },
      { pct: '25%', color: '#ff4655', label: 'WEAK' },
      { pct: '50%', color: '#ff9800', label: 'FAIR' },
      { pct: '75%', color: '#f0b94a', label: 'GOOD' },
      { pct: '100%', color: '#4cff91', label: 'STRONG' },
    ];

    const l = lvls[Math.min(s, 4)];

    fill.style.width = l.pct;
    fill.style.background = l.color;

    lbl.textContent = l.label;
    lbl.style.color = l.color;

  });

}

// CLAIM SKIN
function claimSkin(btn, skinName) {

  const user = getUser();

  if (!user) {

    showToast('Sign in first to claim!');
    showPage('login');

    return;
  }

  btn.textContent = 'CLAIMED ✓';
  btn.className = 'skin-btn claimed';
  btn.disabled = true;

  addToCollection(skinName, 'WEAPON SKIN');

  updateDashStats();

  showToast(skinName + ' claimed!', 'ok');

}

// COLLECTION
function getCollection() {

  return JSON.parse(
    localStorage.getItem('val_collection') || '[]'
  );

}

function addToCollection(name, type) {

  const col = getCollection();

  if (!col.find(s => s.name === name)) {

    col.push({
      name,
      type,
      claimedAt: new Date().toISOString()
    });

    localStorage.setItem(
      'val_collection',
      JSON.stringify(col)
    );

  }

}

// GET USER
function getUser() {

  try {

    return JSON.parse(
      localStorage.getItem('val_user')
    );

  } catch (e) {

    return null;

  }

}

// =====================================
// LOGIN
// =====================================

async function doLogin() {

  hideAlert('login-alert');

  const username =
    document.getElementById('login-username')?.value.trim();

  const password =
    document.getElementById('login-password')?.value.trim();

  const btn =
    document.getElementById('loginArrowBtn');

  if (!username || !password) {

    showAlert(
      'login-alert',
      'Please fill in all fields.'
    );

    return;
  }

  if (btn) {

    btn.disabled = true;
    btn.style.opacity = '.6';

  }

  try {

    const res = await fetch(
      `${API}/auto-login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          password
        })
      }
    );

    const data = await res.json();

    console.log(data);

    if (res.ok && data.success) {

      // SAVE USER
      localStorage.setItem(
        'val_user',
        JSON.stringify(data.user)
      );

      // SUCCESS
      showAlert(
        'login-alert',
        'Login successful!',
        'success'
      );

      setTimeout(() => {

        showPage('dashboard');

        document.body.style.overflow = 'auto';

        loadDashboard(data.user);

      }, 1000);

    } else {

      showAlert(
        'login-alert',
        data.message || 'Login failed.'
      );

    }

  } catch (err) {

    console.log(err);

    showAlert(
      'login-alert',
      'Cannot connect to server.'
    );

  } finally {

    if (btn) {

      btn.disabled = false;
      btn.style.opacity = '1';

    }

  }

}

// REGISTER
async function doRegister() {

  hideAlert('register-alert');

  const username =
    document.getElementById('reg-username')?.value.trim();

  const email =
    document.getElementById('reg-email')?.value.trim();

  const password =
    document.getElementById('reg-password')?.value.trim();

  const confirm =
    document.getElementById('reg-confirm')?.value.trim();

  const terms =
    document.getElementById('reg-terms')?.checked;

  const btn =
    document.getElementById('registerArrowBtn');

  if (!username || !email || !password || !confirm) {

    showAlert(
      'register-alert',
      'Please fill in all fields.'
    );

    return;
  }

  if (password !== confirm) {

    showAlert(
      'register-alert',
      'Passwords do not match.'
    );

    return;
  }

  if (password.length < 6) {

    showAlert(
      'register-alert',
      'Password must be at least 6 characters.'
    );

    return;
  }

  if (!terms) {

    showAlert(
      'register-alert',
      'Please accept the Terms of Service.'
    );

    return;
  }

  if (btn) {

    btn.disabled = true;
    btn.style.opacity = '.6';

  }

  try {

    const res = await fetch(
      `${API}/register`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      }
    );

    const data = await res.json();

    if (res.ok && data.success) {

      showAlert(
        'register-alert',
        'Account created! Redirecting...',
        'success'
      );

      setTimeout(() => {

        showPage('login');

      }, 1800);

    } else {

      showAlert(
        'register-alert',
        data.message || 'Registration failed.'
      );

    }

  } catch (err) {

    showAlert(
      'register-alert',
      'Cannot connect to server.'
    );

  } finally {

    if (btn) {

      btn.disabled = false;
      btn.style.opacity = '1';

    }

  }

}

// LOGOUT
function doLogout() {

  localStorage.removeItem('val_user');

  showPage('main');

  document.body.style.overflow = 'auto';

  showToast(
    'Logged out. See you on the battlefield!'
  );

}

// LOAD DASHBOARD
function loadDashboard(user) {

  const uname =
    (user.username || 'AGENT').toUpperCase();

  const rank =
    user.rank || 'IRON I';

  setEl('dashUname', uname);
  setEl('dashRank', rank);
  setEl('dashAvatar', uname[0]);
  setEl('dashHeroName', uname);
  setEl('dcRank', rank);
  setEl('dcWins', user.wins || 0);
  setEl('dcVP', (user.vp_balance || 0).toLocaleString());
  setEl('dcStreak', '3D');
  setEl('dcSkins', getCollection().length);

  setEl('sqKD', '1.34');
  setEl('sqHS', '28');
  setEl('sqWR', '54');
  setEl('sqACS', '217');

  buildMatchHistory();
  buildDashStore();

  showDash('overview');

}

function setEl(id, val) {

  const el = document.getElementById(id);

  if (el) {
    el.textContent = val;
  }

}

// MATCH HISTORY
const MATCHES = [
  { result: 'win', map: 'ASCENT', score: '13-8', kda: '24/10/6', ago: '2 hrs ago' },
  { result: 'loss', map: 'HAVEN', score: '9-13', kda: '16/14/3', ago: '5 hrs ago' },
  { result: 'win', map: 'BIND', score: '13-11', kda: '21/12/8', ago: 'Yesterday' },
  { result: 'win', map: 'SPLIT', score: '13-6', kda: '30/8/11', ago: 'Yesterday' },
  { result: 'loss', map: 'LOTUS', score: '7-13', kda: '11/18/4', ago: '2 days ago' },
];

function buildMatchHistory() {

  const list = document.getElementById('matchHistory');

  if (!list) return;

  list.innerHTML = MATCHES.map(m => `
    <div class="match-row">
      <div class="match-badge ${m.result}">
        ${m.result.toUpperCase()}
      </div>

      <div class="match-map">
        ${m.map}
        <span style="color:var(--gray);font-size:12px">
          ${m.score}
        </span>
      </div>

      <div class="match-kda">
        ${m.kda}
      </div>

      <div class="match-ago">
        ${m.ago}
      </div>
    </div>
  `).join('');

}

// DASHBOARD STORE
const STORE_SKINS = [
  { icon: '⚔️', name: 'PRIME VANDAL', type: 'Rifle' },
  { icon: '🔮', name: 'REAVER PHANTOM', type: 'Rifle' },
  { icon: '⚡', name: 'GLITCHPOP FRENZY', type: 'Pistol' },
  { icon: '🐉', name: 'ELDERFLAME OPERATOR', type: 'Sniper' },
];

function buildDashStore() {

  const grid =
    document.getElementById('dashStoreGrid');

  if (!grid) return;

  const col = getCollection();

  grid.innerHTML = STORE_SKINS.map(s => {

    const already =
      col.find(c => c.name === s.name);

    return `
      <div class="ds-card">

        <div class="ds-icon">
          ${s.icon}
        </div>

        <div class="ds-name">
          ${s.name}
        </div>

        <div class="ds-type">
          ${s.type}
        </div>

        <button
          class="ds-claim ${already ? 'claimed' : ''}"
          onclick="${already ? '' : `dashClaim(this,'${s.name}','${s.type}')`}"
          ${already ? 'disabled' : ''}
        >
          ${already ? 'CLAIMED ✓' : 'CLAIM FREE'}
        </button>

      </div>
    `;

  }).join('');

}

function dashClaim(btn, name, type) {

  addToCollection(name, type);

  btn.textContent = 'CLAIMED ✓';
  btn.className = 'ds-claim claimed';
  btn.disabled = true;

  setEl('dcSkins', getCollection().length);

  showToast(
    name + ' added to collection!',
    'ok'
  );

}

// DASHBOARD TABS
function showDash(tab) {

  ['overview', 'store', 'stats'].forEach(t => {

    const s = document.getElementById('dsec-' + t);
    const l = document.getElementById('dlink-' + t);

    if (s) {
      s.classList.toggle('hidden', t !== tab);
    }

    if (l) {
      l.classList.toggle('active', t === tab);
    }

  });

}

function updateDashStats() {

  setEl(
    'dcSkins',
    getCollection().length
  );

}

// AUTO LOGIN
window.addEventListener('DOMContentLoaded', () => {

  const user = getUser();

  if (user) {

    showPage('dashboard');

    loadDashboard(user);

  }

});

// ENTER KEY
document.addEventListener('keydown', e => {

  if (e.key !== 'Enter') return;

  const lp = document.getElementById('login-page');
  const rp = document.getElementById('register-page');

  if (lp && !lp.classList.contains('hidden-page')) {
    doLogin();
  }

  if (rp && !rp.classList.contains('hidden-page')) {
    doRegister();
  }

});