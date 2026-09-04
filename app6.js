/* Kelly Care - pezzo 6 di 8 */

A.logWater=()=>openSheet('💧 Ha bevuto',`<form><div class="grid three" data-choices="amount" data-multi="0" data-autosubmit="1"><button type="button" class="tile" data-val="poco"><span>💧</span>Poco</button><button type="button" class="tile" data-val="normale"><span>💧💧</span>Normale</button><button type="button" class="tile" data-val="tanto"><span>💧💧💧</span>Tanto</button></div>${F.hidden('amount','')}</form>`,
async d=>{await ins('health_events',{category:'water',title:'Ha bevuto',details:{amount:d.amount}});await autoCompleteKind('water');closeSheet();await loadToday();render();toast('Registrato 💧')});

A.logPoo=()=>openSheet('💩 Popò',`<form><div class="grid" data-choices="stool" data-multi="0" data-autosubmit="1"><button type="button" class="tile" data-val="normale"><span>👍</span>Normale</button><button type="button" class="tile" data-val="morbida"><span>🫠</span>Morbida</button><button type="button" class="tile" data-val="diarrea"><span>💦</span>Diarrea</button><button type="button" class="tile" data-val="strana"><span>🤔</span>Strana</button></div>${F.hidden('stool','')}</form>`,
async d=>{await ins('toilet_events',{kind:'poo',stool:d.stool});closeSheet();await loadToday();render();toast('Popò registrata 💩')});

A.logPee=()=>run(async()=>{await ins('toilet_events',{kind:'pee'});closeSheet();await loadToday();render()},'Pipì registrata 💧');

A.logVomit=()=>openSheet('🤮 Vomito',`<form>${F.num('episodes','Quanti episodi?','1')}${F.dt('occurred_at','Quando')}${F.area('notes','Com\\'era? Note')}${F.submit('Salva')}</form>`,
async d=>{await ins('health_events',{category:'vomit',title:'Vomito',occurred_at:new Date(d.occurred_at).toISOString(),details:{episodes:d.episodes},notes:d.notes||null});closeSheet();await loadToday();render();toast('Registrato')});

A.logMed=()=>{
 const opts=S.meds.filter(m=>m.active).map(m=>[m.id,`${m.name}${m.dose?' · '+m.dose:''}`]);
 openSheet('💊 Farmaco dato',`<form>${opts.length?F.select('med_id','Quale farmaco?',[...opts,['','Altro (scrivi sotto)']]):''}${F.text('name','Nome farmaco','','es. antibiotico')}${F.text('dose','Dose','','es. 1 compressa')}${F.dt('occurred_at','Quando')}${F.area('notes','Note')}${F.submit('Salva')}</form>`,
 async d=>{
  const med=S.meds.find(m=>m.id===d.med_id);
  const name=med?med.name:d.name;
  if(!name)throw new Error('Scrivi il nome del farmaco');
  await ins('health_events',{category:'medication_given',title:`💊 ${name}`,occurred_at:new Date(d.occurred_at).toISOString(),details:{dose:d.dose||(med&&med.dose)||''},notes:d.notes||null});
  if(med)await q(T('medications').update({last_given:ymd(d.occurred_at)}).eq('id',med.id));
  await autoCompleteKind('medication');
  closeSheet();await refreshAll();toast('Farmaco registrato 💊');
 });
};

A.logWeight=()=>openSheet('⚖️ Peso',`<form>${F.num('weight_kg','Peso (kg)',S.dog.weight_kg||'')}${F.dt('measured_at','Quando')}${F.area('notes','Note')}${F.submit('Salva peso')}</form>`,
async d=>{
 if(!d.weight_kg)throw new Error('Inserisci il peso');
 await ins('weight_history',{weight_kg:Number(d.weight_kg),measured_at:new Date(d.measured_at).toISOString(),notes:d.notes||null});
 await q(T('dogs').update({weight_kg:Number(d.weight_kg)}).eq('id',S.dog.id));
 closeSheet();await refreshAll();toast('Peso salvato ⚖️');
});

A.logNote=()=>openSheet('📝 Nota',`<form>${F.area('text','Cosa vuoi annotare?','','es. oggi molto vivace al parco')}${F.dt('occurred_at','Quando')}${F.submit('Salva nota')}</form>`,
async d=>{if(!d.text)return;await ins('notes',{text:d.text,occurred_at:new Date(d.occurred_at).toISOString()});closeSheet();await loadToday();render();toast('Nota salvata 📝')});

A.logPhoto=()=>openSheet('📷 Foto',`<form>${F.file('file','Scegli o scatta una foto')}${F.area('text','Didascalia')}${F.submit('Salva foto')}</form>`,
async d=>{const f=d.file;if(!f||!f.size)throw new Error('Scegli una foto');const p=await upload(f,'photos');await ins('notes',{text:d.text||null,photo_path:p});closeSheet();await loadToday();render();toast('Foto salvata 📷')});

A.sick=()=>openSheet(`🚨 ${esc(dogName())} non sta bene`,`<p class="muted small">Registra i sintomi per raccontarli bene al veterinario. L'app non fa diagnosi: se sei preoccupato, chiama subito il veterinario.</p>
${S.vets[0]&&S.vets[0].phone?`<a class="btn green sm" style="margin-top:10px" href="tel:${esc(S.vets[0].phone.replace(/\s/g,''))}">📞 Chiama ${esc(S.vets[0].name)}</a>`:''}
<form>${F.choices('symptoms','Sintomi (anche più di uno)',SYMPTOMS,'',true)}
<div class="pair">${F.dt('occurred_at','Da quando')}${F.num('episodes','Episodi','1')}</div>
<div class="pair">${F.text('last_meal','Ultimo pasto','','es. 8:00, tutto')}${F.select('water','Acqua',[['normale','Beve normale'],['tanto','Beve tanto'],['poco','Beve poco'],['no','Non beve']])}</div>
${F.select('behavior','Comportamento',[['normale','Normale'],['abbattuta','Abbattuta / poco attiva'],['agitata','Agitata'],['dolorante','Sembra avere dolore']])}
${F.area('notes','Note')}${F.file('file','Foto (opzionale)')}${F.submit('Salva segnalazione','red')}</form>`,
async d=>{
 let p=null;if(d.file&&d.file.size)p=await upload(d.file,'health');
 await ins('health_events',{category:'sick',title:'🚨 Non sta bene',occurred_at:new Date(d.occurred_at).toISOString(),details:{symptoms:d.symptoms,episodes:d.episodes,last_meal:d.last_meal,water:d.water,behavior:d.behavior},notes:d.notes||null,attachment_path:p});
 closeSheet();await refreshAll();toast('Segnalazione salvata');
});

A.healthCat=({k})=>{
 const c=HCATS[k];let list='',addBtn='';
 if(k==='weight'){
  list=S.weights.map(w=>`<div class="ev"><div class="e">⚖️</div><div class="b"><b>${w.weight_kg} kg</b><div class="sub">${fmtDateFull(w.measured_at)} · ${esc(who(w.created_by))}${w.notes?' · '+esc(w.notes):''}</div></div><button class="del" data-a="delRow" data-tb="weight_history" data-id="${w.id}">🗑</button></div>`).join('');
  addBtn=`<button class="btn" data-a="logWeight">＋ Nuovo peso</button>`;
 }else if(k==='vaccine'){
  list=S.vaccs.map(v=>`<div class="ev"><div class="e">💉</div><div class="b"><b>${esc(v.name)}</b><div class="sub">fatto: ${v.given_on?fmtDateFull(v.given_on):'—'}${v.next_due?` · prossimo: ${fmtDateFull(v.next_due)} (${dueLabel(v.next_due)})`:''}${v.notes?' · '+esc(v.notes):''}</div>${v.attachment_path?`<button class="btn sm sec" style="margin-top:8px" data-a="openDoc" data-p="${esc(v.attachment_path)}">📎 Allegato</button>`:''}</div><button class="undo" data-a="editVacc" data-id="${v.id}">✏️</button><button class="del" data-a="delRow" data-tb="vaccinations" data-id="${v.id}">🗑</button></div>`).join('');
  addBtn=`<button class="btn" data-a="editVacc">＋ Nuovo vaccino</button>`;
 }else if(k==='medication'){
  list=S.meds.map(m=>`<div class="ev"><div class="e">${m.active?'💊':'⏸️'}</div><div class="b"><b>${esc(m.name)}${m.dose?' · '+esc(m.dose):''}</b><div class="sub">${esc([m.schedule,m.last_given?'ultimo: '+fmtDateFull(m.last_given):'',m.next_due?'prossimo: '+fmtDateFull(m.next_due)+' ('+dueLabel(m.next_due)+')':'',m.notes].filter(Boolean).join(' · '))}</div></div><button class="undo" data-a="editMed" data-id="${m.id}">✏️</button><button class="del" data-a="delRow" data-tb="medications" data-id="${m.id}">🗑</button></div>`).join('');
  addBtn=`<div class="row"><button class="btn" data-a="editMed">＋ Nuovo farmaco</button><button class="btn sec" data-a="logMed">💊 Dato ora</button></div>`;
 }else{
  list=S.healthAll.filter(h=>h.category===k).map(h=>`<div class="ev"><div class="e">${c.e}</div><div class="b"><b>${esc(h.title||c.n)}</b><div class="sub">${fmtDateFull(h.occurred_at)}${h.next_due?` · prossimo: ${fmtDateFull(h.next_due)} (${dueLabel(h.next_due)})`:''}${h.notes?' · '+esc(h.notes):''} · ${esc(who(h.created_by))}</div>${h.attachment_path?`<button class="btn sm sec" style="margin-top:8px" data-a="openDoc" data-p="${esc(h.attachment_path)}">📎 Allegato</button>`:''}</div><button class="del" data-a="delRow" data-tb="health_events" data-id="${h.id}">🗑</button></div>`).join('');
  addBtn=`<button class="btn" data-a="addHealth" data-k="${k}">＋ Registra ${c.n.toLowerCase()}</button>`;
 }
 openSheet(`${c.e} ${c.n}`,`${addBtn}<div style="margin-top:14px">${list||'<div class="empty small">Nessun dato ancora.</div>'}</div>`);
};