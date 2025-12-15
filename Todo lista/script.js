console.log("🔥 script.js laddad");

// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB177SHk2mk3leIILG5U19rpNFhDEd_5CM",
  authDomain: "handlingslista-9204a.firebaseapp.com",
  projectId: "handlingslista-9204a",
  storageBucket: "handlingslista-9204a.appspot.com",
  messagingSenderId: "87606086562",
  appId: "1:87606086562:web:49d1daea84d64dfbe580fb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("✅ Firebase init klar");

// ================= DOM =================
const itemInput = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addBtn = document.getElementById("add-btn");
const clearBtn = document.getElementById("clear-btn");
const todoList = document.getElementById("todo-list");

// ================= REALTIME =================
const q = query(
  collection(db, "items"),
  orderBy("createdAt", "asc")
);

onSnapshot(q, snapshot => {
  const items = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
  renderItems(items);
});

// ================= ADD ITEM =================
addBtn.addEventListener("click", async () => {
  const name = itemInput.value.trim();
  const amount = quantityInput.value;
  const unit = unitInput.value;
  const category = categoryInput.value;

  if (!name || !amount || !unit || !category) return;

  await addDoc(collection(db, "items"), {
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
clearBtn.addEventListener("click", async () => {
  const snap = await collection(db, "items");
  snap.forEach(async d => {
    await deleteDoc(doc(db, "items", d.id));
  });
});

// ================= RENDER =================
function renderItems(items) {
  todoList.innerHTML = "";

  const grouped = {};

  items.forEach(item => {
    if (!item.name || !item.amount || !item.unit || !item.category) return;
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  Object.entries(grouped).forEach(([category, items]) => {
    const section = document.createElement("div");
    section.className = "category-section";

    const h3 = document.createElement("h3");
    h3.textContent = category;
    section.appendChild(h3);

    const ul = document.createElement("ul");

    items.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} – ${item.amount} ${item.unit}`;

      if (item.done) li.classList.add("done");

      li.addEventListener("click", async () => {
        await updateDoc(doc(db, "items", item.id), {
          done: !item.done
        });
      });

      ul.appendChild(li);
    });

    section.appendChild(ul);
    todoList.appendChild(section);
  });
}