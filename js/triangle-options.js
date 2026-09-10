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
    if (opts.hidden) root.classList.add('hidden');

    const buttons = [];
    let answerKey = null;      // set by the screen
    let onAnswer = null;
    let locked = false;

    CHOICES.forEach(function (c) {
      const b = document.createElement('button');
      b.type = 'button';
      b.classList.add('triangle-option');
      b.classList.add(c.cls);
      b.textContent = c.label;
      b.dataset.key = c.key;

      b.addEventListener('click', function (e) {
        e.stopPropagation();          // a tap here must never skip the screen
        if (locked) return;
        choose(c.key, b);
      });
      root.appendChild(b);
      buttons.push(b);
    });

    // dragging or stray taps inside the panel stay inside it
    root.addEventListener('click', function (e) { e.stopPropagation(); });
    root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

    function clearStates() {
      buttons.forEach(function (b) {
        b.classList.remove('selected', 'correct', 'incorrect');
      });
    }

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

    parent.appendChild(root);

    return {
      el: root,
      setAnswer: function (k) { answerKey = k; },
      reset: function () { clearStates(); locked = false; },
      lock: function () { locked = true; },
      show: function () { root.classList.remove('hidden'); },
      hide: function () { root.classList.add('hidden'); },
      onAnswer: function (fn) { onAnswer = fn; }
    };
  }

  return { mount: mount, CHOICES: CHOICES };
})();
