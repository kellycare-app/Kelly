/* Kelly Care - pezzo 8 di 8 */
A.toggleRem = ({ id, on }) => run(async () => { await q(T('reminders').update({ active: on !== '1' }).eq('id', id)); await refreshAll(); });
A.enableNotif = async () => {
  if (!('Notification' in window)) return toast('Notifiche non supportate qui', true);
  const p = await Notification.requestPermission();
  if (p === 'granted') { notify(`🐶 Notifiche attive per ${dogName()}!`); render(); } else toast('Permesso non concesso', true);
};

async function notify(text) {
  if (!('Notification' in window) || Notification.permission !== 'granted') { toast(text); return; }
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg && reg.showNotification) await reg.showNotification('Kelly Care', { body: text, tag: 'kc-' + text });
    else new Notification('Kelly Care', { body: text });
  } catch { toast(text); }
}
function checkReminders() {
  if (!S.dog) return;
  const now = new Date(), hm = `${pad(now.getHours())}:${pad(now.getMinutes())}`, dow = now.getDay() === 0 ? 7 : now.getDay();
  S.reminders.filter(r => r.active && r.time === hm && (!r.days || !r.days.length || r.days.includes(dow))).forEach(r => {
    const key = `kc_fired_${r.id}_${ymd()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1'); notify(r.title);
  });
  const dkey = `kc_due_${ymd()}`;
  if (!localStorage.getItem(dkey)) { const b = dueBanners(); if (b.length) { localStorage.setItem(dkey, '1'); b.slice(0, 3).forEach(notify); } }
  Object.keys(localStorage).filter(k => (k.startsWith('kc_fired_') || k.startsWith('kc_due_')) && !k.endsWith(ymd())).forEach(k => localStorage.removeItem(k));
}
