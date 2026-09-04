/* Kelly Care - pezzo 1 di 8 */
'use strict';

const CFG = (() => {
  const f = window.KELLY_CONFIG || {};
  const okFile = f.SUPABASE_URL && !f.SUPABASE_URL.includes('INSERISCI') && f.SUPABASE_ANON_KEY && !f.SUPABASE_ANON_KEY.includes('INSERISCI');
  if (okFile) return f;
  try { const l =
 JSON.parse(localStorage.getItem('kc_config') || 'null'); if (l && l.SUPABASE_URL && l.SUPABASE_ANON_KEY) return l; } catch {}
  return null;
})();
if (!CFG) {
  document.getElementById('app').innerHTML = `<div class="login">
    <div class="logo">🐶</div><h1>Kelly Care</h1>
    <p class="muted">Prima volta: incolla le due chiavi di Supabase.</p>
    <form id="cfgform">
      <label>Project URL<input name="url" placeholder="https://xxxx.supabase.co" autocapitalize="off" autocorrect="off" required></label>
      <label>anon public key<textarea name="key" placeholder="sb_publishable_..." required style="min-height:110px"></textarea></label>
      <button class="btn" type="submit" style="margin-top:18px">Salva e apri Kelly Care 🐾</button>
      <p class="small muted" style="margin-top:12px;text-align:center">Si fa una volta sola per telefono.</p>
    </form></div>`;
  document.getElementById('cfgform').addEventListener('submit', e => {
    e.preventDefault();
    const url = e.target.url.value.trim().replace(/\/+$/, ''), key = e.target.key.value.trim();
    if (!/^https:\/\/.+\.supabase\.co$/.test(url)) { alert('Il Project URL deve essere tipo https://xxxx.supabase.co'); return; }
    if (key.length < 20) { alert('La chiave sembra incompleta: copiala tutta.'); return; }
    localStorage.setItem('kc_config', JSON.stringify({ SUPABASE_URL: url, SUPABASE_ANON_KEY: key }));
    location.reload();
  });
  throw new Error('config mancante');
}
const sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
const BUCKET = 'kelly';

const S = {
  user: null, profile: null, dog: null, members: {}, dogPhoto: null,
  tasks: [], comps: [], activeWalk: null,
  today: { meals: [], walks: [], toilet: [], health: [], notes: [], weights: [] },
  meds: [], vaccs: [], healthAll: [], weights: [], appts: [], docs: [], vets: [], reminders: [],
  diary: [], diaryFilter: 'all', calMonth: null, calSel: null,
  view: 'today', chan: null, tick: null
};

const DEFAULT_TASKS = [
  { time: '08:00', emoji: '🍽️', title: 'Pappa', kind: 'meal' },
  { time: '09:00', emoji: '🐾', title: 'Passeggiata', kind: 'walk' },
  { time: '13:00', emoji: '💧', title: 'Controlla acqua', kind: 'water' },
  { time: '19:00', emoji: '🍽️', title: 'Pappa', kind: 'meal' },
  { time: '21:30', emoji: '🐾', title: 'Passeggiata', kind: 'walk' }
];
const HCATS = {
  weight: { e: '⚖️', n: 'Peso' },
  vaccine: { e: '💉', n: 'Vaccini' },
  medication: { e: '💊', n: 'Farmaci' },
  antiparasite: { e: '🦟', n: 'Antiparassitario' },
  vet: { e: '🩺', n: 'Veterinario' },
  grooming: { e: '✂️', n: 'Toelettatura' },
  teeth: { e: '🦷', n: 'Denti' },
  ears: { e: '👂', n: 'Orecchie' },
  bath: { e: '🛁', n: 'Bagno' }
};
const SYMPTOMS = [
  ['vomito', '🤮 Vomito'], ['diarrea', '💩 Diarrea'], ['non_mangia', '🍽️ Non mangia'],
  ['beve_molto', '💧 Beve molto'], ['beve_poco', '💧 Beve poco'], ['poco_attiva', '😴 Poco attiva'],
  ['dolore', '😖 Dolore/disagio'], ['sangue', '🩸 Sangue'], ['altro', '❓ Altro']
];
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const WDAYS = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const valid = d => d instanceof Date && !isNaN(d);
const fmtTime = d => { d = new Date(d); return valid(d) ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : ''; };
const fmtDate = d => { d = new Date(d); return valid(d) ? `${WDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}` : ''; };
const fmtDateFull = d => { d = new Date(d); return valid(d) ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : ''; };
const ymd = (d = new Date()) => { d = new Date(d); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const localDT = (d = new Date()) => { d = new Date(d); return `${ymd(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const dayStart = (d = new Date()) => { d = new Date(d); d.setHours(0, 0, 0, 0); return d; };
const isToday = d => ymd(d) === ymd();
const who = id => (S.members[id] && S.members[id].display_name) || 'qualcuno';
const dogName = () => (S.dog && S.dog.name) || 'Kelly';
const minsBetween = (a, b) => Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));
const age = bd => {
  if (!bd) return '';
  const b = new Date(bd), n = new Date();
  let y = n.getFullYear() - b.getFullYear(), m = n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) m--;
  if (m < 0) { y--; m += 12; }
  return y > 0 ? `${y} ann${y === 1 ? 'o' : 'i'}${m ? ` e ${m} mes${m === 1 ? 'e' : 'i'}` : ''}` : `${m} mes${m === 1 ? 'e' : 'i'}`;
};
const dueLabel = d => {
  if (!d) return '';
  const diff = Math.round((dayStart(d) - dayStart()) / 86400000);
  if (diff < 0) return `scaduto da ${-diff} g`;
  if (diff === 0) return 'oggi!';
  if (diff === 1) return 'domani';
  return `tra ${diff} g`;
};
const isDue = d => d && dayStart(d) <= dayStart();
const debounce = (f, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; };

let toastT;
function toast(msg, err) {
  const t = $('#toast'); t.textContent = msg; t.className = err ? 'err' : ''; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, err ? 4000 : 2000);
}
async function run(fn, okMsg) {
  try { await fn(); if (okMsg) toast(okMsg); }
  catch (e) { console.error(e); toast('Errore: ' + (e.message || e), true); }
}

async function q(p) { const { data, error } = await p; if (error) throw error; return data; }
const T = t => sb.from(t);
async function ins(table, row) {
  const base = { dog_id: S.dog.id, created_by: S.user.id };
  if (['meals', 'toilet_events', 'health_events', 'notes'].includes(table)) base.occurred_at = new Date().toISOString();
  return q(T(table).insert({ ...base, ...row }).select().single());
}
async function upload(file, folder) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const path = `${S.dog.id}/${folder}/${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}
const urlCache = {};
async function signed(path) {
  if (!path) return null;
  if (urlCache[path] && urlCache[path].exp > Date.now()) return urlCache[path].url;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 3600 * 6);
  if (error) return null;
  urlCache[path] = { url: data.signedUrl, exp: Date.now() + 3600 * 5 * 1000 };
  return data.signedUrl;
}

let sheetSubmit = null;
function openSheet(title, html, onSubmit) {
  sheetSubmit = onSubmit || null;
  $('#sheet').innerHTML = `<div class="handle"></div><button class="close" data-a="closeSheet" aria-label="Chiudi">✕</button><h2>${title}</h2>${html}`;
  $('#overlay').hidden = false;
}
document.getElementById('btn-add-event-quick')?.addEventListener('click', () => {
  const dateVal = document.getElementById('cal-date-input').value;
  const titleVal = document.getElementById('cal-title-input').value.trim();

  if (!dateVal || !titleVal) {
    alert('Seleziona una data e inserisci un titolo');
    return;
  }

  CalendarManager.addEvent(dateVal, titleVal, 'generale');
  document.getElementById('cal-title-input').value = '';
  renderCalendar();
});
