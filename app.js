const STORAGE_KEY = "bikeSpot.current";
const HISTORY_KEY = "bikeSpot.history";
const MAX_HISTORY = 3;
const displayNumber = document.querySelector("#displayNumber");
const statusText = document.querySelector("#statusText");
const savedAt = document.querySelector("#savedAt");
const panel = document.querySelector(".panel");
const spotInput = document.querySelector("#spotInput");
const entryForm = document.querySelector("#entryForm");
const saveButton = document.querySelector("#saveButton");
const editButton = document.querySelector("#editButton");
const doneButton = document.querySelector("#doneButton");
const deleteButton = document.querySelector("#deleteButton");
const clearInputButton = document.querySelector("#clearInputButton");
const historySection = document.querySelector("#historySection");
const historyList = document.querySelector("#historyList");
const toast = document.querySelector("#toast");

let toastTimer = 0;
let autoSaveTimer = 0;

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

function getHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.number).slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function setHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

function rememberNumber(number) {
  const next = [
    { number, savedAt: new Date().toISOString() },
    ...getHistory().filter((item) => item.number !== number),
  ];
  setHistory(next);
}

function setStoredSpot(number) {
  const payload = {
    number,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  rememberNumber(number);
  return payload;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clearExpiredSpot() {
  const current = getStoredSpot();
  if (!current?.savedAt) return;

  if (localDateKey(new Date(current.savedAt)) !== localDateKey(new Date())) {
    localStorage.removeItem(STORAGE_KEY);
    showToast("前回の番号をリセットしました");
  }
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

function renderHistory(currentNumber) {
  const history = getHistory().filter((item) => item.number !== currentNumber);
  historyList.textContent = "";
  historySection.hidden = Boolean(currentNumber) || history.length === 0;

  history.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "history-chip";
    button.textContent = item.number;
    button.addEventListener("click", () => {
      spotInput.value = item.number;
      render();
      spotInput.focus();
    });
    historyList.append(button);
  });
}

function render() {
  const current = getStoredSpot();
  const inputValue = sanitize(spotInput.value);
  spotInput.value = inputValue;

  if (current?.number) {
    panel.classList.add("is-saved");
    displayNumber.textContent = current.number;
    statusText.textContent = "保存中の番号";
    savedAt.textContent = `${formatTime(current.savedAt)} 保存`;
    saveButton.textContent = "変更";
    editButton.disabled = false;
    doneButton.disabled = false;
    renderHistory(current.number);
    return;
  }

  panel.classList.remove("is-saved");
  displayNumber.textContent = inputValue || "----";
  statusText.textContent = "番号を入力してください";
  savedAt.textContent = "保存された番号はありません";
  saveButton.textContent = "保存";
  editButton.disabled = true;
  doneButton.disabled = true;
  renderHistory();
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

function scheduleAutoSave() {
  window.clearTimeout(autoSaveTimer);
  if (getStoredSpot()) return;

  const number = sanitize(spotInput.value);
  if (number.length === 3) {
    autoSaveTimer = window.setTimeout(saveCurrentInput, 650);
  }
}

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveCurrentInput();
});

spotInput.addEventListener("input", () => {
  render();
  scheduleAutoSave();
});

document.querySelectorAll("[data-digit]").forEach((button) => {
  button.addEventListener("click", () => {
    spotInput.value = sanitize(`${spotInput.value}${button.dataset.digit}`);
    render();
    scheduleAutoSave();
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

clearExpiredSpot();
render();
spotInput.focus();
