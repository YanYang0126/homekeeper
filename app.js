const STORAGE_KEY = "family-home-page-v1";
const NOTIFY_KEY = "family-home-page-notified-v1";
const REMINDER_ENABLED_KEY = "family-home-page-reminder-enabled-v1";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

const state = loadData();

const elements = {
  searchInput: $("#searchInput"),
  alertPanel: $("#alertPanel"),
  fridgeForm: $("#fridgeForm"),
  clothesForm: $("#clothesForm"),
  dateForm: $("#dateForm"),
  storageForm: $("#storageForm"),
  restockForm: $("#restockForm"),
  fridgeList: $("#fridgeList"),
  clothesList: $("#clothesList"),
  dateList: $("#dateList"),
  storageList: $("#storageList"),
  restockList: $("#restockList"),
  clothesPhotoInput: $("#clothesPhotoInput"),
  storagePhotoInput: $("#storagePhotoInput"),
  clothesPhotoPreview: $("#clothesPhotoPreview"),
  storagePhotoPreview: $("#storagePhotoPreview"),
  imageDialog: $("#imageDialog"),
  dialogImage: $("#dialogImage"),
  dialogCaption: $("#dialogCaption"),
};

init();

function init() {
  registerServiceWorker();
  bindImageFallbacks();
  bindTabs();
  bindForms();
  bindButtons();
  bindPhotoPreview(elements.clothesPhotoInput, elements.clothesPhotoPreview);
  bindPhotoPreview(elements.storagePhotoInput, elements.storagePhotoPreview);
  updateReminderButton();
  render();
  checkBrowserNotifications(false);
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  if (!["http:", "https:"].includes(window.location.protocol)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}

function bindImageFallbacks() {
  $$(".qisi-corner").forEach((image) => {
    image.addEventListener("error", () => {
      const fallbackSrc = image.dataset.fallbackSrc;
      if (fallbackSrc && image.src.indexOf(fallbackSrc) === -1) {
        image.src = fallbackSrc;
        image.dataset.fallbackSrc = "";
        return;
      }
      image.classList.add("image-missing");
      const fallback = $(".qisi-fallback");
      if (fallback) fallback.classList.add("show");
    });
  });
}

function bindTabs() {
  $$(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      button.classList.remove("opening");
      void button.offsetWidth;
      button.classList.add("opening");
      window.setTimeout(() => button.classList.remove("opening"), 720);
      setActiveTab(button.dataset.tab, true);
    });
  });
}

function bindForms() {
  elements.fridgeForm.addEventListener("submit", handleFridgeSubmit);
  elements.clothesForm.addEventListener("submit", handleClothesSubmit);
  elements.dateForm.addEventListener("submit", handleDateSubmit);
  elements.storageForm.addEventListener("submit", handleStorageSubmit);
  elements.restockForm.addEventListener("submit", handleRestockSubmit);
  elements.searchInput.addEventListener("input", render);
}

function bindButtons() {
  $("#clearFridgeForm").addEventListener("click", () => resetFridgeForm());
  $("#clearClothesForm").addEventListener("click", () => resetClothesForm());
  $("#clearDateForm").addEventListener("click", () => resetDateForm());
  $("#clearStorageForm").addEventListener("click", () => resetStorageForm());
  $("#clearRestockForm").addEventListener("click", () => resetRestockForm());
  $("#exportClothesImageButton").addEventListener("click", exportClothesImage);
  $("#exportCalendarButton").addEventListener("click", exportCalendarFile);
  $("#notifyButton").addEventListener("click", toggleNotifications);
  $("#closeImageDialog").addEventListener("click", closeImageDialog);

  document.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-kind]");
    const deleteButton = event.target.closest("[data-delete-kind]");
    const photoButton = event.target.closest("[data-open-photo]");
    const storedItemButton = event.target.closest("[data-open-kind]");
    const photoTrigger = event.target.closest("[data-photo-trigger]");
    const furnitureButton = event.target.closest("[data-furniture]");
    const restockPreset = event.target.closest("[data-restock-preset]");

    if (furnitureButton) {
      toggleFurnitureDoor(furnitureButton);
      return;
    }

    if (photoTrigger) {
      openPhotoPicker(photoTrigger);
      return;
    }

    if (restockPreset) {
      fillRestockPreset(restockPreset);
      return;
    }

    if (storedItemButton) {
      openStoredItem(storedItemButton.dataset.openKind, storedItemButton.dataset.id);
      return;
    }

    if (editButton) {
      editItem(editButton.dataset.editKind, editButton.dataset.id);
      return;
    }

    if (deleteButton) {
      handleDeleteButton(deleteButton);
      return;
    }

    if (photoButton) {
      openImageDialog(photoButton.dataset.openPhoto, photoButton.dataset.caption || "照片");
      return;
    }
  });

  elements.imageDialog.addEventListener("click", (event) => {
    if (event.target === elements.imageDialog) closeImageDialog();
  });
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return normalizeData(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

function emptyData() {
  return {
    fridge: [],
    clothes: [],
    dates: [],
    storage: [],
    restock: [],
  };
}

function normalizeData(value) {
  const data = value && value.data ? value.data : value;
  return {
    fridge: Array.isArray(data?.fridge) ? data.fridge : [],
    clothes: Array.isArray(data?.clothes) ? data.clothes : [],
    dates: Array.isArray(data?.dates) ? data.dates : [],
    storage: Array.isArray(data?.storage) ? data.storage : [],
    restock: Array.isArray(data?.restock) ? data.restock : [],
  };
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    alert("保存失败：浏览器本地空间可能满了。可以删除一些照片后继续使用。");
    return false;
  }
}

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanText(value) {
  return String(value || "").trim();
}

function getFormData(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === "string") data[key] = cleanText(data[key]);
  });
  return data;
}

function upsert(kind, item) {
  const now = new Date().toISOString();
  const list = state[kind];
  const existingIndex = list.findIndex((entry) => entry.id === item.id);
  const previous = existingIndex >= 0 ? list[existingIndex] : null;
  const next = {
    ...previous,
    ...item,
    id: item.id || uid(),
    createdAt: previous?.createdAt || now,
    updatedAt: now,
  };

  if (existingIndex >= 0) {
    list[existingIndex] = next;
  } else {
    list.unshift(next);
  }
}

function setActiveTab(tabName, shouldScroll = false) {
  $$(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  $$(".tab-section").forEach((section) => {
    section.classList.toggle("active", section.id === `tab-${tabName}`);
  });

  if (shouldScroll) {
    const activeSection = $(`#tab-${tabName}`);
    if (activeSection) activeSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleFridgeSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.fridgeForm);
  upsert("fridge", {
    ...data,
    shelfLifeDays: Number(data.shelfLifeDays || 0),
  });
  if (saveData()) {
    resetFridgeForm();
    render();
  }
}

async function handleClothesSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.clothesForm);
  const previous = state.clothes.find((item) => item.id === data.id);
  const file = elements.clothesPhotoInput.files[0];
  const photo = file ? await compressImage(file, 1100, 0.8) : previous?.photo || "";

  upsert("clothes", {
    ...data,
    photo,
  });
  if (saveData()) {
    resetClothesForm();
    render();
  }
}

function handleDateSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.dateForm);
  upsert("dates", data);
  if (saveData()) {
    resetDateForm();
    render();
    checkBrowserNotifications(true);
  }
}

async function handleStorageSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.storageForm);
  const previous = state.storage.find((item) => item.id === data.id);
  const file = elements.storagePhotoInput.files[0];
  const photo = file ? await compressImage(file, 1000, 0.78) : previous?.photo || "";

  upsert("storage", {
    ...data,
    photo,
  });
  if (saveData()) {
    resetStorageForm();
    render();
  }
}

function handleRestockSubmit(event) {
  event.preventDefault();
  const data = getFormData(elements.restockForm);
  upsert("restock", data);
  if (saveData()) {
    resetRestockForm();
    render();
  }
}

function render() {
  renderScenes();
  renderAlerts();
  renderFridge();
  renderClothes();
  renderDates();
  renderStorage();
  renderRestock();
}

function renderScenes() {
  renderSceneItems("#fridgeSceneItems", "fridge", state.fridge, (item) => item.name, "冰箱还是空的");
  renderSceneItems("#clothesSceneItems", "clothes", state.clothes, (item) => item.name, "衣柜还没有记录");
  renderSceneItems("#dateSceneItems", "dates", getFutureDates(), (item) => {
    const diff = daysUntil(item.date);
    return diff >= 0 ? `${item.name} · ${diff === 0 ? "今天" : `${diff}天`}` : item.name;
  }, "还没有提醒事项");
  renderSceneItems("#storageSceneItems", "storage", state.storage, (item) => item.name, "柜子里还没有记录");
  renderSceneItems("#restockSceneItems", "restock", state.restock, (item) => item.name, "暂时没有补货项");
}

function renderSceneItems(selector, kind, list, getLabel, emptyText) {
  const container = $(selector);
  if (!container) return;
  const items = list.slice(0, 8);
  if (!items.length) {
    container.innerHTML = `<span class="scene-empty">${escapeHtml(emptyText)}</span>`;
    return;
  }

  const extraCount = Math.max(0, list.length - items.length);
  const chips = items.map((item) => `
    <button type="button" data-open-kind="${escapeAttr(kind)}" data-id="${escapeAttr(item.id)}">
      ${escapeHtml(getLabel(item) || "未命名")}
    </button>
  `);
  if (extraCount) chips.push(`<span>还有 ${extraCount} 项</span>`);
  container.innerHTML = chips.join("");
}

function renderAlerts() {
  const lines = [];

  state.dates.forEach((item) => {
    const diff = daysUntil(item.date);
    if (diff === 1) lines.push(`明天是「${item.name}」，请提前准备。`);
    if (diff === 0) lines.push(`今天是「${item.name}」。`);
  });

  state.fridge.forEach((item) => {
    const status = getFridgeStatus(item);
    if (status.level === "danger" || status.level === "warn") {
      lines.push(`冰箱里的「${item.name}」${status.text}。`);
    }
  });

  state.restock.forEach((item) => {
    if (isRestockNeeded(item)) {
      lines.push(`补货清单里的「${item.name}」${item.status || "需要补货"}。`);
    }
  });

  if (!lines.length) {
    elements.alertPanel.classList.add("hidden");
    elements.alertPanel.innerHTML = "";
    return;
  }

  elements.alertPanel.classList.remove("hidden");
  elements.alertPanel.innerHTML = `
    <strong>今天需要留意</strong>
    <ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  `;
}

function renderFridge() {
  const list = filterBySearch(state.fridge)
    .slice()
    .sort((a, b) => sortByDate(expiryDate(a), expiryDate(b)));

  $("#fridgeListMeta").textContent = `${list.length} 项`;
  if (!list.length) {
    renderEmpty(elements.fridgeList, "还没有冰箱记录");
    return;
  }

  elements.fridgeList.innerHTML = list
    .map((item) => {
      const status = getFridgeStatus(item);
      const expiry = expiryDate(item);
      return `
        <article class="item-card" data-item-kind="fridge" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="tag ${status.className}">${escapeHtml(status.text)}</span>
          </div>
          ${compactMeta([
            item.amount ? `数量 ${item.amount}` : "未填数量",
            item.place ? `位置 ${item.place}` : "未填位置",
            expiry ? `到期 ${expiry}` : "未计算到期"
          ])}
          ${cardActions("fridge", item.id)}
        </article>
      `;
    })
    .join("");
}

function renderClothes() {
  const list = filterBySearch(state.clothes);
  $("#clothesListMeta").textContent = `${list.length} 件`;
  if (!list.length) {
    renderEmpty(elements.clothesList, "还没有衣服照片");
    return;
  }

  elements.clothesList.innerHTML = list
    .map((item) => {
      const photoContent = item.photo
        ? `<img src="${item.photo}" alt="${escapeAttr(item.name)}" />`
        : `<div class="photo-placeholder">暂无照片</div>`;
      return `
        <article class="photo-card" data-item-kind="clothes" data-item-id="${escapeAttr(item.id)}">
          <button class="photo-open" type="button" data-open-photo="${escapeAttr(item.photo || "")}" data-caption="${escapeAttr(item.name || "衣服照片")}" ${item.photo ? "" : "disabled"}>
            ${photoContent}
          </button>
          <div class="photo-body">
            <div class="card-top">
              <h4>${escapeHtml(item.name)}</h4>
              <span class="tag blue">${escapeHtml(item.type || "衣服")}</span>
            </div>
            ${compactMeta([
              item.season || "未填季节",
              item.color ? `颜色 ${item.color}` : "",
              item.place ? `位置 ${item.place}` : "未填位置"
            ])}
            ${cardActions("clothes", item.id)}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderDates() {
  const list = filterBySearch(state.dates)
    .slice()
    .sort((a, b) => sortByDate(a.date, b.date));

  $("#dateListMeta").textContent = `${list.length} 个`;
  if (!list.length) {
    renderEmpty(elements.dateList, "还没有重要日期");
    return;
  }

  elements.dateList.innerHTML = list
    .map((item) => {
      const status = getDateStatus(item);
      return `
        <article class="item-card" data-item-kind="dates" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="tag ${status.className}">${escapeHtml(status.text)}</span>
          </div>
          ${compactMeta([
            item.date ? `日期 ${item.date}` : "未填日期",
            item.type || "其他",
            "提前一天提醒"
          ])}
          ${cardActions("dates", item.id)}
        </article>
      `;
    })
    .join("");
}

function renderStorage() {
  const list = filterBySearch(state.storage);
  $("#storageListMeta").textContent = `${list.length} 项`;
  if (!list.length) {
    renderEmpty(elements.storageList, "还没有位置记录");
    return;
  }

  elements.storageList.innerHTML = list
    .map((item) => {
      const photoBlock = item.photo
        ? `<button class="text-button" type="button" data-open-photo="${escapeAttr(item.photo)}" data-caption="${escapeAttr(item.name || "位置照片")}">看位置照片</button>`
        : "";
      return `
        <article class="item-card" data-item-kind="storage" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="tag">${escapeHtml(item.type || "物品")}</span>
          </div>
          ${compactMeta([
            item.room ? `房间 ${item.room}` : "未填房间",
            item.spot ? `位置 ${item.spot}` : "未填位置",
            item.owner ? `负责人 ${item.owner}` : ""
          ])}
          <div class="card-actions">
            ${photoBlock}
            <button class="text-button" type="button" data-edit-kind="storage" data-id="${escapeAttr(item.id)}">编辑</button>
            <button class="text-button danger" type="button" data-delete-kind="storage" data-id="${escapeAttr(item.id)}">删除</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderRestock() {
  const list = filterBySearch(state.restock)
    .slice()
    .sort((a, b) => getRestockRank(a) - getRestockRank(b));

  $("#restockListMeta").textContent = `${list.length} 项`;
  if (!list.length) {
    renderEmpty(elements.restockList, "还没有补货记录");
    return;
  }

  elements.restockList.innerHTML = list
    .map((item) => {
      const status = getRestockStatus(item);
      return `
        <article class="item-card" data-item-kind="restock" data-item-id="${escapeAttr(item.id)}">
          <div class="card-top">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="tag ${status.className}">${escapeHtml(item.status || "需要补货")}</span>
          </div>
          ${compactMeta([
            item.category || "其他",
            item.stock ? `库存 ${item.stock}` : "未填库存",
            item.place ? `位置 ${item.place}` : ""
          ])}
          ${cardActions("restock", item.id)}
        </article>
      `;
    })
    .join("");
}

function cardActions(kind, id) {
  return `
    <div class="card-actions">
      <button class="text-button" type="button" data-edit-kind="${kind}" data-id="${escapeAttr(id)}">编辑</button>
      <button class="text-button danger" type="button" data-delete-kind="${kind}" data-id="${escapeAttr(id)}">删除</button>
    </div>
  `;
}

function compactMeta(parts) {
  const items = parts.filter((part) => cleanText(part));
  if (!items.length) return "";
  return `<div class="compact-meta">${items.map((part) => `<span>${escapeHtml(part)}</span>`).join("")}</div>`;
}

function toggleFurnitureDoor(button) {
  button.classList.toggle("door-open");
  const isOpen = button.classList.contains("door-open");
  button.setAttribute("aria-pressed", isOpen ? "true" : "false");
  if (button.dataset.furniture === "fridge") {
    button.setAttribute("aria-label", isOpen ? "关闭我的冰箱" : "打开我的冰箱");
  }
  if (button.dataset.furniture === "closet") {
    button.setAttribute("aria-label", isOpen ? "关闭我的衣柜" : "打开我的衣柜");
  }
  if (button.dataset.furniture === "cabinet") {
    button.setAttribute("aria-label", isOpen ? "关闭重要物品柜" : "打开重要物品柜");
  }
}

function renderEmpty(container, title) {
  container.innerHTML = `
    <div class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <span>从左侧表单添加第一条。</span>
    </div>
  `;
}

function openStoredItem(kind, id) {
  if (!state[kind]?.some((item) => item.id === id)) return;

  setActiveTab(kind);
  if (elements.searchInput.value.trim()) {
    elements.searchInput.value = "";
    render();
  }

  requestAnimationFrame(() => {
    const card = $$("[data-item-kind]").find((item) => item.dataset.itemKind === kind && item.dataset.itemId === id);
    if (!card) return;
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.remove("item-focus");
    void card.offsetWidth;
    card.classList.add("item-focus");
    window.setTimeout(() => card.classList.remove("item-focus"), 1800);
  });
}

function openPhotoPicker(button) {
  const input = $(`#${button.dataset.photoTrigger}`);
  if (!input) return;

  if (button.dataset.photoMode === "camera") {
    input.setAttribute("capture", "environment");
  } else {
    input.removeAttribute("capture");
  }

  input.value = "";
  input.click();
}

function filterBySearch(list) {
  const query = elements.searchInput.value.trim().toLowerCase();
  if (!query) return list;
  return list.filter((item) => JSON.stringify(item).toLowerCase().includes(query));
}

function sortByDate(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return new Date(`${a}T00:00:00`) - new Date(`${b}T00:00:00`);
}

function getFutureDates() {
  return state.dates
    .filter((item) => daysUntil(item.date) >= 0)
    .slice()
    .sort((a, b) => sortByDate(a.date, b.date));
}

function expiryDate(item) {
  if (!item.productionDate || !Number(item.shelfLifeDays)) return "";
  const date = parseLocalDate(item.productionDate);
  date.setDate(date.getDate() + Number(item.shelfLifeDays));
  return toDateInputValue(date);
}

function getFridgeStatus(item) {
  const expiry = expiryDate(item);
  if (!expiry) return { text: "未计算", className: "", level: "muted" };
  const diff = daysUntil(expiry);
  if (diff < 0) return { text: `已过期 ${Math.abs(diff)} 天`, className: "danger", level: "danger" };
  if (diff === 0) return { text: "今天到期", className: "danger", level: "danger" };
  if (diff === 1) return { text: "明天到期", className: "warn", level: "warn" };
  if (diff <= 3) return { text: `临期 ${diff} 天`, className: "warn", level: "warn" };
  if (diff <= 7) return { text: `还有 ${diff} 天`, className: "blue", level: "blue" };
  return { text: `还有 ${diff} 天`, className: "good", level: "good" };
}

function getDateStatus(item) {
  const diff = daysUntil(item.date);
  if (Number.isNaN(diff)) return { text: "未填写", className: "", level: "muted" };
  if (diff < 0) return { text: `已过 ${Math.abs(diff)} 天`, className: "", level: "muted" };
  if (diff === 0) return { text: "今天", className: "danger", level: "danger" };
  if (diff === 1) return { text: "明天", className: "warn", level: "warn" };
  if (diff <= 7) return { text: `还有 ${diff} 天`, className: "blue", level: "blue" };
  return { text: `还有 ${diff} 天`, className: "good", level: "good" };
}

function getRestockStatus(item) {
  if (item.status === "已备足") return { className: "good", level: "good" };
  if (item.status === "下次再看") return { className: "blue", level: "blue" };
  if (item.status === "库存偏低") return { className: "warn", level: "warn" };
  return { className: "danger", level: "danger" };
}

function isRestockNeeded(item) {
  return item.status === "需要补货" || item.status === "库存偏低" || !item.status;
}

function getRestockRank(item) {
  const ranks = {
    需要补货: 0,
    库存偏低: 1,
    下次再看: 2,
    已备足: 3,
  };
  return ranks[item.status] ?? 0;
}

function daysUntil(value) {
  if (!value) return Number.NaN;
  const target = parseLocalDate(value);
  const today = startOfDay(new Date());
  return Math.round((target - today) / 86400000);
}

function parseLocalDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function editItem(kind, id) {
  const item = state[kind].find((entry) => entry.id === id);
  if (!item) return;
  let formToShow = null;

  if (kind === "fridge") {
    fillForm(elements.fridgeForm, item);
    setSubmitText(elements.fridgeForm, "更新冰箱记录");
    setActiveTab("fridge");
    formToShow = elements.fridgeForm;
  }

  if (kind === "clothes") {
    fillForm(elements.clothesForm, item);
    showPreview(elements.clothesPhotoPreview, item.photo);
    setSubmitText(elements.clothesForm, "更新衣服");
    setActiveTab("clothes");
    formToShow = elements.clothesForm;
  }

  if (kind === "dates") {
    fillForm(elements.dateForm, item);
    setSubmitText(elements.dateForm, "更新日期");
    setActiveTab("dates");
    formToShow = elements.dateForm;
  }

  if (kind === "storage") {
    fillForm(elements.storageForm, item);
    showPreview(elements.storagePhotoPreview, item.photo);
    setSubmitText(elements.storageForm, "更新位置");
    setActiveTab("storage");
    formToShow = elements.storageForm;
  }

  if (kind === "restock") {
    fillForm(elements.restockForm, item);
    setSubmitText(elements.restockForm, "更新补货项");
    setActiveTab("restock");
    formToShow = elements.restockForm;
  }

  if (formToShow) {
    formToShow.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function handleDeleteButton(button) {
  deleteItem(button.dataset.deleteKind, button.dataset.id);
}

function deleteItem(kind, id) {
  state[kind] = state[kind].filter((item) => item.id !== id);
  if (saveData()) render();
}

function fillForm(form, item) {
  $$("[name]", form).forEach((field) => {
    if (field.type === "file") {
      field.value = "";
      return;
    }
    field.value = item[field.name] ?? "";
  });
}

function setSubmitText(form, text) {
  const button = $('button[type="submit"]', form);
  if (button) button.textContent = text;
}

function resetFridgeForm() {
  elements.fridgeForm.reset();
  elements.fridgeForm.elements.id.value = "";
  setSubmitText(elements.fridgeForm, "保存到冰箱");
}

function resetClothesForm() {
  elements.clothesForm.reset();
  elements.clothesForm.elements.id.value = "";
  showPreview(elements.clothesPhotoPreview, "");
  setSubmitText(elements.clothesForm, "保存衣服");
}

function resetDateForm() {
  elements.dateForm.reset();
  elements.dateForm.elements.id.value = "";
  setSubmitText(elements.dateForm, "保存日期");
}

function resetStorageForm() {
  elements.storageForm.reset();
  elements.storageForm.elements.id.value = "";
  showPreview(elements.storagePhotoPreview, "");
  setSubmitText(elements.storageForm, "保存位置");
}

function resetRestockForm() {
  elements.restockForm.reset();
  elements.restockForm.elements.id.value = "";
  setSubmitText(elements.restockForm, "保存补货项");
}

function fillRestockPreset(button) {
  resetRestockForm();
  elements.restockForm.elements.name.value = button.dataset.restockPreset || "";
  elements.restockForm.elements.category.value = button.dataset.restockCategory || "其他";
  elements.restockForm.elements.status.value = "需要补货";
  elements.restockForm.elements.name.focus();
}

function bindPhotoPreview(input, preview) {
  input.addEventListener("change", async () => {
    const file = input.files[0];
    if (!file) {
      showPreview(preview, "");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    showPreview(preview, dataUrl);
  });
}

function showPreview(preview, dataUrl) {
  if (!dataUrl) {
    preview.classList.add("hidden");
    preview.style.backgroundImage = "";
    return;
  }
  preview.classList.remove("hidden");
  preview.style.backgroundImage = `url("${dataUrl}")`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function compressImage(file, maxSize, quality) {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl).catch(() => null);
  if (!image) return dataUrl;

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function openImageDialog(src, caption) {
  if (!src) return;
  elements.dialogImage.src = src;
  elements.dialogCaption.textContent = caption;
  if (elements.imageDialog.showModal) {
    elements.imageDialog.showModal();
  } else {
    elements.imageDialog.setAttribute("open", "");
  }
}

function closeImageDialog() {
  if (elements.imageDialog.close) {
    elements.imageDialog.close();
  } else {
    elements.imageDialog.removeAttribute("open");
  }
  elements.dialogImage.src = "";
}

function remindersEnabled() {
  return localStorage.getItem(REMINDER_ENABLED_KEY) === "true";
}

function setRemindersEnabled(enabled) {
  localStorage.setItem(REMINDER_ENABLED_KEY, enabled ? "true" : "false");
  updateReminderButton();
}

function updateReminderButton() {
  const button = $("#notifyButton");
  if (!button) return;
  const enabled = remindersEnabled();
  button.textContent = enabled ? "关闭提醒" : "开启提醒";
  button.classList.toggle("primary-button", enabled);
  button.classList.toggle("ghost-button", !enabled);
  button.setAttribute("aria-pressed", enabled ? "true" : "false");
}

async function toggleNotifications() {
  if (remindersEnabled()) {
    setRemindersEnabled(false);
    alert("已关闭系统通知提醒。网页里的红色提醒事项仍会正常显示。");
    return;
  }

  if (!("Notification" in window)) {
    alert("这个浏览器不支持系统通知。网页里的红色提醒事项仍会正常显示。");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    setRemindersEnabled(true);
    alert("已开启系统通知提醒。网页打开时，如果明天有重要日期，会弹出提醒。");
    checkBrowserNotifications(true);
  } else {
    setRemindersEnabled(false);
    alert("提醒权限没有开启。网页里的红色提醒事项仍会正常显示。");
  }
}

function checkBrowserNotifications(showEmptyTip) {
  if (!remindersEnabled()) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const todayKey = toDateInputValue(new Date());
  const notified = loadNotified();
  const dueTomorrow = state.dates.filter((item) => daysUntil(item.date) === 1);

  dueTomorrow.forEach((item) => {
    const key = `${todayKey}-${item.id}-${item.date}`;
    if (notified[key]) return;
    new Notification(`明天有重要日期：${item.name}`, {
      body: item.note || `${item.date}，请提前准备。`,
    });
    notified[key] = true;
  });

  localStorage.setItem(NOTIFY_KEY, JSON.stringify(notified));

  if (showEmptyTip && !dueTomorrow.length) {
    alert("当前没有明天到期的重要日期。");
  }
}

function loadNotified() {
  try {
    return JSON.parse(localStorage.getItem(NOTIFY_KEY)) || {};
  } catch {
    return {};
  }
}

function exportCalendarFile() {
  if (!state.dates.length) {
    alert("请先添加重要日期。");
    return;
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const events = state.dates
    .filter((item) => item.date)
    .map((item) => {
      const start = item.date.replaceAll("-", "");
      const endDate = parseLocalDate(item.date);
      endDate.setDate(endDate.getDate() + 1);
      const end = toDateInputValue(endDate).replaceAll("-", "");
      const description = [`类型：${item.type || "其他"}`, item.note ? `备注：${item.note}` : ""].filter(Boolean).join("\\n");

      return [
        "BEGIN:VEVENT",
        `UID:${icsEscape(item.id)}@family-home-page`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `DTEND;VALUE=DATE:${end}`,
        `SUMMARY:${icsEscape(item.name)}`,
        `DESCRIPTION:${icsEscape(description)}`,
        "BEGIN:VALARM",
        "TRIGGER:-P1D",
        "ACTION:DISPLAY",
        `DESCRIPTION:${icsEscape(`明天：${item.name}`)}`,
        "END:VALARM",
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Family Home Page//ZH-CN//EN", "CALSCALE:GREGORIAN", events, "END:VCALENDAR"].join("\r\n");
  downloadBlob("\ufeff" + content, "家庭重要日期提醒.ics", "text/calendar;charset=utf-8");
}

async function exportClothesImage() {
  if (!state.clothes.length) {
    alert("请先添加衣服记录。");
    return;
  }

  const items = state.clothes.slice();
  const columns = 3;
  const cardWidth = 340;
  const cardHeight = 410;
  const gap = 24;
  const padding = 42;
  const headerHeight = 110;
  const rows = Math.ceil(items.length / columns);
  const canvas = document.createElement("canvas");
  canvas.width = padding * 2 + columns * cardWidth + (columns - 1) * gap;
  canvas.height = padding * 2 + headerHeight + rows * cardHeight + Math.max(0, rows - 1) * gap;

  const context = canvas.getContext("2d");
  context.fillStyle = "#f5f8f7";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#14211f";
  context.font = "700 42px Microsoft YaHei, Arial";
  context.fillText("家里衣服清单", padding, 62);
  context.fillStyle = "#66736f";
  context.font = "24px Microsoft YaHei, Arial";
  context.fillText(`生成时间：${new Date().toLocaleString("zh-CN")} · 共 ${items.length} 件`, padding, 100);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = padding + col * (cardWidth + gap);
    const y = padding + headerHeight + row * (cardHeight + gap);
    await drawClothesCard(context, item, x, y, cardWidth, cardHeight);
  }

  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadBlob(blob, "衣服图片清单.png", "image/png");
  });
}

async function drawClothesCard(context, item, x, y, width, height) {
  context.save();
  drawRoundRect(context, x, y, width, height, 8, "#ffffff", "#dce7e3");

  const imageHeight = 230;
  if (item.photo) {
    const image = await loadImage(item.photo).catch(() => null);
    if (image) {
      drawImageCover(context, image, x + 14, y + 14, width - 28, imageHeight);
    } else {
      drawPhotoPlaceholder(context, x + 14, y + 14, width - 28, imageHeight);
    }
  } else {
    drawPhotoPlaceholder(context, x + 14, y + 14, width - 28, imageHeight);
  }

  context.fillStyle = "#14211f";
  context.font = "700 24px Microsoft YaHei, Arial";
  wrapText(context, item.name || "未命名衣服", x + 18, y + imageHeight + 54, width - 36, 30, 2);

  context.fillStyle = "#66736f";
  context.font = "18px Microsoft YaHei, Arial";
  const meta = [
    `类别：${item.type || "未填写"}`,
    `季节：${item.season || "未填写"}`,
    `颜色：${item.color || "未填写"}`,
    `位置：${item.place || "未填写"}`,
  ];
  meta.forEach((line, index) => {
    context.fillText(line, x + 18, y + imageHeight + 116 + index * 26);
  });

  context.restore();
}

function drawRoundRect(context, x, y, width, height, radius, fill, stroke) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
  context.strokeStyle = stroke;
  context.stroke();
}

function drawPhotoPlaceholder(context, x, y, width, height) {
  drawRoundRect(context, x, y, width, height, 8, "#eef7f4", "#dce7e3");
  context.fillStyle = "#66736f";
  context.font = "700 22px Microsoft YaHei, Arial";
  context.textAlign = "center";
  context.fillText("暂无照片", x + width / 2, y + height / 2);
  context.textAlign = "start";
}

function drawImageCover(context, image, x, y, width, height) {
  const ratio = Math.max(width / image.width, height / image.height);
  const drawWidth = image.width * ratio;
  const drawHeight = image.height * ratio;
  const offsetX = x + (width - drawWidth) / 2;
  const offsetY = y + (height - drawHeight) / 2;

  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  context.restore();
}

function wrapText(context, text, x, y, maxWidth, lineHeight, maxLines) {
  const chars = Array.from(String(text));
  let line = "";
  let lines = 0;

  chars.forEach((char, index) => {
    const testLine = line + char;
    const isLast = index === chars.length - 1;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines += 1;
      context.fillText(lines === maxLines ? `${line.slice(0, -1)}...` : line, x, y);
      y += lineHeight;
      line = char;
      if (lines >= maxLines) line = "";
    } else {
      line = testLine;
    }

    if (isLast && line && lines < maxLines) {
      context.fillText(line, x, y);
    }
  });
}

function exportAllData() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: state,
  };
  downloadBlob(JSON.stringify(payload, null, 2), "赛博小管家数据.json", "application/json;charset=utf-8");
}

async function importAllData(event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;

  try {
    const text = await file.text();
    const imported = normalizeData(JSON.parse(text));
    if (!confirm("导入会替换当前浏览器里的数据，确定继续吗？")) return;

    state.fridge = imported.fridge;
    state.clothes = imported.clothes;
    state.dates = imported.dates;
    state.storage = imported.storage;
    state.restock = imported.restock;
    if (saveData()) render();
  } catch {
    alert("导入失败：请选择之前导出的 JSON 文件。");
  }
}

function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function icsEscape(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function formatNote(value) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}
