const CFG = window.SANTA_CONFIG;
const NAMES = CFG.names;
const $ = (id) => document.getElementById(id);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const LS_KEY = "santa-mine-v1";

/* ============================================================
   STORAGE — Firebase if configured, otherwise local demo mode.
   Only two sets are stored: who HAS drawn, and which names are
   TAKEN. Never who drew whom, so the organizer can't peek.
   ============================================================ */

// Is the state still completable? With n >= 2 names left it always is;
// it only breaks when the last person left is the last name left.
function feasible(givers, recips) {
  return !(givers.length === 1 && recips.length === 1 && givers[0] === recips[0]);
}

function chooseRecipient(state, me) {
  const drawn = state.drawn || {}, taken = state.taken || {};
  if (drawn[me]) throw new Error("already");
  const giversLeft = NAMES.filter((n) => !drawn[n] && n !== me);
  const options = NAMES.filter((n) => n !== me && !taken[n]).filter((c) =>
    feasible(giversLeft, NAMES.filter((n) => !taken[n] && n !== c))
  );
  if (!options.length) throw new Error("stuck");
  return pick(options);
}

function emptyState(round = 1) { return { drawn: {}, taken: {}, round }; }

function localStore() {
  const KEY = "santa-demo-state";
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || emptyState(); } catch { return emptyState(); } };
  const write = (s) => { localStorage.setItem(KEY, JSON.stringify(s)); listeners.forEach((f) => f(s)); };
  const listeners = [];
  window.addEventListener("storage", (e) => { if (e.key === KEY) listeners.forEach((f) => f(read())); });
  return {
    demo: true,
    subscribe(f) { listeners.push(f); f(read()); },
    async draw(me) {
      const s = read(); const r = chooseRecipient(s, me);
      s.drawn[me] = true; s.taken[r] = true; write(s); return { recipient: r, round: s.round };
    },
    async reset() { write(emptyState((read().round || 1) + 1)); },
  };
}

async function firebaseStore() {
  const V = "10.12.2";
  const { initializeApp } = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-app.js`);
  const fs = await import(`https://www.gstatic.com/firebasejs/${V}/firebase-firestore.js`);
  const app = initializeApp(CFG.firebase);
  const db = fs.getFirestore(app);
  const ref = fs.doc(db, "santa", "state");
  return {
    demo: false,
    subscribe(f) { fs.onSnapshot(ref, (snap) => f(snap.exists() ? snap.data() : emptyState())); },
    async draw(me) {
      return fs.runTransaction(db, async (t) => {
        const snap = await t.get(ref);
        const s = snap.exists() ? snap.data() : emptyState();
        const r = chooseRecipient(s, me);
        t.set(ref, {
          drawn: { ...(s.drawn || {}), [me]: true },
          taken: { ...(s.taken || {}), [r]: true },
          round: s.round || 1,
        });
        return { recipient: r, round: s.round || 1 };
      });
    },
    async reset() {
      await fs.runTransaction(db, async (t) => {
        const snap = await t.get(ref);
        t.set(ref, emptyState(((snap.exists() && snap.data().round) || 1) + 1));
      });
    },
  };
}

/* ============================================================
   COPY — the comedy department
   ============================================================ */
const LOADING = [
  "Consulting the elves' HR department…",
  "Bribing Rudolph with carrots…",
  "Shaking the box suspiciously…",
  "Checking the list. Checking it twice…",
  "Asking Mrs. Claus, she actually runs things…",
  "Untangling the lights…",
];
const PAST_TAG = ["drew already ✓", "already sorted ✓", "done & dusted ✓"];

/* ============================================================
   AVATARS — faces/<name>.png, then .jpg, then a cute fallback
   ============================================================ */
const COLORS = ["#e0364a", "#1f8a5b", "#d98a1c", "#3a7bd5", "#9b4fd1", "#d6457f", "#1aa6a6", "#7a5b3a"];
const faceCache = {};
function findFace(name) {
  if (faceCache[name]) return faceCache[name];
  const base = `faces/${name.toLowerCase()}`;
  const exts = [".png", ".jpg", ".jpeg", ".webp"];
  return (faceCache[name] = new Promise((resolve) => {
    let i = 0; const img = new Image();
    img.onload = () => resolve(img.src);
    img.onerror = () => (++i < exts.length ? (img.src = base + exts[i]) : resolve(null));
    img.src = base + exts[0];
  }));
}
function avatar(name, size = "") {
  const el = document.createElement("div");
  el.className = `avatar ${size}`;
  el.style.setProperty("--c", COLORS[NAMES.indexOf(name) % COLORS.length]);
  el.textContent = name[0];
  findFace(name).then((src) => {
    if (!src) return;
    const img = new Image(); img.alt = name; img.src = src;
    el.textContent = ""; el.classList.add("photo"); el.appendChild(img);
  });
  return el;
}

/* ============================================================
   SOUND — the song plays on the welcome screen only; the reveal
   sound plays on every reveal, even if the song was muted.
   ============================================================ */
const sound = (() => {
  let muted = false, onHome = true, primed = false;
  const song = Object.assign(new Audio(CFG.customAudio), { loop: true, volume: 0.55, preload: "auto" });
  const sfx = Object.assign(new Audio(CFG.revealSound), { preload: "auto", volume: 1 });

  function playSong() {
    if (muted || !onHome || !CFG.customAudio) return;
    if (song.paused) song.play().catch(() => {}); // blocked until the first tap on most phones
  }
  // Phones only let a page play sound after a tap. The reveal happens a few
  // seconds after the tap, so unlock the sound effect silently on the first tap.
  function prime() {
    if (primed || !CFG.revealSound) return; primed = true;
    sfx.muted = true;
    sfx.play().then(() => { sfx.pause(); sfx.currentTime = 0; sfx.muted = false; })
      .catch(() => { sfx.muted = false; primed = false; });
  }
  function reveal() {
    if (!CFG.revealSound) return;
    try { sfx.pause(); sfx.currentTime = 0; sfx.muted = false; sfx.play().catch(() => {}); } catch {}
  }
  function leaveHome() {
    onHome = false;
    $("musicBtn").classList.add("hidden");
    if (song.paused) return;
    const start = song.volume, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 700);
      song.volume = start * (1 - k);
      k < 1 ? requestAnimationFrame(step) : song.pause();
    };
    requestAnimationFrame(step);
  }
  function syncButton() {
    const b = $("musicBtn");
    b.classList.toggle("muted", muted);
    b.setAttribute("aria-label", muted ? "Turn music on" : "Turn music off");
  }
  return {
    init() {
      syncButton();
      playSong(); // starts right away wherever the browser allows it
      const unlock = (e) => { prime(); if (!e.target.closest?.("#musicBtn")) playSong(); };
      document.addEventListener("pointerdown", unlock, true);
      document.addEventListener("keydown", unlock, true);
      $("musicBtn").onclick = () => {
        muted = !muted;
        muted ? song.pause() : playSong();
        syncButton();
      };
    },
    reveal,
    leaveHome,
  };
})();

/* ============================================================
   UI
   ============================================================ */
let store, state = emptyState(), me = null, busy = false;

function mine() { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch { return null; } }
function saveMine(v) { v ? localStorage.setItem(LS_KEY, JSON.stringify(v)) : localStorage.removeItem(LS_KEY); }

function makeSnow() {
  const box = $("snow"); const n = innerWidth < 600 ? 28 : 55;
  for (let i = 0; i < n; i++) {
    const f = document.createElement("span");
    f.className = "flake"; f.textContent = pick(["❄", "❅", "•", "•", "❆"]);
    f.style.left = Math.random() * 100 + "vw";
    f.style.fontSize = 8 + Math.random() * 16 + "px";
    f.style.animationDuration = 7 + Math.random() * 10 + "s";
    f.style.animationDelay = -Math.random() * 15 + "s";
    f.style.setProperty("--drift", (Math.random() * 80 - 40) + "px");
    box.appendChild(f);
  }
}

function setTitle() {
  document.title = CFG.title;
  $("appTitle").textContent = CFG.title;
  // split by grapheme so emoji stay whole; keep words together so they don't break mid-word
  const graphemes = (t) => window.Intl?.Segmenter ? [...new Intl.Segmenter().segment(t)].map((x) => x.segment) : [...t];
  const h = $("welcomeTitle"); h.innerHTML = "";
  let i = 0;
  CFG.title.split(" ").forEach((word, wi) => {
    if (wi) h.append(" ");
    const w = document.createElement("span"); w.className = "word";
    graphemes(word).forEach((ch) => {
      const s = document.createElement("span");
      s.className = "ch"; s.textContent = ch;
      s.style.animationDelay = 0.3 + i++ * 0.035 + "s";
      w.appendChild(s);
    });
    h.appendChild(w);
  });
}

function renderChecklist() {
  const drawn = state.drawn || {};
  const count = NAMES.filter((n) => drawn[n]).length;
  $("progressPill").textContent = `${count}/${NAMES.length}`;
  $("progressFill").style.width = (count / NAMES.length) * 100 + "%";
  const ul = $("checklist"); ul.innerHTML = "";
  NAMES.forEach((n) => {
    const li = document.createElement("li");
    li.className = drawn[n] ? "done" : "";
    li.appendChild(avatar(n, "sm"));
    const w = document.createElement("span"); w.className = "who"; w.textContent = n; li.appendChild(w);
    const m = document.createElement("span"); m.className = "mark"; m.textContent = drawn[n] ? "✓" : ""; li.appendChild(m);
    ul.appendChild(li);
  });
  const left = NAMES.length - count;
  $("sideFoot").textContent =
    left === 0 ? "🎉 Everyone's drawn! Let the shopping panic begin."
    : left === 1 ? "One straggler left. We see you. 👀"
    : count === 0 ? "Nobody yet. Someone be brave."
    : `${left} people still procrastinating.`;
}

function renderNameGrid() {
  const drawn = state.drawn || {};
  const grid = $("nameGrid"); grid.innerHTML = "";
  NAMES.forEach((n, i) => {
    const b = document.createElement("button");
    b.className = "name-bubble"; b.style.animationDelay = i * 0.04 + "s";
    b.appendChild(avatar(n));
    const s = document.createElement("span"); s.className = "nm"; s.textContent = n; b.appendChild(s);
    if (drawn[n]) {
      b.disabled = true;
      const t = document.createElement("span"); t.className = "tag"; t.textContent = PAST_TAG[i % 3]; b.appendChild(t);
    }
    b.onclick = () => confirmMe(n);
    grid.appendChild(b);
  });
}

function showModal(build) {
  const card = $("modalCard"); card.innerHTML = ""; build(card);
  $("modal").classList.remove("hidden");
}
function hideModal() { $("modal").classList.add("hidden"); }
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") hideModal(); });

function el(tag, props = {}, ...kids) {
  const e = Object.assign(document.createElement(tag), props);
  kids.forEach((k) => e.append(k)); return e;
}

function confirmMe(name) {
  showModal((c) => {
    c.append(
      avatar(name, "xl"),
      el("h3", { textContent: `So you're ${name}?`, style: "margin-bottom:18px" }),
    );
    const row = el("div", { className: "row" });
    row.append(
      el("button", { className: "btn btn-ghost", textContent: "No, wrong person", onclick: hideModal }),
      el("button", { className: "btn btn-red", textContent: "Yep, it's me", onclick: () => { hideModal(); goDraw(name); } }),
    );
    c.append(row);
  });
}

function resetGift() {
  const g = $("gift");
  g.className = "gift idle";
  $("facePop").innerHTML = "";
  $("confetti").innerHTML = "";
  $("revealText").classList.add("hidden");
  $("loadingLine").textContent = "";
}

function goWho() {
  me = null;
  $("stepDraw").classList.add("hidden");
  $("stepWho").classList.remove("hidden");
  renderNameGrid();
}

function goDraw(name) {
  me = name;
  $("stepWho").classList.add("hidden");
  $("stepDraw").classList.remove("hidden");
  $("drawHello").textContent = `Hi ${name}! 👋`;
  $("drawSub").classList.add("hidden");
  resetGift();
  $("openBtn").textContent = "✨ Open the box"; $("openBtn").onclick = openBox;
  $("openBtn").classList.remove("hidden"); $("openBtn").disabled = false;
  $("replayBtn").classList.add("hidden");
  $("backBtn").classList.remove("hidden");
}

function confetti() {
  const box = $("confetti");
  const cols = ["#e0364a", "#1f8a5b", "#f6c453", "#ffffff", "#3a7bd5"];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    const a = Math.random() * Math.PI - Math.PI; // upward half
    const d = 120 + Math.random() * 220;
    p.style.background = pick(cols);
    p.style.setProperty("--x", Math.cos(a) * d * 1.4 + "px");
    p.style.setProperty("--y", Math.sin(a) * d + 160 * Math.random() + "px");
    p.style.setProperty("--r", Math.random() * 720 - 360 + "deg");
    p.style.animationDelay = Math.random() * 0.15 + "s";
    if (Math.random() > 0.5) p.style.borderRadius = "50%";
    box.appendChild(p);
  }
}

async function playReveal(recipient, { fresh }) {
  const g = $("gift");
  $("facePop").innerHTML = ""; $("facePop").appendChild(avatar(recipient, "xl"));
  g.className = "gift open";
  await sleep(450);
  confetti(); sound.reveal();
  await sleep(900);
  g.className = "gift open opened";
  $("revealName").textContent = recipient + "!";
  $("revealJoke").textContent = (CFG.messages || {})[recipient] || "";
  $("revealText").classList.remove("hidden");
  $("loadingLine").textContent = "";
  $("openBtn").classList.add("hidden");
  $("replayBtn").classList.remove("hidden");
  $("backBtn").classList.add("hidden");
  if (fresh) $("revealText").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function openBox() {
  if (busy || !me) return;
  busy = true; $("openBtn").disabled = true; $("backBtn").classList.add("hidden");
  const g = $("gift"); g.className = "gift shaking";
  let li = 0; const order = [...LOADING].sort(() => Math.random() - 0.5);
  $("loadingLine").textContent = order[0];
  const ticker = setInterval(() => { $("loadingLine").textContent = order[++li % order.length]; }, 900);
  try {
    const [res] = await Promise.all([store.draw(me), sleep(2200)]);
    saveMine({ me, recipient: res.recipient, round: res.round });
    clearInterval(ticker);
    await playReveal(res.recipient, { fresh: true });
  } catch (err) {
    clearInterval(ticker);
    g.className = "gift idle";
    $("openBtn").disabled = false; $("backBtn").classList.remove("hidden");
    $("loadingLine").textContent = "";
    const msg = err.message === "already"
      ? `Someone already drew as ${me}. If that wasn't you, text the organizer for a reset.`
      : "The elves dropped the box (network hiccup). Try again?";
    showModal((c) => c.append(el("div", { textContent: "🙀", style: "font-size:3rem" }), el("h3", { textContent: "Uh oh" }), el("p", { textContent: msg }),
      el("button", { className: "btn btn-red", textContent: "OK", onclick: () => { hideModal(); if (err.message === "already") goWho(); } })));
  } finally { busy = false; }
}

function showMine(m) {
  goDraw(m.me);
  $("drawHello").textContent = `Welcome back, ${m.me}! 🎄`;
  $("drawSub").textContent = "You've already drawn. Need a reminder? Open it again.";
  $("drawSub").classList.remove("hidden");
  $("openBtn").textContent = "🎁 Remind me who I got";
  $("openBtn").onclick = async () => {
    $("openBtn").disabled = true;
    const g = $("gift"); g.className = "gift shaking"; await sleep(900);
    await playReveal(m.recipient, { fresh: true });
  };
  $("backBtn").classList.add("hidden");
}

/* ---------- admin ---------- */
async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function openAdmin() {
  showModal((c) => {
    const inp = el("input", { type: "password", placeholder: "Secret passcode", autocomplete: "off" });
    const err = el("p", { className: "err", textContent: "" });
    const go = async () => {
      if ((await sha256(inp.value.trim())) !== CFG.adminPasscodeHash) { err.textContent = "Nope. Nice try, Grinch."; return; }
      showModal((c2) => {
        c2.append(
          el("div", { textContent: "🧨", style: "font-size:3rem" }),
          el("h3", { textContent: "Reset everything?" }),
          el("p", { textContent: "Wipes every draw so the whole group starts over. Everyone will need to draw again. You still won't see who had whom." }),
        );
        const row = el("div", { className: "row" });
        row.append(
          el("button", { className: "btn btn-ghost", textContent: "Never mind", onclick: hideModal }),
          el("button", { className: "btn btn-red", textContent: "Yes, nuke it", onclick: async (e) => {
            e.target.disabled = true; e.target.textContent = "Resetting…";
            try { await store.reset(); saveMine(null); hideModal(); goWho(); }
            catch { e.target.textContent = "Failed, try again"; e.target.disabled = false; }
          } }),
        );
        c2.append(row);
      });
    };
    inp.addEventListener("keydown", (e) => e.key === "Enter" && go());
    c.append(
      el("div", { textContent: "🔧", style: "font-size:3rem" }),
      el("h3", { textContent: "Santa's control room" }),
      el("p", { textContent: "Organizer only. Elves, look away." }),
      inp, err,
      el("button", { className: "btn btn-green", textContent: "Enter", onclick: go }),
    );
    setTimeout(() => inp.focus(), 50);
  });
}

/* ---------- boot ---------- */
async function boot() {
  setTitle(); makeSnow(); NAMES.forEach(findFace); sound.init();
  try { store = CFG.firebase ? await firebaseStore() : localStore(); }
  catch (e) { console.error(e); store = localStore(); }
  if (store.demo) $("demoBadge").classList.remove("hidden");

  let first = true;
  store.subscribe((s) => {
    state = s || emptyState();
    renderChecklist();
    const m = mine();
    const wasReset = m && m.round !== (state.round || 1);
    if (wasReset) saveMine(null); // organizer reset
    if (wasReset && !first && !busy) { goWho(); return; }
    if (first) { first = false; const mm = mine(); if (mm) showMine(mm); else goWho(); return; }
    if (!$("stepWho").classList.contains("hidden")) renderNameGrid();
    // if a reset happened while someone was looking at their reveal
    if (me && !busy && !(state.drawn || {})[me] && !$("revealText").classList.contains("hidden")) goWho();
  });

  $("replayBtn").onclick = async () => {
    const m = mine(); if (!m) return;
    resetGift(); $("gift").className = "gift shaking"; await sleep(800);
    await playReveal(m.recipient, { fresh: false });
  };
  $("backBtn").onclick = goWho;
  $("adminBtn").onclick = openAdmin;
  $("sideToggle").onclick = () => {
    const open = $("sideCard").classList.toggle("open");
    $("sideToggle").setAttribute("aria-expanded", open);
  };

  $("enterBtn").onclick = () => {
    sound.leaveHome();
    $("adminBtn").classList.remove("hidden");
    $("welcome").classList.add("leaving");
    $("app").classList.remove("hidden");
    setTimeout(() => $("welcome").remove(), 650);
  };
}
boot();
