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

// Laster lagrede data, eller starter tomt
let members = load(MEMBERS_KEY, []);
let currentId = load(CURRENT_KEY, null);

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
  } catch {
    alert("Kunne ikke lagre data i nettleseren.");
  }
}

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

function removeMember(id) {
  const member = members.find((m) => m.id === id);
  if (!member) return;
  if (!confirm(`Vil du fjerne ${member.name}?`)) return;

  members = members.filter((m) => m.id !== id);
  render();
}

// Setter fokus på navnefeltet når vinduet åpnes
memberModal.addEventListener("shown.bs.modal", () => nameInput.focus());

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addMember(nameInput.value, colorInput.value);
  nameInput.value = "";
  nameInput.focus();
});

render();