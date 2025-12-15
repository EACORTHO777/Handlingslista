// ===== FIREBASE =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "DIN_API_KEY",
  authDomain: "DIN.authDomain",
  projectId: "DIN_projectId",
  storageBucket: "DIN.storageBucket",
  messagingSenderId: "DIN_senderId",
  appId: "DIN_appId"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== TEST =====
addDoc(collection(db, "test"), {
  ok: true,
  createdAt: new Date()
})
.then(() => console.log("🔥 Firestore funkar"))
.catch(err => console.error("❌ Firestore error", err));

console.log("Script loaded");

// ===== ELEMENT =====
const itemInput = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addButton = document.getElementById("add-btn");
const clearButton = document.getElementById("clear-btn");
const todoList = document.getElementById("todo-list");

// ===== STATE =====
let items = JSON.parse(localStorage.getItem("items")) || [];



// ===== HAPTIC FEEDBACK =====
function haptic(type = "light") {
  if (!("vibrate" in navigator)) return;

  const patterns = {
    light: 10,
    medium: 20,
    heavy: 30
  };

  navigator.vibrate(patterns[type] || 10);
}

// ===== FAST KATEGORIORNING =====
const CATEGORY_ORDER = [
  "Frukt & grönt",
  "Kött & fisk",
  "Mejeri",
  "Frysvaror",
  "Skafferi",
  "Hygien",
  "Hushåll",
  "Leå",
  "Drycker",
  "Njiåm",
  "Övrigt",
  "Kissen"
];

// ===== EMOJIS (PRESENTATION ONLY) =====
const CATEGORY_EMOJIS = {
  "Frukt & grönt": "🍌",
  "Kött & fisk": "🍖",
  "Mejeri": "🐮",
  "Frysvaror": "🧊",
  "Skafferi": "🧂",
  "Hygien": "🧴",
  "Hushåll": "🧹",
  "Leå": "🍼",
  "Drycker": "🥤",
  "Njiåm": "🤓",
  "Övrigt": "👀",
  "Kissen": "🐱"
};

// ===== SAVE =====
function saveItems() {
  localStorage.setItem("items", JSON.stringify(items));
}

// ===== RENDER =====
function renderItems() {
  todoList.innerHTML = "";

  const grouped = {};

  // gruppera per kategori
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  // ===== AKTIVA KATEGORIER (FAST ORDNING) =====
  CATEGORY_ORDER.forEach(category => {
    if (!grouped[category]) return;

    const activeItems = grouped[category].filter(i => !i.done);
    if (activeItems.length === 0) return;

    const section = document.createElement("div");
    section.classList.add("category-section");

    const CATEGORY_CLASS_MAP = {
  "Frukt & grönt": "category-frukt",
  "Kött & fisk": "category-kott",
  "Mejeri": "category-mejeri",
  "Frysvaror": "category-frys",
  "Skafferi": "category-skafferi",
  "Hygien": "category-hygien",
  "Hushåll": "category-hushall",
  "Leå": "category-lea",
  "Drycker": "category-drycker",
  "Njiåm": "category-njiam",
  "Övrigt": "category-ovrigt",
  "Kissen": "category-kissen"
};

if (CATEGORY_CLASS_MAP[category]) {
  section.classList.add(CATEGORY_CLASS_MAP[category]);
}

    const h3 = document.createElement("h3");
    h3.textContent = `${CATEGORY_EMOJIS[category] || ""} ${category}`;

    const ul = document.createElement("ul");

    activeItems.forEach(item => {
      const li = document.createElement("li");

      const span = document.createElement("span");
      span.textContent = `${item.name} (${item.amountText})`;

      // klick = markera klar
      span.addEventListener("click", () => {
        item.done = true;
        haptic("medium");
        saveItems();
        renderItems();
      });

      li.appendChild(span);
      ul.appendChild(li);
    });

    section.appendChild(h3);
    section.appendChild(ul);
    todoList.appendChild(section);
  });

  // ===== KLAR (ALLTID SIST) =====
  const doneItems = items.filter(i => i.done);
  if (doneItems.length > 0) {
    const section = document.createElement("div");
    section.classList.add("category-section");

    const h3 = document.createElement("h3");
    h3.textContent = "✅ Klar";

    const ul = document.createElement("ul");

    doneItems.forEach(item => {
      const li = document.createElement("li");
      li.classList.add("done");

      const del = document.createElement("del");
      del.textContent = `${item.name} (${item.amountText})`;

      // klick = ångra klar
      del.addEventListener("click", () => {
        item.done = false;
        haptic("light");
        saveItems();
        renderItems();
      });

      li.appendChild(del);
      ul.appendChild(li);
    });

    section.appendChild(h3);
    section.appendChild(ul);
    todoList.appendChild(section);
  }
}

// ===== ADD ITEM =====
addButton.addEventListener("click", () => {
  const name = itemInput.value.trim();
  const rawAmount = quantityInput.value.trim();
  const unit = unitInput.value;
  const category = categoryInput.value;

  if (!name || !rawAmount || !category) return;

  const hasLetters = /[a-zA-Z]/.test(rawAmount);
  const amountText = hasLetters ? rawAmount : `${rawAmount} ${unit}`;

  items.push({
    name,
    amountText,
    category,
    done: false
  });

  saveItems();
  renderItems();

  // nollställ inputs (Safari-safe)
  itemInput.value = "";
  quantityInput.value = "";
  categoryInput.value = "";
  unitInput.value = "st";

  setTimeout(() => {
    itemInput.value = "";
    quantityInput.value = "";
  }, 0);

  itemInput.focus();
});

// ===== CLEAR =====
clearButton.addEventListener("click", () => {
  if (!confirm("Är du säker på att du vill rensa listan?")) return;
  items = [];
  localStorage.clear();
  renderItems();
});

// ===== INIT =====
renderItems();
itemInput.focus();

// ===== PWA =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

db.collection("test").add({
  ok: true,
  createdAt: new Date()
}).then(() => {
  console.log("🔥 Firestore funkar");
}).catch(err => {
  console.error("❌ Firestore error", err);
});