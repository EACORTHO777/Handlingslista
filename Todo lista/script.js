// 🔥 Firebase v9 (MODULAR)
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

// ✅ Firebase config
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

// DOM
const itemInput = document.getElementById("item-input");
const quantityInput = document.getElementById("quantity-input");
const unitInput = document.getElementById("unit-input");
const categoryInput = document.getElementById("category-input");
const addBtn = document.getElementById("add-btn");
const clearBtn = document.getElementById("clear-btn");
const todoList = document.getElementById("todo-list");

// DATA
let items = [];

// 📡 REALTIME LISTENER (DETTA ÄR MAGIN)
onSnapshot(collection(db, "items"), snapshot => {
  items = snapshot.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
  render();
});

// ➕ ADD ITEM
addBtn.addEventListener("click", async () => {
  if (!itemInput.value || !categoryInput.value) return;

  await addDoc(collection(db, "items"), {
    name: itemInput.value,
    quantity: quantityInput.value || 1,
    unit: unitInput.value,
    category: categoryInput.value,
    done: false,
    createdAt: Date.now()
  });

  itemInput.value = "";
  quantityInput.value = "";
  categoryInput.value = "";
});

// 🧹 CLEAR ALL
clearBtn.addEventListener("click", async () => {
  for (const item of items) {
    await deleteDoc(doc(db, "items", item.id));
  }
});

// 🎨 RENDER
function render() {
  todoList.innerHTML = "";

  const categories = [...new Set(items.map(i => i.category))];

  categories.forEach(category => {
    const section = document.createElement("div");
    section.className = "category-section";

    const h3 = document.createElement("h3");
    h3.textContent = category;
    section.appendChild(h3);

    const ul = document.createElement("ul");

    items
      .filter(i => i.category === category)
      .forEach(item => {
        const li = document.createElement("li");
        li.textContent = `${item.name} (${item.quantity} ${item.unit})`;

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