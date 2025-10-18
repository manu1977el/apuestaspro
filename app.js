// ==================== Apuestas PRO - Versión local (sin API) ====================
// Gestiona pestañas e historial de picks con cálculo de probabilidades simple

(function() {
  const tabInicio = document.getElementById('tab-inicio');
  const tabPicks  = document.getElementById('tab-picks');
  const sectionInicio = document.getElementById('inicio');
  const sectionPicks  = document.getElementById('picks');
  const listaPicks = document.getElementById('lista-picks');
  const btnAddPick = document.getElementById('add-pick');

  const LS_KEY = 'ap_picks_v1';

  // 📊 Mostrar picks almacenados
  function mostrarPicks() {
    const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    if (!picks.length) {
      listaPicks.innerHTML = `<p>📭 No tienes picks guardados</p>`;
      return;
    }
    let html = `<ul style="list-style:none;padding:0;margin:0;">`;
    picks.forEach((p, i) => {
      html += `
        <li style="background:#121212;padding:10px;border-radius:8px;margin-bottom:8px;">
          ⭐ <strong>${p.local}</strong> vs <strong>${p.visitante}</strong><br>
          🧮 Probabilidad: <strong>${p.probabilidad || '-'}%</strong><br>
          💰 Cuota: ${p.cuota || '-'}
          <div style="font-size:12px;color:#999;margin-top:5px;">
            ${new Date(p.fecha).toLocaleString()}
          </div>
        </li>
      `;
    });
    html += `</ul>`;
    listaPicks.innerHTML = html;
  }

  // 📝 Guardar pick manual
  function guardarPickManual(local, visitante, cuota) {
    const picks = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
    const probabilidad = cuota ? Math.round((1 / parseFloat(cuota)) * 100) : null;
    picks.unshift({
      local,
      visitante,
      cuota,
      probabilidad,
      fecha: new Date().toISOString()
    });
    localStorage.setItem(LS_KEY, JSON.stringify(picks));
    mostrarPicks();
  }

  // 🧭 Pestañas
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
    mostrarPicks();
  });

  // ➕ Botón para crear picks manuales
  btnAddPick?.addEventListener('click', () => {
    const local = prompt("Equipo local:");
    const visitante = prompt("Equipo visitante:");
    const cuota = prompt("Cuota:");
    if (local && visitante) {
      guardarPickManual(local, visitante, cuota);
    }
  });

  // Inicializar interfaz
  sectionInicio.style.display = 'block';
  sectionPicks.style.display = 'none';
  mostrarPicks();
})();
