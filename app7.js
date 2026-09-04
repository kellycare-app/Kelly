/* Kelly Care - pezzo 7 di 8 (Azioni e Gestori Completi) */

const A = {};

/* --- REGISTRAZIONI RAPIDE BISOGNI --- */
A.poop = async () => {
  await ins('potty', { type: 'poop' });
  await refreshAll();
  toast('💩 Cacca registrata!');
};

A.pee = async () => {
  await ins('potty', { type: 'pee' });
  await refreshAll();
  toast('💧 Pipì registrata!');
};

A.both = async () => {
  await ins('potty', { type: 'both' });
  await refreshAll();
  toast('🐾 Bisogni registrati!');
};

/* --- REGISTRAZIONE PASTI E PASSEGGIATE --- */
A.addMeal = () => openSheet('🍽️ Registra Pasto', `<form>
  ${F.text('food', 'Tipo di Cibo', S.dog ? S.dog.food || '' : '', 'es. Crocchette, Umido')}
  ${F.num('amount_g', 'Quantità (Grammi)', '', 'es. 150')}
  ${F.area('notes', 'Note')}
  ${F.submit('Salva Pasto')}
</form>`, async d => {
  await ins('meals', {
    food: d.food || 'Cibo',
    amount_g: d.amount_g ? parseFloat(d.amount_g) : null,
    notes: d.notes || null
  });
  closeSheet();
  await refreshAll();
  toast('Pasto registrato! 🍽️');
});

A.addWalk = () => openSheet('🐾 Registra Passeggiata', `<form>
  ${F.num('duration_min', 'Durata (Minuti)', '20', 'es. 30')}
  ${F.area('notes', 'Note (es. Parco, corsa, incontri)')}
  ${F.submit('Salva Passeggiata')}
</form>`, async d => {
  await ins('walks', {
    duration_min: d.duration_min ? parseInt(d.duration_min) : 15,
    notes: d.notes || null
  });
  closeSheet();
  await refreshAll();
  toast('Passeggiata salvata! 🐾');
});

/* --- CALENDARIO E APPUNTAMENTI --- */
A.addCalEvent = () => openSheet('📅 Nuovo Appuntamento', `<form>
  ${F.text('title', 'Cosa devi fare?', '', 'es. Toelettatura, Richiamo Vaccino')}
  ${F.time('time', 'Orario', '09:00')}
  ${F.area('notes', 'Note aggiuntive')}
  ${F.submit('Salva Appuntamento')}
</form>`, async d => {
  if (!d.title) return toast('Inserisci un titolo', true);
  await ins('reminders', {
    title: d.title,
    time: d.time || '09:00',
    active: true,
    days: [1, 2, 3, 4, 5, 6, 7]
  });
  closeSheet();
  await refreshAll();
  toast('Appuntamento salvato! 📅');
});

/* --- REGISTRAZIONE SPESE --- */
A.addExpense = () => openSheet('💶 Nuova Spesa Kelly', `<form>
  ${F.text('title', 'Descrizione', '', 'es. Sacco Crocchette, Antiparassitario')}
  ${F.num('amount', 'Importo (€)', '', 'es. 25.50', '0.01')}
  ${F.select('category', 'Categoria', [
    ['food', '🥣 Cibo'],
    ['health', '🩺 Salute/Vet'],
    ['toys', '🧸 Giochi/Accessori'],
    ['grooming', '✂️ Toelettatura']
  ])}
  ${F.submit('Salva Spesa')}
</form>`, async d => {
  if (!d.title || !d.amount) return toast('Compila i campi obbligatori', true);
  await ins('health_events', {
    category: 'expense',
    title: `💶 ${d.title} (${d.amount}€)`,
    notes: `Categoria: ${d.category}`
  });
  closeSheet();
  await refreshAll();
  toast('Spesa registrata! 💶');
});

/* --- FOTO PROFILO & ELIMINAZIONE RIGHE --- */
A.dogPhoto = () => openSheet('🐶 Foto di ' + dogName(), `<form>
  ${F.file('photo', 'Scegli foto', 'image/*')}
  ${F.submit('Carica')}
</form>`, async d => {
  if (!d.photo || !d.photo.size) return toast('Seleziona una foto', true);
  const path = await upload(d.photo, 'avatar');
  const url = await signed(path);
  await q(T('dogs').update({ photo_path: path }).eq('id', S.dog.id));
  S.dogPhoto = url;
  closeSheet();
  render();
  toast('Foto aggiornata! 🐾');
});

A.delRow = async (el, dataset) => {
  if (!confirm('Vuoi davvero eliminare questo elemento?')) return;
  const { tb, id } = dataset;
  if (tb && id) {
    await del(tb, id);
    await refreshAll();
    toast('Elemento eliminato');
  }
};
