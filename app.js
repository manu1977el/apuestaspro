// ===============================
// 📲 Apuestas PRO - Lógica principal
// ===============================

// 🟦 Referencias UI
const tabInicio = document.getElementById('tab-inicio');
const tabPicks = document.getElementById('tab-picks');
const sectionInicio = document.getElementById('inicio');
const sectionPicks = document.getElementById('picks');

const leagueSelect = document.getElementById('leagueSelect');
const dateInput = document.getElementById('dateInput');
const btnBuscar = document.getElementById('btnBuscar');
const partidosContainer = document.getElementById('partidosContainer');

const mpHome = document.getElementById('mpHome');
const mpAway = document.getElementById('mpAway');
const mpOdd = document.getElementById('mpOdd');
const btnAddPick = document.getElementById('btnAddPick');

const listaPicks = document.getElementById('listaPicks');
const btnExport = document.getElementById('btnExport');
const btnClear = document.getElementById('btnClear');

const fabRefresh = document.getElementById('fabRefresh');
const fabGoPicks = document.getElementById('fabGoPicks');

// ===============================
// 🧭 Navegación entre pestañas
// ===============================
tabInicio.addEventListener('click', () => {
  tabInicio.classList.add('active');
  tabPicks.classList.remove('active');
  sectionInicio.classList.add('active');
  sectionPicks.classList.remove('active');
});

tabPicks.addEventListener('click', () => {
  tabPicks.classList.add('active');
  tabInicio.classList.remove('active');
  sectionPicks.classList.add('active');
  sectionInicio.classList.remove('active');
  mostrarPicks();
});

// ===============================
// 📅 Ligas y fechas
// ===============================
async function cargarLigas() {
  try {
    const resp = await fetch(`${API_FOOTBALL_BASE}/leagues`, { headers: apiHeaders });
    const data = await resp.json();
    leagueSelect.innerHTML = '';

    data.response
      .filter(l => l.country && l.league.type === 'League')
      .slice(0, 30)
      .forEach(liga => {
        const opt = document.createElement('option');
        opt.value = liga.league.id;
        opt.textContent = `${liga.country.name} - ${liga.league.name}`;
        leagueSelect.appendChild(opt);
      });
  } catch (e) {
    leagueSelect.innerHTML = `<option>Error al cargar ligas</option>`;
  }
}

// ===============================
// 📡 Buscar partidos
// ===============================
btnBuscar.addEventListener('click', buscarPartidos);

async function buscarPartidos() {
  const leagueId = leagueSelect.value;
  const date = dateInput.value;

  if (!leagueId || !date) {
    alert("Selecciona liga y fecha");
    return;
  }

  partidosContainer.innerHTML = "<p>⏳ Cargando partidos...</p>";

  try {
    const resp = await fetch(
      `${API_FOOTBALL_BASE}/fixtures?league=${leagueId}&date=${date}&timezone=${TIMEZONE}`,
      { headers: apiHeaders }
    );
    const data = await resp.json();
    partidosContainer.innerHTML = '';

    if (!data.response || data.response.length === 0) {
      partidosContainer.innerHTML = "<p>No hay partidos para esta fecha</p>";
      return;
    }

    data.response.forEach(p => {
      const div = document.createElement('div');
      div.style.background = '#1b1b1b';
      div.style.padding = '10px';
      div.style.marginBottom = '10px';
      div.style.borderRadius = '8px';
      div.innerHTML = `
        <strong>${p.teams.home.name}</strong> vs <strong>${p.teams.away.name}</strong><br>
        🕒 ${new Date(p.fixture.date).toLocaleString('es-ES')}<br>
        <button class="btnPick" data-home="${p.teams.home.name}" data-away="${p.teams.away.name}">⭐ Añadir pick</button>
      `;
      partidosContainer.appendChild(div);
    });

    document.querySelectorAll('.btnPick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const home = e.target.getAttribute('data-home');
        const away = e.target.getAttribute('data-away');
        addPick(home, away, '');
      });
    });

  } catch (e) {
    partidosContainer.innerHTML = "<p>❌ Error al cargar partidos</p>";
  }
}

// ===============================
// 📝 Picks manuales
// ===============================
btnAddPick.addEventListener('click', () => {
  const home = mpHome.value.trim();
  const away = mpAway.value.trim();
  const odd = mpOdd.value.trim();
  if (!home || !away) {
    alert("Introduce equipo local y visitante");
    return;
  }
  addPick(home, away, odd);
  mpHome.value = '';
  mpAway.value = '';
  mpOdd.value = '';
});

// ===============================
// 💾 Guardar y mostrar picks
// ===============================
function addPick(home, away, odd) {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  let prob = "";
  if (odd && !isNaN(odd)) {
    prob = (1 / parseFloat(odd) * 100).toFixed(2);
  }

  picks.push({
    home,
    away,
    odd: odd || "-",
    prob: prob || "-"
  });

  localStorage.setItem(LS_KEY, JSON.stringify(picks));
  mostrarPicks();
}

function mostrarPicks() {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  listaPicks.innerHTML = "";

  if (picks.length === 0) {
    listaPicks.innerHTML = "<p>No tienes picks guardados</p>";
    return;
  }

  picks.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ⭐ <strong>${p.home}</strong> vs <strong>${p.away}</strong><br>
      📊 Probabilidad: <strong>${p.prob}%</strong> | 💰 Cuota: ${p.odd}
      <br><button onclick="eliminarPick(${i})" class="secondary">Eliminar</button>
    `;
    listaPicks.appendChild(li);
  });
}

function eliminarPick(index) {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  picks.splice(index, 1);
  localStorage.setItem(LS_KEY, JSON.stringify(picks));
  mostrarPicks();
}

btnClear.addEventListener('click', () => {
  if (confirm("¿Seguro que quieres borrar todos los picks?")) {
    localStorage.removeItem(LS_KEY);
    mostrarPicks();
  }
});

// ===============================
// 📤 Exportar picks a CSV
// ===============================
btnExport.addEventListener('click', () => {
  const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  if (picks.length === 0) {
    alert("No hay picks para exportar");
    return;
  }

  let csv = "Local,Visitante,Cuota,Probabilidad\n";
  picks.forEach(p => {
    csv += `${p.home},${p.away},${p.odd},${p.prob}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'picks.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// ===============================
// 🧭 FAB Buttons
// ===============================
fabRefresh.addEventListener('click', () => {
  location.reload();
});

fabGoPicks.addEventListener('click', () => {
  tabPicks.click();
});

// ===============================
// 🚀 Inicialización
// ===============================
window.addEventListener('load', () => {
  cargarLigas();
  mostrarPicks();
});
