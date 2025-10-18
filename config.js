// ===== CONFIG GLOBAL (SIN MÓDULOS) =====
window.APP_CONFIG = {
  // 🔌 Proxy CORS temporal. Debes tener acceso concedido aquí:
  // https://cors-anywhere.herokuapp.com/corsdemo
  API_BASE: "https://cors-anywhere.herokuapp.com/https://v3.football.api-sports.io",

  // 🔐 Keys (van aquí porque nos has pedido ir sin proxy propio)
  API_FOOTBALL_KEY: "6DF57D1853E112002FA1139673F50218",
  ODDS_API_KEY:     "ddc3cb56d665397d69ceb71faf0e1b8b",

  // Ligas por defecto (fallback si /leagues falla)
  MAIN_LEAGUES: [
    { id: 39,  name: "Premier League" },
    { id: 140, name: "LaLiga" },
    { id: 135, name: "Serie A" },
    { id: 78,  name: "Bundesliga" },
    { id: 61,  name: "Ligue 1" },
    { id: 2,   name: "UEFA Champions League" },
    { id: 3,   name: "UEFA Europa League" }
  ],

  // Texto de UI (ids esperados en index.html)
  SELECTORS: {
    statusApi:   "status-api",
    statusOdds:  "status-odds",
    tabInicio:   "tab-inicio",
    tabPicks:    "tab-picks",
    sectionInicio: "inicio",
    sectionPicks:  "picks",
    filtroLigas: "filtro-ligas",
    fecha:       "fecha",
    btnBuscar:   "buscar-partidos",
    resultados:  "resultados",
    listaPicks:  "lista-picks"
  }
};
