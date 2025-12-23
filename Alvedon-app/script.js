// 🔥 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB177SHk2mk3leIILG5U19rpNFhDEd_5CM",
  authDomain: "handlingslista-9204a.firebaseapp.com",
  databaseURL: "https://handlingslista-9204a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "handlingslista-9204a",
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ⏱ tider
const SIX_HOURS = 6 * 60 * 60 * 1000;
const FOUR_HOURS = 4 * 60 * 60 * 1000;
const FIVE_HOURS = 5 * 60 * 60 * 1000;

// 🔁 timers
const intervals = {};

// ---------- helpers ----------
function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

function formatClock(ts) {
  return new Date(ts).toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatus(elapsed, statusEl) {
  statusEl.className = "status-box"; // reset

  if (elapsed < FOUR_HOURS) {
    statusEl.classList.add("status-wait");
    return "VÄNTA";
  }

  if (elapsed < FIVE_HOURS) {
    statusEl.classList.add("status-warning");
    return "DU KAN GE NU";
  }

  if (elapsed < SIX_HOURS) {
    statusEl.classList.add("status-warning");
    return "INGA PROBLEM ATT GE NU";
  }

  statusEl.classList.add("status-ok");
  return "GE NU";
}

// ---------- listener ----------
function setupListener(type) {
  const statusEl = document.getElementById(`${type}-status`);
  const timerEl = document.getElementById(`${type}-timer`);
  const lastEl = document.getElementById(`${type}-last`);
  const progressEl = document.getElementById(`${type}-progress`);
  const btn = document.getElementById(`${type}-btn`);

  db.ref(type).on("value", (snap) => {
    const data = snap.val();

    if (intervals[type]) {
      clearInterval(intervals[type]);
      intervals[type] = null;
    }

    if (!data?.lastGiven) {
      statusEl.textContent = "–";
      statusEl.style.color = "";
      timerEl.textContent = "–";
      lastEl.textContent = "Senast given: –";
      progressEl.style.width = "0%";
      btn.disabled = false;
      return;
    }

    intervals[type] = setInterval(() => {
      const now = Date.now();
      const elapsed = now - data.lastGiven;
      const remaining = SIX_HOURS - elapsed;

      const status = getStatus(elapsed, statusEl);
      statusEl.textContent = status;

      btn.disabled = elapsed < FOUR_HOURS;

      const nextTime = new Date(data.lastGiven + SIX_HOURS)
        .toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });

      timerEl.textContent = `Nästa dos kl ${nextTime} (${formatTime(remaining)})`;
      lastEl.textContent = `Senast given: ${formatClock(data.lastGiven)}`;

      const progress = Math.min((elapsed / SIX_HOURS) * 100, 100);
      progressEl.style.width = `${progress}%`;
      progressEl.style.background =
        type === "alvedon" ? "var(--blue)" : "var(--green)";
    }, 1000);
  });
}

// ---------- buttons ----------
function setupButton(type) {
  document.getElementById(`${type}-btn`).addEventListener("click", () => {
    if (!confirm(`Är du säker på att du gav ${type}?`)) return;
    db.ref(type).set({ lastGiven: Date.now() });
  });
}

function setupReset(type) {
  document.getElementById(`${type}-reset`).addEventListener("click", () => {
    if (!confirm(`Nollställa ${type}?`)) return;
    db.ref(type).remove();
  });
}

// ---------- init ----------
["alvedon", "ipren"].forEach((type) => {
  setupListener(type);
  setupButton(type);
  setupReset(type);
});