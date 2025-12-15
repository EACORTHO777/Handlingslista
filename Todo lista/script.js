// ===== FIREBASE (MODULAR v9) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// 🔑 DIN FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyB177SHk2mk3leIILG5U19rpNFhDEd_5CM",
  authDomain: "handlingslista-9204a.firebaseapp.com",
  projectId: "handlingslista-9204a",
  storageBucket: "handlingslista-9204a.appspot.com",
  messagingSenderId: "87606086562",
  appId: "1:87606086562:web:49d1daea84d64dfbe580fb"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== ELEMENT =====
const itemInput = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addButton = document.getElementById("add-btn");
const todoList = document.getElementById("todo-list");

// ===== STATE =====
let items = [];

// ===== ADD ITEM (SKRIVER TILL FIRESTORE) =====
addButton.addEventListener("click", async () => {
  const name = itemInput.value.trim();
  const qty = quantityInput.value.trim();
  const unit = unitInput.value;
  const category = categoryInput.value;

  if (!name || !category) return;

  await addDoc(collection(db, "items"), {
    name,
    amountText: qty ? `${qty} ${unit}` : "",
    category,
    done: false,
    createdAt: serverTimestamp()
  });

  itemInput.value = "";
  quantityInput.value = "";
  itemInput.focus();
});

// ===== REALTIME LYSSNING =====
onSnapshot(collection(db, "items"), snapshot => {
  items = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  renderItems();
});

// ===== RENDER =====
function renderItems() {
  todoList.innerHTML = "";

  items.forEach(item => {
    const div = document.createElement("div");
    div.textContent = `${item.name} (${item.amountText || "-"})`;
    todoList.appendChild(div);
  });
}

console.log("🔥 Firebase LIVE");