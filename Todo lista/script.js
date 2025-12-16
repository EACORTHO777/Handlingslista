console.log("🔥 script.js laddad (Realtime DB – FINAL)");

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
  "Kissen": { emoji: "🐱", class: "category-kissen" },
  "Övrigt": { emoji: "👀", class: "category-ovrigt" }
};

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
});

// ================= CLEAR LIST =================
clearBtn.addEventListener("click", () => {
  if (!confirm("Rensa hela listan?")) return;
  remove(itemsRef);
});

// ================= RENDER =================
function renderItems(items) {
  todoList.innerHTML = "";

  const grouped = {};
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  Object.entries(grouped).forEach(([category, items]) => {
    const meta = CATEGORY_META[category] || CATEGORY_META["Övrigt"];

    const section = document.createElement("div");
    section.className = `category-section ${meta.class}`;

    const title = document.createElement("h3");
    title.textContent = `${meta.emoji} ${category}`;
    section.appendChild(title);

    const ul = document.createElement("ul");

    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} – ${item.amount} ${item.unit}`;

      if (item.done) li.classList.add("done");

      li.addEventListener("click", () => {
        update(ref(db, `items/${item.id}`), {
          done: !item.done
        });
      });

      ul.appendChild(li);
    });

    section.appendChild(ul);
    todoList.appendChild(section);
  });
}