"use strict";

const heartsContainer = document.getElementById("hearts");
const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");

const segmentControl = document.getElementById("segmentControl");

const modal = document.getElementById("resultModal");
const resultMainImage = document.getElementById("resultMainImage");
const resultGallery = document.getElementById("resultGallery");
const resultTitle = document.getElementById("resultTitle");
const resultSubtitle = document.getElementById("resultSubtitle");
const resultDescription = document.getElementById("resultDescription");
const resultHowto = document.getElementById("resultHowto");

const closeBtn = document.getElementById("closeBtn");
const searchBtn = document.getElementById("searchBtn");
const toggleButtons = document.querySelectorAll(".toggle");

const selectorGlass = document.querySelector(".selector-glass");
const tickSound = document.getElementById("tickSound");

const CONFIG = {
  visibleItems: 8,
  radius: 260,
  spinSpeed: 90,
  minSpinSteps: 12,
  maxSpinSteps: 20,
};

let state = {
  currentType: "roleplay",
  data: [],
  visibleStartIndex: 0,
  isSpinning: false,
  currentResult: null,
};

const fallbackIcon = (title) => {
  const seed = encodeURIComponent(title.trim().toLowerCase());
  return `https://api.dicebear.com/7.x/icons/svg?seed=${seed}&backgroundColor=ffffff`;
};

const assignIcon = async (img, item) => {
  const primary = item.icon;

  if (primary && primary.trim() !== "") {
    img.src = primary;

    img.onerror = async () => {
      const fallback = await fetchPexelsSingle(item.title);
      img.src = fallback || fallbackIcon(item.title);
    };
  } else {
    const fallback = await fetchPexelsSingle(item.title);
    img.src = fallback || fallbackIcon(item.title);
  }
};

function createHearts() {
  heartsContainer.innerHTML = "";
  for (let i = 0; i < 35; i++) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.innerHTML = "❤";
    heart.style.left = Math.random() * 100 + "%";
    heart.style.animationDuration = 8 + Math.random() * 12 + "s";
    heart.style.fontSize = 12 + Math.random() * 18 + "px";
    heart.style.opacity = 0.15 + Math.random() * 0.25;
    heartsContainer.appendChild(heart);
  }
}

async function loadData(type) {
  try {
    state.currentType = type;
    spinBtn.disabled = true;

    const response = await fetch(`./${type}.json`, { cache: "no-store" });
    if (!response.ok) throw new Error();

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error();

    state.data = data;
    state.visibleStartIndex = 0;

    buildWheel();
    updateSelectorIcon();
  } catch {
    alert("Unable to load data.");
  } finally {
    spinBtn.disabled = false;
  }
}

function buildWheel() {
  wheel.innerHTML = "";
  renderVisibleItems(true);
}

function renderVisibleItems(immediate = false) {
  const total = state.data.length;
  const visible = CONFIG.visibleItems;
  if (!total) return;

  const angleStep = 180 / (visible - 1);
  const centerIndex = Math.floor(visible / 2);

  wheel.innerHTML = "";

  for (let i = 0; i < visible; i++) {
    const dataIndex = (state.visibleStartIndex + i) % total;
    const item = state.data[dataIndex];

    const wrapper = document.createElement("div");
    wrapper.className = "wheel-icon-wrapper";

    const img = document.createElement("img");
    img.className = "wheel-icon";
    assignIcon(img, item);

    wrapper.appendChild(img);

    const angle = (i - centerIndex) * angleStep;
    const radians = (angle * Math.PI) / 180;

    const x = CONFIG.radius * Math.sin(radians);
    const y = -CONFIG.radius * Math.cos(radians);

    const distance = Math.abs(i - centerIndex);

    let scale = 0.75;
    if (distance === 0) scale = 1.2;
    else if (distance === 1) scale = 1.0;
    else if (distance === 2) scale = 0.9;

    wrapper.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;

    if (distance === 0) wrapper.style.opacity = "0";
    else if (distance === 1) wrapper.style.opacity = "0.4";
    else if (distance === 2) wrapper.style.opacity = "0.25";
    else wrapper.style.opacity = "0.15";

    wrapper.style.transition = immediate
      ? "none"
      : "transform 0.35s ease, opacity 0.35s ease";

    wheel.appendChild(wrapper);
  }
}

function updateSelectorIcon() {
  const centerIndex =
    (state.visibleStartIndex + Math.floor(CONFIG.visibleItems / 2)) %
    state.data.length;

  const item = state.data[centerIndex];

  selectorGlass.innerHTML = "";

  const img = document.createElement("img");
  img.style.width = "64px";
  img.style.height = "64px";
  img.style.borderRadius = "50%";
  img.style.background = "white";
  img.style.padding = "8px";
  img.style.boxShadow = "0 10px 25px rgba(0,0,0,0.3)";

  assignIcon(img, item);

  selectorGlass.appendChild(img);
}

function spinWheel() {
  if (state.isSpinning || !state.data.length) return;

  state.isSpinning = true;
  spinBtn.disabled = true;

  const totalSteps =
    Math.floor(Math.random() * (CONFIG.maxSpinSteps - CONFIG.minSpinSteps)) +
    CONFIG.minSpinSteps;

  let currentStep = 0;

  const interval = setInterval(() => {
    state.visibleStartIndex = (state.visibleStartIndex + 1) % state.data.length;

    renderVisibleItems();
    updateSelectorIcon();

    if (tickSound) {
      const tick = tickSound.cloneNode();
      tick.volume = 0.4;
      tick.play().catch(() => {});
    }

    currentStep++;

    if (currentStep >= totalSteps) {
      clearInterval(interval);

      const finalIndex =
        (state.visibleStartIndex + Math.floor(CONFIG.visibleItems / 2)) %
        state.data.length;

      const item = state.data[finalIndex];

      selectorGlass.classList.remove("pulse");
      void selectorGlass.offsetWidth;
      selectorGlass.classList.add("pulse");

      showResult(item);

      state.isSpinning = false;
      spinBtn.disabled = false;
    }
  }, CONFIG.spinSpeed);
}

async function getGalleryImages(item) {
  const keywords = `${item.title} couple ${state.currentType} illustration guide`;

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keywords)}&per_page=4`,
      {
        headers: {
          Authorization:
            "3gVWj8OVC4PfooaG9Uj1geXtG8GvCJCfXzHOUms28J9JKPHjcdRN3p89",
        },
      },
    );

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      return data.photos.map((photo) => photo.src.medium);
    }
  } catch {}

  return [];
}

async function fetchPexelsSingle(title) {
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(title + " couple illustration")}&per_page=1`,
      {
        headers: {
          Authorization:
            "3gVWj8OVC4PfooaG9Uj1geXtG8GvCJCfXzHOUms28J9JKPHjcdRN3p89",
        },
      },
    );

    const data = await response.json();

    if (data.photos && data.photos.length > 0) return data.photos[0].src.medium;
  } catch {}

  return null;
}

async function showResult(item) {
  state.currentResult = item;

  resultTitle.textContent = item.title || "";
  resultSubtitle.textContent = item.subtitle || "";
  resultDescription.textContent = item.description || "";
  resultHowto.textContent = item.howto || "";

  if (item.icon && item.icon.trim() !== "") {
    resultMainImage.src = item.icon;

    resultMainImage.onerror = async () => {
      const fallback = await fetchPexelsSingle(item.title);
      resultMainImage.src = fallback || fallbackIcon(item.title);
    };
  } else {
    const fallback = await fetchPexelsSingle(item.title);
    resultMainImage.src = fallback || fallbackIcon(item.title);
  }

  resultGallery.innerHTML = "";

  const galleryImages = await getGalleryImages(item);

  galleryImages.forEach((src, index) => {
    const img = document.createElement("img");

    img.crossOrigin = "anonymous";
    img.referrerPolicy = "no-referrer";

    img.src = src + "&t=" + Date.now() + index;

    img.onerror = () => {
      img.src = `https://picsum.photos/seed/${index}/400/400`;
    };

    img.onclick = () => {
      resultMainImage.src = img.src;
    };

    resultGallery.appendChild(img);
  });

  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

function searchWeb() {
  if (!state.currentResult) return;

  const query =
    state.currentResult.title +
    " sex " +
    state.currentType +
    " images and videos";

  window.open(
    "https://www.google.com/search?tbm=isch&q=" + encodeURIComponent(query),
    "_blank",
  );
}

toggleButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    toggleButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    segmentControl.setAttribute("data-active", index);

    loadData(btn.dataset.type);
  });
});

spinBtn.addEventListener("click", spinWheel);
closeBtn.addEventListener("click", closeModal);
searchBtn.addEventListener("click", searchWeb);

createHearts();
loadData("roleplay");

