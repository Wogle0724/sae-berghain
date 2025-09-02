// ==== One-time view key ====
const SEEN_KEY = "sae_once_seen_v1";

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
const destroySeconds = 10; // set what you want
// ==============================

const byId = (id) => document.getElementById(id);

// ---- One-time view: purple ΣAE only ----
function showSigmaOnly() {
  // nuke timers if any
  try { window.stop(); } catch {}
  document.body.className = ""; // remove vignette if you want
  document.body.innerHTML = `
    <div class="sigma-only">
      <div class="logo">ΣΑΕ</div>
    </div>
  `;
  // harden: background stays black
  document.body.style.background = "#000";
}

// If already viewed on this browser, show mark and bail out.
if (localStorage.getItem(SEEN_KEY)) {
  showSigmaOnly();
  // prevent the rest of the script from running
  throw new Error("SAE: already viewed; showing mark only");
}

// ====== caret handling ======
let lastCursorEl = null;
function setCursor(el) {
  if (lastCursorEl) lastCursorEl.classList.remove("cursor");
  el.classList.add("cursor");
  lastCursorEl = el;
}

// ΣΑΕ/SAE tokenizer (gold while typing)
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

// Reserve final height so center doesn't shift
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

// Scale the entire panel (keeps all lines inside, no wrap)
function fitPanelScale() {
  const wrap  = document.querySelector(".wrap");
  const panel = document.querySelector(".panel");
  if (!wrap || !panel) return;

  panel.style.setProperty("--zoom", 1);

  // ensure we measure widest line, not clipped box
  const prevOverflow = panel.style.overflow;
  panel.style.overflow = "visible";

  const types = [...panel.querySelectorAll(".type")];
  const needW = types.length ? Math.max(...types.map(el => el.scrollWidth)) : panel.scrollWidth;
  const needH = panel.scrollHeight;

  const availW = panel.clientWidth;
  const availH = wrap.clientHeight;

  const scaleW = availW > 0 ? Math.min(1, availW / needW) : 1;
  const scaleH = availH > 0 ? Math.min(1, availH / needH) : 1;
  const scale  = Math.min(scaleW, scaleH);

  panel.style.setProperty("--zoom", String(scale));
  panel.style.overflow = prevOverflow;
}

// Type with live gold ΣΑΕ and scale panel as we go
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
        await new Promise(r => setTimeout(r, speed));
      }
    } else {
      for (let i = 0; i < part.text.length; i++) {
        el.innerHTML += part.text[i];
        fitPanelScale();
        await new Promise(r => setTimeout(r, speed));
      }
    }
  }
  setCursor(el);
}

async function sequence() {
  await new Promise(r => setTimeout(r, initialDelayMs));
  for (let i = 0; i < lines.length; i++) {
    const el = byId("l" + i);
    el.closest(".line").classList.add("show");
    await typeInto(el, lines[i], charDelayMs);
    await new Promise(r => setTimeout(r, linePauseMs));
  }
  startCountdown();
}

function startCountdown() {
  // Countdown line HTML should be:
  // <p class="line countdown" id="destroy" style="visibility:hidden;">
  //   <span class="type" id="destroyType">
  //     THIS MESSAGE WILL BE DESTROYED IN <span id="t" class="count-num">10</span>
  //   </span>
  // </p>
  const destroyLine = byId("destroy");
  const numEl = byId("t");

  destroyLine.style.visibility = "visible";
  requestAnimationFrame(() => {
    destroyLine.classList.add("show");
    fitPanelScale();
  });

  let t = destroySeconds;
  numEl.textContent = t;
  const tick = setInterval(() => {
    t -= 1;
    numEl.textContent = t;
    fitPanelScale();
    if (t <= 0) { clearInterval(tick); obliterate(); }
  }, 1000);
}

function obliterate() {
  // mark as seen so next visit shows only ΣAE
  try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch {}

  const b = byId("blackout");
  b.classList.add("show");
  setTimeout(showSigmaOnly, 900);
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

// Refit on viewport changes
let _rf;
window.addEventListener("resize", () => {
  clearTimeout(_rf);
  _rf = setTimeout(fitPanelScale, 150);
});

// (Optional) developer reset: press Shift+D to clear one-time view
window.addEventListener("keydown", (e) => {
  if (e.shiftKey && e.key.toLowerCase() === "d") {
    localStorage.removeItem(SEEN_KEY);
    location.reload();
  }
});


