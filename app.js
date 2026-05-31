const STORAGE_KEY = "bikeSpot.current";
const displayNumber = document.querySelector("#displayNumber");
const statusText = document.querySelector("#statusText");
const savedAt = document.querySelector("#savedAt");
const spotInput = document.querySelector("#spotInput");
const entryForm = document.querySelector("#entryForm");
const saveButton = document.querySelector("#saveButton");
const editButton = document.querySelector("#editButton");
const doneButton = document.querySelector("#doneButton");
const deleteButton = document.querySelector("#deleteButton");
const clearInputButton = document.querySelector("#clearInputButton");
const toast = document.querySelector("#toast");

let toastTimer = 0;

function sanitize(value) {
  return value.replace(/\D/g, "").slice(0, 4);
}

function getStoredSpot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredSpot(number) {
  const payload = {
    number,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

function formatTime(iso) {
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1500);
}

function render() {
  const current = getStoredSpot();
  const inputValue = sanitize(spotInput.value);
  spotInput.value = inputValue;

  if (current?.number) {
    displayNumber.textContent = current.number;
    statusText.textContent = "保存中の番号";
    savedAt.textContent = `${formatTime(current.savedAt)} 保存`;
    saveButton.textContent = "変更";
    editButton.disabled = false;
    doneButton.disabled = false;
    return;
  }

  displayNumber.textContent = inputValue || "----";
  statusText.textContent = "番号を入力してください";
  savedAt.textContent = "保存された番号はありません";
  saveButton.textContent = "保存";
  editButton.disabled = true;
  doneButton.disabled = true;
}

function saveCurrentInput() {
  const number = sanitize(spotInput.value);
  if (number.length < 2) {
    showToast("番号を入力してください");
    spotInput.focus();
    return;
  }

  setStoredSpot(number);
  spotInput.value = "";
  render();
  showToast(`${number} を保存しました`);
}

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentInput();
});

spotInput.addEventListener("input", render);

document.querySelectorAll("[data-digit]").forEach((button) => {
  button.addEventListener("click", () => {
    spotInput.value = sanitize(`${spotInput.value}${button.dataset.digit}`);
    render();
  });
});

deleteButton.addEventListener("click", () => {
  spotInput.value = spotInput.value.slice(0, -1);
  render();
});

clearInputButton.addEventListener("click", () => {
  spotInput.value = "";
  render();
  spotInput.focus();
});

editButton.addEventListener("click", () => {
  const current = getStoredSpot();
  if (!current?.number) return;
  spotInput.value = current.number;
  localStorage.removeItem(STORAGE_KEY);
  render();
  spotInput.focus();
});

doneButton.addEventListener("click", () => {
  const current = getStoredSpot();
  localStorage.removeItem(STORAGE_KEY);
  spotInput.value = "";
  render();
  showToast(current?.number ? `${current.number} 精算完了` : "完了");
  spotInput.focus();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

render();
spotInput.focus();
