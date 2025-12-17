console.log("🔥 script.js laddad – Realtime DB / Sektioner");

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
const itemsRef = ref(db, "items");

// ================= DOM =================
const itemInput = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addBtn = document.getElementById("add-btn");
const clearBtn = document.getElementById("clear-btn");
const todoList = document.getElementById("todo-list");

// ================= SEKTIONER =================
const SECTIONS = [
  {
    title: "🥦 Frukt & Grönt / Skafferi mat",
    class: "cat-frukt",
    categories: ["Frukt & grönt", "Skafferi"]
  },
  {
    title: "🥩 Kött & Fisk",
    class: "cat-kott",
    categories: ["Kött & fisk"]
  },
  {
    title: "🧀 Mejeri / Frys",
    class: "cat-mejeri",
    categories: ["Mejeri", "Frysvaror"]
  },
  {
    title: "🧼 Hygien / Hushåll / LEÅ",
    class: "cat-hygien",
    categories: ["Hygien", "Hushåll", "Leå"]
  },
  {
    title: "🥤 Drycker & NJIÅM",
    class: "cat-drycker",
    categories: ["Drycker", "Njiåm"]
  }
];

// ================= REALTIME LISTENER =================
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

  if (!name || !amount || !category) return;

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
  itemInput.focus();
});

// ================= CLEAR LIST =================
clearBtn.addEventListener("click", () => {
  if (!confirm("Rensa hela listan?")) return;
  remove(itemsRef);
});

// ================= RENDER =================
function renderItems(items) {
  todoList.innerHTML = "";

  const active = items.filter(i => !i.done);
  const done = items.filter(i => i.done);

  // ===== SEKTIONER =====
  SECTIONS.forEach(section => {
    const sectionItems = active.filter(item =>
      section.categories.includes(item.category)
    );

    if (!sectionItems.length) return;

    const card = document.createElement("div");
    card.className = `category-section ${section.class}`;

    const h3 = document.createElement("h3");
    h3.textContent = section.title;
    card.appendChild(h3);

    const ul = document.createElement("ul");

    sectionItems.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} – ${item.amount} ${item.unit}`;

      li.addEventListener("click", () => {
        update(ref(db, `items/${item.id}`), { done: true });
      });

      ul.appendChild(li);
    });

    card.appendChild(ul);
    todoList.appendChild(card);
  });

  // ===== KLAR (ALLTID SIST) =====
  if (done.length) {
    const card = document.createElement("div");
    card.className = "category-section cat-klar";

    const h3 = document.createElement("h3");
    h3.textContent = "✅ Klar";
    card.appendChild(h3);

    const ul = document.createElement("ul");

    done.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `<del>${item.name} – ${item.amount} ${item.unit}</del>`;

      li.addEventListener("click", () => {
        update(ref(db, `items/${item.id}`), { done: false });
      });

      ul.appendChild(li);
    });

    card.appendChild(ul);
    todoList.appendChild(card);
  }
}