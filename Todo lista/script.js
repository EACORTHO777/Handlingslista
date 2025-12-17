console.log("🔥 script.js laddad – SMART AUTO-KATEGORI");

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

// ================= SMART AUTO MAP =================
let learnedMap = JSON.parse(localStorage.getItem("learnedMap")) || {};

const AUTO_RULES = [
  {
    words: ["banan", "bananer", "banana"],
    category: "Frukt & grönt",
    unit: "kg"
  },
  {
    words: ["äpple", "apples", "apple"],
    category: "Frukt & grönt",
    unit: "kg"
  },
  {
    words: ["potatis", "potato"],
    category: "Frukt & grönt",
    unit: "kg"
  },
  {
    words: ["mjölk", "milk"],
    category: "Mejeri",
    unit: "st"
  },
  {
    words: ["ost", "cheese"],
    category: "Mejeri",
    unit: "st"
  },
  {
    words: ["smör", "butter"],
    category: "Mejeri",
    unit: "st"
  },
  {
    words: ["kyckling", "chicken"],
    category: "Kött & fisk",
    unit: "kg"
  },
  {
    words: ["kött", "beef", "meat"],
    category: "Kött & fisk",
    unit: "kg"
  },
  {
    words: ["lax", "salmon", "fish"],
    category: "Kött & fisk",
    unit: "kg"
  },
  {
    words: ["pasta"],
    category: "Pasta",
    unit: "st"
  },
  {
    words: ["ris", "rice"],
    category: "Ris",
    unit: "kg"
  },
  {
    words: ["ketchup"],
    category: "Ketchup",
    unit: "st"
  },
  {
    words: ["kaffe", "coffee"],
    category: "Kaffe",
    unit: "st"
  },
  {
    words: ["te", "tea"],
    category: "Kaffe",
    unit: "st"
  }
];

// ================= AUTO-DETECT =================
function detectFromText(text) {
  const value = text.toLowerCase();

  // 1️⃣ kolla om appen har lärt sig tidigare
  for (const key in learnedMap) {
    if (value.includes(key)) {
      return learnedMap[key];
    }
  }

  // 2️⃣ annars kolla fasta regler
  for (const rule of AUTO_RULES) {
    for (const word of rule.words) {
      if (value.includes(word)) {
        return {
          category: rule.category,
          unit: rule.unit
        };
      }
    }
  }

  return null;
}

// ================= INPUT LISTENER =================
itemInput.addEventListener("input", () => {
  const text = itemInput.value.trim();
  if (!text) return;

  const result = detectFromText(text);
  if (!result) return;

  if (result.category) categoryInput.value = result.category;
  if (result.unit) unitInput.value = result.unit;
});

// ================= ADD ITEM =================
addBtn.addEventListener("click", () => {
  const name = itemInput.value.trim();
  const amount = quantityInput.value;
  const unit = unitInput.value;
  const category = categoryInput.value;

  if (!name || !amount || !unit || !category) return;

  // 🤖 LÄR SIG: spara första ordet
  const firstWord = name.toLowerCase().split(" ")[0];
  learnedMap[firstWord] = { category, unit };
  localStorage.setItem("learnedMap", JSON.stringify(learnedMap));

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
  itemInput.focus();
});

// ================= CLEAR =================
clearBtn.addEventListener("click", () => {
  if (!confirm("Rensa hela listan?")) return;
  remove(itemsRef);
});

// ================= RENDER =================
const SECTION_ORDER = [
  { title: "🥦 Frukt & Grönt / Skafferi mat", categories: ["Frukt & grönt", "Skafferi"] },
  { title: "☕️ Kaffe / Skafferi bak", categories: ["Kaffe", "Bakning"] },
  { title: "🥩 Kött & Fisk", categories: ["Kött & fisk"] },
  { title: "🧀 Mejeri / Frys", categories: ["Mejeri", "Frysvaror"] },
  { title: "🧼 Hygien / Hushåll / LEÅ", categories: ["Hygien", "Hushåll", "Leå"] },
  { title: "🍝 Pasta / Ris / Ketchup", categories: ["Pasta", "Ris", "Ketchup"] },
  { title: "🥤 Drycker & NJIÅM", categories: ["Drycker", "Njiåm"] }
];

onValue(itemsRef, snapshot => {
  const data = snapshot.val() || {};
  const items = Object.entries(data).map(([id, value]) => ({
    id,
    ...value
  }));
  renderItems(items);
});

function renderItems(items) {
  todoList.innerHTML = "";

  const active = items.filter(i => !i.done);
  const done = items.filter(i => i.done);

  SECTION_ORDER.forEach(section => {
    const list = active.filter(i => section.categories.includes(i.category));
    if (!list.length) return;

    const card = document.createElement("div");
    card.className = "category-section";

    const h3 = document.createElement("h3");
    h3.textContent = section.title;
    card.appendChild(h3);

    const ul = document.createElement("ul");

    list.forEach(item => {
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

  if (done.length) {
    const card = document.createElement("div");
    card.className = "category-section";

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