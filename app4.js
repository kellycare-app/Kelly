/* Kelly Care - pezzo 4 di 8 */
function healthEmoji(h) {
  return { sick: '🚨', vomit: '🤮', water: '💧', medication_given: '💊' }[h.category] || (HCATS[h.category] ? HCATS[h.category].e : '❤️');
}
function healthSub(h) {
  const d = h.details || {};
  const parts = [];
  if (h.category === 'sick' && d.symptoms) parts.push(d.symptoms.split(',').map(s => (SYMPTOMS.find(x => x[0] === s) || [s, s])[1]).join(', '));
  if (d.episodes) parts.push(`${d.episodes} episodi`);
  if (d.amount) parts.push(d.amount);
  if (d.dose) parts.push(d.dose);
  if (d.last_meal) parts.push('ultimo pasto: ' + d.last_meal);
  if (d.water) parts.push('acqua: ' + d.water);
  if (d.behavior) parts.push(d.behavior);
  if (h.next_due) parts.push('prossimo: ' + fmtDateFull(h.next_due));
  if (h.notes) parts.push(h.notes);
  return parts.join(' · ');
}
function renderDiary() {
  const filters = [['all', 'Tutto'], ['meal', '🍽️ Pasti'], ['walk', '🐾 Passeggiate'], ['toilet', '💩 Bisogni'], ['health', '❤️ Salute'], ['weight', '⚖️ Peso'], ['med', '💊 Farmaci'], ['note', '📝 Note']];
  const items = S.diary.filter(e => S.diaryFilter === 'all' || e.f === S.diaryFilter);
  let html = '', lastDay = '';
  items.forEach(e => {
    const day = ymd(e.t);
    if (day !== lastDay) { html += `<div class="day">${isToday(e.t) ? 'Oggi' : fmtDate(e.t)}</div>`; lastDay = day; }
    html += `<div class="ev"><div class="e">${e.e}</div><div class="b"><b>${esc(e.title)}</b><div class="sub">${esc(e.sub)}${e.sub ? ' · ' : ''}${esc(who(e.by))}</div>${e.photoUrl ? `<img src="${e.photoUrl}" alt="">` : ''}</div>
      <div class="tm">${fmtTime(e.t)}</div><button class="del" data-a="delRow" data-tb="${e.tb}" data-id="${e.id}" aria-label="Elimina">🗑</button></div>`;
  });
  return `<h1>Diario 📖</h1>
    <div class="filters">${filters.map(f => `<button class="${S.diaryFilter === f[0] ? 'on' : ''}" data-a="diaryFilter" data-f="${f[0]}">${f[1]}</button>`).join('')}</div>
    ${html || '<div class="empty"><span>📖</span>Ancora niente qui. Registra qualcosa dalla schermata Oggi!</div>'}`;
}

function lastOf(cat) { return S.healthAll.find(h => h.category === cat); }
function renderHealth() {
  const lastW = S.weights[0];
  const prevW = S.weights[1];
  const wTrend = lastW && prevW ? (lastW.weight_kg > prevW.weight_kg ? ' ↑' : lastW.weight_kg < prevW.weight_kg ? ' ↓' : ' =') : '';
  const cards = Object.entries(HCATS).map(([k, c]) => {
    let sub = 'Nessun dato', due = false;
    if (k === 'weight') sub = lastW ? `${lastW.weight_kg} kg${wTrend} · ${fmtDate(lastW.measured_at)}` : 'Nessun dato';
    else if (k === 'vaccine') { const v = S.vaccs.find(x => x.next_due) || S.vaccs[0]; if (v) { sub = v.next_due ? `${v.name}: ${dueLabel(v.next_due)}` : `${v.name} · ${fmtDate(v.given_on)}`; due = isDue(v.next_due); } }
    else if (k === 'medication') { const act = S.meds.filter(m => m.active); if (act.length) { const dueM = act.find(m => isDue(m.next_due)); sub = dueM ? `${dueM.name}: ${dueLabel(dueM.next_due)}` : `${act.length} attiv${act.length === 1 ? 'o' : 'i'}`; due = !!dueM; } }
    else { const h = lastOf(k); if (h) { sub = h.next_due ? `prossimo: ${dueLabel(h.next_due)}` : `ultimo: ${fmtDate(h.occurred_at)}`; due = isDue(h.next_due); } }
    return `<button class="hcard" data-a="healthCat" data-k="${k}"><div class="e">${c.e}</div><b>${c.n}</b><div class="sub${due ? ' due' : ''}">${esc(sub)}</div></button>`;
  }).join('');
  const vets = S.vets.map(v => `<div class="ev"><div class="e">${v.is_emergency ? '🚑' : '🩺'}</div><div class="b"><b>${esc(v.name)}</b><div class="sub">${esc([v.clinic, v.address, v.notes].filter(Boolean).join(' · '))}</div>
      <div class="row" style="margin-top:10px">${v.phone ? `<a class="btn sm green" href="tel:${esc(v.phone.replace(/\s/g, ''))}">📞 Chiama</a>` : ''}${v.address ? `<a class="btn sm blue" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}">🗺️ Mappa</a>` : ''}<button class="btn sm sec" data-a="editVet" data-id="${v.id}">✏️</button></div></div></div>`).join('');
  const docs = S.docs.map(d => `<div class="ev"><div class="e">${docEmoji(d)}</div><div class="b"><b>${esc(d.title)}</b><div class="sub">${esc(d.category)} · ${fmtDate(d.created_at)} · ${esc(who(d.created_by))}</div></div><button class="btn sm sec" data-a="openDoc" data-p="${esc(d.storage_path)}">Apri</button><button class="del" data-a="delDoc" data-id="${d.id}" data-p="${esc(d.storage_path)}">🗑</button></div>`).join('');
  return `<h1>Salute ❤️</h1>
    <button class="sos" data-a="sick">🚨 ${esc(dogName()).toUpperCase()} NON STA BENE</button>
    <div class="grid">${cards}</div>
    <div class="sec"><h2>Veterinario</h2><button class="btn ghost sm" data-a="editVet">＋ Aggiungi</button></div>
    ${vets || '<div class="empty"><span>🩺</span>Aggiungi il veterinario di fiducia e il pronto soccorso.</div>'}
    <div class="sec"><h2>Documenti</h2><button class="btn ghost sm" data-a="addDoc">＋ Carica</button></div>
    ${docs || '<div class="empty"><span>📁</span>Libretto, vaccini, analisi, ricette, referti…</div>'}`;
}
function docEmoji(d) { return { libretto: '📘', vaccini: '💉', analisi: '🧪', ricetta: '💊', referto: '📄', microchip: '🔖' }[d.category] || (d.mime && d.mime.startsWith('image') ? '🖼️' : '📎'); }
