// ---- Edit your party details here ----
const lines = [
    "ΣΑΕ Berghain",
    "September 19th",
    "Doors Open 10:30",
    "Black Attire Mandatory ",
    "SPREAD THE WORD"
  ];
  const initialDelayMs = 500;
  const charDelayMs = 28;
  const linePauseMs = 350;
  const destroySeconds = 10;
  // --------------------------------------
  
  const byId = (id) => document.getElementById(id);
  
  // Keep the blinking cursor only on the most recently finished line
  let lastCursorEl = null;
  function setCursor(el) {
    if (lastCursorEl) lastCursorEl.classList.remove("cursor");
    el.classList.add("cursor");
    lastCursorEl = el;
  }
  
  // Tokenize a string into plain + gold segments
  function tokenizeText(text) {
    // Match ΣΑΕ or SAE (case-insensitive)
    const regex = /(ΣΑΕ|SAE)/gi;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), gold: false });
      }
      parts.push({ text: match[0], gold: true });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), gold: false });
    }
    return parts;
  }
  
  async function typeInto(el, text, speed) {
    el.classList.remove("cursor");
    el.innerHTML = "";
  
    const parts = tokenizeText(text);
  
    for (const part of parts) {
      if (part.gold) {
        // Type gold letters one by one inside a span
        const span = document.createElement("span");
        span.classList.add("gold");
        el.appendChild(span);
        for (let i = 0; i < part.text.length; i++) {
          span.textContent += part.text[i];
          await new Promise((r) => setTimeout(r, speed));
        }
      } else {
        // Type normal letters one by one
        for (let i = 0; i < part.text.length; i++) {
          el.innerHTML += part.text[i];
          await new Promise((r) => setTimeout(r, speed));
        }
      }
    }
  
    // After line is fully typed:
    setCursor(el);
  }
  
  async function sequence() {
    await new Promise((r) => setTimeout(r, initialDelayMs));
  
    for (let i = 0; i < lines.length; i++) {
      const el = byId("l" + i);
      const container = el.closest(".line");
      container.classList.add("show");
      await typeInto(el, lines[i], charDelayMs);
      await new Promise((r) => setTimeout(r, linePauseMs));
    }
  
    startCountdown();
  }
  
  function startCountdown() {
    const destroyEl = byId("destroy");
    const tEl = byId("t");
    destroyEl.style.visibility = "visible";
    requestAnimationFrame(() => destroyEl.classList.add("show"));
    let t = destroySeconds;
    tEl.textContent = t;
    const tick = setInterval(() => {
      t -= 1;
      tEl.textContent = t;
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
  function reservePanelHeight() {
    const panel = document.querySelector('.panel');
  
    // make a hidden sample line to measure true line height + margins
    const sample = document.createElement('p');
    sample.className = 'line';
    sample.style.visibility = 'hidden';
    sample.style.position = 'absolute';
    sample.innerHTML = '<span class="type">Sample</span>';
    panel.appendChild(sample);
  
    const cs = getComputedStyle(sample);
    const lh = sample.getBoundingClientRect().height;
    const gap = parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    panel.removeChild(sample);
  
    // total lines = your lines + 1 countdown line
    const total = lines.length + 1;
    const reserved = total * lh + (total - 1) * (gap || 0);
  
    panel.style.minHeight = `${reserved}px`;  // lock the center from the start
  }
  
  
  // Respect reduced motion
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  reservePanelHeight();

  if (prefersReduced) {
    for (let i = 0; i < lines.length; i++) {
      const el = byId("l" + i);
      const container = el.closest(".line");
      container.classList.add("show");
      el.innerHTML = lines[i].replace(/(ΣΑΕ|SAE)/gi, '<span class="gold">$1</span>');
    }
    setCursor(byId("l" + (lines.length - 1)));
    startCountdown();
  } else {
    sequence();
  }
  
  // Quick reset while testing (press R)
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "r") window.location.reload();
  });
  