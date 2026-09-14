/* =============================================================
   Triangle answer panel — self-contained component.

   Builds its own DOM and owns its own state. Mount it anywhere:

       const panel = TriangleOptions.mount(parent, { x, y });
       panel.onAnswer(function (key, isCorrect) { ... });

   The component never decides what is right: the screen tells it,
   and it only reports what was pressed and plays the verdict.
   ============================================================= */
window.TriangleOptions = (function () {
  'use strict';

  /* Default set. A screen can supply its own three answers instead —
     the panel only ever shows what it is given. */
  const CHOICES = [
    { key: 'scalene',      cls: 'scalene',      label: 'Scalene Triangle' },
    { key: 'isosceles',    cls: 'isosceles',    label: 'Isosceles Triangle' },
    { key: 'right-angled', cls: 'right-angled', label: 'Right-angled Triangle' }
  ];

  function mount(parent, opts) {
    opts = opts || {};

    const root = document.createElement('div');
    root.classList.add('triangle-options-panel');
    root.id = opts.id || 'triangleOptions';
    if (opts.x !== undefined) root.style.left = opts.x + 'px';
    if (opts.y !== undefined) root.style.top = opts.y + 'px';
    if (opts.scale) root.style.setProperty('--k', opts.scale);
    if (opts.hidden) root.classList.add('hidden');

    let buttons = [];
    let answerKey = null;      // set by the screen
    let onAnswer = null;
    let locked = false;

    function clearStates() {
      buttons.forEach(function (b) {
        b.classList.remove('selected', 'correct', 'incorrect');
      });
    }

    let builtKeys = '';
    function build(list) {
      list = list || CHOICES;
      // only rebuild when the answers actually differ
      const keys = list.map(function (c) { return c.key; }).join('|');
      if (keys === builtKeys) { clearStates(); return; }
      builtKeys = keys;

      buttons.forEach(function (b) { root.removeChild(b); });
      buttons = [];
      list.forEach(function (c, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.classList.add('triangle-option');
        b.classList.add('opt-' + (i + 1));        // positional colour
        if (c.cls) b.classList.add(c.cls);
        b.textContent = c.label;
        b.dataset.key = c.key;

        b.addEventListener('click', function (e) {
          e.stopPropagation();        // a tap here must never skip the screen
          if (locked) return;
          choose(c.key, b);
        });
        root.appendChild(b);
        buttons.push(b);
      });
    }
    build(opts.choices);

    // dragging or stray taps inside the panel stay inside it
    root.addEventListener('click', function (e) { e.stopPropagation(); });
    root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    function choose(key, btn) {
      clearStates();
      btn.classList.add('selected');
      const right = (answerKey != null) && (key === answerKey);

      // verdicts are transient: they play, then leave the button be
      btn.classList.add(right ? 'correct' : 'incorrect');
      setTimeout(function () { btn.classList.remove('correct', 'incorrect'); }, 700);
      if (!right) setTimeout(function () { btn.classList.remove('selected'); }, 700);

      if (onAnswer) onAnswer(key, right);
    }

    /* Once the method is chosen the buttons give way to the working,
       in the same panel and the same place. */
    let formula = null;
    function showFormula(lines) {
      buttons.forEach(function (b) { b.classList.add('hidden'); });
      if (formula) root.removeChild(formula);
      formula = document.createElement('div');
      formula.classList.add('formula-view');
      (lines || []).forEach(function (l, i) {
        const d = document.createElement('div');
        d.classList.add('formula-' + (l.kind || 'step'));
        d.textContent = l.text;
        d.style.animationDelay = (i * 260) + 'ms';
        formula.appendChild(d);
      });
      root.appendChild(formula);
    }

    function hideFormula() {
      if (formula) { root.removeChild(formula); formula = null; }
      buttons.forEach(function (b) { b.classList.remove('hidden'); });
    }

    parent.appendChild(root);

    return {
      el: root,
      showFormula: showFormula,
      hideFormula: hideFormula,
      setChoices: function (list) { build(list); },
      setAnswer: function (k) { answerKey = k; },
      reset: function () { hideFormula(); clearStates(); locked = false; },
      lock: function () { locked = true; },
      /* `rising` is for the moment it takes the space Swifty has just
         flown out of: it comes up from below rather than appearing, so
         it is visibly settled by the time she lands on it. */
      show: function (rising) {
        root.classList.remove('hidden', 'rising');
        if (rising) { void root.offsetWidth; root.classList.add('rising'); }
      },
      hide: function () { root.classList.add('hidden'); },
      onAnswer: function (fn) { onAnswer = fn; }
    };
  }

  return { mount: mount, CHOICES: CHOICES };
})();
