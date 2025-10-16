// =======================================
// 🏠 Apuestas PRO - app.js FINAL
// =======================================

// 📅 Fecha actual
const today = new Date().toISOString().split('T')[0];

// 🧩 API KEYS — Pega aquí tus claves reales
const API_KEY_FOOTBALL = "PON_AQUI_TU_KEY_DE_API_FOOTBALL";
const API_KEY_ODDS = "PON_AQUI_TU_KEY_DE_ODDS";

// 🌐 Endpoints
const API_FIXTURES = "https://v3.football.api-sports.io/fixtures";
const API_ODDS = "https://v3.football.api-sports.io/odds";

// 🏆 Ligas populares (ids API-Football)
const LEAGUES = [
  { id: 39, name: "Premier League" },
  { id: 140, name: "LaLiga" },
  { id: 135, name: "Serie A" },
  { id: 78, name: "Bundesliga" },
  { id: 61, name: "Ligue 1" },
  { id: 2, name: "Champions League" },
  { id: 3, name: "Europa League" }
];

// 🧭 Elementos de UI
const tabInicio = document.getElementById('tab-inicio');
const tabPicks = document.getElementById('tab-picks');
const sectionInicio = document.getElementById('inicio');
const sectionPicks = document.getElementById('picks');
const btnBuscar = document.getElementById('buscar-partidos');
const resultados = document.getElementById('resultados');
const filtroLigas = document.getElementById('filtro-ligas');
const listaPicks = document.getElementById('lista-picks');

// =============================
// 🧭 Navegación pestañas
// =============================
tabInicio?.addEventListener('click', () => {
  sectionInicio.style.display = 'block';
  sectionPicks.style.display = 'none';
  tabInicio.classList.add('active');
  tabPicks.classList.remove('active');
});

tabPicks?.addEventListener('click', () => {
  sectionInicio.style.display = 'none';
  sectionPicks.style.display = 'block';
  tabPicks.classList.add('active');
  tabInicio.classList.remove('active');
});

// =============================
// 🏆 Rellenar selector de ligas
// =============================
function cargarSelectorLigas() {
  if (!filtroLigas) return;
  filtroLigas.innerHTML = `<option value="all">🌍 Todas</option>`;
  LEAGUES.forEach(liga => {
    filtroLigas.innerHTML += `<option value="${liga.id}">${liga.name}</option>`;
  });
}

// =============================
// ⚽ Obtener partidos del día
// =============================
async function obtenerPartidos(fecha, liga = "all") {
  resultados.innerHTML = `<p>⏳ Cargando partidos...</p>`;
  try {
    const url = liga === "all"
      ? `${API_FIXTURES}?date=${fecha}`
      : `${API_FIXTURES}?date=${fecha}&league=${liga}&season=2025`;

    const response = await fetch(url, {
      headers: { 'x-apisports-key': API_KEY_FOOTBALL }
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const data = await response.json();

    if (data.response.length === 0) {
      resultados.innerHTML = `<p>⚽ No hay partidos para hoy (${today})</p>`;
      return;
    }

    mostrarPartidos(data.response);
  } catch (error) {
    console.error('❌ Error al obtener partidos:', error);
    resultados.innerHTML = `<p style="color:red;">❌ No se pudo conectar con API-Football.</p>`;
  }
}

// =============================
// 💰 Obtener cuotas
// =============================
async function obtenerCuotas(fixtureId) {
  try {
    const response = await fetch(`${API_ODDS}?fixture=${fixtureId}&bookmaker=8`, { // 8 = Bet365
      headers: { 'x-apisports-key': API_KEY_ODDS }
    });

    if (!response.ok) throw new Error(`Error cuotas ${response.status}`);
    const data = await response.json();
    if (!data.response || data.response.length === 0) return null;

    const markets = data.response[0].bookmakers[0].bets.find(bet => bet.name === "Match Winner");
    if (!markets) return null;

    const odds = {};
    markets.values.forEach(o => odds[o.value] = o.odd);
    return odds;
  } catch (error) {
    console.error('❌ Error al obtener cuotas:', error);
    return null;
  }
}

// =============================
// 📝 Mostrar partidos
// =============================
async function mostrarPartidos(partidos) {
  let html = `<h3>📅 Partidos del ${today}</h3><ul style="list-style:none; padding:0;">`;

  for (const p of partidos) {
    const home = p.teams.home.name;
    const away = p.teams.away.name;
    const hora = new Date(p.fixture.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    const odds = await obtenerCuotas(p.fixture.id);
    const cuotasHTML = odds
      ? `<div>💰 1: ${odds['Home'] || '-'} | X: ${odds['Draw'] || '-'} | 2: ${odds['Away'] || '-'}</div>`
      : `<div style="color:gray;">📉 Cuotas no disponibles</div>`;

    html += `
      <li style="margin-bottom:10px; background:#222; padding:12px; border-radius:6px;">
        🏟️ <strong>${home}</strong> vs <strong>${away}</strong><br>
        ⏰ ${hora}<br>
        ${cuotasHTML}
        <button class="btn-pick" data-home="${home}" data-away="${away}" data-hora="${hora}">⭐ Guardar pick</button>
      </li>
    `;
  }

  html += `</ul>`;
  resultados.innerHTML = html;

  // Añadir listeners a botones de picks
  document.querySelectorAll('.btn-pick').forEach(btn => {
    btn.addEventListener('click', e => {
      const el = e.currentTarget;
      guardarPick(el.dataset.home, el.dataset.away, el.dataset.hora);
    });
  });
}

// =============================
// 📝 Guardar picks (localStorage)
// =============================
function guardarPick(home, away, hora) {
  const picks = JSON.parse(localStorage.getItem('picks') || '[]');
  picks.push({ home, away, hora });
  localStorage.setItem('picks', JSON.stringify(picks));
  mostrarPicks();
}

// =============================
// 📥 Mostrar picks guardados
// =============================
function mostrarPicks() {
  const picks = JSON.parse(localStorage.getItem('picks') || '[]');
  if (picks.length === 0) {
    listaPicks.innerHTML = `<p>📭 No tienes picks guardados.</p>`;
    return;
  }

  let html = `<ul style="list-style:none; padding:0;">`;
  picks.forEach(p => {
    html += `<li style="background:#222; margin-bottom:8px; padding:10px; border-radius:6px;">
              ⭐ <strong>${p.home}</strong> vs <strong>${p.away}</strong> ⏰ ${p.hora}
            </li>`;
  });
  html += `</ul>`;
  listaPicks.innerHTML = html;
}

// =============================
// 🔘 Eventos
// =============================
btnBuscar?.addEventListener('click', () => {
  obtenerPartidos(today, filtroLigas.value);
});

filtroLigas?.addEventListener('change', () => {
  obtenerPartidos(today, filtroLigas.value);
});

// =============================
// 🚀 Inicialización
// =============================
window.addEventListener('load', () => {
  cargarSelectorLigas();
  mostrarPicks();
  obtenerPartidos(today);
});
