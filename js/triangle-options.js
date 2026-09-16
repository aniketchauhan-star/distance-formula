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

      /* The border carries the verdict. Green is left showing — the
         screen goes on to work this answer through, and the child
         should still be able to see which one they picked; clearStates
         takes it off at the next question. Red clears itself, because
         the panel stays live for another go. */
      btn.classList.add(right ? 'correct' : 'incorrect');
      if (!right) setTimeout(function () {
        btn.classList.remove('incorrect', 'selected');
      }, 700);

      if (onAnswer) onAnswer(key, right);
    }

    /* Once the method is chosen the buttons give way to the working,
       in the same panel and the same place.

       A line can be a plain string, or parts — and a part that names a
       length carries the side of the triangle it belongs to. Those are
       lit one at a time rather than all at once, and each one tells the
       host which side it just named, so the board can light the same
       thing at the same moment. That is the whole point of the sequence:
       the words and the drawing say one thing together. */
    const LINE_MS = 420;      // a line arriving
    const BEAT_MS = 620;      // one named part after the last

    let formula = null, beats = [];
    function clearBeats() {
      beats.forEach(clearTimeout);
      beats = [];
    }

    /* How long the whole thing runs, without running it — the host has
       to hold the screen open for exactly that. */
    function formulaMs(lines) {
      let ms = 0;
      (lines || []).forEach(function (l) {
        ms += LINE_MS;
        (l.parts || []).forEach(function (f) { if (f.lit) ms += BEAT_MS; });
      });
      return ms;
    }

    function showFormula(lines, onBeat) {
      buttons.forEach(function (b) { b.classList.add('hidden'); });
      clearBeats();
      if (formula) root.removeChild(formula);
      formula = document.createElement('div');
      formula.classList.add('formula-view');

      let at = 0;
      (lines || []).forEach(function (l) {
        const d = document.createElement('div');
        d.classList.add('formula-' + (l.kind || 'step'));
        d.style.animationDelay = at + 'ms';
        if (l.parts) {
          l.parts.forEach(function (f) {
            const sp = document.createElement('span');
            sp.textContent = f.t;
            // held back at low contrast until its moment, never reflowing
            if (f.lit) sp.classList.add('lit-' + f.lit, 'wait');
            d.appendChild(sp);
          });
        } else {
          d.textContent = l.text;
        }
        formula.appendChild(d);
        at += LINE_MS;

        (l.parts || []).forEach(function (f, k) {
          if (!f.lit) return;
          const sp = d.children[k], which = f.lit;
          beats.push(setTimeout(function () {
            sp.classList.remove('wait');
            sp.classList.add('now');
            if (onBeat) onBeat(which);
          }, at));
          at += BEAT_MS;
        });
      });

      root.appendChild(formula);
      return at;
    }

    function hideFormula() {
      clearBeats();
      if (formula) { root.removeChild(formula); formula = null; }
      buttons.forEach(function (b) { b.classList.remove('hidden'); });
    }

    parent.appendChild(root);

    return {
      el: root,
      showFormula: showFormula,
      formulaMs: formulaMs,
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
