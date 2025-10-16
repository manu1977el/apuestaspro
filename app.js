/* ===== util ===== */
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>document.querySelectorAll(s);
const todayISO = ()=> new Date().toISOString().slice(0,10);
const toProb = (odds)=> odds>0 ? (1/odds)*100 : 0;
const fmtPct = (x)=> `${(x).toFixed(1)}%`;
const storage = {
  get(k,def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def; }catch{ return def; } },
  set(k,v){ localStorage.setItem(k,JSON.stringify(v)); }
};

const {API_FOOTBALL_KEY, ODDS_API_KEY, PROXY_URL, MAIN_LEAGUES, STATIC_COMPETITIONS, MARKETS} = window.APP_CONFIG;

/* ===== refs ===== */
const apiFootState = $('#apiFootState');
const oddsState    = $('#oddsState');
const tabHome = $('#tabHome'), tabPicks = $('#tabPicks');
const pageHome = $('#pageHome'), pagePicks = $('#pagePicks');
const dateInput = $('#dateInput'), compSelect = $('#compSelect'), teamSelect = $('#teamSelect');
const btnSearch = $('#btnSearch'), spinner = $('#spinner'), matchCounter = $('#matchCounter'), noMatches = $('#noMatches'), matchesList = $('#matchesList');
const mpHome=$('#mpHome'), mpAway=$('#mpAway'), mpComp=$('#mpComp'), marketsGrid=$('#marketsGrid');
const btnAddPick=$('#btnAddPick'), btnClearForm=$('#btnClearForm'), picksList=$('#picksList'), btnExport=$('#btnExport'), btnClearPicks=$('#btnClearPicks');
const picksCount=$('#picksCount'), comboProb=$('#comboProb'), comboEV=$('#comboEV');
const fabRefresh=$('#fabRefresh'), fabGoPicks=$('#fabGoPicks');

/* ===== nav ===== */
function showHome(){ tabHome.classList.add('active'); tabPicks.classList.remove('active'); pageHome.classList.remove('hidden'); pagePicks.classList.add('hidden'); }
function showPicks(){ tabPicks.classList.add('active'); tabHome.classList.remove('active'); pagePicks.classList.remove('hidden'); pageHome.classList.add('hidden'); }
tabHome.onclick = showHome; tabPicks.onclick = showPicks; fabGoPicks.onclick = showPicks;

/* ===== status APIs ===== */
async function pingAPI(url, headers){
  try{
    const r = await fetch(url, {headers, cf: {cacheTtl: 0}});
    return r.ok;
  }catch{ return false; }
}
async function refreshStatus(){
  const base = PROXY_URL || '';
  const af = await pingAPI(
    `${base}/https://v3.football.api-sports.io/status`,
    {'x-apisports-key':API_FOOTBALL_KEY}
  );
  apiFootState.textContent = af ? 'Online':'Offline';
  apiFootState.className = `dot ${af?'green':'red'}`;
  const od = await pingAPI(
    `${base}/https://api.the-odds-api.com/v4/sports?apikey=${ODDS_API_KEY}`
  );
  oddsState.textContent = od ? 'Online':'Offline';
  oddsState.className = `dot ${od?'green':'red'}`;
  return {af, od};
}
fabRefresh.onclick = refreshStatus;

/* ===== comps y equipos ===== */
function fillCompetitions(selectEl){
  selectEl.innerHTML = STATIC_COMPETITIONS
    .map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
}
fillCompetitions(compSelect);
fillCompetitions(mpComp);

async function loadTeamsForLeague(leagueId){
  // intenta live, si falla usa caché
  const cacheKey = `teams_${leagueId}`;
  try{
    const url = `${PROXY_URL}/https://v3.football.api-sports.io/teams?league=${leagueId}&season=${new Date().getFullYear()}`;
    const r = await fetch(url, {headers:{'x-apisports-key':API_FOOTBALL_KEY}});
    if(!r.ok) throw 0;
    const j = await r.json();
    const names = (j.response || []).map(t=>t.team?.name).filter(Boolean);
    if (names.length) storage.set(cacheKey, names);
    return names;
  }catch{
    return storage.get(cacheKey, []);
  }
}
compSelect.onchange = async ()=>{
  const lid = Number(compSelect.value);
  teamSelect.disabled = !lid;
  teamSelect.innerHTML = `<option value="">Todos los equipos</option>`;
  if(!lid) return;
  const teams = await loadTeamsForLeague(lid);
  teams.forEach(n=>{
    const op = document.createElement('option');
    op.value = op.textContent = n;
    teamSelect.appendChild(op);
  });
};

/* ===== buscar partidos ===== */
function cardMatch(m){
  const dt = new Date(m.fixture.timestamp*1000);
  return `<div class="item">
    <div class="row"><strong>${m.teams.home.name} vs ${m.teams.away.name}</strong><span class="chip">${dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span></div>
    <div class="row"><span class="chip">${m.league.name}</span><span class="chip">${m.fixture.venue?.name||''}</span></div>
  </div>`;
}
async function fetchMatchesForLeague(leagueId, dateISO){
  try{
    const url = `${PROXY_URL}/https://v3.football.api-sports.io/fixtures?date=${dateISO}&league=${leagueId}&season=${new Date().getFullYear()}`;
    const r = await fetch(url, {headers:{'x-apisports-key':API_FOOTBALL_KEY}});
    if(!r.ok) throw 0;
    const j = await r.json();
    return j.response || [];
  }catch{
    return [];
  }
}
btnSearch.onclick = async ()=>{
  const date = dateInput.value || todayISO();
  const lid = Number(compSelect.value||0);
  const team = teamSelect.value || '';

  spinner.classList.remove('hidden');
  noMatches.classList.add('hidden');
  matchCounter.classList.add('hidden');
  matchesList.innerHTML = '';

  let fixtures = [];
  if(lid){
    fixtures = await fetchMatchesForLeague(lid, date);
  }else{
    for(const L of MAIN_LEAGUES){
      const chunk = await fetchMatchesForLeague(L, date);
      fixtures.push(...chunk);
    }
  }
  if(team){
    fixtures = fixtures.filter(f => f.teams.home.name===team || f.teams.away.name===team);
  }

  spinner.classList.add('hidden');
  if(!fixtures.length){
    noMatches.classList.remove('hidden');
  }else{
    fixtures.sort((a,b)=>a.fixture.timestamp-b.fixture.timestamp);
    matchCounter.textContent = `📊 Partidos encontrados: ${fixtures.length}`;
    matchCounter.classList.remove('hidden');
    matchesList.innerHTML = fixtures.map(cardMatch).join('');
  }
  // alerta si API devuelve cero siempre
  if(!fixtures.length){
    alert("⚠️ La API no devolvió partidos para esa búsqueda. Prueba otra fecha/competición o revisa el límite diario.");
  }
};

/* ===== picks ===== */
function renderMarkets(){
  marketsGrid.innerHTML = '';
  MARKETS.forEach(name=>{
    const wrap = document.createElement('div');
    wrap.innerHTML = `<input data-market="${name}" placeholder="${name} (cuota)">`;
    marketsGrid.appendChild(wrap);
  });
}
renderMarkets();

function readPickForm(){
  const home = mpHome.value.trim(), away = mpAway.value.trim();
  const comp = mpComp.options[mpComp.selectedIndex]?.text || '';
  if(!home || !away) return null;
  const odds = [...marketsGrid.querySelectorAll('input')]
    .map(i=>({market:i.dataset.market, odd: parseFloat(i.value)}))
    .filter(x=>!isNaN(x.odd) && x.odd>1.01);
  return {home, away, comp, odds, ts: Date.now()};
}
function writePicks(list){ storage.set('picks', list); }
function readPicks(){ return storage.get('picks', []); }

function renderPicks(){
  const picks = readPicks();
  $('#picksCount').textContent = `Picks: ${picks.length}`;
  // combinada: producto de probabilidades
  let p = 1; let ev = 1;
  picks.forEach(pk=>{
    const avgOdd = pk.odds.length ? pk.odds.reduce((a,b)=>a+b.odd,0)/pk.odds.length : 1;
    const prob = toProb(avgOdd)/100;
    p *= prob || 1;
    ev *= (avgOdd*prob) || 1;
  });
  $('#comboProb').textContent = `Prob: ${fmtPct(p*100)}`;
  $('#comboEV').textContent = `EV: ${fmtPct((ev-1)*100)}`;

  picksList.innerHTML = picks.map((pk,idx)=>`
    <div class="item">
      <div class="row"><strong>${pk.home} vs ${pk.away}</strong><span class="chip">${pk.comp||''}</span></div>
      <div class="row"><span class="chip">Mercados: ${pk.odds.length}</span>
        <button class="btn danger" data-del="${idx}">Borrar</button>
      </div>
    </div>
  `).join('');
  picksList.querySelectorAll('[data-del]').forEach(b=>{
    b.onclick = ()=>{ const arr = readPicks(); arr.splice(+b.dataset.del,1); writePicks(arr); renderPicks(); };
  });
}
btnAddPick.onclick = ()=>{
  const pk = readPickForm();
  if(!pk){ alert("Completa local y visitante, y añade al menos una cuota"); return; }
  const arr = readPicks(); arr.push(pk); writePicks(arr); renderPicks();
};
btnClearForm.onclick = ()=>{
  mpHome.value = mpAway.value = '';
  marketsGrid.querySelectorAll('input').forEach(i=> i.value='');
};
btnClearPicks.onclick = ()=>{ if(confirm('¿Borrar todos los picks?')){ writePicks([]); renderPicks(); } };
btnExport.onclick = ()=>{
  const arr = readPicks();
  const csv = [
    "local,visitante,competicion,mercado,cuota,fecha",
    ...arr.flatMap(pk=> pk.odds.map(o=>[
      `"${pk.home}"`,`"${pk.away}"`,`"${pk.comp}"`,`"${o.market}"`,o.odd,new Date(pk.ts).toISOString()
    ].join(',')))
  ].join('\n');
  const blob = new Blob([csv],{type:'text/csv'}), a=document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download='picks.csv'; a.click(); URL.revokeObjectURL(a.href);
};

/* ===== init ===== */
function initUI(){
  // fecha por defecto
  dateInput.value = todayISO();
  // competencias iniciales (si no hay red, ya salen las estáticas)
  compSelect.innerHTML = STATIC_COMPETITIONS.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  // ‘Todos los equipos’ por defecto
  teamSelect.innerHTML = `<option value="">Todos los equipos</option>`;
  renderPicks();
}
window.addEventListener('load', async ()=>{
  initUI();
  await refreshStatus();
});