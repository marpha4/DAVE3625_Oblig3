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

// Lager en kategorimeny med ikoner. Valgt kategori lagres i et skjult felt,
// så resten av koden kan lese den med .value som før
function setupCategoryPicker(input) {
  const root = input.closest(".category-picker");
  const button = root.querySelector(".category-toggle");
  const menu = root.querySelector(".category-menu");

  CATEGORIES.forEach((c) => {
    const li = document.createElement("li");
    const item = document.createElement("button");
    item.type = "button";
    item.className = "dropdown-item d-flex align-items-center gap-2";
    item.dataset.id = c.id;
    item.innerHTML = `<i class="bi ${c.icon} category-icon"></i>`;
    item.append(c.name);
    item.addEventListener("click", () => set(c.id));
    li.appendChild(item);
    menu.appendChild(li);
  });

  function set(id) {
    const category = CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
    input.value = category.id;
    button.innerHTML = `<i class="bi ${category.icon} category-icon me-2"></i>`;
    button.append(category.name);
    menu.querySelectorAll(".dropdown-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === category.id);
    });
  }

  set(input.value);
  return { set };
}

const addCategoryPicker = setupCategoryPicker(categoryInput);
const editCategoryPicker = setupCategoryPicker(editCategory);
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
  // id er tidspunktet varen ble laget, så eldre varer får riktig dato
  createdAt: Number(item.id) || Date.now(),
  ...item,
}));

// Husarbeid
const CHORES_KEY = "husholdning_husarbeid";
let chores = load(CHORES_KEY, []);
let choreFilter = "alle";

// Formaterer et tidspunkt, f.eks. «i dag 21:22», «i går 18:05» eller «20. okt. 14:10»
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const time = date.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" });

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysAgo = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (daysAgo === 0) return `i dag ${time}`;
  if (daysAgo === 1) return `i går ${time}`;

  const options = { day: "numeric", month: "short" };
  if (date.getFullYear() !== now.getFullYear()) options.year = "numeric";
  return `${date.toLocaleDateString("nb-NO", options)} ${time}`;
}

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
    localStorage.setItem(CHORES_KEY, JSON.stringify(chores));
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
  renderChores();
  renderTabCounts();
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
  addedBy.className = "small text-muted d-flex align-items-baseline gap-1";
  const member = members.find((m) => m.id === item.addedBy);
  const dot = document.createElement("span");
  dot.className = "member-dot";
  dot.style.background = member ? member.color : item.addedByColor;
  const who = document.createElement("span");
  // «Lagt til av» og datoen står i samme tekst, så linjen brytes naturlig på mobil
  const addedByName = member ? member.name : item.addedByName;

  // Hvis den som la til varen også endret den sist, vises «Endret» på samme linje.
  // Hvis noen andre endret den, vises det på en egen linje under.
  // Eldre endringer uten lagret person regnes som gjort av den som la til varen
  const editedBySelf =
    Boolean(item.updatedAt) && (!item.updatedBy || item.updatedBy === item.addedBy);
  const lineDate = editedBySelf ? item.updatedAt : item.createdAt;
  who.textContent = editedBySelf
    ? `Lagt til av ${addedByName} · Endret: ${formatDate(lineDate)}`
    : `Lagt til av ${addedByName} · ${formatDate(lineDate)}`;
  who.title = new Date(lineDate).toLocaleString("nb-NO");
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

  // Endret av en annen enn den som la til varen
  if (item.updatedAt && !editedBySelf) {
    const editor = members.find((m) => m.id === item.updatedBy);
    const editorName = editor ? editor.name : item.updatedByName;

    const updated = document.createElement("div");
    updated.className = "small text-muted d-flex align-items-baseline gap-1";
    const editorDot = document.createElement("span");
    editorDot.className = "member-dot";
    editorDot.style.background = editor ? editor.color : item.updatedByColor;
    const editorText = document.createElement("span");
    editorText.textContent = `Endret av ${editorName} · ${formatDate(item.updatedAt)}`;
    editorText.title = new Date(item.updatedAt).toLocaleString("nb-NO");
    updated.append(editorDot, editorText);
    text.appendChild(updated);
  }

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
    markUpdated(existing, current);
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
    createdAt: Date.now(),
  });
  render();
}

// Lagrer når og av hvem en vare sist ble endret
function markUpdated(item, member) {
  item.updatedAt = Date.now();
  if (!member) return;
  item.updatedBy = member.id;
  // Navn og farge lagres i tilfelle medlemmet fjernes senere
  item.updatedByName = member.name;
  item.updatedByColor = member.color;
}

function openEditItem(id) {
  const item = shoppingItems.find((i) => i.id === id);
  if (!item) return;
  editingId = id;
  editName.value = item.name;
  editQuantity.value = item.quantity;
  editCategoryPicker.set(item.category);
  editComment.value = item.comment;
  bootstrap.Modal.getOrCreateInstance(editItemModal).show();
}

editItemModal.addEventListener("shown.bs.modal", () => editName.focus());

editItemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const item = shoppingItems.find((i) => i.id === editingId);
  const name = editName.value.trim();
  if (!item || !name) return;

  const changes = {
    name,
    quantity: Math.min(99, Math.max(1, parseInt(editQuantity.value, 10) || 1)),
    category: editCategory.value,
    comment: editComment.value.trim(),
  };

  // Oppdaterer bare «Endret» datoen hvis noe faktisk ble endret
  const changed = Object.keys(changes).some((key) => changes[key] !== item[key]);
  if (changed) {
    Object.assign(item, changes);
    markUpdated(item, getCurrentMember());
  }

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

// ===== Husarbeid =====

const choreForm = document.getElementById("choreForm");
const choreInput = document.getElementById("choreInput");
const assigneeInput = document.getElementById("assigneeInput");
const choresList = document.getElementById("choresList");
const choresEmpty = document.getElementById("choresEmpty");
const choresCount = document.getElementById("choresCount");
const choresNoMember = document.getElementById("choresNoMember");
const filterButtons = document.querySelectorAll("[data-filter]");

// Meny for å velge ansvarlig. Valgt medlem lagres i et skjult felt
function setupMemberPicker(input) {
  const root = input.closest(".member-picker");
  const button = root.querySelector(".member-toggle");
  const menu = root.querySelector(".member-menu");

  function set(id) {
    const member = members.find((m) => m.id === id);
    input.value = member ? member.id : "";
    button.innerHTML = "";
    if (member) {
      const name = document.createElement("span");
      name.textContent = member.name;
      button.append(createAvatar(member, true), name);
    } else {
      button.innerHTML = '<i class="bi bi-person-dash text-muted"></i>';
      button.append("Ikke tildelt");
    }
    menu.querySelectorAll(".dropdown-item").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === input.value);
    });
  }

  // Bygger listen på nytt når medlemmer legges til eller fjernes
  function refresh() {
    menu.innerHTML = "";
    const options = [{ id: "", name: "Ikke tildelt" }, ...members];
    options.forEach((m) => {
      const li = document.createElement("li");
      const item = document.createElement("button");
      item.type = "button";
      item.className = "dropdown-item d-flex align-items-center gap-2";
      item.dataset.id = m.id;
      if (m.id) {
        item.appendChild(createAvatar(m, true));
      } else {
        item.innerHTML = '<i class="bi bi-person-dash"></i>';
      }
      const name = document.createElement("span");
      name.textContent = m.name;
      item.appendChild(name);
      item.addEventListener("click", () => set(m.id));
      li.appendChild(item);
      menu.appendChild(li);
    });
    set(input.value);
  }

  return { set, refresh };
}

const assigneePicker = setupMemberPicker(assigneeInput);
let assigneeChosen = false;

function renderChores() {
  const current = getCurrentMember();
  const hasMember = Boolean(current);
  [...choreForm.elements].forEach((el) => (el.disabled = !hasMember));
  choresNoMember.hidden = hasMember;

  // Ansvarlig er som standard den som er logget inn, til man velger noe annet
  if (!assigneeChosen && current) assigneeInput.value = current.id;
  assigneePicker.refresh();

  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === choreFilter);
    btn.setAttribute("aria-pressed", btn.dataset.filter === choreFilter);
    if (btn.dataset.filter === "mine") btn.disabled = !hasMember;
  });

  const visible = chores
    .filter((c) => choreFilter === "alle" || (current && c.assignedTo === current.id))
    .sort((a, b) => a.done - b.done || a.createdAt - b.createdAt);

  choresList.innerHTML = "";
  visible.forEach((chore) => choresList.appendChild(createChoreItem(chore)));

  choresEmpty.hidden = visible.length > 0;
  choresEmpty.textContent =
    choreFilter === "mine" ? "Du har ingen oppgaver." : "Ingen oppgaver ennå.";

  choresCount.textContent = chores.filter((c) => !c.done).length;
}

// Lager en linje med fargeprikk og tekst for et medlem
function memberLine(memberId, fallbackName, fallbackColor, text, className = "") {
  const line = document.createElement("div");
  line.className = `small d-flex align-items-baseline gap-1 ${className}`;
  const member = members.find((m) => m.id === memberId);
  const dot = document.createElement("span");
  dot.className = "member-dot";
  dot.style.background = member ? member.color : fallbackColor || "";
  const label = document.createElement("span");
  label.textContent = text(member ? member.name : fallbackName);
  line.append(dot, label);
  return line;
}

function createChoreItem(chore) {
  const li = document.createElement("li");
  li.className = "list-group-item d-flex align-items-center gap-3 px-0";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "form-check-input mt-0 flex-shrink-0";
  checkbox.checked = chore.done;
  checkbox.setAttribute("aria-label", `Gjort: ${chore.title}`);
  checkbox.addEventListener("change", () => toggleChore(chore.id));

  const text = document.createElement("div");
  text.className = "flex-grow-1";

  const title = document.createElement("div");
  title.className = chore.done ? "item-name done text-muted" : "item-name";
  title.textContent = chore.title;
  text.appendChild(title);

  if (chore.assignedTo) {
    text.appendChild(
      memberLine(chore.assignedTo, chore.assignedToName, chore.assignedToColor,
        (name) => `Ansvarlig: ${name}`, "text-muted")
    );
  } else {
    const line = document.createElement("div");
    line.className = "small text-muted";
    line.textContent = "Ikke tildelt";
    text.appendChild(line);
  }

  // Viser hvem som gjorde oppgaven og når
  if (chore.done) {
    const doneLine = memberLine(chore.doneBy, chore.doneByName, chore.doneByColor,
      (name) => `Gjort av ${name} · ${formatDate(chore.doneAt)}`, "chore-done-by");
    doneLine.title = new Date(chore.doneAt).toLocaleString("nb-NO");
    text.appendChild(doneLine);
  }

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn-sm btn-outline-secondary flex-shrink-0";
  removeBtn.innerHTML = '<i class="bi bi-x-lg"></i>';
  removeBtn.title = `Slett ${chore.title}`;
  removeBtn.addEventListener("click", () => deleteChore(chore.id));

  li.append(checkbox, text, removeBtn);
  return li;
}

function addChore(title, assignedTo) {
  const trimmed = title.trim();
  const current = getCurrentMember();
  if (!trimmed || !current) return;

  const assignee = members.find((m) => m.id === assignedTo);
  chores.push({
    id: Date.now().toString(),
    title: trimmed,
    assignedTo: assignee ? assignee.id : "",
    // Navn og farge lagres i tilfelle medlemmet fjernes senere
    assignedToName: assignee ? assignee.name : "",
    assignedToColor: assignee ? assignee.color : "",
    done: false,
    createdAt: Date.now(),
    createdBy: current.id,
  });
  render();
}

function toggleChore(id) {
  const chore = chores.find((c) => c.id === id);
  const current = getCurrentMember();
  if (!chore) return;

  chore.done = !chore.done;
  if (chore.done && current) {
    chore.doneBy = current.id;
    chore.doneByName = current.name;
    chore.doneByColor = current.color;
    chore.doneAt = Date.now();
  } else {
    delete chore.doneBy;
    delete chore.doneByName;
    delete chore.doneByColor;
    delete chore.doneAt;
  }
  render();
}

async function deleteChore(id) {
  const chore = chores.find((c) => c.id === id);
  if (!chore) return;
  const ok = await confirmAction(`«${chore.title}» blir slettet fra husarbeid.`);
  if (!ok) return;
  chores = chores.filter((c) => c.id !== id);
  render();
}

assigneeInput.closest(".member-picker").addEventListener("click", (event) => {
  if (event.target.closest(".dropdown-item")) assigneeChosen = true;
});

choreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addChore(choreInput.value, assigneeInput.value);
  choreInput.value = "";
  choreInput.focus();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    choreFilter = btn.dataset.filter;
    render();
  });
});

// ===== Sider =====

// Viser én side om gangen ut fra adressen, f.eks. index.html#husarbeid.
// Da fungerer tilbakeknappen, og man kan lenke rett til en side.
const PAGES = {
  handleliste: "Handleliste",
  husarbeid: "Husarbeid",
};
const pageLinks = document.querySelectorAll("[data-page]");
const tabShoppingCount = document.getElementById("tabShoppingCount");
const tabChoresCount = document.getElementById("tabChoresCount");

function showPage() {
  const requested = location.hash.slice(1);
  const page = PAGES[requested] ? requested : "handleliste";

  document.querySelectorAll(".page").forEach((section) => {
    section.hidden = section.id !== page;
  });

  pageLinks.forEach((link) => {
    const active = link.dataset.page === page;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });

  document.title = `${PAGES[page]} · Husholdningen`;
}

// Antall som gjenstår vises også i fanene
function renderTabCounts() {
  tabShoppingCount.textContent = shoppingItems.filter((i) => !i.done).length;
  tabChoresCount.textContent = chores.filter((c) => !c.done).length;
}

window.addEventListener("hashchange", showPage);

// Setter fokus på navnefeltet når vinduet åpnes
memberModal.addEventListener("shown.bs.modal", () => nameInput.focus());

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addMember(nameInput.value, colorInput.value);
  nameInput.value = "";
  nameInput.focus();
});

showPage();
render();