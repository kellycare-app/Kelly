/* Kelly Care - pezzo 5 di 8 */
const A = {};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (el && A[el.dataset.a]) { e.preventDefault(); A[el.dataset.a](el.dataset, el); return; }
  const ch = e.target.closest('[data-choices] button');
  if (ch) {
    const box = ch.parentElement, multi = box.dataset.multi === '1';
    if (!multi) box.querySelectorAll('button').forEach(b => b.classList.remove('on'));
    ch.classList.toggle('on');
    const val = [...box.querySelectorAll('button.on')].map(b => b.dataset.val).join(',');
    box.parentElement.querySelector(`input[name="${box.dataset.choices}"]`).value = val;
    if (box.dataset.autosubmit === '1') box.closest('form').requestSubmit();
    return;
  }
  if (e.target.id === 'overlay') closeSheet();
});
A.closeSheet = closeSheet;
A.nav = async ({ v }) => { S.view = v; if (v === 'diary') { render(); await run(loadDiary); } if (v === 'health') { S.docs = await q(T('documents').select('*').eq('dog_id', S.dog.id).order('created_at', { ascending: false })); } render(); };
A.logout = () => sb.auth.signOut();
A.resetCfg = () => { if (confirm('Rimuovere le chiavi salvate su questo telefono? (i dati di Kelly restano su Supabase)')) { localStorage.removeItem('kc_config'); sb.auth.signOut(); location.reload(); } };
A.diaryFilter = ({ f }) => { S.diaryFilter = f; render(); };
A.calPrev = () => { S.calMonth = new Date(S.calMonth.getFullYear(), S.calMonth.getMonth() - 1, 1); render(); };
A.calNext = () => { S.calMonth = new Date(S.calMonth.getFullYear(), S.calMonth.getMonth() + 1, 1); render(); };
A.calSel = ({ d }) => { S.calSel = d; render(); };

async function completeTask(taskId) {
  await q(T('task_completions').upsert({ dog_id: S.dog.id, task_id: taskId, task_date: ymd(), completed_by: S.user.id, completed_at: new Date().toISOString() }, { onConflict: 'task_id,task_date' }));
}
async function autoCompleteKind(kind) {
  const now = new Date(), nowM = now.getHours() * 60 + now.getMinutes();
  const cand = S.tasks.filter(t => t.active && t.kind === kind && !S.comps.find(c => c.task_id === t.id))
    .map(t => { const [h, m] = t.time.split(':').map(Number); return { t, diff: h * 60 + m - nowM }; })
    .filter(x => x.diff <= 150).sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))[0];
  if (cand) await completeTask(cand.t.id);
}
A.doTask = ({ id }) => run(async () => { await completeTask(id); await loadToday(); render(); }, 'Fatto ✓');
A.undoTask = ({ id }) => run(async () => { await q(T('task_completions').delete().eq('id', id)); await loadToday(); render(); }, 'Annullato');
A.editTasks = () => {
  const rows = S.tasks.sort((a, b) => a.time.localeCompare(b.time)).map(t => `<div class="task"><div class="t">${esc(t.time)}</div><div class="n"><b>${esc(t.emoji)} ${esc(t.title)}</b><div class="sub">${t.active ? 'attiva' : 'disattivata'}</div></div><button class="undo" data-a="editTask" data-id="${t.id}">✏️</button><button class="undo" data-a="delTask" data-id="${t.id}">🗑</button></div>`).join('');
  openSheet('Routine giornaliera', `<div class="list">${rows}</div><button class="btn sec" style="margin-top:14px" data-a="editTask">＋ Aggiungi attività</button>`);
};
A.editTask = ({ id }) => {
  const t = S.tasks.find(x => x.id === id) || { time: '12:00', title: '', emoji: '🐶', kind: 'other', active: true };
  openSheet(id ? 'Modifica attività' : 'Nuova attività', `<form>${F.hidden('id', id || '')}
    <div class="pair">${F.time('time', 'Orario', t.time)}${F.select('emoji', 'Icona', [['🍽️', '🍽️ Pappa'], ['🐾', '🐾 Passeggiata'], ['💧', '💧 Acqua'], ['💊', '💊 Farmaco'], ['🦴', '🦴 Snack'], ['🎾', '🎾 Gioco'], ['🛁', '🛁 Bagno'], ['🐶', '🐶 Altro']], t.emoji)}</div>
    ${F.text('title', 'Nome', t.title, 'es. Pappa')}
    ${F.select('kind', 'Tipo (per completarla in automatico quando registri)', [['meal', 'Pappa'], ['walk', 'Passeggiata'], ['water', 'Acqua'], ['medication', 'Farmaco'], ['other', 'Altro']], t.kind)}
    ${F.check('active', 'Attiva', t.active)}${F.submit()}</form>`,
    async d => {
      const row = { time: d.time, title: d.title, emoji: d.emoji, kind: d.kind, active: d.active };
      if (d.id) await q(T('daily_tasks').update(row).eq('id', d.id)); else await ins('daily_tasks', row);
      closeSheet(); await refreshAll(); toast('Routine aggiornata');
    });
};
A.delTask = ({ id }) => { if (confirm('Eliminare questa attività dalla routine?')) run(async () => { await q(T('daily_tasks').delete().eq('id', id)); closeSheet(); await refreshAll(); }, 'Eliminata'); };

A.register = () => openSheet('Cosa registriamo? 🐶', `<div class="grid">
  <button class="tile" data-a="logMeal"><span>🍽️</span>Ha mangiato</button>
  <button class="tile" data-a="logWalk"><span>🐾</span>Passeggiata</button>
  <button class="tile" data-a="logWater"><span>💧</span>Ha bevuto</button>
  <button class="tile" data-a="logPoo"><span>💩</span>Popò</button>
  <button class="tile" data-a="logPee"><span>💧</span>Pipì</button>
  <button class="tile" data-a="logVomit"><span>🤮</span>Vomito</button>
  <button class="tile" data-a="logMed"><span>💊</span>Farmaco</button>
  <button class="tile" data-a="logWeight"><span>⚖️</span>Peso</button>
  <button class="tile" data-a="logNote"><span>📝</span>Nota</button>
  <button class="tile" data-a="logPhoto"><span>📷</span>Foto</button>
  </div>`);

A.logMeal = () => {
  const last = S.today.meals[S.today.meals.length - 1];
  const food = (last && last.food) || S.dog.food || '';
  openSheet('🍽️ Ha mangiato', `<form>
    ${F.choices('eaten_pct', 'Quanto ha mangiato?', [['100', 'Tutto 😋'], ['50', 'Metà'], ['25', 'Poco'], ['0', 'Niente']], '100')}
    <div class="pair">${F.num('planned_qty', 'Previsti (g)', last && last.planned_qty ? last.planned_qty : '')}${F.num('eaten_qty', 'Mangiati (g)', '', 'auto')}</div>
    <div class="pair">${F.text('food', 'Alimento', food, 'es. crocchette')}${F.text('brand', 'Marca', (last && last.brand) || '')}</div>
    ${F.dt('occurred_at', 'Quando')}${F.check('is_snack', '🦴 È uno snack')}${F.area('notes', 'Note')}${F.submit('Salva pasto')}</form>`,
    async d => {
      const planned = d.planned_qty ? Number(d.planned_qty) : null;
      const eaten = d.eaten_qty ? Number(d.eaten_qty) : (planned != null ? Math.round(planned * Number(d.eaten_pct || 100) / 100) : null);
      await ins('meals', { occurred_at: new Date(d.occurred_at).toISOString(), food: d.food || null, brand: d.brand || null, planned_qty: planned, eaten_qty: eaten, is_snack: d.is_snack, notes: d.notes || null });
      if (!d.is_snack && isToday(d.occurred_at)) await autoCompleteKind('meal');
      closeSheet(); await loadToday(); render(); toast('Pasto registrato 🍽️');
    });
};
A.logWalk = () => {
  if (S.activeWalk) return A.endWalk();
  openSheet('🐾 Passeggiata', `<button class="btn blue" data-a="startWalk">▶ Inizia adesso (cronometro)</button>
    <p class="muted small" style="margin:16px 0 4px">Oppure registra una passeggiata già fatta:</p>
    <form>${F.dt('started_at', 'Inizio')}${F.num('duration_min', 'Durata (minuti)', '20')}
    <div class="pair">${F.check('pee', '💧 Pipì', true)}${F.check('poo', '💩 Popò')}</div>${F.area('notes', 'Note')}${F.submit('Salva passeggiata')}</form>`,
    async d => {
      const st = new Date(d.started_at), dur = Number(d.duration_min) || 0;
      await ins('walks', { started_at: st.toISOString(), ended_at: new Date(st.getTime() + dur * 60000).toISOString(), duration_min: dur, pee: d.pee, poo: d.poo, notes: d.notes || null });
      if (isToday(st)) await autoCompleteKind('walk');
      closeSheet(); await loadToday(); render(); toast('Passeggiata registrata 🐾');
    });
};
A.startWalk = () => run(async () => {
  S.activeWalk = await ins('walks', { started_at: new Date().toISOString() });
  closeSheet(); render();
}, 'Buona passeggiata! 🐾');
A.endWalk = () => {
  const w = S.activeWalk; if (!w) return;
  openSheet(`🐾 Fine passeggiata · ${minsBetween(w.started_at, new Date())} min`, `<form>
    <div class="pair">${F.check('pee', '💧 Ha fatto pipì', true)}${F.check('poo', '💩 Ha fatto popò')}</div>
    ${F.choices('stool', 'Com\'era la popò?', [['', 'niente'], ['normale', 'Normale'], ['morbida', 'Morbida'], ['diarrea', 'Diarrea'], ['strana', 'Strana']], '')}
    ${F.area('notes', 'Note')}${F.submit('Termina passeggiata', 'blue')}</form>`,
    async d => {
      const end = new Date();
      await q(T('walks').update({ ended_at: end.toISOString(), duration_min: minsBetween(w.started_at, end), pee: d.pee, poo: d.poo, notes: d.notes || null }).eq('id', w.id));
      if (d.poo && d.stool) await ins('toilet_events', { kind: 'poo', stool: d.stool, notes: 'durante la passeggiata' });
      await autoCompleteKind('walk');
      S.activeWalk = null; closeSheet(); await loadToday(); render(); toast('Passeggiata terminata ✓');
    });
};
