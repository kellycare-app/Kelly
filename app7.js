/* Kelly Care - pezzo 7 di 8 */
A.addHealth = ({ k }) => {
  const c = HCATS[k];
  openSheet(`${c.e} ${c.n}`, `<form>${F.text('title', 'Cosa', '', `es. ${k === 'antiparasite' ? 'pipetta antiparassitaria' : k === 'vet' ? 'visita di controllo' : k === 'grooming' ? 'taglio e bagno' : 'controllo'}`)}
    <div class="pair">${F.date('occurred_at', 'Fatto il', ymd())}${F.date('next_due', 'Prossima scadenza')}</div>${F.area('notes', 'Note')}${F.file('file', 'Allegato (foto/PDF)', 'image/*,application/pdf')}${F.submit()}</form>`,
    async d => {
      let p = null; if (d.file && d.file.size) p = await upload(d.file, k);
      await ins('health_events', { category: k, title: d.title || c.n, occurred_at: new Date(d.occurred_at + 'T12:00').toISOString(), next_due: d.next_due || null, notes: d.notes || null, attachment_path: p });
      closeSheet(); await refreshAll(); toast('Salvato ✓');
    });
};
A.editVacc = ({ id }) => {
  const v = S.vaccs.find(x => x.id === id) || {};
  openSheet('💉 Vaccino', `<form>${F.hidden('id', id || '')}${F.text('name', 'Vaccino', v.name || '', 'es. Esavalente, Rabbia')}
    <div class="pair">${F.date('given_on', 'Fatto il', v.given_on || ymd())}${F.date('next_due', 'Richiamo', v.next_due || '')}</div>${F.area('notes', 'Note', v.notes || '')}${F.file('file', 'Allegato (foto/PDF)', 'image/*,application/pdf')}${F.submit()}</form>`,
    async d => {
      const row = { name: d.name, given_on: d.given_on || null, next_due: d.next_due || null, notes: d.notes || null };
      if (d.file && d.file.size) row.attachment_path = await upload(d.file, 'vaccines');
      if (d.id) await q(T('vaccinations').update(row).eq('id', d.id)); else await ins('vaccinations', row);
      closeSheet(); await refreshAll(); toast('Vaccino salvato 💉');
    });
};
A.editMed = ({ id }) => {
  const m = S.meds.find(x => x.id === id) || { active: true };
  openSheet('💊 Farmaco', `<form>${F.hidden('id', id || '')}${F.text('name', 'Nome', m.name || '')}<div class="pair">${F.text('dose', 'Dose', m.dose || '', 'es. 1 compressa')}${F.text('schedule', 'Quando', m.schedule || '', 'es. ogni sera')}</div>
    <div class="pair">${F.date('last_given', 'Ultima volta', m.last_given || '')}${F.date('next_due', 'Prossima volta', m.next_due || '')}</div>${F.area('notes', 'Note', m.notes || '')}${F.check('active', 'In corso', m.active)}${F.submit()}</form>`,
    async d => {
      const row = { name: d.name, dose: d.dose || null, schedule: d.schedule || null, last_given: d.last_given || null, next_due: d.next_due || null, notes: d.notes || null, active: d.active };
      if (d.id) await q(T('medications').update(row).eq('id', d.id)); else await ins('medications', row);
      closeSheet(); await refreshAll(); toast('Farmaco salvato 💊');
    });
};

A.editVet = ({ id }) => {
  const v = S.vets.find(x => x.id === id) || {};
  openSheet('🩺 Veterinario', `<form>${F.hidden('id', id || '')}${F.text('name', 'Nome', v.name || '', 'es. Dott.ssa Rossi')}${F.text('clinic', 'Clinica', v.clinic || '')}
    ${F.text('phone', 'Telefono', v.phone || '')}${F.text('address', 'Indirizzo', v.address || '', 'via, città')}${F.area('notes', 'Note / orari', v.notes || '')}
    ${F.check('is_emergency', '🚑 Pronto soccorso / emergenze', v.is_emergency)}${F.submit()}${id ? `<button type="button" class="btn ghost" data-a="delRow" data-tb="vets" data-id="${id}">Elimina</button>` : ''}</form>`,
    async d => {
      const row = { name: d.name, clinic: d.clinic || null, phone: d.phone || null, address: d.address || null, notes: d.notes || null, is_emergency: d.is_emergency };
      if (d.id) await q(T('vets').update(row).eq('id', d.id)); else await q(T('vets').insert({ dog_id: S.dog.id, ...row }));
      closeSheet(); await refreshAll(); toast('Veterinario salvato');
    });
};
A.addDoc = () => openSheet('📁 Carica documento', `<form>${F.text('title', 'Titolo', '', 'es. Libretto sanitario')}${F.select('category', 'Tipo', [['libretto', 'Libretto sanitario'], ['vaccini', 'Vaccini'], ['analisi', 'Analisi'], ['ricetta', 'Ricetta'], ['referto', 'Referto'], ['microchip', 'Microchip'], ['altro', 'Altro']])}
  ${F.file('file', 'File (PDF o immagine)', 'image/*,application/pdf')}${F.submit('Carica')}</form>`,
  async d => { const f = d.file; if (!f || !f.size) throw new Error('Scegli un file'); const p = await upload(f, 'documents'); await ins('documents', { title: d.title || f.name, category: d.category, storage_path: p, mime: f.type }); closeSheet(); await A.nav({ v: 'health' }); toast('Documento caricato 📁'); });
A.openDoc = async ({ p }) => { const u = await signed(p); if (u) window.open(u, '_blank'); else toast('File non trovato', true); };
A.delDoc = ({ id, p }) => { if (confirm('Eliminare il documento?')) run(async () => { await sb.storage.from(BUCKET).remove([p]); await q(T('documents').delete().eq('id', id)); await A.nav({ v: 'health' }); }, 'Eliminato'); };
A.addAppt = ({ d }) => openSheet('📅 Appuntamento', `<form>${F.text('title', 'Cosa', '', 'es. Visita veterinaria')}${F.select('category', 'Tipo', [['vet', '🩺 Veterinario'], ['grooming', '✂️ Toelettatura'], ['other', '📅 Altro']])}
  ${F.dt('starts_at', 'Quando', (d || ymd()) + 'T10:00')}${F.text('location', 'Dove')}${F.area('notes', 'Note')}${F.submit()}</form>`,
  async x => { await ins('appointments', { title: x.title, category: x.category, starts_at: new Date(x.starts_at).toISOString(), location: x.location || null, notes: x.notes || null }); closeSheet(); await refreshAll(); toast('Appuntamento salvato 📅'); });
A.delRow = ({ tb, id }) => { if (confirm('Eliminare?')) run(async () => { await q(T(tb).delete().eq('id', id)); closeSheet(); await refreshAll(); }, 'Eliminato'); };

A.dogPhoto = () => openSheet('📷 Foto di ' + esc(dogName()), `<form>${F.file('file', 'Scegli o scatta la foto')}${F.submit('Salva foto')}</form>`,
  async d => { const f = d.file; if (!f || !f.size) throw new Error('Scegli una foto'); const p = await upload(f, 'profile'); await q(T('dogs').update({ photo_path: p }).eq('id', S.dog.id)); delete urlCache[p]; closeSheet(); await refreshAll(); toast('Che bella! 🐶'); });
A.editDog = () => {
  const d = S.dog;
  openSheet('Profilo di ' + esc(d.name), `<form>${F.text('name', 'Nome', d.name)}${F.text('breed', 'Razza', d.breed || '')}
    <div class="pair">${F.select('sex', 'Sesso', [['F', 'Femmina'], ['M', 'Maschio']], d.sex || 'F')}${F.date('birth_date', 'Data di nascita', d.birth_date || '')}</div>
    <div class="pair">${F.num('weight_kg', 'Peso (kg)', d.weight_kg || '')}${F.text('microchip', 'Microchip', d.microchip || '')}</div>
    ${F.check('neutered', 'Sterilizzata', d.neutered)}${F.text('food', 'Alimentazione', d.food || '')}${F.text('allergies', 'Allergie / intolleranze', d.allergies || '')}${F.area('notes', 'Note', d.notes || '')}${F.submit()}</form>`,
    async x => {
      await q(T('dogs').update({ name: x.name || 'Kelly', breed: x.breed || null, sex: x.sex, birth_date: x.birth_date || null, weight_kg: x.weight_kg || null, microchip: x.microchip || null, neutered: x.neutered, food: x.food || null, allergies: x.allergies || null, notes: x.notes || null }).eq('id', S.dog.id));
      closeSheet(); await refreshAll(); toast('Profilo aggiornato');
    });
};
A.editMe = () => openSheet('Il tuo nome', `<form>${F.text('name', 'Nome', S.profile.display_name || '')}${F.submit()}</form>`,
  async d => { await q(T('profiles').update({ display_name: d.name }).eq('id', S.user.id)); closeSheet(); await refreshAll(); toast('Nome aggiornato'); });
A.editRem = ({ id }) => {
  const r = S.reminders.find(x => x.id === id) || { title: '', time: '08:00', days: [1, 2, 3, 4, 5, 6, 7], active: true, category: 'other' };
  openSheet('🔔 Promemoria', `<form>${F.hidden('id', id || '')}${F.text('title', 'Messaggio', r.title, `es. 🐶 È ora della pappa di ${dogName()}!`)}${F.time('time', 'Orario', r.time)}
    ${F.choices('days', 'Giorni', [['1', 'lun'], ['2', 'mar'], ['3', 'mer'], ['4', 'gio'], ['5', 'ven'], ['6', 'sab'], ['7', 'dom']], (r.days || []).join(','), true)}
    ${F.check('active', 'Attivo', r.active)}${F.submit()}${id ? `<button type="button" class="btn ghost" data-a="delRow" data-tb="reminders" data-id="${id}">Elimina</button>` : ''}</form>`,
    async d => {
      const row = { title: d.title, time: d.time, days: d.days ? d.days.split(',').map(Number) : [1, 2, 3, 4, 5, 6, 7], active: d.active };
      if (d.id) await q(T('reminders').update(row).eq('id', d.id)); else await ins('reminders', row);
      closeSheet(); await refreshAll(); toast('Promemoria salvato 🔔');
    });
};
