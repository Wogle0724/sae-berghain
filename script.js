// ==== Party text & timings ====
const lines = [
  "ΣΑΕ Berghain",
  "September 19th",
  "Doors Open 10:30",
  "Black Attire Mandatory",
  "SPREAD THE WORD"
];
const initialDelayMs = 500;
const charDelayMs = 28;
const linePauseMs = 350;
const destroySeconds = 99; // long countdown
// ==============================

const byId = (id) => document.getElementById(id);

// Blink caret only on the most recently finished line
let lastCursorEl = null;
function setCursor(el) {
  if (lastCursorEl) lastCursorEl.classList.remove("cursor");
  el.classList.add("cursor");
  lastCursorEl = el;
}

// Split line into normal + gold parts (ΣΑΕ or SAE)
function tokenizeText(text) {
  const regex = /(ΣΑΕ|SAE)/gi;
  const parts = [];
  let lastIndex = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push({ text: text.slice(lastIndex, m.index), gold: false });
    parts.push({ text: m[0], gold: true });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex), gold: false });
  return parts;
}

// Measure final height up-front so the center never shifts
function reservePanelHeight() {
  const panel = document.querySelector(".panel");
  const sample = document.createElement("p");
  sample.className = "line";
  sample.style.visibility = "hidden";
  sample.style.position = "absolute";
  sample.innerHTML = '<span class="type">Sample</span>';
  panel.appendChild(sample);

  const cs = getComputedStyle(sample);
  const lh = sample.getBoundingClientRect().height;
  const gap = parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
  panel.removeChild(sample);

  const total = lines.length + 1; // + countdown line
  const reserved = total * lh + (total - 1) * gap;
  panel.style.minHeight = `${reserved}px`;
}

// Scale the entire panel to fit width & height (no wrapping, no overflow)
function fitPanelScale() {
  const wrap  = document.querySelector(".wrap");
  const panel = document.querySelector(".panel");
  if (!wrap || !panel) return;

  panel.style.setProperty("--zoom", 1); // reset scale before measuring

  const availW = panel.clientWidth;
  const availH = wrap.clientHeight;

  const needW = panel.scrollWidth;
  const needH = panel.scrollHeight;

  const scaleW = availW > 0 ? Math.min(1, availW / needW) : 1;
  const scaleH = availH > 0 ? Math.min(1, availH / needH) : 1;
  const scale  = Math.min(scaleW, scaleH);

  panel.style.setProperty("--zoom", String(scale));
}

// Type a line with live ΣΑΕ gold and scale the whole panel as we go
async function typeInto(el, text, speed) {
  el.classList.remove("cursor");
  el.innerHTML = "";

  const parts = tokenizeText(text);
  for (const part of parts) {
    if (part.gold) {
      const span = document.createElement("span");
      span.classList.add("gold");
      el.appendChild(span);
      for (let i = 0; i < part.text.length; i++) {
        span.textContent += part.text[i];
        fitPanelScale();
        await new Promise((r) => setTimeout(r, speed));
      }
    } else {
      for (let i = 0; i < part.text.length; i++) {
        el.innerHTML += part.text[i];
        fitPanelScale();
        await new Promise((r) => setTimeout(r, speed));
      }
    }
  }

  setCursor(el);
}

async function sequence() {
  await new Promise((r) => setTimeout(r, initialDelayMs));

  for (let i = 0; i < lines.length; i++) {
    const el = byId("l" + i);
    el.closest(".line").classList.add("show");
    await typeInto(el, lines[i], charDelayMs);
    await new Promise((r) => setTimeout(r, linePauseMs));
  }

  startCountdown();
}

function startCountdown() {
  const destroyLine = byId("destroy");          // <p.line.countdown>
  const numEl       = byId("t");                // <span id="t" class="count-num">

  destroyLine.style.visibility = "visible";
  requestAnimationFrame(() => {
    destroyLine.classList.add("show");          // fade in like the other lines
    fitPanelScale();                            // include this full line in scaling
  });

  let t = destroySeconds;
  numEl.textContent = t;
  const tick = setInterval(() => {
    t -= 1;
    numEl.textContent = t;
    fitPanelScale();                            // keep whole line (text + number) fitting
    if (t <= 0) { clearInterval(tick); obliterate(); }
  }, 1000);
}


function obliterate() {
  const b = byId("blackout");
  b.classList.add("show");
  setTimeout(() => {
    document.body.innerHTML = "";
    document.body.style.background = "#000";
  }, 900);
}

// ===== Boot =====
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
reservePanelHeight();
fitPanelScale();

if (prefersReduced) {
  for (let i = 0; i < lines.length; i++) {
    const el = byId("l" + i);
    el.closest(".line").classList.add("show");
    el.innerHTML = lines[i].replace(/(ΣΑΕ|SAE)/gi, '<span class="gold">$1</span>');
  }
  setCursor(byId("l" + (lines.length - 1)));
  startCountdown();
  fitPanelScale();
} else {
  sequence();
}

// Refit on viewport changes (e.g., rotation, mobile chrome collapse)
let _rf;
window.addEventListener("resize", () => {
  clearTimeout(_rf);
  _rf = setTimeout(fitPanelScale, 150);
});

// Quick reset while testing (press R)
window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === "r") window.location.reload();
});
