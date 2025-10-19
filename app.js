// ==========================
// 📲 Apuestas PRO - app.js
// ==========================
const API_KEY = 'TU_API_KEY_AQUI';   // ⚠️ Usa tu key real aquí
const API_URL = 'https://v3.football.api-sports.io';

// ---------------------------
// Elementos UI
// ---------------------------
const apiStatus = document.getElementById('apiStatus');
const oddsStatus = document.getElementById('oddsStatus');
const tabHome = document.getElementById('tabHome');
const tabPicks = document.getElementById('tabPicks');
const sectionHome = document.getElementById('home');
const sectionPicks = document.getElementById('picks');
const selLeague = document.getElementById('selLeague');
const selDate = document.getElementById('selDate');
const btnSearch = document.getElementById('btnSearch');
const matchesDiv = document.getElementById('matches');
const picksList = document.getElementById('picksList');
const btnExport = document.getElementById('btnExport');
const btnClear = document.getElementById('btnClear');
const fabRefresh = document.getElementById('fabRefresh');
const fabGoPicks = document.getElementById('fabGoPicks');

// Manual pick
const mpHome = document.getElementById('mpHome');
const mpAway = document.getElementById('mpAway');
const mpOdd = document.getElementById('mpOdd');
const btnAddPick = document.getElementById('btnAddPick');
const m1x2Home = document.getElementById('m1x2Home');
const m1x2Draw = document.getElementById('m1x2Draw');
const m1x2Away = document.getElementById('m1x2Away');
const mOver25 = document.getElementById('mOver25');
const mUnder25 = document.getElementById('mUnder25');
const mBTTSYes = document.getElementById('mBTTSYes');
const mBTTSNo = document.getElementById('mBTTSNo');

// Modal
const pickModal = document.getElementById('pickModal');
const pmTeams = document.getElementById('pmTeams');
const pmLeague = document.getElementById('pmLeague');
const pm1x2Home = document.getElementById('pm1x2Home');
const pm1x2Draw = document.getElementById('pm1x2Draw');
const pm1x2Away = document.getElementById('pm1x2Away');
const pmOver25 = document.getElementById('pmOver25');
const pmUnder25 = document.getElementById('pmUnder25');
const pmBTTSYes = document.getElementById('pmBTTSYes');
const pmBTTSNo = document.getElementById('pmBTTSNo');
const pmSave = document.getElementById('pmSave');
const pmCancel = document.getElementById('pmCancel');

// ---------------------------
// LocalStorage
// ---------------------------
const LS_KEY = 'apuestas_pro_picks';

// ---------------------------
// API Helper
// ---------------------------
async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      headers: { 'x-apisports-key': API_KEY }
    });
    if (!res.ok) throw new Error('Error API');
    apiStatus.textContent = 'Online';
    apiStatus.className = 'online';
    return await res.json();
  } catch (err) {
    console.warn(err);
    apiStatus.textContent = 'Offline';
    apiStatus.className = 'offline';
    return null;
  }
}

// ---------------------------
// Competitions
// ---------------------------
async function loadLeagues() {
  selLeague.innerHTML = `<option value="">Cargando ligas...</option>`;
  const data = await apiFetch('/leagues?current=true');
  if (!data) {
    selLeague.innerHTML = `<option value="">No disponible</option>`;
    return;
  }
  const leagues = data.response;
  selLeague.innerHTML = `<option value="">Selecciona competición</option>`;
  leagues.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.league.id;
    opt.textContent = `${l.country.name} - ${l.league.name}`;
    selLeague.appendChild(opt);
  });
}

// ---------------------------
// Matches
// ---------------------------
async function searchMatches() {
  const leagueId = selLeague.value;
  const date = selDate.value;
  if (!leagueId || !date) {
    alert('Selecciona liga y fecha');
    return;
  }
  matchesDiv.innerHTML = `<p>Cargando partidos...</p>`;
  const data = await apiFetch(`/fixtures?league=${leagueId}&season=2025&date=${date}`);
  if (!data || data.response.length === 0) {
    matchesDiv.innerHTML = `<p>No hay partidos para esta fecha</p>`;
    return;
  }
  renderMatches(data.response);
}

function renderMatches(matches) {
  matchesDiv.innerHTML = '';
  matches.forEach(m => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.innerHTML = `
      <div class="match-info">
        <strong>${m.teams.home.name}</strong> vs <strong>${m.teams.away.name}</strong><br>
        <span>${m.league.name} · ${m.fixture.date.split('T')[0]}</span>
      </div>
      <button class="btn small add-pick" data-home="${m.teams.home.name}" data-away="${m.teams.away.name}" data-league="${m.league.name}" data-date="${m.fixture.date.split('T')[0]}">➕</button>
    `;
    matchesDiv.appendChild(card);
  });

  document.querySelectorAll('.add-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      openPickModal(btn.dataset.home, btn.dataset.away, btn.dataset.league, btn.dataset.date);
    });
  });
}

// ---------------------------
// Modal funciones
// ---------------------------
function openPickModal(home, away, league, date) {
  pmTeams.textContent = `${home} vs ${away}`;
  pmLeague.textContent = `${league} · ${date}`;
  pickModal.classList.add('show');
  pickModal.dataset.home = home;
  pickModal.dataset.away = away;
  pickModal.dataset.league = league;
  pickModal.dataset.date = date;
}

function closePickModal() {
  pickModal.classList.remove('show');
  [pm1x2Home, pm1x2Draw, pm1x2Away, pmOver25, pmUnder25, pmBTTSYes, pmBTTSNo].forEach(i => i.value = '');
}

// ---------------------------
// Picks almacenamiento
// ---------------------------
function getPicks() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
}

function savePicks(picks) {
  localStorage.setItem(LS_KEY, JSON.stringify(picks));
}

function addPick(pick) {
  const picks = getPicks();
  picks.push(pick);
  savePicks(picks);
  renderPicks();
}

function renderPicks() {
  const picks = getPicks();
  picksList.innerHTML = '';
  if (picks.length === 0) {
    picksList.innerHTML = '<li>No tienes picks guardados</li>';
    return;
  }
  picks.forEach((p, i) => {
    const li = document.createElement('li');
    li.className = 'pick-item';
    li.innerHTML = `
      <strong>${p.home}</strong> vs <strong>${p.away}</strong> (${p.league || ''})<br>
      <small>${p.date || ''}</small><br>
      <small>${p.markets || ''}</small>
    `;
    picksList.appendChild(li);
  });
}

btnExport.addEventListener('click', () => {
  const picks = getPicks();
  if (picks.length === 0) return;
  const csv = 'data:text/csv;charset=utf-8,' + [
    ['Local', 'Visitante', 'Liga', 'Fecha', 'Mercados'],
    ...picks.map(p => [p.home, p.away, p.league || '', p.date || '', p.markets || ''])
  ].map(e => e.join(',')).join('\n');
  const a = document.createElement('a');
  a.href = encodeURI(csv);
  a.download = 'picks.csv';
  a.click();
});

btnClear.addEventListener('click', () => {
  if (confirm('¿Borrar todos los picks?')) {
    savePicks([]);
    renderPicks();
  }
});

// ---------------------------
// Eventos
// ---------------------------

// Tabs
tabHome.addEventListener('click', () => {
  tabHome.classList.add('active');
  tabPicks.classList.remove('active');
  sectionHome.style.display = 'block';
  sectionPicks.style.display = 'none';
});

tabPicks.addEventListener('click', () => {
  tabPicks.classList.add('active');
  tabHome.classList.remove('active');
  sectionPicks.style.display = 'block';
  sectionHome.style.display = 'none';
  renderPicks();
});

// Modal
pmCancel.addEventListener('click', closePickModal);
pmSave.addEventListener('click', () => {
  const pick = {
    home: pickModal.dataset.home,
    away: pickModal.dataset.away,
    league: pickModal.dataset.league,
    date: pickModal.dataset.date,
    markets: `1X2: ${pm1x2Home.value || '-'} / ${pm1x2Draw.value || '-'} / ${pm1x2Away.value || '-'}, Over2.5: ${pmOver25.value || '-'}, Under2.5: ${pmUnder25.value || '-'}, BTTS: ${pmBTTSYes.value || '-'} / ${pmBTTSNo.value || '-'}`
  };
  addPick(pick);
  closePickModal();
});

// Manual pick
btnAddPick.addEventListener('click', () => {
  if (!mpHome.value || !mpAway.value) {
    alert('Introduce equipos');
    return;
  }
  const pick = {
    home: mpHome.value,
    away: mpAway.value,
    markets: `1X2: ${m1x2Home.value || '-'} / ${m1x2Draw.value || '-'} / ${m1x2Away.value || '-'}, Over2.5: ${mOver25.value || '-'}, Under2.5: ${mUnder25.value || '-'}, BTTS: ${mBTTSYes.value || '-'} / ${mBTTSNo.value || '-'}`
  };
  addPick(pick);
  mpHome.value = mpAway.value = mpOdd.value = '';
  [m1x2Home, m1x2Draw, m1x2Away, mOver25, mUnder25, mBTTSYes, mBTTSNo].forEach(i => i.value = '');
});

// FAB
fabRefresh.addEventListener('click', loadLeagues);
fabGoPicks.addEventListener('click', () => tabPicks.click());

// Buscar partidos
btnSearch.addEventListener('click', searchMatches);

// ---------------------------
// Init
// ---------------------------
(function init() {
  const today = new Date().toISOString().split('T')[0];
  selDate.value = today;
  loadLeagues();
  renderPicks();
})();
