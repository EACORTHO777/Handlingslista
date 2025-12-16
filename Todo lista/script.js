
console.log("🔥 script.js laddad (Realtime DB – KLAR-LOGIK)");

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

// ================= CATEGORY META =================
const CATEGORY_META = {
  "Frukt & grönt": { emoji: "🍌", class: "category-frukt" },
  "Kött & fisk": { emoji: "🍖", class: "category-kott" },
  "Mejeri": { emoji: "🐮", class: "category-mejeri" },
  "Frysvaror": { emoji: "🧊", class: "category-frys" },
  "Skafferi": { emoji: "🧂", class: "category-skafferi" },
  "Hygien": { emoji: "🧴", class: "category-hygien" },
  "Hushåll": { emoji: "🧹", class: "category-hushall" },
  "Leå": { emoji: "🍼", class: "category-lea" },
  "Drycker": { emoji: "🥤", class: "category-drycker" },
  "Njiåm": { emoji: "🤓", class: "category-njiam" },
  "Övrigt": { emoji: "👀", class: "category-ovrigt" }
};

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

// ================= RENDER =================
function renderItems(items) {
  todoList.innerHTML = "";

  const active = {};
  const doneItems = [];

  items.forEach(item => {
    if (item.done) {
      doneItems.push(item);
    } else {
      if (!active[item.category]) active[item.category] = [];
      active[item.category].push(item);
    }
  });

  // === AKTIVA KATEGORIER ===
  Object.entries(active).forEach(([category, items]) => {
    const meta = CATEGORY_META[category];
    if (!meta) return;

    const section = document.createElement("div");
    section.className = `category-section ${meta.class}`;

    const h3 = document.createElement("h3");
    h3.textContent = `${meta.emoji} ${category}`;
    section.appendChild(h3);

    const ul = document.createElement("ul");

    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} – ${item.amount} ${item.unit}`;

      li.addEventListener("click", () => {
        update(ref(db, `items/${item.id}`), {
          done: true
        });
      });

      ul.appendChild(li);
    });

    section.appendChild(ul);
    todoList.appendChild(section);
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