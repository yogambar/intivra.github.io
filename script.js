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

const UNSPLASH_KEY = "Q8AR4qJNRsiKVhcSL0CZ1-ZVh3AQwuplKL8odvZsYOU";
const PEXELS_KEY = "7Mnxe2W1ZMTTrH4vtYY5PyymCI1fAq6HJ1hx8LRACuzA2qb5x9d4yGfe";

const CONFIG = {
  visibleItems: 8,
  radius: 260,
  spinSpeed: 90,
  minSpinSteps: 15,
  maxSpinSteps: 25,
  searchSuffix: "romantic couple soft lighting lifestyle",
};

let state = {
  currentType: "roleplay",
  data: [],
  visibleStartIndex: 0,
  isSpinning: false,
  currentResult: null,
};

const imageCache = {};

const fallbackIcon = (title) => {
  const seed = encodeURIComponent(title.trim().toLowerCase());
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

async function fetchPexels(query, count = 6) {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`,
      { headers: { Authorization: PEXELS_KEY } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.photos ? data.photos.map((p) => p.src.medium) : [];
  } catch {
    return [];
  }
}

async function fetchUnsplash(query, count = 6) {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ? data.results.map((p) => p.urls.small) : [];
  } catch {
    return [];
  }
}

async function fetchImages(query, count = 6) {
  const cacheKey = query + count;
  if (imageCache[cacheKey]) return imageCache[cacheKey];

  const pexelsPromise = fetchPexels(query, count);
  const unsplashPromise = fetchUnsplash(query, count);

  const pexels = await pexelsPromise;
  if (pexels.length) {
    imageCache[cacheKey] = pexels;
    return pexels;
  }

  const unsplash = await unsplashPromise;
  imageCache[cacheKey] = unsplash;
  return unsplash;
}

async function assignIcon(img, item) {
  img.loading = "lazy";
  img.decoding = "async";

  if (state.currentType === "position" && item.icon) {
    img.src = item.icon;
    img.onerror = () => (img.src = fallbackIcon(item.title));
    return;
  }

  img.src = fallbackIcon(item.title);

  const results = await fetchImages(item.title + " " + CONFIG.searchSuffix, 1);

  if (results.length) img.src = results[0];
}

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
  state.currentType = type;
  spinBtn.disabled = true;

  const response = await fetch(`./${type}.json`, { cache: "no-store" });
  state.data = await response.json();
  state.visibleStartIndex = 0;

  buildWheel();
  updateSelectorIcon();
  spinBtn.disabled = false;
}

function buildWheel() {
  wheel.innerHTML = "";
  renderVisibleItems(true);
}

function renderVisibleItems(immediate = false) {
  const total = state.data.length;
  if (!total) return;

  const visible = CONFIG.visibleItems;
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
    if (distance === 0) scale = 1.3;
    else if (distance === 1) scale = 1.0;
    else if (distance === 2) scale = 0.85;

    wrapper.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    wrapper.style.opacity =
      distance === 0 ? "0" : distance === 1 ? "0.6" : "0.3";
    wrapper.style.transition = immediate
      ? "none"
      : "transform 0.2s ease-out, opacity 0.2s ease-out";

    wheel.appendChild(wrapper);
  }
}

function updateSelectorIcon() {
  const centerPos = Math.floor(CONFIG.visibleItems / 2);
  const centerIndex = (state.visibleStartIndex + centerPos) % state.data.length;
  const item = state.data[centerIndex];

  selectorGlass.innerHTML = "";
  const img = document.createElement("img");
  img.className = "selector-img-style";
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
      tick.volume = 0.2;
      tick.play().catch(() => {});
    }

    currentStep++;
    if (currentStep >= totalSteps) {
      clearInterval(interval);
      const finalIdx =
        (state.visibleStartIndex + Math.floor(CONFIG.visibleItems / 2)) %
        state.data.length;
      showResult(state.data[finalIdx]);
      state.isSpinning = false;
      spinBtn.disabled = false;
    }
  }, CONFIG.spinSpeed);
}

async function showResult(item) {
  state.currentResult = item;

  resultTitle.textContent = item.title || "";
  resultSubtitle.textContent = item.subtitle || "";
  resultDescription.textContent = item.description || "";
  resultHowto.textContent = item.howto || "";
  resultGallery.innerHTML = "";

  modal.style.display = "flex";

  const searchQuery = item.title + " " + CONFIG.searchSuffix;

  const results = await fetchImages(searchQuery, 6);

  if (state.currentType === "position" && item.icon) {
    resultMainImage.src = item.icon;
  } else if (results.length) {
    resultMainImage.src = results[0];
  } else {
    resultMainImage.src = fallbackIcon(item.title);
  }

  if (results.length) {
    const galleryImages =
      state.currentType === "position"
        ? results.slice(0, 4)
        : results.slice(1, 5);

    galleryImages.forEach((src) => {
      const img = document.createElement("img");
      img.src = src;
      img.loading = "lazy";
      img.onclick = () => {
        const current = resultMainImage.src;
        resultMainImage.src = src;
        img.src = current;
      };
      resultGallery.appendChild(img);
    });
  }
}

function closeModal() {
  modal.style.display = "none";
}

function searchWeb() {
  if (!state.currentResult) return;
  const query = `${state.currentResult.title} intimacy ${state.currentType}`;
  window.open(
    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`,
    "_blank",
  );
}

toggleButtons.forEach((btn, index) => {
  btn.addEventListener("click", () => {
    toggleButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (segmentControl) segmentControl.setAttribute("data-active", index);
    loadData(btn.dataset.type);
  });
});

spinBtn.addEventListener("click", spinWheel);
closeBtn.addEventListener("click", closeModal);
searchBtn.addEventListener("click", searchWeb);

createHearts();
loadData("roleplay");
