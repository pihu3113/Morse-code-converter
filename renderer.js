// ── Morse code table ───────────────────────────────────────────
const MORSE_MAP = {
  A: '.-',    B: '-...',  C: '-.-.',  D: '-..',
  E: '.',     F: '..-.',  G: '--.',   H: '....',
  I: '..',    J: '.---',  K: '-.-',   L: '.-..',
  M: '--',    N: '-.',    O: '---',   P: '.--.',
  Q: '--.-',  R: '.-.',   S: '...',   T: '-',
  U: '..-',   V: '...-',  W: '.--',   X: '-..-',
  Y: '-.--',  Z: '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...',
  '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.', ' ': '/'
};

// Reverse map: morse → character
const REVERSE_MAP = {};
for (const [char, morse] of Object.entries(MORSE_MAP)) {
  REVERSE_MAP[morse] = char;
}

let currentMode = 'encode';
let refVisible = false;

// ── Title bar buttons ──────────────────────────────────────────
document.getElementById('btn-close').addEventListener('click', () => {
  window.electronAPI.close();
});

document.getElementById('btn-minimize').addEventListener('click', () => {
  window.electronAPI.minimize();
});

// ── Mode switching ─────────────────────────────────────────────
function setMode(mode) {
  currentMode = mode;

  document.getElementById('mode-encode').classList.toggle('active', mode === 'encode');
  document.getElementById('mode-decode').classList.toggle('active', mode === 'decode');

  const inputArea  = document.getElementById('input-area');
  const inputLabel = document.getElementById('input-label');
  const outputLabel = document.getElementById('output-label');
  const hintText   = document.getElementById('hint-text');

  if (mode === 'encode') {
    inputLabel.textContent  = 'Enter Text';
    outputLabel.textContent = 'Morse Code';
    inputArea.placeholder   = 'Type something here...';
    hintText.innerHTML      = '· = dot &nbsp; – = dash &nbsp; / = word gap';
    document.querySelector('.output-card').style.borderTopColor = 'var(--mint)';
  } else {
    inputLabel.textContent  = 'Enter Morse Code';
    outputLabel.textContent = 'Decoded Text';
    inputArea.placeholder   = 'e.g. .... . .-.. .-.. --- / .-- --- .-. .-.. -..';
    hintText.innerHTML      = 'Use spaces between letters, / between words';
    document.querySelector('.output-card').style.borderTopColor = 'var(--peach)';
    document.getElementById('output-area').style.background = 'var(--peach-light)';
    document.getElementById('output-area').style.borderColor = 'var(--peach)';
  }

  inputArea.value = '';
  resetOutput();
  updateCharCount(0);
}

// ── Convert ────────────────────────────────────────────────────
function convert() {
  const input = document.getElementById('input-area').value;
  updateCharCount(input.length);

  if (!input.trim()) {
    resetOutput();
    return;
  }

  if (currentMode === 'encode') {
    encodeToMorse(input);
  } else {
    decodeFromMorse(input);
  }
}

function encodeToMorse(text) {
  const outputEl = document.getElementById('output-area');
  const words = text.toUpperCase().split(' ');
  const result = words
    .map(word =>
      word.split('').map(char => MORSE_MAP[char] || '?').join(' ')
    )
    .join(' / ');

  outputEl.classList.remove('error');
  outputEl.style.background = 'var(--mint-light)';
  outputEl.style.borderColor = 'var(--mint)';
  outputEl.textContent = result;
}

function decodeFromMorse(morse) {
  const outputEl = document.getElementById('output-area');
  const words = morse.trim().split(/\s*\/\s*/);

  try {
    const result = words
      .map(word => {
        if (!word.trim()) return '';
        return word.trim().split(/\s+/).map(code => {
          const char = REVERSE_MAP[code];
          if (char === undefined) throw new Error(`Unknown code: ${code}`);
          return char;
        }).join('');
      })
      .join(' ');

    outputEl.classList.remove('error');
    outputEl.style.background = 'var(--peach-light)';
    outputEl.style.borderColor = 'var(--peach)';
    outputEl.style.fontFamily = "'Segoe UI', system-ui, sans-serif";
    outputEl.style.fontSize = '17px';
    outputEl.style.letterSpacing = '0';
    outputEl.textContent = result;
  } catch (e) {
    outputEl.classList.add('error');
    outputEl.textContent = `Invalid morse code: ${e.message}`;
  }
}

function resetOutput() {
  const outputEl = document.getElementById('output-area');
  outputEl.classList.remove('error');
  outputEl.style.background = currentMode === 'encode' ? 'var(--mint-light)' : 'var(--peach-light)';
  outputEl.style.borderColor = currentMode === 'encode' ? 'var(--mint)' : 'var(--peach)';
  outputEl.style.fontFamily = "'Courier New', monospace";
  outputEl.style.fontSize = '17px';
  outputEl.style.letterSpacing = '0.06em';
  outputEl.innerHTML = '<span class="placeholder-text">Output will appear here...</span>';
}

function updateCharCount(n) {
  document.getElementById('char-count').textContent =
    `${n} character${n !== 1 ? 's' : ''}`;
}

// ── Clear ──────────────────────────────────────────────────────
function clearInput() {
  document.getElementById('input-area').value = '';
  resetOutput();
  updateCharCount(0);
}

// ── Copy ───────────────────────────────────────────────────────
function copyOutput() {
  const outputEl = document.getElementById('output-area');
  const text = outputEl.textContent;
  if (!text || text === 'Output will appear here...') return;

  navigator.clipboard.writeText(text).then(() => {
    const label = document.getElementById('copy-label');
    label.textContent = '✓ Copied!';
    setTimeout(() => { label.textContent = '⎘ Copy'; }, 1800);
  });
}

// ── Reference table ────────────────────────────────────────────
function toggleRef() {
  refVisible = !refVisible;
  const panel = document.getElementById('ref-panel');
  const label = document.getElementById('ref-toggle-label');

  if (refVisible) {
    panel.style.display = 'block';
    label.textContent = '▲ Hide Morse Reference';
    buildRefGrid();
  } else {
    panel.style.display = 'none';
    label.textContent = '▼ Show Morse Reference';
  }
}

function buildRefGrid() {
  const grid = document.getElementById('ref-grid');
  if (grid.children.length > 0) return; // already built

  const entries = Object.entries(MORSE_MAP).filter(([c]) => c !== ' ');
  entries.forEach(([char, morse]) => {
    const item = document.createElement('div');
    item.className = 'ref-item';
    item.innerHTML = `
      <span class="ref-char">${char === '.' ? '.' : char}</span>
      <span class="ref-morse">${morse}</span>
    `;
    item.title = `Click to insert "${char}"`;
    item.addEventListener('click', () => insertChar(char));
    grid.appendChild(item);
  });
}

function insertChar(char) {
  const input = document.getElementById('input-area');
  if (currentMode === 'encode') {
    input.value += char;
  } else {
    const morse = MORSE_MAP[char.toUpperCase()];
    if (morse) {
      const val = input.value;
      input.value = val ? val + ' ' + morse : morse;
    }
  }
  convert();
  input.focus();
}

// ── Init ───────────────────────────────────────────────────────
resetOutput();
