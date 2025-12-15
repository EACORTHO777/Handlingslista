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
  updateDoc
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

// ================= DOM =================
const itemInput = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addBtn = document.getElementById("add-btn");
const clearBtn = document.getElementById("clear-btn");
const todoList = document.getElementById("todo-list");

let items = [];

// ================= REALTIME LISTENER =================
onSnapshot(collection(db, "items"), snapshot => {
  items = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(item => item.name && item.category) // 🔥 tar bort skräp
    .sort((a, b) => b.createdAt - a.createdAt); // 🔥 nyast först

  renderItems();
});

// ================= ADD ITEM =================
addBtn.addEventListener("click", async () => {
  console.log("🟢 Klick på Lägg till");

  const name = itemInput.value.trim();
  const amount = quantityInput.value || "1";
  const unit = unitInput.value;
  const category = categoryInput.value || "Test";

  console.log("📦 Values:", { name, amount, unit, category });

  try {
    const docRef = await addDoc(collection(db, "items"), {
      name,
      amount,
      unit,
      category,
      done: false,
      createdAt: Date.now()
    });

    console.log("✅ addDoc klar, id:", docRef.id);
  } catch (err) {
    console.error("❌ addDoc FEL:", err);
  }

  itemInput.value = "";
  quantityInput.value = "";
  categoryInput.value = "";
});

// ================= CLEAR =================
clearBtn.addEventListener("click", async () => {
  for (const item of items) {
    await deleteDoc(doc(db, "items", item.id));
  }
});

// ================= RENDER =================
function renderItems() {
  todoList.innerHTML = "";

  items.forEach(item => {
    const amountText =
      item.amount && item.unit
        ? ` (${item.amount} ${item.unit})`
        : "";

    const div = document.createElement("div");
    div.textContent = `${item.name}${amountText}`;

    div.style.cursor = "pointer";
    if (item.done) div.style.textDecoration = "line-through";

    div.addEventListener("click", async () => {
      await updateDoc(doc(db, "items", item.id), {
        done: !item.done
      });
    });

    todoList.appendChild(div);
  });
}

// ================= SERVICE WORKER REGISTER =================
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./service-worker.js")
      .then(reg => console.log("✅ Service Worker registrerad", reg))
      .catch(err => console.error("❌ SW-fel", err));
  });
}