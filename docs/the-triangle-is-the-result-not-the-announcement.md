# Build prompt — the triangle is the result, not the announcement

A child currently arrives at the right triangle by being shown it. She
says "But look at A and C", a point called C is already there, and the
two legs get measured because the screen asks for them. The triangle is
announced and then confirmed.

This rewrites that stretch so the triangle is **arrived at**. She
notices the problem, wonders aloud, tries something, and the triangle is
what is left on the board when the child has finished measuring. The
last line lands as a result rather than as an instruction, which is the
whole point of the change.

**Nothing about the board's drawing changes.** Same pair, same C, same
two legs, same two questions, same answers. What changes is the order
the words arrive in, what is lit while each is said, and where one beat
ends and the next begins.

---

## 0. What is there now

Four screens, in script order. Ids are labels, not positions — the
script already skips 21, 23 and 27, so nothing here needs renumbering.

```
   22   "But what if two points are like this?"
        "Our earlier way won't work this time."
        A(2,1) B(6,4) drawn.  pulse: the whole triangle.

   24   "But look at A and C."
        "Can you find AC?"
        C(6,1) is already on the board, the AC leg dashed.
        task: distance, measureLeg 0.   intro: 'measure'.

   25   "Great! Now find CB."
        AC settled with its length; CB drawn.
        task: distance, measureLeg 1.   focus: 'h'.

   26   "What kind of triangle is this?"
        Both legs with their lengths.  task: choice, right-angled.
```

C exists before anybody wonders where it came from, and the words
"Look! We made a triangle" are gone — they were on 26 once and were
replaced by the question.

---

## 1. The sequence to build

Seven spoken moments. The bracketed lines are what the board does, not
what she says.

```
   1.  "But these two aren't."
       [AB lit. The two rows and columns from the screen before are
        gone; this pair is the only thing on the paper.]

   2.  "How can we find the distance between these two?"
       [Nothing moves. This is the question the whole lesson answers,
        and it is allowed to sit.]

   3.  "Let's explore."
       [C appears at (6,1). A and C light.]

   4.  "Hmm… what about A and C?"
       [AC lit — the side, not the pair of dots.]

   5.  "We know how to find this distance."
       [The child measures AC. It comes out 4.]

   6.  "Now find the distance from C to B."
       [C and B light first, then CB. The child measures it. 3.]

   7.  "Look! We made a triangle."
       [AC and CB stay exactly as the child left them, with their
        lengths. AB comes back to full strength. The whole shape is
        on the board at once, for the first time.]
```

Then screen 26 asks what kind of triangle it is, unchanged.

### Why each beat is where it is

- **1 and 2 are two sentences, not one.** "These two aren't" is an
  observation; "how can we find the distance" is a question. Run
  together they become one shrug. Apart, the second is the thing the
  rest of the lesson is answering.
- **2 holds.** Give it a real pause — `hold` on the beat, or a beat of
  its own — before "Let's explore." A question that is answered in the
  same breath was not a question.
- **3 is where C arrives**, and it arrives *because* she said she would
  explore. C appearing before anyone has wondered is the current fault.
- **4 is a guess, not an instruction.** "Hmm… what about A and C?" is
  her trying something. The child is watching someone think.
- **5 hands over.** "We know how to find this distance" is true — they
  measured rows and columns three screens ago — and it is the reason
  this is askable.
- **7 is a result.** It must come *after* the second measurement and
  before the question on 26, and nothing may move on the board except
  AB coming back up.

---

## 2. What is lit, and with what

The board already has everything this needs. Use it; do not add a
second way to light a side.

| beat | what lights | the call |
|---|---|---|
| 1 | the pair AB | `spotlightPart('ab')` |
| 3 | the dots A and C | `pulsePoints`, keys `['a','c']` |
| 4 | the side AC | `spotlightPart('h')` |
| 6 | the dots C and B, then the side | `pulsePoints ['c','b']`, then `spotlightPart('v')` |
| 7 | AB forward, legs kept | `spotlightPart('ab')` after the legs are settled |

`spotlightPart(which)` lights one whole side — its stroke, the length
written on it, and the two corners it runs between — and hushes
everything else. `pulsePoints` lights named dots and nothing between
them, which is exactly right for beat 3: the line from A to C is the
*next* sentence, and lighting it early answers the question before it
is asked.

In config these hang off the line that says them:

```js
lineLights: [ { pulse: 'ab' },          // "But these two aren't."
              {},                        // the question: nothing moves
              { points: ['a', 'c'] } ]   // "Let's explore."
```

`lightAfterLine` runs the entry for line *n* when line *n* finishes, so
a light never lands under the wrong sentence.

---

## 3. Three sentences on one screen

Beats 1–3 belong together: one board, one arrival, three sentences.
A screen currently supports `line` and `line2` and no more.

The plumbing already exists. `sayLines(list, then, each)` says any
number of lines, waits for each one's light to finish before starting
the next, and calls `each(i)` per line — it is what the `derive`
screens use. It is simply not reachable from an ordinary screen.

**Give an ordinary screen a `lines: []` array routed through
`sayLines`, with `lineLights` indexed to match.** Keep `line` and
`line2` working exactly as they do — every other screen uses them.

If that is more than this change should carry, split beats 1–2 from
beat 3 into two screens instead. Do not fake a third sentence by
appending it to `line2`: the beats need their own lights and their own
pauses, and a line that is really two lines cannot have either.

---

## 4. C has to arrive

On beat 3, C is drawn for the first time. Today it is simply present.

The leg spec already carries what is needed: `mark: { name: 'C' }` puts
the labelled corner at the leg's far end, and `dash: true` lays the
side down as a guide rather than as a measured line. What must change
is *when* — C and its dashed guide belong to the sentence "Let's
explore", not to the screen's arrival.

`wordCues` is the nearest existing mechanism — it fires on a word as the
balloon puts it up, and screen 20 uses it to draw a pair on
"horizontally". A leg is not a recalled pair, so either extend the same
idea (`{ word: 'explore', leg: 0 }`) or hang it on `lineLights` for
that line. Either is fine; a third way of drawing a leg is not.

---

## 5. Her voice

Six of the seven lines have no recording, and the game is used to that
— 39 of its 53 spoken lines already fall back to the per-word notes.
So this costs almost nothing. But two things are worth knowing:

- **"Look! We made a triangle." IS recorded.** `16-look-we-made-a-triangle.mp3`,
  2.19s, keyed on exactly those words. It has been sitting unused since
  that line was taken off screen 26. Writing beat 7 with exactly this
  wording — "Look! We made a triangle." — **gives her voice back for
  free.** Any other phrasing throws the clip away.

- **"What kind of triangle is it?" is also recorded** and also unused,
  because screen 26 says "…is this?". Outside this change, but if 26
  ever goes back to "it", that clip returns too.

`Voice.MAP` is keyed on the line's exact text, so a line that changes
its words stops matching. Leave orphaned entries in the map with a
note; the clips still exist and the key is what would hook them back
up.

---

## 6. What must not change

- The board: A(2,1), B(6,4), C(6,1), AC = 4, CB = 3.
- Both questions: `kind: 'distance'`, `measureLeg` 0 then 1, the same
  answers, the same counting fallback after a wrong guess.
- Screen 26 and everything after it.
- `line` / `line2` on every other screen.
- The measuring line's own behaviour: out, held, and faded where it
  stands on a wrong guess.

---

## 7. How to know it is right

Measured on the running page, not looked at.

1. **Nothing is on the board when she starts.** At the first frame of
   beat 1, the pair is drawn and C is not.
2. **The question sits.** The gap between the end of "How can we find
   the distance between these two?" and the start of "Let's explore."
   is at least 800ms.
3. **C arrives with the word.** C's dot is not on the board before
   "Let's explore." begins, and is on it before that line's balloon
   closes.
4. **Each light lands under its own sentence.** While line *n* is being
   said, the lit side is the one that line names — AB on 1, nothing new
   on 2, A and C as dots on 3, AC as a side on 4.
5. **The lit thing on beat 3 is two dots, not a line.** The AC stroke
   is still hushed while A and C are lit.
6. **Both measurements still work.** AC answers 4, CB answers 3, a
   wrong guess still walks out, holds and fades.
7. **Beat 7 adds nothing and removes nothing.** Between the frame
   before "Look! We made a triangle." and the frame after it settles,
   AC and CB are at the same coordinates with the same lengths written
   on them; only AB's opacity has changed.
8. **She says it in her own voice.** `Voice.MAP` resolves
   "Look! We made a triangle." to a clip, and it plays.
9. **The walk is clean.** Every screen, answering each number wrong
   once before right: 0 exceptions, and no screen left with a
   measuring line half-faded.
