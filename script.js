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
const destroySeconds = 20; // set what you want

// ---- Date glitch (keep "September  ??", pulse numbers briefly) ----
const DATE_LINE_INDEX = 1; // lines[1]
const DATE_GLITCH = {
  base: "September ",
  choices: [11, 18, 19, 20],
  blinkMinMs: 60,     // how long the number shows
  blinkMaxMs: 100,
  gapMinMs: 200,      // time between pulses
  gapMaxMs: 1000
};
// ==============================

const byId = (id) => document.getElementById(id);

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function injectGlitchStyles() {
  if (document.getElementById("glitchStyles")) return;
  const style = document.createElement("style");
  style.id = "glitchStyles";
  style.textContent = `
    .glitch-num{
      display:inline-block;
      min-width:2ch;              /* stable width for  ?? vs numbers */
      text-align:right;
      font-variant-numeric: tabular-nums;
    }
    .glitching .glitch-num{
      text-shadow: 0 0 6px rgba(106,73,142,.8), 0 0 12px rgba(106,73,142,.4);
    }
  `;
  document.head.appendChild(style);
}

function ensureGlitchSpan(el) {
  // "September <span class=glitch-num> ??</span>"
  el.innerHTML = `${DATE_GLITCH.base}<span class="glitch-num"> ??</span>`;
  fitPanelScale();
  return el.querySelector(".glitch-num");
}

// Start continuous pulse glitch; returns a stopper { stop() {} } if you need it later.
function startDateGlitch(el) {
  injectGlitchStyles();
  const numSpan = ensureGlitchSpan(el);

  let running = true;
  (async () => {
    while (running) {
      await sleep(randInt(DATE_GLITCH.gapMinMs, DATE_GLITCH.gapMaxMs));
      if (!running) break;

      const choice = DATE_GLITCH.choices[Math.floor(Math.random() * DATE_GLITCH.choices.length)];
      el.classList.add("glitching");
      numSpan.textContent = String(choice);
      fitPanelScale();

      await sleep(randInt(DATE_GLITCH.blinkMinMs, DATE_GLITCH.blinkMaxMs));

      numSpan.textContent = " ??";
      el.classList.remove("glitching");
      fitPanelScale();
    }
  })();

  return { stop() { running = false; } };
}

// ---- One-time view: purple ΣAE only ----
function showSigmaOnly() {
  document.body.style.background = "#000";
  document.body.classList.remove("vignette");

  const wrap = document.querySelector(".wrap");
  if (wrap) wrap.style.display = "none";

  let overlay = document.getElementById("sigmaOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "sigmaOverlay";
    overlay.style.cssText = `
      position: fixed; inset: 0; display: grid; place-items: center; 
      background: #000; z-index: 9999;
    `;
    const logo = document.createElement("div");
    logo.textContent = "ΣΑΕ";
    logo.style.cssText = `
      color:#6a498e; font-weight:700;
      font-family:"Share Tech Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: clamp(3rem, 14vw, 12rem); letter-spacing:.05em;
    `;
    overlay.appendChild(logo);
    document.body.appendChild(overlay);
  }
}

// If already viewed on this browser, show mark and try to start music, then bail out.
if (localStorage.getItem(SEEN_KEY)) {
  autoplayBgmHard();   // <- force autoplay (muted first), then unmute+fade in
  showSigmaOnly();
  throw new Error("SAE: already viewed; showing mark only");
}

// ===== Password gate additions =====
const PASSWORD_SHA256_HEX = "b50d427a71ef5f98a1bdd4335b71d381dc6a3e937d899f87b92af24121bb9579"; // sha256("919")

async function sha256Hex(str) {
  const buf = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function passwordMatches(input) {
  const hex = await sha256Hex(input);
  return hex === PASSWORD_SHA256_HEX;
}

function ensureGateDom() {
  if (byId("gate")) return;

  const gate = document.createElement("div");
  gate.id = "gate";
  gate.setAttribute("role", "dialog");
  gate.setAttribute("aria-modal", "true");
  gate.style.cssText = `
    position:fixed;inset:0;display:grid;place-items:center;
    background:rgba(0,0,0,0.92);backdrop-filter:blur(2px);
    transition:opacity 400ms ease, visibility 400ms ease;
    opacity:1;visibility:visible;z-index:9999;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    width:min(90vw,480px);background:#0a0a0a;border:1px solid #1f1f1f;
    border-radius:16px;padding:28px 24px;box-shadow:0 10px 30px rgba(0,0,0,.6);
    text-align:center;color:#e8e8e8;font-family:'Share Tech Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  `;

  const label = document.createElement("label");
  label.setAttribute("for", "pw");
  label.textContent = "Enter Password:";
  label.style.cssText = `display:block;font-size:1.1rem;letter-spacing:.08em;margin-bottom:14px;`;

  const input = document.createElement("input");
  input.id = "pw";
  input.type = "password";
  input.autocomplete = "off";
  input.style.cssText = `
    width:100%;padding:14px 16px;border-radius:12px;border:1px solid #262626;
    background:#0d0d0d;color:#e8e8e8;outline:none;font-size:1rem;
  `;

  const btn = document.createElement("button");
  btn.id = "pwBtn";
  btn.type = "button";
  btn.textContent = "Unlock";
  btn.style.cssText = `
    margin-top:14px;width:100%;padding:12px 16px;border-radius:12px;border:1px solid #6a498e;
    background:#6a498e;color:#fff;font-weight:600;letter-spacing:.05em;cursor:pointer;
  `;

  const err = document.createElement("p");
  err.id = "pwErr";
  err.setAttribute("aria-live", "polite");
  err.style.cssText = `height:1.4em;margin-top:10px;color:#c23;font-size:.95rem;`;

  card.appendChild(label);
  card.appendChild(input);
  card.appendChild(btn);
  card.appendChild(err);
  gate.appendChild(card);
  document.body.appendChild(gate);
}

function showGate() {
  ensureGateDom();

  const gate = byId("gate");
  const input = byId("pw");
  const btn = byId("pwBtn");
  const err = byId("pwErr");
  const panel = document.querySelector(".panel");

  // Hide the panel until we unlock
  if (panel) {
    panel.style.opacity = "0";
    panel.style.transition = "opacity 400ms ease";
  }

  const unlock = async () => {
    err.textContent = "";
    const ok = await passwordMatches(input.value || "");
    if (!ok) {
      err.textContent = "Incorrect password.";
      input.select();
      return;
    }

    gate.style.opacity = "0";
    gate.style.visibility = "hidden";
    setTimeout(() => {
      if (panel) panel.style.opacity = "1";
      playBgm();        // start music after unlock (user gesture -> allowed)
      bootAfterUnlock();
      gate.remove();
    }, 280);
  };

  btn.addEventListener("click", unlock);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") unlock(); });

  setTimeout(() => input.focus(), 0);
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
  if (!panel) return;
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
  const prevOverflow = panel.style.overflow;
  panel.style.overflow = "visible";

  const types = [...panel.querySelectorAll(".type")];
  const needW = types.length  ? Math.max(...types.map(el => el.scrollWidth)) : panel.scrollWidth;
  const needH = panel.scrollHeight;

  const availW = panel.clientWidth;
  const availH = wrap.clientHeight;

  const scaleW = availW > 0  ? Math.min(1, availW / needW) : 1;
  const scaleH = availH > 0  ? Math.min(1, availH / needH) : 1;
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

    if (i === DATE_LINE_INDEX) {
      // Type "September  ??" once, then keep pulsing numbers and returning to " ??"
      await typeInto(el, `${DATE_GLITCH.base} ??`, charDelayMs);
      startDateGlitch(el);
    } else {
      await typeInto(el, lines[i], charDelayMs);
    }

    await new Promise(r => setTimeout(r, linePauseMs));
  }
  startCountdown();
}

function startCountdown() {
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
  try { localStorage.setItem(SEEN_KEY, String(Date.now())); } catch {}
  const b = byId("blackout");
  if (b) {
    b.classList.add("show");
    setTimeout(showSigmaOnly, 900);
  } else {
    showSigmaOnly();
  }
  // Do NOT stop music here; it should keep playing on the ΣAE overlay.
}

// ---- Boot AFTER unlock (runs your original animation) ----
function bootAfterUnlock() {
  reservePanelHeight();
  fitPanelScale();

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    for (let i = 0; i < lines.length; i++) {
      const el = byId("l" + i);
      el.closest(".line").classList.add("show");
      el.innerHTML = lines[i].replace(/(ΣΑΕ|SAE)/gi, '<span class="gold">$1</span>');
      if (i === DATE_LINE_INDEX) {
        // show plain "September  ??" without animation for reduced motion
        el.innerHTML = `${DATE_GLITCH.base} ??`;
      }
    }
    setCursor(byId("l" + (lines.length - 1)));
    startCountdown();
    fitPanelScale();
  } else {
    sequence();
  }
}

// ===== Initial boot (now gated) =====
(function init() {
  // If already "seen", we already bailed above.

  // Show password gate and wait for unlock
  showGate();

  // Refit on viewport changes
  let _rf;
  window.addEventListener("resize", () => {
    clearTimeout(_rf);
    _rf = setTimeout(fitPanelScale, 150);
  });

  // (Optional) developer reset: Shift+D to clear one-time view
  window.addEventListener("keydown", (e) => {
    if (e.shiftKey && e.key.toLowerCase() === "d") {
      localStorage.removeItem(SEEN_KEY);
      location.reload();
    }
  });
})();

// === Background music (auto-play on reload; no UI) ===
function ensureBgm() {
  let a = document.getElementById("bgm");
  if (!a) {
    a = document.createElement("audio");
    a.id = "bgm";
    a.src = "./berghain.mp3";   // change path if needed
    a.loop = true;
    a.preload = "auto";
    a.autoplay = true;
    a.setAttribute("playsinline", "true");
    document.body.appendChild(a);
  }
  return a;
}

function fadeAudio(audio, target = 0.35, ms = 800) {
  const steps = 24, dt = ms / steps;
  const start = audio.volume || 0;
  let i = 0;
  clearInterval(audio.__fadeId);
  audio.__fadeId = setInterval(() => {
    i++;
    audio.volume = start + (target - start) * (i / steps);
    if (i >= steps) clearInterval(audio.__fadeId);
  }, dt);
}

/**
 * Autoplay strategy that works on most browsers without user gesture:
 * 1) try play; 2) when 'playing' fires, fade in (unmute if you set muted elsewhere)
 * Re-tries a few times during load.
 */
function autoplayBgmHard() {
  const a = ensureBgm();
  a.currentTime = 0;    // restart on each load

  const tryPlay = () => a.play().catch(() => {});
  tryPlay();
  const retries = [150, 400, 800, 1200, 1800];
  retries.forEach(t => setTimeout(tryPlay, t));

  const onPlaying = () => {
    setTimeout(() => {
      fadeAudio(a, 0.35, 900);
    }, 200);
    a.removeEventListener("playing", onPlaying);
  };
  a.addEventListener("playing", onPlaying);

  a.addEventListener("canplay", tryPlay, { once: true });
  window.addEventListener("pageshow", () => { tryPlay(); }, { once: true });
}

// Keep your existing playBgm() for the post-unlock (gesture) path if you want:
async function playBgm() {
  const a = ensureBgm();
  try {
    a.currentTime = 0;
    await a.play();            // allowed due to the unlock gesture
    fadeAudio(a, 0.35, 800);
  } catch {}
}

//localStorage.removeItem("sae_once_seen_v1");
