const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const searchGallery = document.querySelector(".search-gallery");
const commonGallery = document.querySelector(".common-gallery");
const copyButton = document.getElementById('copy-btn')
const saveButton = document.getElementById('save-btn')
const commonButton = document.getElementById('common-btn')
const searchInput = document.getElementById("search-input");

let hoverImgSrc = null;
let hoverImgAlt = null;
let searchTimeoutInstance = null;

chrome.storage.sync.get("commonImageList", (res) => {
  if (!res.commonImageList) return;
  console.log(res.commonImageList)
  res.commonImageList
    .filter((image) => image.url && image.alt)
    .forEach((image) => {
      const imgElement = createImage(image, commonGallery);
      addImageClickCopyEvent(imgElement)
    });
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));

    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab !== "searchTab") hideOverlay();
  });
});

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

function createImage(targetImg, tabContent) {
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
    const res = await (await fetch(url)).json()
    searchGallery.innerHTML = "";
    res.urls.forEach((url) => createImage(url, searchGallery));
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

// 當滑鼠移入圖片時顯示遮罩
searchGallery.addEventListener("mouseover", (e) => {
  const target = e.target.closest(".image-container")?.querySelector("img");
  if (target) {
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

copyButton.addEventListener('click', () => {
  copyImage()
  copyButton.innerHTML = '✓'
  setTimeout(() => {
    copyButton.innerHTML = '複製'
  }, 500);
})

saveButton.addEventListener('click', () => {
  const link = document.createElement("a");
  link.href = hoverImgSrc;
  link.download = hoverImgSrc.split("/").pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  delete link;
})

commonButton.addEventListener('click', () => {
  chrome.storage.sync.get(["commonImageList"], function (result) {
    const hoverImg = { url: hoverImgSrc, alt: hoverImgAlt };
    const imageList = result.commonImageList || [];
    const imgElement = createImage(hoverImg, commonGallery)
    
    imageList.push(hoverImg);
    addImageClickCopyEvent(imgElement)
    chrome.storage.sync.set({ commonImageList: imageList });
  });
})