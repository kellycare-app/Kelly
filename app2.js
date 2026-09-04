/* Kelly Care - pezzo 2 di 8 */
function closeSheet() { $('#overlay').hidden = true; $('#sheet').innerHTML = ''; sheetSubmit = null; }
const F = {
  text: (n, l, v = '', ph = '') => `<label>${l}<input name="${n}" value="${esc(v)}" placeholder="${esc(ph)}"></label>`,
  num: (n, l, v = '', ph = '') => `<label>${l}<input type="number" inputmode="decimal" step="any" name="${n}" value="${esc(v)}" placeholder="${esc(ph)}"></label>`,
  dt: (n, l, v = localDT()) => `<label>${l}<input type="datetime-local" name="${n}" value="${v}"></label>`,
  date: (n, l, v = '') => `<label>${l}<input type="date" name="${n}" value="${v}"></label>`,
  time: (n, l, v = '') => `<label>${l}<input type="time" name="${n}" value="${v}"></label>`,
  area: (n, l, v = '', ph = '') => `<label>${l}<textarea name="${n}" placeholder="${esc(ph)}">${esc(v)}</textarea></label>`,
  select: (n, l, opts, v = '') => `<label>${l}<select name="${n}">${opts.map(o => `<option value="${esc(o[0])}"${o[0] === v ? ' selected' : ''}>${esc(o[1])}</option>`).join('')}</select></label>`,
  check: (n, l, v = false) => `<label class="ck"><input type="checkbox" name="${n}"${v ? ' checked' : ''}>${l}</label>`,
  file: (n, l, accept = 'image/*') => `<label>${l}<input type="file" name="${n}" accept="${accept}"></label>`,
  hidden: (n, v) => `<input type="hidden" name="${n}" value="${esc(v)}">`,
  choices: (n, l, opts, v = '', multi = false) => `<label>${l}</label><div class="choices" data-choices="${n}" data-multi="${multi ? 1 : 0}">${opts.map(o => `<button type="button" data-val="${esc(o[0])}" class="${(multi ? String(v).split(',') : [v]).includes(o[0]) ? 'on' : ''}">${esc(o[1])}</button>`).join('')}</div>${F.hidden(n, v)}`,
  submit: (l = 'Salva', cls = '') => `<button class="btn ${cls}" type="submit">${l}</button>`
};
function formData(form) {
  const o = {};
  new FormData(form).forEach((v, k) => { o[k] = v; });
  form.querySelectorAll('input[type=checkbox]').forEach(c => { o[c.name] = c.checked; });
  return o;
}

function renderLogin(msg = '') {
  $('#nav').hidden = true;
  $('#app').innerHTML = `<div class="login">
    <div class="logo">🐶</div>
    <h1>Kelly Care</h1>
    <p class="muted">La routine di Kelly, insieme.</p>
    <form data-form="login">
      ${F.text('email', 'Email', localStorage.getItem('kc_email') || '', 'la tua email')}
      <label>Password<input type="password" name="password" required></label>
      ${F.submit('Entra 🐾')}
      ${msg ? `<p class="small" style="color:var(--red);margin-top:10px;text-align:center">${esc(msg)}</p>` : ''}
    </form></div>`;
}
document.addEventListener('submit', async e => {
  const form = e.target;
  if (form.dataset.form === 'login') {
    e.preventDefault();
    const d = formData(form);
    localStorage.setItem('kc_email', d.email);
    form.querySelector('button').disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: d.email.trim(), password: d.password });
    if (error) renderLogin('Email o password non corretti.');
    return;
  }
  if (form.closest('#sheet') && sheetSubmit) {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;
    try { await sheetSubmit(formData(form), form); }
    catch (err) { console.error(err); toast('Errore: ' + (err.message || err), true); if (btn) btn.disabled = false; }
  }
});

if (typeof sb !== 'undefined') {
  sb.auth.onAuthStateChange((ev, session) => {
    if (ev === 'SIGNED_OUT') { S.user = null; stopSync(); renderLogin(); }
    if (ev === 'SIGNED_IN' && session && !S.user) start(session.user);
  });
  (async function init() {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
    const { data: { session } } = await sb.auth.getSession();
    if (session) start(session.user); else renderLogin();
  })();
}

async function start(user) {
  S.user = user;
  await run(async () => {
    await loadCore();
    if (!S.profile.display_name || S.profile.display_name.trim() === '') { askName(); return; }
    if (!S.dog) { onboarding(); return; }
    await loadToday();
    S.view = 'today';
    render();
    startSync();
    checkReminders();
  });
}
async function loadCore() {
  const profs = await q(T('profiles').select('*'));
  S.members = Object.fromEntries(profs.map(p => [p.id, p]));
  S.profile = S.members[S.user.id] || (await q(T('profiles').insert({ id: S.user.id, display_name: '' }).select().single()));
  const dogs = await q(T('dogs').select('*').order('created_at').limit(1));
  S.dog = dogs[0] || null;
  if (S.dog) {
    await q(T('family_members').upsert({ dog_id: S.dog.id, user_id: S.user.id }, { onConflict: 'dog_id,user_id' }));
    S.dogPhoto = await signed(S.dog.photo_path);
    S.tasks = await q(T('daily_tasks').select('*').eq('dog_id', S.dog.id).order('time'));
    S.vets = await q(T('vets').select('*').eq('dog_id', S.dog.id).order('is_emergency').order('created_at'));
    S.reminders = await q(T('reminders').select('*').eq('dog_id', S.dog.id).order('time'));
    S.meds = await q(T('medications').select('*').eq('dog_id', S.dog.id).order('active', { ascending: false }).order('name'));
    S.vaccs = await q(T('vaccinations').select('*').eq('dog_id', S.dog.id).order('given_on', { ascending: false }));
    S.healthAll = await q(T('health_events').select('*').eq('dog_id', S.dog.id).order('occurred_at', { ascending: false }).limit(300));
    S.weights = await q(T('weight_history').select('*').eq('dog_id', S.dog.id).order('measured_at', { ascending: false }).limit(100));
    S.appts = await q(T('appointments').select('*').eq('dog_id', S.dog.id).order('starts_at'));
  }
}
async function loadToday() {
  if (!S.dog) return;
  const from = dayStart().toISOString(), d = S.dog.id;
  const [comps, meals, walks, toilet, health, notes, weights, active] = await Promise.all([
    q(T('task_completions').select('*').eq('dog_id', d).eq('task_date', ymd())),
    q(T('meals').select('*').eq('dog_id', d).gte('occurred_at', from).order('occurred_at')),
    q(T('walks').select('*').eq('dog_id', d).gte('started_at', from).order('started_at')),
    q(T('toilet_events').select('*').eq('dog_id', d).gte('occurred_at', from).order('occurred_at')),
    q(T('health_events').select('*').eq('dog_id', d).gte('occurred_at', from).order('occurred_at')),
    q(T('notes').select('*').eq('dog_id', d).gte('occurred_at', from).order('occurred_at')),
    q(T('weight_history').select('*').eq('dog_id', d).gte('measured_at', from)),
    q(T('walks').select('*').eq('dog_id', d).is('ended_at', null).order('started_at', { ascending: false }).limit(1))
  ]);
  S.comps = comps; S.today = { meals, walks, toilet, health, notes, weights };
  S.activeWalk = active[0] || null;
}
async function refreshAll() {
  await run(async () => {
    await loadCore();
    await loadToday();
    if (S.view === 'diary') await loadDiary();
    render();
  });
}
const refreshSoon = debounce(refreshAll, 400);

function startSync() {
  stopSync();
  S.chan = sb.channel('kelly-sync')
    .on('postgres_changes', { event: '*', schema: 'public' }, () => refreshSoon())
    .subscribe();
  if (S.tick) clearInterval(S.tick);
  S.tick = setInterval(() => {
    if (S.view === 'today' && S.activeWalk) { const el = $('#walktimer'); if (el) el.textContent = walkClock(); }
    if (new Date().getSeconds() < 30) checkReminders();
  }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.user) refreshSoon(); });
}
function stopSync() { if (S.chan) { sb.removeChannel(S.chan); S.chan = null; } if (S.tick) { clearInterval(S.tick); S.tick = null; } }

function askName() {
  $('#app').innerHTML = '';
  openSheet('Come ti chiami? 👋', `<p class="muted">Così Kelly saprà chi si è preso cura di lei.</p>
    <form>${F.text('name', 'Il tuo nome', '', 'es. Davide')}${F.submit('Continua')}</form>`,
    async d => {
      const name = (d.name || '').trim(); if (!name) return;
      await q(T('profiles').update({ display_name: name }).eq('id', S.user.id));
      closeSheet(); start(S.user);
    });
      }
