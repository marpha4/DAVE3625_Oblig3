// Nøkler for lagring i localStorage
const MEMBERS_KEY = "husholdning_medlemmer";
const CURRENT_KEY = "husholdning_valgt_medlem";

// Elementer i headeren
const profileAvatar = document.getElementById("profileAvatar");
const profileName = document.getElementById("profileName");
const profileListAnchor = document.getElementById("profileListAnchor");
const profileMenu = profileListAnchor.parentElement;

// Elementer i medlemsvinduet
const memberModal = document.getElementById("memberModal");
const memberList = document.getElementById("memberList");
const emptyText = document.getElementById("emptyText");
const memberForm = document.getElementById("memberForm");
const nameInput = document.getElementById("nameInput");
const colorInput = document.getElementById("colorInput");

// Innhold
const welcomeText = document.getElementById("welcomeText");

// Elementer i handlelisten
const SHOPPING_KEY = "husholdning_handleliste";
const shoppingForm = document.getElementById("shoppingForm");
const itemInput = document.getElementById("itemInput");
const quantityInput = document.getElementById("quantityInput");
const categoryInput = document.getElementById("categoryInput");
const commentInput = document.getElementById("commentInput");

// Kategorier i den rekkefølgen de vises i listen
const CATEGORIES = [
  { id: "frukt", name: "Frukt og grønt", icon: "bi-apple" },
  { id: "meieri", name: "Meieri og egg", icon: "bi-cup-straw" },
  { id: "kjott", name: "Kjøtt og fisk", icon: "bi-egg-fried" },
  { id: "brod", name: "Brød og bakervarer", icon: "bi-basket" },
  { id: "torr", name: "Tørrvarer", icon: "bi-box-seam" },
  { id: "frys", name: "Frysevarer", icon: "bi-snow" },
  { id: "drikke", name: "Drikke", icon: "bi-cup-hot" },
  { id: "vask", name: "Vaskemidler", icon: "bi-droplet" },
  { id: "hygiene", name: "Hygiene", icon: "bi-heart-pulse" },
  { id: "annet", name: "Annet", icon: "bi-three-dots" },
];

// Elementer i vinduet for å endre en vare
const editItemModal = document.getElementById("editItemModal");
const editItemForm = document.getElementById("editItemForm");
const editName = document.getElementById("editName");
const editQuantity = document.getElementById("editQuantity");
const editCategory = document.getElementById("editCategory");
const editComment = document.getElementById("editComment");
let editingId = null;

[categoryInput, editCategory].forEach((select) => {
  CATEGORIES.forEach((c) => {
    const option = document.createElement("option");
    option.value = c.id;
    option.textContent = c.name;
    select.appendChild(option);
  });
});
categoryInput.value = "annet";
const shoppingList = document.getElementById("shoppingList");
const shoppingEmpty = document.getElementById("shoppingEmpty");
const shoppingCount = document.getElementById("shoppingCount");
const shoppingNoMember = document.getElementById("shoppingNoMember");
const clearCheckedBtn = document.getElementById("clearCheckedBtn");

// Laster lagrede data, eller starter tomt
let members = load(MEMBERS_KEY, []);
let currentId = load(CURRENT_KEY, null);
// Varer lagret før antall og kategori fantes får standardverdier
let shoppingItems = load(SHOPPING_KEY, []).map((item) => ({
  quantity: 1,
  category: "annet",
  comment: "",
  ...item,
}));

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save() {
  try {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
    localStorage.setItem(CURRENT_KEY, JSON.stringify(currentId));
    localStorage.setItem(SHOPPING_KEY, JSON.stringify(shoppingItems));
  } catch {
    alert("Kunne ikke lagre data i nettleseren.");
  }
}

// Viser et bekreftelsesvindu og svarer true hvis brukeren trykker Slett
const confirmModalEl = document.getElementById("confirmModal");
const confirmMessage = document.getElementById("confirmMessage");
const confirmOk = document.getElementById("confirmOk");
const confirmList = document.getElementById("confirmList");
const confirmModal = new bootstrap.Modal(confirmModalEl);

// items er en valgfri liste med tekst som vises under meldingen
function confirmAction(message, okText = "Slett", items = []) {
  return new Promise((resolve) => {
    let confirmed = false;
    confirmMessage.textContent = message;
    confirmList.innerHTML = "";
    confirmList.hidden = items.length === 0;
    items.forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      confirmList.appendChild(li);
    });
    confirmOk.textContent = okText;

    const onOk = () => {
      confirmed = true;
      confirmModal.hide();
    };
    const onHidden = () => {
      confirmOk.removeEventListener("click", onOk);
      resolve(confirmed);
    };

    confirmOk.addEventListener("click", onOk);
    confirmModalEl.addEventListener("hidden.bs.modal", onHidden, { once: true });
    confirmModal.show();
  });
}

confirmModalEl.addEventListener("shown.bs.modal", () => confirmOk.focus());

function getCurrentMember() {
  return members.find((m) => m.id === currentId);
}

function createAvatar(member, small = false) {
  const avatar = document.createElement("span");
  avatar.className = small ? "avatar small" : "avatar";
  avatar.style.background = member.color;
  avatar.textContent = member.name.charAt(0).toUpperCase();
  return avatar;
}

// Tegner alt på nytt
function render() {
  if (!getCurrentMember()) {
    currentId = members.length > 0 ? members[0].id : null;
  }

  renderProfile();
  renderProfileMenu();
  renderMemberList();
  renderShoppingList();
  save();
}

function renderProfile() {
  const current = getCurrentMember();
  if (current) {
    profileAvatar.textContent = current.name.charAt(0).toUpperCase();
    profileAvatar.style.background = current.color;
    profileName.textContent = current.name;
    welcomeText.textContent = `Hei, ${current.name}!`;
  } else {
    profileAvatar.textContent = "?";
    profileAvatar.style.background = "";
    profileName.textContent = "Ingen profil";
    welcomeText.textContent = "Velkommen! Legg til et medlem for å starte.";
  }
}

function renderProfileMenu() {
  // Fjerner gamle elementer etter overskriften
  profileMenu.querySelectorAll(".profile-item").forEach((el) => el.remove());

  if (members.length === 0) {
    const li = document.createElement("li");
    li.className = "profile-item";
    li.innerHTML = '<span class="dropdown-item-text text-muted">Ingen medlemmer ennå</span>';
    profileMenu.appendChild(li);
  }

  members.forEach((m) => {
    const li = document.createElement("li");
    li.className = "profile-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dropdown-item d-flex align-items-center gap-2";
    if (m.id === currentId) btn.classList.add("active");

    const name = document.createElement("span");
    name.className = "flex-grow-1";
    name.textContent = m.name;

    btn.append(createAvatar(m, true), name);

    if (m.id === currentId) {
      const check = document.createElement("i");
      check.className = "bi bi-check-lg";
      btn.appendChild(check);
    }

    btn.addEventListener("click", () => {
      currentId = m.id;
      render();
    });

    li.appendChild(btn);
    profileMenu.appendChild(li);
  });

  // Snarvei til medlemsvinduet nederst i menyen
  const divider = document.createElement("li");
  divider.className = "profile-item";
  divider.innerHTML = '<hr class="dropdown-divider">';

  const manage = document.createElement("li");
  manage.className = "profile-item";
  manage.innerHTML =
    '<button class="dropdown-item" type="button" data-bs-toggle="modal" data-bs-target="#memberModal">' +
    '<i class="bi bi-gear me-2"></i>Administrer medlemmer</button>';

  profileMenu.append(divider, manage);
}

function renderMemberList() {
  memberList.innerHTML = "";
  emptyText.hidden = members.length > 0;
  memberList.hidden = members.length === 0;

  members.forEach((m) => {
    const li = document.createElement("li");
    li.className = "list-group-item d-flex align-items-center gap-2";

    const name = document.createElement("span");
    name.className = "flex-grow-1";
    name.textContent = m.name;

    li.append(createAvatar(m, true), name);

    if (m.id === currentId) {
      const badge = document.createElement("span");
      badge.className = "badge text-bg-primary";
      badge.textContent = "Deg";
      li.appendChild(badge);
    }

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-sm btn-outline-danger";
    removeBtn.innerHTML = '<i class="bi bi-trash"></i>';
    removeBtn.title = `Fjern ${m.name}`;
    removeBtn.addEventListener("click", () => removeMember(m.id));

    li.appendChild(removeBtn);
    memberList.appendChild(li);
  });
}

function addMember(name, color) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const exists = members.some(
    (m) => m.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (exists) {
    alert("Det finnes allerede et medlem med det navnet.");
    return;
  }

  const member = { id: Date.now().toString(), name: trimmed, color };
  members.push(member);

  // Første medlem blir automatisk valgt
  if (members.length === 1) currentId = member.id;
  render();
}

async function removeMember(id) {
  const member = members.find((m) => m.id === id);
  if (!member) return;
  const ok = await confirmAction(`${member.name} blir fjernet fra husholdningen.`, "Fjern");
  if (!ok) return;

  members = members.filter((m) => m.id !== id);
  render();
}

// ===== Handleliste =====

function renderShoppingList() {
  const hasMember = Boolean(getCurrentMember());
  [...shoppingForm.elements].forEach((el) => (el.disabled = !hasMember));
  shoppingNoMember.hidden = hasMember;

  shoppingList.innerHTML = "";
  shoppingEmpty.hidden = shoppingItems.length > 0;

  // Viser varene gruppert etter kategori
  CATEGORIES.forEach((category) => {
    const items = shoppingItems
      .filter((i) => i.category === category.id)
      .sort((a, b) => a.done - b.done); // ikke kjøpte varer først
    if (items.length === 0) return;

    const heading = document.createElement("h4");
    heading.className = "category-heading";
    heading.innerHTML = `<i class="bi ${category.icon}"></i>`;
    heading.append(` ${category.name}`);

    const ul = document.createElement("ul");
    ul.className = "list-group list-group-flush mb-3";
    items.forEach((item) => ul.appendChild(createShoppingItem(item)));

    shoppingList.append(heading, ul);
  });

  const remaining = shoppingItems.filter((i) => !i.done).length;
  const checked = shoppingItems.length - remaining;
  shoppingCount.textContent = remaining;
  shoppingCount.title = "Varer som ikke er kjøpt ennå";
  clearCheckedBtn.disabled = checked === 0;
}

function createShoppingItem(item) {
  const li = document.createElement("li");
  li.className = "list-group-item d-flex align-items-center gap-3 px-0";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "form-check-input mt-0 flex-shrink-0";
  checkbox.checked = item.done;
  checkbox.setAttribute("aria-label", `Kjøpt: ${item.name}`);
  checkbox.addEventListener("change", () => toggleItem(item.id));

  const text = document.createElement("div");
  text.className = "flex-grow-1";

  const name = document.createElement("div");

  // Viser hvem som la til varen
  const addedBy = document.createElement("div");
  addedBy.className = "small text-muted d-flex align-items-center gap-1";
  const member = members.find((m) => m.id === item.addedBy);
  const dot = document.createElement("span");
  dot.className = "member-dot";
  dot.style.background = member ? member.color : item.addedByColor;
  const who = document.createElement("span");
  who.textContent = `Lagt til av ${member ? member.name : item.addedByName}`;
  addedBy.append(dot, who);

  // Varenavn med antall til høyre. Streken settes på hele linjen
  // slik at den går sammenhengende over både navn og antall
  const label = document.createElement("span");
  label.textContent = item.name;
  const qty = document.createElement("span");
  qty.className = "small text-muted text-nowrap";
  qty.textContent = `${item.quantity} stk`;
  name.className = item.done ? "item-name done text-muted" : "item-name";
  name.append(label, "\u00a0\u00a0", qty);
  text.appendChild(name);

  // Kommentar vises under navnet hvis den finnes
  if (item.comment) {
    const comment = document.createElement("div");
    comment.className = "item-comment small";
    comment.innerHTML = '<i class="bi bi-chat-left-text"></i>';
    const commentText = document.createElement("span");
    commentText.textContent = item.comment;
    comment.appendChild(commentText);
    text.appendChild(comment);
  }

  text.appendChild(addedBy);

  const editBtn = document.createElement("button");
  editBtn.type = "button";
  editBtn.className = "btn btn-sm btn-outline-primary";
  editBtn.innerHTML = '<i class="bi bi-pencil"></i><span class="d-none d-sm-inline"> Endre</span>';
  editBtn.title = `Endre ${item.name}`;
  editBtn.addEventListener("click", () => openEditItem(item.id));

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn-sm btn-outline-secondary";
  removeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
  removeBtn.title = `Slett ${item.name}`;
  removeBtn.addEventListener("click", () => deleteItem(item.id));

  const actions = document.createElement("div");
  actions.className = "d-flex gap-1 flex-shrink-0";
  actions.append(editBtn, removeBtn);

  li.append(checkbox, text, actions);
  return li;
}

function addItem(name, quantity, category, comment = "") {
  const trimmed = name.trim();
  const current = getCurrentMember();
  if (!trimmed || !current) return;

  const amount = Math.min(99, Math.max(1, parseInt(quantity, 10) || 1));

  // Finnes varen allerede på listen, økes antallet i stedet for å lage en ny
  const existing = shoppingItems.find(
    (i) =>
      !i.done &&
      i.category === category &&
      i.name.toLowerCase() === trimmed.toLowerCase()
  );
  if (existing) {
    existing.quantity = Math.min(99, existing.quantity + amount);
    if (comment.trim()) existing.comment = comment.trim();
    render();
    return;
  }

  shoppingItems.push({
    id: Date.now().toString(),
    name: trimmed,
    quantity: amount,
    category,
    comment: comment.trim(),
    done: false,
    addedBy: current.id,
    // Lagrer navn og farge i tilfelle medlemmet fjernes senere
    addedByName: current.name,
    addedByColor: current.color,
  });
  render();
}

function openEditItem(id) {
  const item = shoppingItems.find((i) => i.id === id);
  if (!item) return;
  editingId = id;
  editName.value = item.name;
  editQuantity.value = item.quantity;
  editCategory.value = item.category;
  editComment.value = item.comment;
  bootstrap.Modal.getOrCreateInstance(editItemModal).show();
}

editItemModal.addEventListener("shown.bs.modal", () => editName.focus());

editItemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const item = shoppingItems.find((i) => i.id === editingId);
  const name = editName.value.trim();
  if (!item || !name) return;

  item.name = name;
  item.quantity = Math.min(99, Math.max(1, parseInt(editQuantity.value, 10) || 1));
  item.category = editCategory.value;
  item.comment = editComment.value.trim();
  bootstrap.Modal.getInstance(editItemModal).hide();
  render();
});

function toggleItem(id) {
  const item = shoppingItems.find((i) => i.id === id);
  if (!item) return;
  item.done = !item.done;
  render();
}

async function deleteItem(id) {
  const item = shoppingItems.find((i) => i.id === id);
  if (!item) return;
  const ok = await confirmAction(`«${item.name}» blir slettet fra handlelisten.`);
  if (!ok) return;
  shoppingItems = shoppingItems.filter((i) => i.id !== id);
  render();
}

async function clearChecked() {
  const checked = shoppingItems.filter((i) => i.done);
  const count = checked.length;
  if (count === 0) return;
  const text =
    count === 1
      ? "Denne avkryssede varen blir slettet:"
      : `Disse ${count} avkryssede varene blir slettet:`;
  const names = checked.map((i) => `${i.name} (${i.quantity} stk)`);
  const ok = await confirmAction(text, "Slett", names);
  if (!ok) return;
  shoppingItems = shoppingItems.filter((i) => !i.done);
  render();
}

shoppingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addItem(itemInput.value, quantityInput.value, categoryInput.value, commentInput.value);
  itemInput.value = "";
  quantityInput.value = 1;
  commentInput.value = "";
  itemInput.focus();
});

clearCheckedBtn.addEventListener("click", clearChecked);

// Setter fokus på navnefeltet når vinduet åpnes
memberModal.addEventListener("shown.bs.modal", () => nameInput.focus());

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addMember(nameInput.value, colorInput.value);
  nameInput.value = "";
  nameInput.focus();
});

render();