// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 Din riktiga config (denna är korrekt)
const firebaseConfig = {
  apiKey: "AIzaSyB177SHk2mk3leIILG5U19rpNFhDEd_5CM",
  authDomain: "handlingslista-9204a.firebaseapp.com",
  projectId: "handlingslista-9204a",
  storageBucket: "handlingslista-9204a.firebasestorage.app",
  messagingSenderId: "87606086562",
  appId: "1:87606086562:web:49d1daea84d64dfbe580fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= DOM =================
const itemInput = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addButton = document.getElementById("add-btn");
const clearButton = document.getElementById("clear-btn");
const todoList = document.getElementById("todo-list");

// ================= DATA =================
let items = [];

// FAST KATEGORIORNING
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

// ================= HAPTIC =================
function haptic(type = "light") {
  if (!("vibrate" in navigator)) return;
  const map = { light: 10, medium: 20, heavy: 30 };
  navigator.vibrate(map[type] || 10);
}

// ================= REALTIME SYNC =================
onSnapshot(collection(db, "items"), snapshot => {
  items = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
  renderItems();
});

// ================= RENDER =================
function renderItems() {
  todoList.innerHTML = "";

  CATEGORY_ORDER.forEach(category => {
    const categoryItems = items.filter(
      i => i.category === category && !i.done
    );

    if (categoryItems.length === 0) return;

    const section = document.createElement("div");
    section.className = "category-section";

    const h3 = document.createElement("h3");
    h3.textContent = `${category} (${categoryItems.length})`;

    const ul = document.createElement("ul");

    categoryItems.forEach(item => {
      const li = document.createElement("li");

      const del = document.createElement("del");
      del.textContent = `${item.name} (${item.amountText})`;

      del.addEventListener("click", () => {
        haptic("medium");
        updateDoc(doc(db, "items", item.id), {
          done: true
        });
      });

      li.appendChild(del);
      ul.appendChild(li);
    });

    section.appendChild(h3);
    section.appendChild(ul);
    todoList.appendChild(section);
  });

  // ===== KLAR =====
  const doneItems = items.filter(i => i.done);
  if (doneItems.length > 0) {
    const section = document.createElement("div");
    section.className = "category-section";

    const h3 = document.createElement("h3");
    h3.textContent = "Klar";

    const ul = document.createElement("ul");

    doneItems.forEach(item => {
      const li = document.createElement("li");
      li.className = "done";

      const del = document.createElement("del");
      del.textContent = `${item.name} (${item.amountText})`;

      del.addEventListener("click", () => {
        haptic("light");
        updateDoc(doc(db, "items", item.id), {
          done: false
        });
      });

      li.appendChild(del);
      ul.appendChild(li);
    });

    section.appendChild(h3);
    section.appendChild(ul);
    todoList.appendChild(section);
  }
}

// ================= ADD ITEM =================
addButton.addEventListener("click", () => {
  const name = itemInput.value.trim();
  if (!name) return;

  let amountText = quantityInput.value
    ? `${quantityInput.value} ${unitInput.value}`
    : "";

  const category = categoryInput.value || "Övrigt";

  haptic("heavy");

  addDoc(collection(db, "items"), {
    name,
    amountText,
    category,
    done: false,
    createdAt: Date.now()
  });

  itemInput.value = "";
  quantityInput.value = "";
  unitInput.value = "st";
  categoryInput.value = "";
  itemInput.focus();
});

// ================= CLEAR LIST =================
clearButton.addEventListener("click", () => {
  if (!confirm("Är du säker på att du vill rensa listan?")) return;
  haptic("heavy");

  items.forEach(item => {
    updateDoc(doc(db, "items", item.id), { done: true });
  });
});