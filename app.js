// ==========================
// 📱 Apuestas PRO - v.2025
// ==========================

// 📌 Configuración
const API_FOOTBALL_BASE = "https://v3.football.api-sports.io";
const API_KEY = "6DF57D1853E112002FA1139673F50218"; // tu key real
const TIMEZONE = "Europe/Madrid";

const apiHeaders = {
  "x-apisports-key": API_KEY,
  "x-rapidapi-host": "v3.football.api-sports.io"
};

const LS_KEY = 'ap_picks_v1';

// 🧭 Elementos UI
const tabInicio = document.getElementById('tab-inicio');
const tabPicks = document.getElementById('tab-picks');
const sectionInicio = document.getElementById('inicio');
const sectionPicks = document.getElementById('picks');
const partidosContainer = document.getElementById('lista-partidos');
const listaPicks = document.getElementById('lista-picks');
const btnAddManual = document.getElementById('btnAddPick');
const leagueSelect = document.getElementById('leagueSelect');
const dateInput = document.getElementById('dateInput');
const fabRefresh = document.getElementById('fabRefresh');
const fabGoPicks = document.getElementById('fabGoPicks');

// =======================
// 🧭 Navegación de pestañas
// =======================
tabInicio.addEventListener('click', () => {
  sectionInicio.style.display = 'block';
  sectionPicks.style.display = 'none';
  tabInicio.classList.add('active');
  tabPicks.classList.remove('active');
});

tabPicks.addEventListener('click', () => {
  sectionInicio.style.display = 'none';
  sectionPicks.style.display = 'block';
  tabInicio.classList.remove('active');
  tabPicks.classList.add('active');
});

// =======================
// 📅 Buscar partidos (con cuotas)
// =======================
async function buscarPartidos() {
  const leagueId = leagueSelect.value;
  const date = dateInput.value;
  const season = 2025; // 👈 temporada 2025/26

  if (!leagueId || !date) {
    alert("Selecciona una liga y una fecha válida");
    return;
  }

  const yearSelected = parseInt(date.split('-')[0], 10);
  if (yearSelected < season || yearSelected > season + 1) {
    partidosContainer.innerHTML = `
      <p>⚠️ La fecha seleccionada no corresponde a la temporada ${season}/${season + 1}.</p>
    `;
    return;
  }

  partidosContainer.innerHTML = "<p>⏳ Cargando partidos...</p>";

  try {
    const resp = await fetch(
      `${API_FOOTBALL_BASE}/fixtures?league=${leagueId}&season=${season}&date=${date}&timezone=${TIMEZONE}`,
      { headers: apiHeaders }
    );
    const data = await resp.json();

    if (!data.response || data.response.length === 0) {
      partidosContainer.innerHTML = "<p>⚠️ No hay partidos programados para esta fecha.</p>";
      return;
    }

    partidosContainer.innerHTML = '';

    data.response.forEach(p => {
      const home = p.teams.home.name;
      const away = p.teams.away.name;
      const hora = new Date(p.fixture.date).toLocaleString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });

      let cuotas = '';
      let cuotaHome = '';
      if (p.bookmakers && p.bookmakers.length > 0 && p.bookmakers[0].bets.length > 0) {
        const market = p.bookmakers[0].bets[0].values;
        cuotaHome = market[0]?.odd || '';
        cuotas = `
          🏠 ${market[0]?.odd || '-'} | 🤝 ${market[1]?.odd || '-'} | 🧳 ${market[2]?.odd || '-'}
        `;
      }

      const div = document.createElement('div');
      div.className = 'partido';
      div.innerHTML = `
        <strong>${home}</strong> vs <strong>${away}</strong><br>
        🕒 ${hora}<br>
        ${cuotas ? `<div>${cuotas}</div>` : '<small>📉 Sin cuotas disponibles</small>'}
        <button class="btnPick" data-home="${home}" data-away="${away}" data-cuota="${cuotaHome}">⭐ Añadir pick</button>
      `;
      partidosContainer.appendChild(div);
    });

    document.querySelectorAll('.btnPick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const home = e.target.getAttribute('data-home');
        const away = e.target.getAttribute('data-away');
        const cuota = e.target.getAttribute('data-cuota');
        addPick(home, away, cuota);
      });
    });

  } catch (e) {
    console.error("❌ Error cargando partidos:", e);
    partidosContainer.innerHTML = "<p>❌ Error al cargar partidos.</p>";
  }
}

// =======================
// ⭐ Añadir picks
// =======================
function addPick(local, visitante, cuota) {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const probabilidad = cuota ? ((1 / parseFloat(cuota)) * 100).toFixed(1) : '-';
  picks.push({ local, visitante, cuota, probabilidad, fecha: new Date().toISOString() });
  localStorage.setItem(LS_KEY, JSON.stringify(picks));
  mostrarPicks();
}

// 🧹 Añadir pick manual
btnAddManual.addEventListener('click', () => {
  const local = document.getElementById('mpHome').value;
  const visitante = document.getElementById('mpAway').value;
  const cuota = document.getElementById('mpComp').value;
  if (!local || !visitante) {
    alert("Completa los campos");
    return;
  }
  addPick(local, visitante, cuota);
  document.getElementById('mpHome').value = '';
  document.getElementById('mpAway').value = '';
  document.getElementById('mpComp').value = '';
});

// =======================
// 📊 Mostrar picks guardados
// =======================
function mostrarPicks() {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  if (!picks.length) {
    listaPicks.innerHTML = "<p>📭 No tienes picks guardados</p>";
    return;
  }

  let html = '<ul style="list-style:none;padding:0;">';
  picks.forEach((p, i) => {
    html += `
      <li style="background:#121212;padding:10px;border-radius:8px;margin-bottom:8px;">
        ⭐ <strong>${p.local}</strong> vs <strong>${p.visitante}</strong><br>
        📊 Probabilidad: <strong>${p.probabilidad}%</strong><br>
        💰 Cuota: ${p.cuota || '-'}
        <div style="font-size:12px;color:#888;margin-top:5px;">
          ${new Date(p.fecha).toLocaleString('es-ES')}
        </div>
      </li>
    `;
  });
  html += '</ul>';
  listaPicks.innerHTML = html;
}

// =======================
// 🌀 FAB Botones
// =======================
fabRefresh.addEventListener('click', () => location.reload());
fabGoPicks.addEventListener('click', () => {
  sectionInicio.style.display = 'none';
  sectionPicks.style.display = 'block';
  tabInicio.classList.remove('active');
  tabPicks.classList.add('active');
});

// =======================
// 🚀 Inicializar
// =======================
document.addEventListener('DOMContentLoaded', () => {
  mostrarPicks();

  // Fecha por defecto: hoy
  const hoy = new Date().toISOString().split('T')[0];
  dateInput.value = hoy;
});
