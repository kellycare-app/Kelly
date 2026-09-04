/* Kelly Care - pezzo 3 di 8 */
function onboarding() {
  $('#app').innerHTML = '';
  openSheet('Creiamo il profilo di Kelly 🐶', `<p class="muted">Bastano pochi dati, il resto lo aggiungi quando vuoi.</p>
    <form>${F.text('name', 'Nome', 'Kelly')}${F.text('breed', 'Razza', '', 'es. Golden Retriever')}
    <div class="pair">${F.select('sex', 'Sesso', [['F', 'Femmina'], ['M', 'Maschio']], 'F')}${F.date('birth_date', 'Data di nascita')}</div>
    ${F.num('weight_kg', 'Peso (kg)')}${F.text('food', 'Alimentazione', '', 'es. crocchette 150 g')}
    ${F.submit('Crea Kelly Care 🐾')}</form>`,
    async d => {
      const dog = await q(T('dogs').insert({ name: d.name || 'Kelly', breed: d.breed || null, sex: d.sex, birth_date: d.birth_date || null, weight_kg: d.weight_kg || null, food: d.food || null, created_by: S.user.id }).select().single());
      await q(T('family_members').insert({ dog_id: dog.id, user_id: S.user.id }));
      await q(T('daily_tasks').insert(DEFAULT_TASKS.map((t, i) => ({ ...t, dog_id: dog.id, sort_order: i, active: true }))));
      await q(T('reminders').insert([
        { dog_id: dog.id, title: `🐶 È ora della pappa di ${d.name || 'Kelly'}!`, time: '08:00', category: 'meal', active: true, days: [1, 2, 3, 4, 5, 6, 7], created_by: S.user.id },
        { dog_id: dog.id, title: `🐾 ${d.name || 'Kelly'} aspetta la sua passeggiata ❤️`, time: '09:00', category: 'walk', active: true, days: [1, 2, 3, 4, 5, 6, 7], created_by: S.user.id },
        { dog_id: dog.id, title: `💧 Controlla l'acqua di ${d.name || 'Kelly'}`, time: '13:00', category: 'water', active: true, days: [1, 2, 3, 4, 5, 6, 7], created_by: S.user.id },
        { dog_id: dog.id, title: `🐶 È ora della pappa di ${d.name || 'Kelly'}!`, time: '19:00', category: 'meal', active: true, days: [1, 2, 3, 4, 5, 6, 7], created_by: S.user.id },
        { dog_id: dog.id, title: `🐾 ${d.name || 'Kelly'} aspetta la sua passeggiata ❤️`, time: '21:30', category: 'walk', active: true, days: [1, 2, 3, 4, 5, 6, 7], created_by: S.user.id }
      ]));
      if (d.weight_kg) await q(T('weight_history').insert({ dog_id: dog.id, weight_kg: d.weight_kg, measured_at: new Date().toISOString(), created_by: S.user.id }));
      closeSheet(); toast('Benvenuta Kelly! 🐶'); start(S.user);
    });
}

function render() {
  if (!S.user || !S.dog) return;
  const y = window.scrollY;
  $('#nav').hidden = false;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === S.view));
  const views = { today: renderToday, diary: renderDiary, health: renderHealth, calendar: renderCalendar, profile: renderProfile };
  $('#app').innerHTML = views[S.view]();
  window.scrollTo(0, S.view === 'today' ? y : 0);
}

function taskState(t) {
  const c = S.comps.find(x => x.task_id === t.id);
  if (c) return { st: 'done', c };
  const [h, m] = t.time.split(':').map(Number), now = new Date();
  const late = now.getHours() * 60 + now.getMinutes() > h * 60 + m + 60;
  return { st: late ? 'late' : 'todo' };
}
function walkClock() {
  if (!S.activeWalk) return '';
  const s = Math.floor((Date.now() - new Date(S.activeWalk.started_at)) / 1000);
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}
function dueBanners() {
  const out = [];
  const seen = new Set();
  S.meds.filter(m => m.active && isDue(m.next_due)).forEach(m => out.push(`💊 Oggi c'è ${m.name} di ${dogName()}.`));
  S.vaccs.filter(v => isDue(v.next_due)).forEach(v => out.push(`💉 Vaccino ${v.name}: ${dueLabel(v.next_due)}`));
  S.healthAll.forEach(h => {
    if (seen.has(h.category) || !HCATS[h.category]) return; seen.add(h.category);
    if (isDue(h.next_due)) out.push(`${HCATS[h.category].e} ${HCATS[h.category].n} di ${dogName()}: ${dueLabel(h.next_due)}`);
  });
  S.appts.filter(a => isToday(a.starts_at)).forEach(a => out.push(`📅 Oggi alle ${fmtTime(a.starts_at)}: ${a.title}`));
  return out;
}
function renderToday() {
  const tasks = S.tasks.filter(t => t.active).sort((a, b) => a.time.localeCompare(b.time));
  const states = tasks.map(t => ({ t, ...taskState(t) }));
  const next = states.find(s => s.st !== 'done');
  let now;
  if (S.activeWalk) {
    now = `<div class="now walk"><div class="lbl">Passeggiata in corso 🐾 con ${esc(who(S.activeWalk.created_by))}</div>
      <div class="timer" id="walktimer">${walkClock()}</div>
      <button class="btn" data-a="endWalk" style="margin-top:10px">Termina passeggiata</button></div>`;
  } else if (next) {
    now = `<div class="now ${next.st}"><div class="lbl">${next.st === 'late' ? '⚠ In ritardo · era per le ' + next.t.time : 'Adesso · ore ' + next.t.time}</div>
      <div class="what">${esc(next.t.emoji)} ${esc(next.t.title)}</div>
      <div class="row">${next.t.kind === 'walk' ? `<button class="btn" data-a="startWalk">Inizia passeggiata 🐾</button>` : ''}
      <button class="btn" data-a="doTask" data-id="${next.t.id}">Fatto ✓</button></div></div>`;
  } else {
    now = `<div class="now done"><div class="lbl">Routine di oggi</div><div class="what">Tutto fatto! 🎉</div><p>${esc(dogName())} è una cagnolina felice.</p></div>`;
  }
  const list = states.map(({ t, st, c }) => `<div class="task ${st}">
      <div class="t">${esc(t.time)}</div>
      <div class="n"><b>${esc(t.emoji)} ${esc(t.title)}</b>
        <div class="sub">${st === 'done' ? `Fatto da ${esc(who(c.completed_by))} alle ${fmtTime(c.completed_at)} ✓` : 'Tocca quando è fatta'}</div></div>
      ${st === 'done' ? `<span class="chip done">✓ Fatto</span><button class="undo" data-a="undoTask" data-id="${c.id}" aria-label="Annulla">↩</button>`
        : `<button class="chip ${st}" data-a="doTask" data-id="${t.id}">${st === 'late' ? '⚠ In ritardo' : '○ Da fare'}</button>`}
    </div>`).join('');
  const T0 = S.today;
  const pee = T0.toilet.filter(x => x.kind === 'pee').length + T0.walks.filter(w => w.pee).length;
  const poo = T0.toilet.filter(x => x.kind === 'poo').length + T0.walks.filter(w => w.poo).length;
  const walkMin = T0.walks.reduce((a, w) => a + (w.duration_min || 0), 0);
  const banners = dueBanners();
  return `<div class="hero"><button class="avatar" data-a="dogPhoto" aria-label="Cambia foto">${S.dogPhoto ? `<img src="${S.dogPhoto}" alt="">` : '🐶'}</button>
    <div><h1>${esc(dogName())}</h1><p class="muted">Oggi, ${fmtDate(new Date())}${S.dog.birth_date ? ' · ' + age(S.dog.birth_date) : ''}</p></div></div>
    ${banners.map(b => `<div class="banner">${esc(b)}</div>`).join('')}
    ${now}
    <div class="sec"><h2>Routine di oggi</h2><button class="btn ghost sm" data-a="editTasks">Modifica</button></div>
    <div class="list">${list || '<div class="empty"><span>🐾</span>Nessuna attività. Aggiungine una!</div>'}</div>
    <div class="stats">
      <div class="stat"><b>${T0.meals.length}</b><span>🍽️ pasti</span></div>
      <div class="stat"><b>${T0.walks.filter(w => w.ended_at).length}</b><span>🐾 giri · ${walkMin} min</span></div>
      <div class="stat"><b>${pee}</b><span>💧 pipì</span></div>
      <div class="stat"><b>${poo}</b><span>💩 popò</span></div>
    </div>
    <button class="btn fab" data-a="register">＋ REGISTRA</button>
    <div style="height:70px"></div>`;
}

async function loadDiary() {
  const from = new Date(Date.now() - 45 * 86400000).toISOString(), d = S.dog.id;
  const [meals, walks, toilet, health, notes, weights] = await Promise.all([
    q(T('meals').select('*').eq('dog_id', d).gte('occurred_at', from)),
    q(T('walks').select('*').eq('dog_id', d).gte('started_at', from)),
    q(T('toilet_events').select('*').eq('dog_id', d).gte('occurred_at', from)),
    q(T('health_events').select('*').eq('dog_id', d).gte('occurred_at', from)),
    q(T('notes').select('*').eq('dog_id', d).gte('occurred_at', from)),
    q(T('weight_history').select('*').eq('dog_id', d).gte('measured_at', from))
  ]);
  const ev = [];
  meals.forEach(m => ev.push({ id: m.id, tb: 'meals', f: 'meal', t: m.occurred_at, e: m.is_snack ? '🦴' : '🍽️', title: m.is_snack ? 'Snack' : 'Pappa', sub: [m.food, m.brand, m.eaten_qty != null ? `mangiato ${m.eaten_qty}${m.unit || 'g'}` + (m.planned_qty ? ` su ${m.planned_qty}` : '') : '', m.notes].filter(Boolean).join(' · '), by: m.created_by }));
  walks.forEach(w => ev.push({ id: w.id, tb: 'walks', f: 'walk', t: w.started_at, e: '🐾', title: w.ended_at ? `Passeggiata · ${w.duration_min || minsBetween(w.started_at, w.ended_at)} min` : 'Passeggiata in corso', sub: [w.pee ? 'pipì' : '', w.poo ? 'popò' : '', w.notes].filter(Boolean).join(' · '), by: w.created_by }));
  toilet.forEach(x => ev.push({ id: x.id, tb: 'toilet_events', f: 'toilet', t: x.occurred_at, e: x.kind === 'poo' ? '💩' : '💧', title: x.kind === 'poo' ? 'Popò' : 'Pipì', sub: [x.stool, x.notes].filter(Boolean).join(' · '), by: x.created_by }));
  health.forEach(h => ev.push({ id: h.id, tb: 'health_events', f: h.category === 'medication_given' ? 'med' : 'health', t: h.occurred_at, e: healthEmoji(h), title: h.title || (HCATS[h.category] ? HCATS[h.category].n : h.category), sub: healthSub(h), by: h.created_by, photo: h.attachment_path }));
  notes.forEach(n => ev.push({ id: n.id, tb: 'notes', f: 'note', t: n.occurred_at, e: n.photo_path ? '📷' : '📝', title: n.photo_path ? 'Foto' : 'Nota', sub: n.text || '', by: n.created_by, photo: n.photo_path }));
  weights.forEach(w => ev.push({ id: w.id, tb: 'weight_history', f: 'weight', t: w.measured_at, e: '⚖️', title: `Peso: ${w.weight_kg} kg`, sub: w.notes || '', by: w.created_by }));
  ev.sort((a, b) => new Date(b.t) - new Date(a.t));
  for (const e of ev) if (e.photo) e.photoUrl = await signed(e.photo);
  S.diary = ev;
                              }
