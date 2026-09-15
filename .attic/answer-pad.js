/* =============================================================
   Answer pad — self-contained.

   "AB = [ ] units", with a keypad to fill the blank. Used where the
   answer is a number the child works out rather than one they can
   pick off the 1-8 slider — the triangle questions answer 5 and 10,
   and 10 is off the slider's end.

   It grades nothing: it reports the number to whoever mounted it,
   and the screen decides what a right answer is.
   ============================================================= */
window.AnswerPad = (function () {
  'use strict';

  const MAXLEN = 3;              // no answer on this board needs more

  function mk(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) cls.split(' ').forEach(function (c) { e.classList.add(c); });
    if (text != null) e.textContent = text;
    return e;
  }

  function mount(parent) {
    const root = mk('div', 'apad hidden');
    const inner = mk('div', 'apad-inner');

    /* the line being completed */
    const line = mk('div', 'apad-line');
    const label = mk('span', 'apad-label', 'AB =');
    const blank = mk('span', 'apad-blank empty');
    const units = mk('span', 'apad-units', 'units');
    line.appendChild(label); line.appendChild(blank); line.appendChild(units);
    inner.appendChild(line);

    /* the keys: 1-9 in reading order, then backspace, 0, and Check */
    const keys = mk('div', 'apad-keys');
    const digitKeys = [];
    const addKey = function (txt, val, cls) {
      const b = mk('button', 'apad-key' + (cls ? ' ' + cls : ''), txt);
      b.type = 'button';
      b.dataset.k = val;
      keys.appendChild(b);
      digitKeys.push(b);
      return b;
    };
    for (let i = 1; i <= 9; i++) addKey(String(i), String(i));
    addKey('⌫', 'back', 'apad-back');
    addKey('0', '0');
    const blankKey = mk('span', 'apad-key');      // keeps the grid square
    blankKey.style.visibility = 'hidden';
    keys.appendChild(blankKey);

    const check = mk('button', 'apad-check', 'Check ✓');
    check.type = 'button';
    keys.appendChild(check);
    inner.appendChild(keys);
    root.appendChild(inner);

    let value = '';
    let onCheck = null;

    function paint(bump) {
      blank.textContent = value;
      blank.classList.toggle('empty', value === '');
      blank.classList.toggle('filled', value !== '');
      check.disabled = value === '';
      if (bump) {
        blank.classList.remove('bump');
        void blank.offsetWidth;                 // restart the kick
        blank.classList.add('bump');
      }
    }

    keys.addEventListener('click', function (e) {
      const b = e.target && e.target.dataset ? e.target : null;
      if (!b || b.dataset.k == null) return;
      e.stopPropagation();                      // never reaches the scene
      if (b.dataset.k === 'back') value = value.slice(0, -1);
      else if (value.length < MAXLEN) value += b.dataset.k;
      /* A leading zero can only be a slip — nothing here answers 0. */
      if (value.length > 1 && value[0] === '0') value = value.slice(1);
      paint(true);
    });

    check.addEventListener('click', function (e) {
      e.stopPropagation();
      if (value === '') return;
      if (onCheck) onCheck(Number(value));
    });

    // taps on the panel itself must not count as taps on the scene
    root.addEventListener('click', function (e) { e.stopPropagation(); });
    root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    parent.appendChild(root);
    paint(false);

    return {
      el: root,
      get value() { return value === '' ? null : Number(value); },
      /* The prompt names the pair being asked about, so one pad serves
         any question of this shape. */
      setPrompt: function (text) { label.textContent = text; },
      reset: function () {
        value = '';
        root.classList.remove('locked');
        paint(false);
      },
      lock: function () { root.classList.add('locked'); },
      show: function () {
        root.classList.remove('hidden', 'enter');
        void root.offsetWidth;
        root.classList.add('enter');
      },
      hide: function () { root.classList.add('hidden'); },
      onCheck: function (fn) { onCheck = fn; }
    };
  }

  return { mount: mount, MAXLEN: MAXLEN };
})();
