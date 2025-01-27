const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const galleries = document.querySelectorAll(".gallery");
const searchGallery = document.querySelector(".search-gallery");
const commonGallery = document.querySelector(".common-gallery");
const copyButton = document.getElementById("copy-btn");
const saveButton = document.getElementById("save-btn");
const commonButton = document.getElementById("common-btn");
const deleteButton = document.getElementById("delete-btn");
const searchInput = document.getElementById("search-input");

let searchTimeoutInstance = null;
let currentTab = "commonTab";

function addImageClickCopyEvent(imgElement) {
  imgElement.style.cursor = "pointer";
  imgElement.addEventListener("click", () => {
    copyImage({ src: imgElement.src, alt: imgElement.alt });
    imgElement.style.cursor = "default";
    setTimeout(() => {
      imgElement.style.cursor = "pointer";
    }, 200);
  });
}

function createSearchImageElement(targetImg) {
  const item = document.createElement("div");
  item.className = "gallery-item";
  item.innerHTML = `
    <img src="${targetImg.url}" alt="${targetImg.alt}" />
    <div class="search-btn-container">
      <button class="btn copy-btn" data-src="${targetImg.url}" data-alt="${targetImg.alt}">複製</button>
      <button class="btn download-btn" data-src="${targetImg.url}" data-alt="${targetImg.alt}">下載</button>
      <button class="btn common-btn" data-src="${targetImg.url}" data-alt="${targetImg.alt}">常用</button>
    </div>
  `;
  searchGallery.appendChild(item);
  copyClick(item.querySelector(".copy-btn"));
  saveClick(item.querySelector(".download-btn"));
  commonClick(item.querySelector(".common-btn"));
}

function createCommonImageElement(targetImg) {
  const item = document.createElement("div");
  item.className = "gallery-item";
  item.innerHTML = `
    <img src="${targetImg.url}" alt="${targetImg.alt}" />
    <div class="common-btn-container">
      <button class="btn delete-btn" data-src="${targetImg.url}" data-alt="${targetImg.alt}" class="delete-btn">X</button>
    </div>
  `;
  commonGallery.appendChild(item);
  deleteClick(item);
  return item;
}

function createSearch(inputValue) {
  if (!inputValue) {
    searchGallery.innerHTML = "";
    return;
  }

  searchTimeoutInstance = setTimeout(async function () {
    searchTimeoutInstance = null;
    const url = `https://mygoapi.miyago9267.com/mygo/img?keyword=${inputValue}`;
    const res = await (await fetch(url)).json();
    searchGallery.innerHTML = "";
    res.urls.forEach((url) => createSearchImageElement(url));
  }, 500);
}

async function copyImage({ src, alt }) {
  const img = document.createElement("img");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  img.src = src;
  img.alt = alt;

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );

  const clipboardItem = new ClipboardItem({ "image/png": blob });
  await navigator.clipboard.write([clipboardItem]);
}

function deleteBtnContainer() {
  const buttonContainer = document.querySelector(".gallery-container");
  if (buttonContainer) {
    buttonContainer.remove();
  }
}

function addTabClick() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      tab.classList.add("active");
      document.getElementById(tab.dataset.tab).classList.add("active");
      if (tab.dataset.tab !== currentTab) {
        currentTab = tab.dataset.tab;
        deleteBtnContainer();
      }
    });
  });
}

function handleGalleyScroll() {
  galleries.forEach((gallery) => {
    gallery.addEventListener("scroll", () => {
      deleteBtnContainer();
    });
  });
}

function copyClick(button) {
  button.addEventListener("click", () => {
    copyImage({ src: button.dataset.src, alt: button.dataset.alt });
    button.innerHTML = "✓";
    setTimeout(() => {
      button.innerHTML = "複製";
    }, 500);
  });
}

function saveClick(button) {
  button.addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = button.dataset.src;
    link.download = button.dataset.alt.split("/").pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
  });
}

function commonClick(button) {
  button.addEventListener("click", () => {
    button.innerHTML = "✓";
    chrome.storage.sync.get(["commonImageList"], function (result) {
      const hoverImg = { url: button.dataset.src, alt: button.dataset.alt };
      const imageList = result.commonImageList || [];
      const imgElement = createCommonImageElement(hoverImg, commonGallery);

      imageList.push(hoverImg);
      addImageClickCopyEvent(imgElement.querySelector("img"));
      chrome.storage.sync.set({ commonImageList: imageList });
      setTimeout(() => {
        button.innerHTML = "常用";
      }, 300);
    });
  });
}

function deleteClick(imageContainer) {
  const button = imageContainer.querySelector(".delete-btn");
  button.addEventListener("click", () => {
    chrome.storage.sync.get(["commonImageList"], function (result) {
      const imageList = result.commonImageList || [];
      if (imageList.length === 0) return;

      imageContainer.remove();
      chrome.storage.sync.set({
        commonImageList: imageList.filter(
          (image) => image.alt !== button.dataset.alt
        ),
      });
    });
  });
}

function handleSearchInput() {
  searchInput.addEventListener("input", function () {
    inputValue = searchInput.value.trim();

    if (searchTimeoutInstance) {
      clearTimeout(searchTimeoutInstance);
      createSearch(inputValue);
    } else {
      createSearch(inputValue);
    }
  });
}

function getCommonImageList() {
  chrome.storage.sync.get("commonImageList", (res) => {
    if (!res.commonImageList) return;
    res.commonImageList
      .filter((image) => image.url && image.alt)
      .forEach((image) => {
        const imgElement = createCommonImageElement(image, commonGallery);
        addImageClickCopyEvent(imgElement.querySelector("img"));
      });
  });
}

addTabClick();
handleSearchInput();
handleGalleyScroll();
getCommonImageList();
