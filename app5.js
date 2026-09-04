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
