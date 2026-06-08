import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase, ref, push, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB177SHk2mk3leIILG5U19rpNFhDEd_5CM",
  authDomain: "handlingslista-9204a.firebaseapp.com",
  databaseURL: "https://handlingslista-9204a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "handlingslista-9204a",
  storageBucket: "handlingslista-9204a.appspot.com",
  messagingSenderId: "87606086562",
  appId: "1:87606086562:web:49d1daea84d64dfbe580fb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const itemsRef  = ref(db, "items");
const eventsRef = ref(db, "events");
const todosRef  = ref(db, "todos");

// ===========================
// NOTIFICATIONS
// ===========================

const lastVisit   = Number(localStorage.getItem("lastVisit") || Date.now());
const appLoadTime = Date.now();
const selfPushed  = { items: new Set(), events: new Set(), todos: new Set() };

function saveLastVisit() {
  localStorage.setItem("lastVisit", Date.now());
}
document.addEventListener("visibilitychange", () => { if (document.hidden) saveLastVisit(); });
window.addEventListener("beforeunload", saveLastVisit);

if ("Notification" in window && Notification.permission === "default") {
  setTimeout(() => Notification.requestPermission(), 1500);
}

function notify(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "logo.png" });
}

// ===========================
// TAB SWITCHING
// ===========================

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ===========================
// HANDLINGSLISTA
// ===========================

const itemInput     = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput     = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addBtn        = document.getElementById("add-btn");
const clearBtn      = document.getElementById("clear-btn");
const todoList      = document.getElementById("todo-list");

const SECTION_ORDER = [
  { title: "Frukt & Grönt / Skafferi mat", categories: ["Frukt & grönt", "Skafferi"],          className: "cat-frukt"    },
  { title: "Kaffe / Skafferi bak",         categories: ["Kaffe", "Bakning"],                    className: "cat-skafferi" },
  { title: "Kött & Fisk",                  categories: ["Kött & fisk"],                         className: "cat-kott"     },
  { title: "Mejeri / Frys",                categories: ["Mejeri", "Frysvaror"],                 className: "cat-mejeri"   },
  { title: "Hygien / Hushåll / LEÅ",       categories: ["Hygien", "Hushåll", "Leå"],            className: "cat-hygien"   },
  { title: "Pasta / Ris / Ketchup",        categories: ["Pasta", "Ris", "Ketchup"],             className: "cat-skafferi" },
  { title: "Drycker & NJIÅM",              categories: ["Drycker", "Njiåm"],                    className: "cat-drycker"  }
];

let learnedMap = JSON.parse(localStorage.getItem("learnedMap")) || {};

const AUTO_RULES = [
  { words: ["banan", "bananer"],  category: "Frukt & grönt", unit: "kg" },
  { words: ["äpple"],             category: "Frukt & grönt", unit: "kg" },
  { words: ["potatis"],           category: "Frukt & grönt", unit: "kg" },
  { words: ["mjölk"],             category: "Mejeri",        unit: "st" },
  { words: ["ost"],               category: "Mejeri",        unit: "st" },
  { words: ["smör"],              category: "Mejeri",        unit: "st" },
  { words: ["kyckling"],          category: "Kött & fisk",   unit: "kg" },
  { words: ["lax"],               category: "Kött & fisk",   unit: "kg" },
  { words: ["pasta"],             category: "Pasta",          unit: "st" },
  { words: ["ris"],               category: "Ris",            unit: "kg" },
  { words: ["ketchup"],           category: "Ketchup",        unit: "st" },
  { words: ["kaffe"],             category: "Kaffe",          unit: "st" }
];

function detectFromText(text) {
  const v = text.toLowerCase();
  for (const key in learnedMap) {
    if (v.includes(key)) return learnedMap[key];
  }
  for (const rule of AUTO_RULES) {
    if (rule.words.some(w => v.includes(w))) return { category: rule.category, unit: rule.unit };
  }
  return null;
}

itemInput.addEventListener("input", () => {
  const res = detectFromText(itemInput.value.trim());
  if (!res) return;
  categoryInput.value = res.category;
  unitInput.value = res.unit;
});

itemInput.addEventListener("keypress", e => { if (e.key === "Enter") addItem(); });
addBtn.addEventListener("click", addItem);

function addItem() {
  const name     = itemInput.value.trim();
  const amount   = quantityInput.value;
  const unit     = unitInput.value;
  const category = categoryInput.value;
  if (!name || !amount || !unit || !category) return;

  const key = name.toLowerCase().split(" ")[0];
  learnedMap[key] = { category, unit };
  localStorage.setItem("learnedMap", JSON.stringify(learnedMap));

  const newRef = push(itemsRef, { name, amount, unit, category, done: false, createdAt: Date.now() });
  selfPushed.items.add(newRef.key);
  itemInput.value = "";
  quantityInput.value = "";
  itemInput.focus();
}

clearBtn.addEventListener("click", () => {
  if (!confirm("Rensa hela listan?")) return;
  remove(itemsRef);
});

let itemsFirstLoad = true;
onValue(itemsRef, snapshot => {
  const data  = snapshot.val() || {};
  const items = Object.entries(data).map(([id, v]) => ({ id, ...v }));

  const cutoff = itemsFirstLoad ? lastVisit : appLoadTime;
  itemsFirstLoad = false;

  items
    .filter(i => !i.done && i.createdAt > cutoff && !selfPushed.items.has(i.id))
    .forEach(i => notify("Ny vara i handlingslistan", `${i.name} – ${i.amount} ${i.unit}`));

  renderItems(items);
});

function renderItems(items) {
  todoList.innerHTML = "";
  const active = items.filter(i => !i.done);
  const done   = items.filter(i =>  i.done);

  SECTION_ORDER.forEach(section => {
    const list = active.filter(i => section.categories.includes(i.category));
    if (!list.length) return;

    const card = document.createElement("div");
    card.className = `category-section ${section.className}`;

    const h3 = document.createElement("h3");
    h3.textContent = section.title;
    card.appendChild(h3);

    const ul = document.createElement("ul");
    list.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} – ${item.amount} ${item.unit}`;
      li.onclick = () => update(ref(db, `items/${item.id}`), { done: true });
      ul.appendChild(li);
    });
    card.appendChild(ul);
    todoList.appendChild(card);
  });

  if (done.length) {
    const card = document.createElement("div");
    card.className = "category-section cat-klar";
    const h3 = document.createElement("h3");
    h3.textContent = "Klar";
    card.appendChild(h3);
    const ul = document.createElement("ul");
    done.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `<del>${item.name} – ${item.amount} ${item.unit}</del>`;
      li.onclick = () => update(ref(db, `items/${item.id}`), { done: false });
      ul.appendChild(li);
    });
    card.appendChild(ul);
    todoList.appendChild(card);
  }
}

// ===========================
// KALENDER
// ===========================

let calYear      = new Date().getFullYear();
let calMonth     = new Date().getMonth();
let selectedDate = null;
let allEvents    = {};

function personClass(person) {
  return { Alexander: "alexander", Alexandra: "alexandra", Båda: "bada" }[person] ?? "bada";
}

let eventsFirstLoad = true;
onValue(eventsRef, snapshot => {
  const data = snapshot.val() || {};

  const cutoff = eventsFirstLoad ? lastVisit : appLoadTime;
  eventsFirstLoad = false;

  Object.entries(data)
    .filter(([id, e]) => e.createdAt > cutoff && !selfPushed.events.has(id))
    .forEach(([, e]) => notify("Ny händelse i kalendern", `${e.title} – ${e.person}`));

  allEvents = data;
  renderCalendar();
  renderDayEvents();
});

document.getElementById("prev-month").addEventListener("click", () => {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  selectedDate = null;
  renderCalendar();
  renderDayEvents();
});

document.getElementById("next-month").addEventListener("click", () => {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  selectedDate = null;
  renderCalendar();
  renderDayEvents();
});

function renderCalendar() {
  const grid  = document.getElementById("calendar-grid");
  const label = document.getElementById("month-label");

  const first     = new Date(calYear, calMonth, 1);
  const monthName = first.toLocaleDateString("sv-SE", { month: "long", year: "numeric" });
  label.textContent = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  grid.innerHTML = "";

  ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].forEach(day => {
    const cell = document.createElement("div");
    cell.className = "cal-header-cell";
    cell.textContent = day;
    grid.appendChild(cell);
  });

  let startDay = first.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;
  for (let i = 0; i < startDay; i++) {
    const cell = document.createElement("div");
    cell.className = "cal-cell empty";
    grid.appendChild(cell);
  }

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today       = new Date();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const cell    = document.createElement("div");
    cell.className = "cal-cell";

    if (d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()) {
      cell.classList.add("today");
    }
    if (selectedDate === dateStr) cell.classList.add("selected");

    const numSpan = document.createElement("span");
    numSpan.textContent = d;
    cell.appendChild(numSpan);

    const dayEvents = Object.values(allEvents).filter(e => e.date === dateStr);
    if (dayEvents.length) {
      const dots = document.createElement("div");
      dots.className = "event-dots";
      dayEvents.slice(0, 3).forEach(ev => {
        const dot = document.createElement("span");
        dot.className = `dot dot-${personClass(ev.person)}`;
        dots.appendChild(dot);
      });
      cell.appendChild(dots);
    }

    cell.addEventListener("click", () => {
      selectedDate = dateStr;
      document.getElementById("event-form").classList.add("hidden");
      renderCalendar();
      renderDayEvents();
    });

    grid.appendChild(cell);
  }
}

function renderDayEvents() {
  const container   = document.getElementById("day-events");
  const addEventBtn = document.getElementById("add-event-btn");

  container.innerHTML = "";

  if (!selectedDate) {
    addEventBtn.classList.add("hidden");
    return;
  }

  const dayEvents = Object.entries(allEvents)
    .filter(([, e]) => e.date === selectedDate)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => {
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return a.createdAt - b.createdAt;
    });

  const [y, m, d] = selectedDate.split("-");
  const dateObj   = new Date(Number(y), Number(m) - 1, Number(d));
  const dateLabel = dateObj.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });

  const header = document.createElement("div");
  header.className = "day-events-header";
  header.textContent = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);
  container.appendChild(header);

  if (dayEvents.length === 0) {
    const p = document.createElement("p");
    p.className = "no-events";
    p.textContent = "Inga händelser";
    container.appendChild(p);
  } else {
    dayEvents.forEach(ev => {
      const item = document.createElement("div");
      item.className = `event-item event-${personClass(ev.person)}`;

      const badge = document.createElement("span");
      badge.className = "event-person-badge";
      badge.textContent = ev.person;

      const title = document.createElement("span");
      title.className = "event-title-text";
      title.textContent = ev.title;

      const del = document.createElement("button");
      del.className = "event-delete";
      del.textContent = "×";
      del.addEventListener("click", () => remove(ref(db, `events/${ev.id}`)));

      item.appendChild(badge);
      item.appendChild(title);

      if (ev.time) {
        const timeBadge = document.createElement("span");
        timeBadge.className = "event-time-badge";
        timeBadge.textContent = ev.time;
        item.appendChild(timeBadge);
      }

      item.appendChild(del);
      container.appendChild(item);
    });
  }

  addEventBtn.classList.remove("hidden");
}

document.getElementById("add-event-btn").addEventListener("click", () => {
  const form = document.getElementById("event-form");
  form.classList.toggle("hidden");
  if (!form.classList.contains("hidden")) {
    document.getElementById("event-title").focus();
  }
});

document.getElementById("event-time-toggle").addEventListener("change", function () {
  const timeInput = document.getElementById("event-time");
  timeInput.classList.toggle("hidden", !this.checked);
  if (this.checked) timeInput.focus();
});

document.getElementById("save-event").addEventListener("click", saveEvent);
document.getElementById("event-title").addEventListener("keypress", e => {
  if (e.key === "Enter") saveEvent();
});

function saveEvent() {
  const title       = document.getElementById("event-title").value.trim();
  const person      = document.getElementById("event-person").value;
  const timeToggle  = document.getElementById("event-time-toggle");
  const time        = timeToggle.checked ? document.getElementById("event-time").value : null;
  if (!title || !selectedDate) return;

  const newRef = push(eventsRef, { date: selectedDate, title, person, time: time || null, createdAt: Date.now() });
  selfPushed.events.add(newRef.key);

  document.getElementById("event-title").value = "";
  document.getElementById("event-time").value  = "";
  timeToggle.checked = false;
  document.getElementById("event-time").classList.add("hidden");
  document.getElementById("event-form").classList.add("hidden");
}

document.getElementById("cancel-event").addEventListener("click", () => {
  document.getElementById("event-title").value = "";
  document.getElementById("event-form").classList.add("hidden");
});

renderCalendar();

// ===========================
// ATT-GÖRA
// ===========================

let allTodos           = {};
let selectedPersonFilter = "alla";

let todosFirstLoad = true;
onValue(todosRef, snapshot => {
  const data = snapshot.val() || {};

  const cutoff = todosFirstLoad ? lastVisit : appLoadTime;
  todosFirstLoad = false;

  Object.entries(data)
    .filter(([id, t]) => !t.done && t.createdAt > cutoff && !selfPushed.todos.has(id))
    .forEach(([, t]) => notify("Ny uppgift i att-göra", `${t.title} – ${t.person}`));

  allTodos = data;
  renderTodos();
});

document.getElementById("todo-add-btn").addEventListener("click", addTodo);
document.getElementById("todo-input").addEventListener("keypress", e => {
  if (e.key === "Enter") addTodo();
});

function addTodo() {
  const title  = document.getElementById("todo-input").value.trim();
  const person = document.getElementById("todo-person").value;
  if (!title) return;

  const newRef = push(todosRef, { title, person, done: false, createdAt: Date.now() });
  selfPushed.todos.add(newRef.key);
  document.getElementById("todo-input").value = "";
  document.getElementById("todo-input").focus();
}

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPersonFilter = btn.dataset.person;
    renderTodos();
  });
});

function renderTodos() {
  const container = document.getElementById("todo-list-attgora");
  container.innerHTML = "";

  const todos = Object.entries(allTodos)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => a.createdAt - b.createdAt);

  const active = todos.filter(t => !t.done);
  const done   = todos.filter(t =>  t.done);

  function makeSection(title, items, className) {
    if (!items.length) return;
    const card = document.createElement("div");
    card.className = `todo-card ${className}`;

    const h3 = document.createElement("h3");
    h3.textContent = title;
    card.appendChild(h3);

    items.forEach(todo => {
      const row = document.createElement("div");
      row.className = `todo-item${todo.done ? " done" : ""}`;

      const check = document.createElement("div");
      check.className = "todo-check";
      if (todo.done) check.textContent = "✓";

      const text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.title;

      const del = document.createElement("button");
      del.className = "todo-delete";
      del.textContent = "×";
      del.addEventListener("click", e => {
        e.stopPropagation();
        remove(ref(db, `todos/${todo.id}`));
      });

      row.appendChild(check);
      row.appendChild(text);
      row.appendChild(del);
      row.addEventListener("click", () => update(ref(db, `todos/${todo.id}`), { done: !todo.done }));
      card.appendChild(row);
    });

    container.appendChild(card);
  }

  const alexanderActive = active.filter(t => t.person === "Alexander");
  const alexandraActive = active.filter(t => t.person === "Alexandra");
  const badaActive      = active.filter(t => t.person === "Båda");

  const alexanderDone = done.filter(t => t.person === "Alexander");
  const alexandraDone = done.filter(t => t.person === "Alexandra");
  const badaDone      = done.filter(t => t.person === "Båda");

  if (selectedPersonFilter === "alla" || selectedPersonFilter === "Alexander") {
    makeSection("Alexander", alexanderActive, "card-alexander");
  }
  if (selectedPersonFilter === "alla" || selectedPersonFilter === "Alexandra") {
    makeSection("Alexandra", alexandraActive, "card-alexandra");
  }
  if (badaActive.length) {
    makeSection("Båda", badaActive, "card-bada");
  }

  let doneItems = [];
  if (selectedPersonFilter === "alla") {
    doneItems = done;
  } else if (selectedPersonFilter === "Alexander") {
    doneItems = [...alexanderDone, ...badaDone];
  } else {
    doneItems = [...alexandraDone, ...badaDone];
  }

  if (doneItems.length) {
    makeSection("Klart", doneItems, "card-done");
  }

  if (!active.length && !done.length) {
    const p = document.createElement("p");
    p.className = "no-todos";
    p.textContent = "Inga uppgifter";
    container.appendChild(p);
  }
}
