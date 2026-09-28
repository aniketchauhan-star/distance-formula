/* The speech balloon's one helper (css/speech-bubble.css): put a line
   of text into it, as plain text. The game itself speaks through
   Bubble.open() in game.js, which lays the words out one at a time in
   step with her voice; this is for anything else that wants to use the
   balloon. */
function setSpeechBubbleText(message) {
  const element = document.querySelector('.game-speech-bubble__text');
  if (element) {
    element.textContent = message;
  }
}
