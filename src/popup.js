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
const pageSize = 10
const maxScrollHeight = 500

let currentPage = 1
let currentTab = "";
let searchTimeoutInstance = null;
let inputMappingArray = [];
let filtMappingArray = [];

function setCurrentTab(tab) {
  currentTab = tab;
}

function clearGallery() {
  searchGallery.innerHTML = "";
}

function addActiveClass(tab) {
  tab.classList.add("active");
  document.getElementById(tab.dataset.tab).classList.add("active");
}

function addTabClick() {
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setCurrentTab(tab.dataset.tab);
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      if (tab.dataset.tab === currentTab) {
        addActiveClass(tab);
      }
    });
  });
}

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

function createCommontInitElement() {
  const empty = document.createElement("div");
  empty.className = "empty-common-gallery";
  empty.innerHTML = "搜尋後加入常用圖片";
  commonGallery.appendChild(empty);
}

function createSearchElement(searchString) {
  const element = document.createElement("div");
  element.className = "empty-common-gallery";
  element.innerHTML = searchString;
  searchGallery.appendChild(element);
}

function removeEmptyElement() {
  const empty = document.querySelector(".empty-common-gallery");
  if (empty) empty.remove();
}

function createSearch(inputValue) {
  clearGallery();
  currentPage = 1;
  
  if (!inputValue) {
    createSearchElement("輸入台詞搜尋圖片");
    return;
  } else {
    createSearchElement("搜尋中...");
  }

  searchTimeoutInstance = setTimeout(async function () {
    searchTimeoutInstance = null;
    clearGallery();
    if (inputValue.length === 0) createSearchElement("沒有搜尋結果");
    else {
      removeEmptyElement();
      inputValue.forEach((url) => createSearchImageElement(url));
    }
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
      removeEmptyElement();
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
      if (!imageList || imageList.length === 0) return;

      const retainImageList = imageList.filter(
        (image) => image.alt !== button.dataset.alt
      );
      if (retainImageList.length === 0) createCommontInitElement();
      chrome.storage.sync.set({ commonImageList: retainImageList });
      imageContainer.remove();
    });
  });
}

function handleSearchInput() {
  createSearchElement("輸入台詞搜尋圖片");
  searchInput.addEventListener("input", function () {
    inputValue = searchInput.value.trim();
    if(!inputValue) {
      clearGallery()
      createSearchElement("輸入台詞搜尋圖片");
      return 
    }
    filtMappingArray = inputMappingArray.filter(item => item.text.includes(inputValue))

    if (searchTimeoutInstance) {
      clearTimeout(searchTimeoutInstance);
      createSearch(getPageItems(currentPage));
    } else {
      createSearch(getPageItems(currentPage));
    }
  });
}

function getCommonImageList() {
  chrome.storage.sync.get("commonImageList", (res) => {
    if (!res.commonImageList || res.commonImageList.length === 0) {
      setCurrentTab("searchTab");
      addActiveClass(document.querySelector(`[data-tab='${currentTab}']`));
      createCommontInitElement();
      return;
    }

    setCurrentTab("commonTab");
    addActiveClass(document.querySelector(`[data-tab='${currentTab}']`));
    res.commonImageList
      ?.filter((image) => image.url && image.alt)
      .forEach((image) => {
        const imgElement = createCommonImageElement(image, commonGallery);
        addImageClickCopyEvent(imgElement.querySelector("img"));
      });
  });
}

function getPageItems(nowPage) {
  return filtMappingArray
    .slice(pageSize * (nowPage - 1), pageSize * nowPage)
    .map(item => ({
      url: `https://ches4117.site/${item.episode}/${item.text}.jpg`,
      src: `https://ches4117.site/${item.episode}/${item.text}.jpg`,
      alt: item.text,
    }))
}

function detectScrollToBottom() {
  searchGallery.addEventListener("scroll", () => {
    if (searchGallery.scrollTop >= maxScrollHeight * currentPage) {
      currentPage += 1
      const pageItems = getPageItems(currentPage)
      pageItems.forEach(item => {
        createSearchImageElement(item)
      })
    }
  });
}

async function getJson() {
  let result = await fetch('./mapping.json');
  inputMappingArray = (await result.json()).result
}

getJson();
getCommonImageList();
addTabClick();
handleSearchInput();
detectScrollToBottom();