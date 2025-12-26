// Vida Hábito - Juego Saludable
// Todos los textos y comentarios están en español.

// --------- Estado y almacenamiento ---------
const todayStr = new Date().toISOString().slice(0,10);
const LS_KEY = 'vida_habito_state_v1';

const baseTasks = [
  // Comida y nutrición
  {id:'agua', name:'Beber 8 vasos de agua', category:'Comida', hp:+5, coins:+5, xp:+10, penaltyHp:-3},
  {id:'desayuno', name:'Desayuno balanceado', category:'Comida', hp:+4, coins:+4, xp:+8, penaltyHp:-2},
  {id:'frutas', name:'Comer 2 porciones de fruta', category:'Comida', hp:+3, coins:+3, xp:+6, penaltyHp:-2},
  // Ejercicio y deporte
  {id:'cardio', name:'20 min de cardio', category:'Ejercicio', hp:+6, coins:+6, xp:+12, penaltyHp:-3},
  {id:'fuerza', name:'Fuerza (30 min)', category:'Ejercicio', hp:+6, coins:+6, xp:+12, penaltyHp:-3},
  {id:'estirar', name:'Estiramientos (10 min)', category:'Ejercicio', hp:+3, coins:+3, xp:+6, penaltyHp:-1},
  {id:'deporte', name:'Practicar un deporte', category:'Deporte', hp:+5, coins:+5, xp:+10, penaltyHp:-2},
  // Mente
  {id:'lectura', name:'Leer 20 minutos', category:'Mente', hp:+2, coins:+4, xp:+10, penaltyHp:-1},
  {id:'musica', name:'Escuchar música que te motive', category:'Mente', hp:+1, coins:+3, xp:+6, penaltyHp:-1},
  {id:'gratitud', name:'Escribir 3 cosas por las que agradeces', category:'Mente', hp:+2, coins:+3, xp:+8, penaltyHp:-1},
  {id:'respirar', name:'Respiración 4-7-8 (5 min)', category:'Mente', hp:+2, coins:+3, xp:+8, penaltyHp:-1},
  // Higiene y cuidado
  {id:'higiene', name:'Higiene personal completa', category:'Higiene', hp:+3, coins:+3, xp:+8, penaltyHp:-2},
  {id:'dental', name:'Cepillado dental 2 veces', category:'Higiene', hp:+3, coins:+3, xp:+8, penaltyHp:-2},
  // Sueño
  {id:'sueno', name:'Dormir 7-8 horas', category:'Sueño', hp:+6, coins:+6, xp:+12, penaltyHp:-4},
  // Triviales y orden
  {id:'orden', name:'Ordenar tu escritorio (10 min)', category:'Triviales', hp:+1, coins:+2, xp:+4, penaltyHp:-1},
  {id:'social', name:'Saludar y conversar con alguien', category:'Triviales', hp:+1, coins:+2, xp:+4, penaltyHp:-1},
];

const shopItems = [
  {id:'dulce', name:'Dulce', price:20, effect:'Ánimo +5, Vida -2', mood:+5, hp:-2},
  {id:'gaseosa', name:'Gaseosa', price:25, effect:'Ánimo +4, Vida -3', mood:+4, hp:-3},
  {id:'helado', name:'Helado', price:30, effect:'Ánimo +6, Vida -3', mood:+6, hp:-3},
  {id:'pizza', name:'Porción de pizza', price:40, effect:'Ánimo +7, Vida -4', mood:+7, hp:-4},
  {id:'capricho', name:'Capricho personal', price:50, effect:'Ánimo +8, Vida -0', mood:+8, hp:0},
];

const defaultState = {
  name: 'Jaime',
  level: 1,
  xp: 0,
  xpToNext: 100,
  hp: 50,
  hpMax: 100,
  mood: 50,
  coins: 0,
  streak: 0,
  lastDate: todayStr,
  avatar: { skin:'#F2C1A0', hair:'#2D1B10', style:'corto' },
  tasks: baseTasks.map(t => ({...t, completed:false})),
  history: [] // {date, completedCount, penalties, hp, mood, coins}
};

let state = loadState();

function loadState(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    if(!raw){
      return structuredClone(defaultState);
    }
    const s = JSON.parse(raw);
    // Migración simple si faltan campos
    s.tasks = (s.tasks && s.tasks.length) ? s.tasks : baseTasks.map(t => ({...t, completed:false}));
    s.xpToNext = s.xpToNext || 100;
    s.hpMax = s.hpMax || 100;
    return s;
  } catch(e){
    console.error('Error cargando estado', e);
    return structuredClone(defaultState);
  }
}

function saveState(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  renderAll();
}

// --------- Lógica principal ---------
function adjustStat(key, delta){
  state[key] += delta;
  if(key==='hp'){
    state.hp = Math.max(0, Math.min(state.hp, state.hpMax));
  }
  if(key==='mood'){
    state.mood = Math.max(0, Math.min(state.mood, 100));
  }
}

function gainXP(amount){
  state.xp += amount;
  while(state.xp >= state.xpToNext){
    state.xp -= state.xpToNext;
    state.level += 1;
    state.hpMax += 5; // sube el máximo de vida levemente por nivel
    adjustStat('hp', +5); // recupera algo al subir de nivel
  }
}

function completeMission(id){
  const m = state.tasks.find(x => x.id===id);
  if(!m || m.completed) return;
  m.completed = true;
  adjustStat('hp', m.hp);
  adjustStat('mood', Math.max(0, Math.floor(m.hp/2))); // ánimo proporcional a hábito
  state.coins += m.coins;
  gainXP(m.xp);
  saveState();
}

function undoMission(id){
  const m = state.tasks.find(x => x.id===id);
  if(!m || !m.completed) return;
  m.completed = false;
  adjustStat('hp', -m.hp);
  adjustStat('mood', -Math.max(0, Math.floor(m.hp/2)));
  state.coins -= m.coins;
  state.xp = Math.max(0, state.xp - m.xp);
  saveState();
}

function skipMission(id){
  const m = state.tasks.find(x => x.id===id);
  if(!m) return;
  // marcar como no completada explícitamente
  m.completed = false;
  saveState();
}

function closeDay(){
  // penalizar misiones no cumplidas
  let penalties = 0;
  let completedCount = 0;
  state.tasks.forEach(m => {
    if(m.completed){
      completedCount++;
    } else {
      adjustStat('hp', m.penaltyHp);
      adjustStat('mood', -1);
      penalties += 1;
    }
  });
  // racha y fecha
  state.streak = (completedCount >= Math.ceil(state.tasks.length * 0.5)) ? state.streak + 1 : 0;
  state.lastDate = todayStr;
  // registrar historial
  state.history.unshift({date: todayStr, completedCount, penalties, hp: state.hp, mood: state.mood, coins: state.coins});
  state.history = state.history.slice(0, 30);
  // reset de misiones
  state.tasks.forEach(m => m.completed=false);
  saveState();
  alert('Día cerrado. Se aplicaron penalizaciones por hábitos no cumplidos. ¡Mañana es una nueva oportunidad!');
}

function checkRollover(){
  if(state.lastDate !== todayStr){
    // aplicar cierre automático
    closeDay();
  }
}

// --------- Tienda ---------
function buyItem(id){
  const item = shopItems.find(i => i.id===id);
  if(!item) return;
  if(state.coins < item.price){
    alert('No tienes suficientes monedas.');
    return;
  }
  state.coins -= item.price;
  adjustStat('hp', item.hp);
  adjustStat('mood', item.mood);
  saveState();
}

// --------- Avatar ---------
function updateAvatar(){
  const head = document.getElementById('head');
  const hair = document.getElementById('hair');
  head.setAttribute('fill', state.avatar.skin);
  hair.setAttribute('fill', state.avatar.hair);
  const style = state.avatar.style;
  let d;
  switch(style){
    case 'largo': d = 'M55,70 Q100,10 145,70 L145,140 Q100,160 55,140 Z'; break;
    case 'rulos': d = 'M55,65 C70,30 130,30 145,65 C140,80 60,80 55,65 Z'; break;
    case 'calvo': d = ''; break;
    default: d = 'M55,70 Q100,20 145,70 Q100,45 55,70 Z';
  }
  hair.setAttribute('d', d);
}

function randomAvatar(){
  const rndColor = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
  const styles = ['corto','largo','rulos','calvo'];
  state.avatar.skin = rndColor();
  state.avatar.hair = rndColor();
  state.avatar.style = styles[Math.floor(Math.random()*styles.length)];
  saveState();
}

// --------- Render de UI ---------
function renderStats(){
  document.getElementById('playerName').value = state.name || '';
  const hpBar = document.getElementById('hpBar');
  hpBar.max = state.hpMax;
  hpBar.value = state.hp;
  document.getElementById('hpText').textContent = `${state.hp}/${state.hpMax}`;

  const moodBar = document.getElementById('moodBar');
  moodBar.max = 100;
  moodBar.value = state.mood;
  document.getElementById('moodText').textContent = `${state.mood}/100`;

  document.getElementById('levelText').textContent = state.level;
  document.getElementById('xpText').textContent = `${state.xp}/${state.xpToNext} XP`;
  document.getElementById('coinsText').textContent = state.coins;
  document.getElementById('streakText').textContent = `${state.streak} días`;
}

function renderMissions(){
  const container = document.getElementById('missionList');
  const grouped = {};
  state.tasks.forEach(m => { (grouped[m.category] ||= []).push(m); });
  container.innerHTML = '';
  Object.keys(grouped).forEach(cat => {
    const catDiv = document.createElement('div');
    catDiv.className = 'category';
    const title = document.createElement('h3');
    title.textContent = cat;
    catDiv.appendChild(title);
    grouped[cat].forEach(m => {
      const mDiv = document.createElement('div');
      mDiv.className = 'mission';
      const nameSpan = document.createElement('span');
      nameSpan.textContent = m.name;
      const rewards = document.createElement('div');
      rewards.className = 'rewards';
      rewards.textContent = `❤️ ${m.hp>0?'+':''}${m.hp} | 🪙 ${m.coins>0?'+':''}${m.coins} | XP ${m.xp}`;
      const actions = document.createElement('div');
      actions.className = 'actions';

      const completeBtn = document.createElement('button');
      completeBtn.className = 'button ' + (m.completed ? 'secondary' : 'primary');
      completeBtn.textContent = m.completed ? '✓ Completada' : 'Completar';
      completeBtn.onclick = () => m.completed ? undoMission(m.id) : completeMission(m.id);

      const skipBtn = document.createElement('button');
      skipBtn.className = 'button danger';
      skipBtn.textContent = 'Saltar';
      skipBtn.onclick = () => skipMission(m.id);

      actions.appendChild(completeBtn);
      actions.appendChild(skipBtn);
      mDiv.appendChild(nameSpan);
      mDiv.appendChild(rewards);
      mDiv.appendChild(actions);
      catDiv.appendChild(mDiv);
    });
    container.appendChild(catDiv);
  });
}

function renderShop(){
  const container = document.getElementById('shopList');
  container.innerHTML = '';
  shopItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item';
    const h4 = document.createElement('h4'); h4.textContent = item.name;
    const price = document.createElement('div'); price.className = 'price'; price.textContent = `Precio: 🪙 ${item.price}`;
    const effect = document.createElement('div'); effect.className = 'effect'; effect.textContent = `Efecto: ${item.effect}`;
    const btn = document.createElement('button'); btn.className = 'button primary'; btn.textContent = 'Comprar'; btn.onclick = () => buyItem(item.id);
    div.appendChild(h4); div.appendChild(price); div.appendChild(effect); div.appendChild(btn);
    container.appendChild(div);
  });
}

function renderSummary(){
  const ul = document.getElementById('summaryStats');
  ul.innerHTML = '';
  const items = [
    `Vida: ${state.hp}/${state.hpMax}`,
    `Ánimo: ${state.mood}/100`,
    `Nivel: ${state.level} (XP ${state.xp}/${state.xpToNext})`,
    `Monedas: ${state.coins}`,
    `Racha: ${state.streak} días`,
    `Misiones hoy: ${state.tasks.filter(m=>m.completed).length}/${state.tasks.length}`,
  ];
  items.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });

  const histUl = document.getElementById('historyList');
  histUl.innerHTML = '';
  state.history.slice(0,7).forEach(h => {
    const li = document.createElement('li');
    li.textContent = `${h.date}: completadas ${h.completedCount}, penalizaciones ${h.penalties}, vida ${h.hp}, ánimo ${h.mood}, monedas ${h.coins}`;
    histUl.appendChild(li);
  });
}

function renderAll(){
  renderStats();
  renderMissions();
  renderShop();
  renderSummary();
  updateAvatar();
}

// --------- Exportar / Importar ---------
function exportState(){
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vida_habito_${todayStr}.json`;
  a.click();
}

function importState(file){
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const obj = JSON.parse(e.target.result);
      state = obj; saveState(); alert('Progreso importado.');
    } catch(err){ alert('Archivo inválido.'); }
  };
  reader.readAsText(file);
}

// --------- Eventos de UI ---------
function bindEvents(){
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(tabId).classList.add('active');
    });
  });
  // Nombre
  document.getElementById('playerName').addEventListener('change', (e) => { state.name = e.target.value; saveState(); });
  // Cerrar día
  document.getElementById('closeDayBtn').addEventListener('click', closeDay);
  // Reset hoy
  document.getElementById('resetTodayBtn').addEventListener('click', () => { state.tasks.forEach(m=>m.completed=false); saveState(); });
  // Avatar
  document.getElementById('skinColor').addEventListener('input', (e) => { state.avatar.skin = e.target.value; saveState(); });
  document.getElementById('hairColor').addEventListener('input', (e) => { state.avatar.hair = e.target.value; saveState(); });
  document.getElementById('hairStyle').addEventListener('change', (e) => { state.avatar.style = e.target.value; saveState(); });
  document.getElementById('randomAvatar').addEventListener('click', randomAvatar);
  // Export/Import
  document.getElementById('exportBtn').addEventListener('click', exportState);
  document.getElementById('importFile').addEventListener('change', (e) => { if(e.target.files[0]) importState(e.target.files[0]); });
  // Notificaciones
  document.getElementById('notifyBtn').addEventListener('click', async () => {
    if(!('Notification' in window)) { alert('Tu navegador no soporta notificaciones.'); return; }
    const perm = await Notification.requestPermission();
    if(perm === 'granted'){
      new Notification('Recordatorio', { body: 'Toma un vaso de agua 💧' });
      // recordatorio simple cada hora (solo mientras la página esté abierta)
      setInterval(() => {
        new Notification('Pausa activa', { body: 'Muévete 2 minutos 🏃‍♂️' });
      }, 60*60*1000);
    }
  });
  // Escuchar clic en completar/undo desde renderMissions a través de botones ya ligados
}

// Añadir misión desde formulario
function bindAddMission(){
  const form = document.getElementById('addMissionForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('mName').value.trim();
    const category = document.getElementById('mCategory').value.trim() || 'Personal';
    const hp = parseInt(document.getElementById('mHp').value) || 0;
    const coins = parseInt(document.getElementById('mCoins').value) || 0;
    const xp = parseInt(document.getElementById('mXp').value) || 0;
    const penaltyHp = parseInt(document.getElementById('mPenalty').value) || 0;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g,'_') + '_' + Math.floor(Math.random()*10000);
    state.tasks.push({id, name, category, hp, coins, xp, penaltyHp, completed:false});
    saveState();
    form.reset();
  });
}

// Inicialización
bindEvents();
bindAddMission();
checkRollover();
renderAll();
