/* Kelly Care - pezzo 4 di 8 */
function healthEmoji(h){return {sick:'🚨',vomit:'🤮',water:'💧',medication_given:'💊'}[h.category]||(HCATS[h.category]?HCATS[h.category].e:'❤️')}

function healthSub(h){
  const d=h.details||{},p=[];
  if(h.category==='sick'&&d.symptoms)p.push(d.symptoms.split(',').map(s=>(SYMPTOMS.find(x=>x[0]===s)||[s,s])[1]).join(', '));
  if(d.episodes)p.push(`${d.episodes} episodi`);
  if(d.amount)p.push(d.amount);
  if(d.dose)p.push(d.dose);
  if(d.last_meal)p.push('ultimo pasto: '+d.last_meal);
  if(d.water)p.push('acqua: '+d.water);
  if(d.behavior)p.push(d.behavior);
  if(h.next_due)p.push('prossimo: '+fmtDateFull(h.next_due));
  if(h.notes)p.push(h.notes);
  return p.join(' · ')
}

function renderDiary(){
  const f=[['all','Tutto'],['meal','🍽️ Pasti'],['walk','🐾 Passeggiate'],['toilet','💩 Bisogni'],['health','❤️ Salute'],['weight','⚖️ Peso'],['med','💊 Farmaci'],['note','📝 Note']];
  const items=S.diary.filter(e=>S.diaryFilter==='all'||e.f===S.diaryFilter);
  let h='',ld='';
  items.forEach(e=>{
    const d=ymd(e.t);
    if(d!==ld){
      h+=`<div class="day">${isToday(e.t)?'Oggi':fmtDate(e.t)}</div>`;
      ld=d
    }
    h+=`<div class="ev"><div class="e">${e.e}</div><div class="b"><b>${esc(e.title)}</b><div class="sub">${esc(e.sub)}${e.sub?' · ':''}${esc(who(e.by))}</div>${e.photoUrl?`<img src="${e.photoUrl}" alt="">`:''}</div><div class="tm">${fmtTime(e.t)}</div><button class="del" data-a="delRow" data-tb="${e.tb}" data-id="${e.id}">🗑</button></div>`
  });
  return `<h1>Diario 📖</h1><div class="filters">${f.map(x=>`<button class="${S.diaryFilter===x[0]?'on':''}" data-a="diaryFilter" data-f="${x[0]}">${x[1]}</button>`).join('')}</div>${h||'<div class="empty"><span>📖</span>Ancora niente qui.</div>'}`
}

function lastOf(c){
  return S.healthAll.find(h=>h.category===c)
}

function docEmoji(d){
  return {libretto:'📘',vaccini:'💉',analisi:'🧪',ricetta:'📝',referto:'📄',microchip:'🔖'}[d.category]||'📁'
}

function renderHealth(){
  const lw=S.weights[0],pw=S.weights[1];
  const tr=lw&&pw?(lw.weight_kg>pw.weight_kg?' ↑':lw.weight_kg<pw.weight_kg?' ↓':' ='):'';

  const cards=Object.entries(HCATS).map(([k,c])=>{
    let sub='Nessun dato',due=false;

    if(k==='weight'){
      sub=lw?`${lw.weight_kg} kg${tr} · ${fmtDate(lw.measured_at)}`:sub
    }else if(k==='vaccine'){
      const v=S.vaccs.find(x=>x.next_due)||S.vaccs[0];
      if(v){
        sub=v.next_due?`${v.name}: ${dueLabel(v.next_due)}`:`${v.name} · ${fmtDate(v.given_on)}`;
        due=isDue(v.next_due)
      }
    }else if(k==='medication'){
      const a=S.meds.filter(x=>x.active);
      if(a.length){
        const m=a.find(x=>isDue(x.next_due));
        sub=m?`${m.name}: ${dueLabel(m.next_due)}`:`${a.length} attiv${a.length===1?'o':'i'}`;
        due=!!m
      }
    }else{
      const x=lastOf(k);
      if(x){
        sub=x.next_due?`prossimo: ${dueLabel(x.next_due)}`:`ultimo: ${fmtDate(x.occurred_at)}`;
        due=isDue(x.next_due)
      }
    }

    return `<button class="hcard" data-a="healthCat" data-k="${k}"><div class="e">${c.e}</div><b>${c.n}</b><div class="sub${due?' due':''}">${esc(sub)}</div></button>`
  }).join('');

  const vets=S.vets.map(v=>`<div class="ev"><div class="e">${v.is_emergency?'🚑':'🩺'}</div><div class="b"><b>${esc(v.name)}</b><div class="sub">${esc([v.clinic,v.address,v.notes].filter(Boolean).join(' · '))}</div><div class="row">${v.phone?`<a class="btn sm green" href="tel:${esc(v.phone.replace(/\s/g,''))}">📞 Chiama</a>`:''}<button class="btn sm sec" data-a="editVet" data-id="${v.id}">✏️</button></div></div></div>`).join('');

  const docs=S.docs.map(d=>`<div class="ev"><div class="e">${docEmoji(d)}</div><div class="b"><b>${esc(d.title)}</b><div class="sub">${esc(d.category)} · ${fmtDate(d.created_at)}</div></div><button class="btn sm sec" data-a="openDoc" data-p="${esc(d.storage_path)}">Apri</button><button class="del" data-a="delDoc" data-id="${d.id}" data-p="${esc(d.storage_path)}">🗑</button></div>`).join('');

  return `<h1>Salute ❤️</h1><button class="sos" data-a="sick">🚨 ${esc(dogName()).toUpperCase()} NON STA BENE</button><div class="grid">${cards}</div><div class="sec"><h2>Veterinario</h2><button class="btn ghost sm" data-a="editVet">＋ Aggiungi</button></div>${vets||'<div class="empty">Nessun veterinario salvato.</div>'}<div class="sec"><h2>Documenti</h2><button class="btn ghost sm" data-a="addDoc">＋ Carica</button></div>${docs||'<div class="empty">Nessun documento.</div>'}`
}

function renderCalendar(){
  if(!S.calMonth){
    const n=new Date();
    S.calMonth=new Date(n.getFullYear(),n.getMonth(),1)
  }

  const y=S.calMonth.getFullYear();
  const m=S.calMonth.getMonth();
  const first=new Date(y,m,1);
  const last=new Date(y,m+1,0);
  const off=(first.getDay()+6)%7;

  let days='';

  for(let i=0;i<off;i++){
    days+='<div class="calday empty"></div>'
  }

  for(let d=1;d<=last.getDate();d++){
    const dt=new Date(y,m,d);
    const key=ymd(dt);
    const has=S.appts.some(a=>ymd(a.starts_at)===key);

    days+=`<button class="calday${S.calSel===key?' on':''}${isToday(dt)?' today':''}" data-a="calSel" data-d="${key}"><b>${d}</b>${has?'<span>●</span>':''}</button>`
  }

  const sel=S.calSel||ymd();

  const list=S.appts
    .filter(a=>ymd(a.starts_at)===sel)
    .sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at))
    .map(a=>`<div class="ev"><div class="e">${a.category==='vet'?'🩺':a.category==='grooming'?'✂️':'📅'}</div><div class="b"><b>${esc(a.title)}</b><div class="sub">${fmtTime(a.starts_at)}${a.location?' · '+esc(a.location):''}${a.notes?' · '+esc(a.notes):''}</div></div><button class="del" data-a="delRow" data-tb="appointments" data-id="${a.id}">🗑</button></div>`)
    .join('');

  return `<h1>Calendario 📅</h1><div class="sec"><button class="btn ghost sm" data-a="calPrev">‹</button><h2>${MONTHS[m]} ${y}</h2><button class="btn ghost sm" data-a="calNext">›</button></div><div class="calendar"><div class="calhead">lun</div><div class="calhead">mar</div><div class="calhead">mer</div><div class="calhead">gio</div><div class="calhead">ven</div><div class="calhead">sab</div><div class="calhead">dom</div>${days}</div><div class="sec"><h2>${fmtDateFull(sel)}</h2><button class="btn sm" data-a="addAppt" data-d="${sel}">＋ Appuntamento</button></div>${list||'<div class="empty"><span>📅</span>Nessun appuntamento.</div>'}`
}

function renderProfile(){
  const d=S.dog;
  const p=S.profile||{};

  const rems=S.reminders.map(r=>`<div class="ev"><div class="e">🔔</div><div class="b"><b>${esc(r.title)}</b><div class="sub">${esc(r.time)} · ${r.active?'attivo':'disattivato'}</div></div><button class="btn sm sec" data-a="toggleRem" data-id="${r.id}" data-on="${r.active?'1':'0'}">${r.active?'Spegni':'Attiva'}</button><button class="btn sm sec" data-a="editRem" data-id="${r.id}">✏️</button></div>`).join('');

  return `<h1>${esc(dogName())} 🐶</h1><div class="profile">${S.dogPhoto?`<img src="${S.dogPhoto}" alt="${esc(dogName())}">`:'<div class="logo">🐶</div>'}<button class="btn ghost sm" data-a="dogPhoto">📷 Foto</button><h2>${esc(d.name)}</h2><p class="muted">${esc([d.breed,age(d.birth_date),d.weight_kg?d.weight_kg+' kg':''].filter(Boolean).join(' · '))}</p><button class="btn sec" data-a="editDog">✏️ Modifica profilo</button></div><div class="sec"><h2>Routine</h2><button class="btn ghost sm" data-a="editTasks">Modifica</button></div><div class="sec"><h2>Promemoria</h2><button class="btn ghost sm" data-a="editRem">＋ Aggiungi</button></div>${rems||'<div class="empty">Nessun promemoria.</div>'}<div class="sec"><h2>Account</h2></div><button class="btn sec" data-a="editMe">👤 ${esc(p.display_name||'Nome')}</button><button class="btn sec" data-a="enableNotif">🔔 Attiva notifiche</button><button class="btn ghost" data-a="logout">Esci</button><button class="btn ghost" data-a="resetCfg">Reimposta collegamento</button>`
}
