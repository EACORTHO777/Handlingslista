console.log("🔥 script.js laddad (Realtime DB – STABIL)");

// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onValue,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB177SHk2mk3leIILG5U19rpNFhDEd_5CM",
  authDomain: "handlingslista-9204a.firebaseapp.com",
  databaseURL:
    "https://handlingslista-9204a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "handlingslista-9204a",
  storageBucket: "handlingslista-9204a.appspot.com",
  messagingSenderId: "87606086562",
  appId: "1:87606086562:web:49d1daea84d64dfbe580fb"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ================= DOM =================
const itemInput = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addBtn = document.getElementById("add-btn");
const clearBtn = document.getElementById("clear-btn");
const todoList = document.getElementById("todo-list");

// ================= CATEGORY ORDER =================
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
  "Klar" // ALLTID SIST
];

const SECTIONS = [
  {
    title: "🥦 Frukt & Grönt / Skafferi mat",
    categories: ["Frukt & grönt", "Skafferi"]
  },
  {
    title: "☕️ Kaffe / Skafferi bak",
    categories: ["Kaffe", "Bakning"]
  },
  {
    title: "🥩 Kött & Fisk",
    categories: ["Kött & fisk"]
  },
  {
    title: "🧀 Mejeri / Frys",
    categories: ["Mejeri", "Frysvaror"]
  },
  {
    title: "🧼 Hygien / Hushåll / LEÅ",
    categories: ["Hygien", "Hushåll", "Leå"]
  },
  {
    title: "🍝 Pasta / Ris / Ketchup",
    categories: ["Pasta", "Ris", "Ketchup"]
  },
  {
    title: "🥤 Drycker & NJIÅM",
    categories: ["Drycker", "Njiåm"]
  }
];

// ================= DB =================
const itemsRef = ref(db, "items");

// ================= REALTIME =================
onValue(itemsRef, snapshot => {
  const data = snapshot.val() || {};
  const items = Object.entries(data).map(([id, value]) => ({
    id,
    ...value
  }));
  renderItems(items);
});

// ================= ADD ITEM =================
addBtn.addEventListener("click", () => {
  const name = itemInput.value.trim();
  const amount = quantityInput.value;
  const unit = unitInput.value;
  const category = categoryInput.value;

  if (!name || !amount || !unit || !category) return;

  push(itemsRef, {
    name,
    amount,
    unit,
    category,
    done: false,
    createdAt: Date.now()
  });

  itemInput.value = "";
  quantityInput.value = "";
  categoryInput.value = "";
});

// ================= CLEAR =================
clearBtn.addEventListener("click", () => {
  remove(itemsRef);
});

function renderItems(items) {
  todoList.innerHTML = "";

  // Dela upp i aktiva + klara
  const activeItems = items.filter(i => !i.done);
  const doneItems = items.filter(i => i.done);

  // === SEKTIONER ===
  SECTIONS.forEach(section => {
    const sectionItems = activeItems.filter(item =>
      section.categories.includes(item.category)
    );

    if (!sectionItems.length) return;

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "category-section";

    const h3 = document.createElement("h3");
    h3.textContent = section.title;
    sectionDiv.appendChild(h3);

    const ul = document.createElement("ul");

    sectionItems.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} – ${item.amount} ${item.unit}`;

      li.addEventListener("click", () => {
        update(ref(db, `items/${item.id}`), {
          done: true
        });
      });

      ul.appendChild(li);
    });

    sectionDiv.appendChild(ul);
    todoList.appendChild(sectionDiv);
  });

  // === KLAR (ALLTID SIST) ===
  if (doneItems.length) {
    const section = document.createElement("div");
    section.className = "category-section category-klar";

    const h3 = document.createElement("h3");
    h3.textContent = "✅ Klar";
    section.appendChild(h3);

    const ul = document.createElement("ul");

    doneItems.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `<del>${item.name} – ${item.amount} ${item.unit}</del>`;

      li.addEventListener("click", () => {
        update(ref(db, `items/${item.id}`), {
          done: false
        });
      });

      ul.appendChild(li);
    });

    section.appendChild(ul);
    todoList.appendChild(section);
  }
}