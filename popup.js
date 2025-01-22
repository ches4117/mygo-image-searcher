const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const searchGallery = document.querySelector(".search-gallery");
const commonGallery = document.querySelector(".common-gallery");
const searchButtons = document.querySelectorAll(".search-btn");
const commonButtons = document.querySelectorAll(".common-btn");
const copyButton = document.getElementById("copy-btn");
const saveButton = document.getElementById("save-btn");
const commonButton = document.getElementById("common-btn");
const deleteButton = document.getElementById("delete-btn");
const searchInput = document.getElementById("search-input");
const overlay = document.getElementById("overlay");

let hoverImgSrc = null;
let hoverImgAlt = null;
let searchTimeoutInstance = null;
let currentTab = "commonTab";

function addImageClickCopyEvent(imgElement) {
  imgElement.style.cursor = "pointer";
  imgElement.addEventListener("click", () => {
    copyImage();
    imgElement.style.cursor = "default";
    setTimeout(() => {
      imgElement.style.cursor = "pointer";
    }, 200);
  });
}

function createImageElement(targetImg, tabContent) {
  const imgContainer = document.createElement("div");
  imgContainer.setAttribute("class", "image-container");

  const img = document.createElement("img");
  img.src = targetImg.url;
  img.alt = targetImg.alt;
  img.width = 300;
  img.height = 150;
  imgContainer.appendChild(img);
  tabContent.appendChild(imgContainer);

  const altText = document.createElement("span");
  altText.innerHTML = targetImg.alt;
  imgContainer.appendChild(altText);
  imgContainer.setAttribute("id", targetImg.alt);
  return img;
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
    res.urls.forEach((url) => createImageElement(url, searchGallery));
  }, 500);
}

async function copyImage() {
  const img = document.createElement("img");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  img.src = hoverImgSrc;
  img.alt = hoverImgAlt;

  // 設定畫布尺寸為圖片尺寸
  canvas.width = img.width;
  canvas.height = img.height;

  // 將圖片繪製到畫布上
  ctx.drawImage(img, 0, 0);

  // 將畫布內容轉為 Blob (PNG 格式)
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );

  // 建立 ClipboardItem 並寫入剪貼板
  const clipboardItem = new ClipboardItem({ "image/png": blob });
  await navigator.clipboard.write([clipboardItem]);
}

function hideOverlay() {
  overlay.style.opacity = 0;
  overlay.style.pointerEvents = "none";
}

function deleteBtn(btns) {
  btns.forEach((btn) => {
    btn.style.display = "none";
  });
}

function showBtn(btns) {
  btns.forEach((btn) => {
    btn.style.display = "block";
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab !== currentTab) {
      currentTab = tab.dataset.tab;
      hideOverlay();
    }
  });
});

// 當滑鼠移入圖片時顯示遮罩
searchGallery.addEventListener("mouseover", (e) => {
  const target = e.target.closest(".image-container")?.querySelector("img");
  if (target) {
    deleteBtn(commonButtons);
    showBtn(searchButtons);

    const rect = target.getBoundingClientRect();
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.opacity = 1;
    overlay.style.pointerEvents = "auto";

    hoverImgSrc = target.src;
    hoverImgAlt = target.alt;
  }
});

commonGallery.addEventListener("mouseover", (e) => {
  const target = e.target.closest(".image-container")?.querySelector("img");
  if (target) {
    deleteBtn(searchButtons);
    showBtn(commonButtons);

    const rect = target.getBoundingClientRect();
    overlay.style.width = "24px";
    overlay.style.height = "24px";
    overlay.style.top = `${rect.top + window.scrollY + 8}px`;
    overlay.style.left = `${rect.left + window.scrollX + rect.width - 32}px`;
    overlay.style.opacity = 1;
    overlay.style.backgroundColor = "transparent";
    overlay.style.pointerEvents = "auto";

    hoverImgSrc = target.src;
    hoverImgAlt = target.alt;
  }
});

// 當滑鼠移出時隱藏遮罩
searchGallery.addEventListener("mouseout", (event) => {
  if (event.target.tagName === "IMG") return;
  hideOverlay();
});

searchInput.addEventListener("input", function () {
  inputValue = searchInput.value.trim();
  if (!inputValue) {
    hideOverlay();
  }

  if (searchTimeoutInstance) {
    clearTimeout(searchTimeoutInstance);
    createSearch(inputValue);
  } else {
    createSearch(inputValue);
  }
});

copyButton.addEventListener("click", () => {
  copyImage();
  copyButton.innerHTML = "✓";
  setTimeout(() => {
    copyButton.innerHTML = "複製";
  }, 500);
});

saveButton.addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = hoverImgSrc;
  link.download = hoverImgSrc.split("/").pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  delete link;
});

commonButton.addEventListener("click", () => {
  commonButton.innerHTML = "✓";
  chrome.storage.sync.get(["commonImageList"], function (result) {
    const hoverImg = { url: hoverImgSrc, alt: hoverImgAlt };
    const imageList = result.commonImageList || [];
    const imgElement = createImageElement(hoverImg, commonGallery);

    imageList.push(hoverImg);
    addImageClickCopyEvent(imgElement);
    chrome.storage.sync.set({ commonImageList: imageList });
    setTimeout(() => {
      commonButton.innerHTML = "常用";
    }, 300);
  });
});

deleteButton.addEventListener("click", () => {
  chrome.storage.sync.get(["commonImageList"], function (result) {
    const imageList = result.commonImageList || [];
    if (imageList.length === 0) return;

    document.getElementById(hoverImgAlt).remove();
    chrome.storage.sync.set({
      commonImageList: imageList.filter((image) => image.alt !== hoverImgAlt),
    });
  });
});

chrome.storage.sync.get("commonImageList", (res) => {
  if (!res.commonImageList) return;
  res.commonImageList
    .filter((image) => image.url && image.alt)
    .forEach((image) => {
      const imgElement = createImageElement(image, commonGallery);
      addImageClickCopyEvent(imgElement);
    });
});
