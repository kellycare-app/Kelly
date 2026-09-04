/* Kelly Care - pezzo 8 di 8 (Event Loop & Inizializzazione) */

document.addEventListener('click', async ev => {
  const btn = ev.target.closest('[data-a]');
  if (!btn) return;

  const action = btn.dataset.a;

  // Gestione Navigazione Schermate
  if (action === 'nav') {
    S.view = btn.dataset.v;
    render();
    return;
  }

  // Gestione Filtri Diario
  if (action === 'diaryFilter') {
    S.diaryFilter = btn.dataset.f;
    render();
    return;
  }

  // Esecuzione Funzioni di Azione (A)
  if (typeof A[action] === 'function') {
    try {
      await A[action](btn, btn.dataset);
    } catch (err) {
      console.error('Errore esecuzione azione:', action, err);
      toast('Impossibile completare l\'operazione', true);
    }
  }
});

// Avvio dell'Applicazione
window.addEventListener('DOMContentLoaded', async () => {
  try {
    if (typeof initApp === 'function') {
      await initApp();
    } else if (typeof refreshAll === 'function') {
      await refreshAll();
    }
  } catch (err) {
    console.error('Errore durante l\'avvio:', err);
  }
});
