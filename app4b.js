/* Kelly Care - continuazione del pezzo 4 */
function calItems() {
  const items = [];
  S.meds.filter(m => m.active && m.next_due).forEach(m => items.push({ d: m.next_due, e: '💊', t: m.name, c: 'm' }));
  S.vaccs.filter(v => v.next_due).forEach(v => items.push({ d: v.next_due, e: '💉', t: `Vaccino ${v.name}`, c: 'v' }));
  const seen = new Set();
  S.healthAll.forEach(h => { if (!HCATS[h.category] || seen.has(h.category)) return; seen.add(h.category); if (h.next_due) items.push({ d: h.next_due, e: HCATS[h.category].e, t: HCATS[h.category].n, c: '' }); });
  S.appts.forEach(a => items.push({ d: ymd(a.starts_at), e: a.category === 'vet' ? '🩺' : a.category === 'grooming' ? '✂️' : '📅', t: `${fmtTime(a.starts_at)} ${a.title}${a.location ? ' · ' + a.location : ''}`, c: 'v', id: a.id }));
  return items;
}
function renderCalendar() {
  const base = S.calMonth || dayStart(); S.calMonth = base;
  const y = base.getFullYear(), m = base.getMonth();
  const first = new Date(y, m, 1), startDow = (first.getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const items = calItems(); const byDay = {}; items.forEach(i => { (byDay[i.d] = byDay[i.d] || []).push(i); });
  let cells = ['lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'].map(w => `<div class="wd">${w}</div>`).join('');
  for (let i = 0; i < startDow; i++) cells += '<div class="d off"></div>';
  for (let d = 1; d <= days; d++) {
    const key = `${y}-${pad(m + 1)}-${pad(d)}`;
    const its = byDay[key] || [];
    cells += `<button class="d${key === ymd() ? ' today' : ''}${key === S.calSel ? ' sel' : ''}" data-a="calSel" data-d="${key}">${d}<div class="dots">${its.slice(0, 3).map(i => `<i class="${i.c}"></i>`).join('')}</div></button>`;
  }
  const sel = S.calSel || ymd();
  const selItems = byDay[sel] || [];
  const upcoming = items.filter(i => i.d >= ymd()).sort((a, b) => a.d.localeCompare(b.d)).slice(0, 8);
  return `<h1>Calendario 📅</h1>
    <div class="cal-head"><button data-a="calPrev">‹</button><h2>${MONTHS[m]} ${y}</h2><button data-a="calNext">›</button></div>
    <div class="cal">${cells}</div>
    <div class="sec"><h2>${sel === ymd() ? 'Oggi' : fmtDateFull(sel)}</h2><button class="btn ghost sm" data-a="addAppt" data-d="${sel}">＋ Appuntamento</button></div>
    ${selItems.map(i => `<div class="ev"><div class="e">${i.e}</div><div class="b"><b>${esc(i.t)}</b></div>${i.id ? `<button class="del" data-a="delRow" data-tb="appointments" data-id="${i.id}">🗑</button>` : ''}</div>`).join('') || '<div class="empty small">Niente in programma.</div>'}
    <div class="sec"><h2>Prossime scadenze</h2></div>
    ${upcoming.map(i => `<div class="ev"><div class="e">${i.e}</div><div class="b"><b>${esc(i.t)}</b><div class="sub">${fmtDateFull(i.d)} · ${dueLabel(i.d)}</div></div></div>`).join('') || '<div class="empty small">Nessuna scadenza. Aggiungile dalla sezione Salute.</div>'}`;
}

function renderProfile() {
  const d = S.dog;
  const rows = [['Nome', d.name], ['Razza', d.breed], ['Sesso', d.sex === 'M' ? 'Maschio' : d.sex === 'F' ? 'Femmina' : ''], ['Nata il', d.birth_date ? fmtDateFull(d.birth_date) : ''], ['Età', age(d.birth_date)], ['Peso', d.weight_kg ? d.weight_kg + ' kg' : ''], ['Sterilizzata', d.neutered ? 'Sì' : 'No'], ['Microchip', d.microchip], ['Alimentazione', d.food], ['Allergie / intolleranze', d.allergies], ['Note', d.notes]];
  const rem = S.reminders.map(r => `<div class="task"><div class="t">${esc(r.time)}</div><div class="n"><b>${esc(r.title)}</b><div class="sub">${(r.days || []).length === 7 ? 'Ogni giorno' : (r.days || []).map(x => ['', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab', 'dom'][x]).join(' ')}</div></div>
    <button class="chip ${r.active ? 'done' : 'todo'}" data-a="toggleRem" data-id="${r.id}" data-on="${r.active ? 1 : 0}">${r.active ? 'Attivo' : 'Spento'}</button><button class="undo" data-a="editRem" data-id="${r.id}">✏️</button></div>`).join('');
  const notifState = !('Notification' in window) ? 'non supportate su questo browser' : Notification.permission === 'granted' ? 'attive ✓' : Notification.permission === 'denied' ? 'bloccate nelle impostazioni del telefono' : 'da attivare';
  return `<div style="text-align:center;margin-top:6px"><button class="avatar big" data-a="dogPhoto">${S.dogPhoto ? `<img src="${S.dogPhoto}" alt="">` : '🐶'}</button>
    <h1 style="margin-top:10px">${esc(d.name)}</h1><p class="muted">${esc([d.breed, age(d.birth_date)].filter(Boolean).join(' · '))}</p>
    <button class="btn sec sm" style="margin-top:10px" data-a="dogPhoto">📷 Cambia foto</button></div>
    <div class="sec"><h2>Profilo</h2><button class="btn ghost sm" data-a="editDog">Modifica</button></div>
    <div class="list">${rows.map(r => `<div class="field"><span>${r[0]}</span><span>${esc(r[1] || '—')}</span></div>`).join('')}</div>
    <div class="sec"><h2>Promemoria</h2><button class="btn ghost sm" data-a="editRem">＋ Nuovo</button></div>
    <div class="banner">🔔 Notifiche: ${notifState}. ${Notification.permission !== 'granted' && 'Notification' in window ? '<button class="btn sm" style="margin
