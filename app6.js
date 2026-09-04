/* Kelly Care - pezzo 6 di 8 (Form e Modali Completi) */

const F = {
  text: (k, l, v = '', p = '') => `
    <div class="f">
      <label>${esc(l)}</label>
      <input type="text" name="${k}" value="${esc(v)}" placeholder="${esc(p)}">
    </div>`,

  num: (k, l, v = '', p = '', step = 'any') => `
    <div class="f">
      <label>${esc(l)}</label>
      <input type="number" step="${step}" name="${k}" value="${esc(v)}" placeholder="${esc(p)}">
    </div>`,

  time: (k, l, v = '') => `
    <div class="f">
      <label>${esc(l)}</label>
      <input type="time" name="${k}" value="${esc(v)}">
    </div>`,

  date: (k, l, v = '') => `
    <div class="f">
      <label>${esc(l)}</label>
      <input type="date" name="${k}" value="${esc(v)}">
    </div>`,

  select: (k, l, opts, v = '') => `
    <div class="f">
      <label>${esc(l)}</label>
      <select name="${k}">
        ${opts.map(o => `
          <option value="${esc(o[0])}" ${o[0] == v ? 'selected' : ''}>
            ${esc(o[1])}
          </option>
        `).join('')}
      </select>
    </div>`,

  area: (k, l, v = '', p = '') => `
    <div class="f">
      <label>${esc(l)}</label>
      <textarea name="${k}" placeholder="${esc(p)}">${esc(v)}</textarea>
    </div>`,

  file: (k, l, accept = '*') => `
    <div class="f">
      <label>${esc(l)}</label>
      <input type="file" name="${k}" accept="${accept}">
    </div>`,

  submit: (l = 'Salva') => `
    <button type="submit" class="btn primary" style="width:100%;margin-top:15px">
      ${esc(l)}
    </button>`
};

function openSheet(title, html, onSubmit) {
  const el = document.getElementById('sheet');
  const overlay = document.getElementById('overlay');

  el.innerHTML = `
    <div class="sheet-hdr">
      <h3>${esc(title)}</h3>
      <button class="close" onclick="closeSheet()">✕</button>
    </div>
    <div class="sheet-bdy">${html}</div>
  `;

  overlay.hidden = false;

  const form = el.querySelector('form');
  if (form && onSubmit) {
    form.onsubmit = async ev => {
      ev.preventDefault();
      const fd = new FormData(form);
      const data = {};
      
      for (let [k, v] of fd.entries()) {
        data[k] = v;
      }
      
      await onSubmit(data);
    };
  }
}

function closeSheet() {
  document.getElementById('overlay').hidden = true;
  document.getElementById('sheet').innerHTML = '';
}
