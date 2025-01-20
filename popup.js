const $ = window.jQuery;

// Tab Menu
const tabs = document.querySelectorAll(".tab");
const searchGallery = document.querySelector(".search-gallery");
const commonGallery = document.querySelector(".common-gallery");
const commonList = document.querySelector(".common-list");
const tabContents = document.querySelectorAll(".tab-content");

chrome.storage.sync.get("commonImageList", (res) => {
  if (!res.commonImageList) return;
  res.commonImageList
    .filter((image) => image.url && image.alt)
    .forEach((image) => {
      const imgElement = createImage(image, commonGallery);
      imgElement.style.cursor = "pointer";
      imgElement.addEventListener("click", () => {
        copyImage();
        imgElement.style.cursor = "default";
        setTimeout(() => {
          imgElement.style.cursor = "pointer";
        }, 200);
      });
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

// Search Image
const searchInput = document.getElementById("searchInput");
let searchTimeoutInstance = null;

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

  searchTimeoutInstance = setTimeout(function () {
    searchTimeoutInstance = null;
    const url = `https://mygoapi.miyago9267.com/mygo/img?keyword=${inputValue}`;
    $.ajax({
      url,
    }).done(function (data) {
      searchGallery.innerHTML = "";
      data.urls.forEach((url) => createImage(url, searchGallery));
    });
  }, 500);
}

let hoverImgSrc = null;
let hoverImgAlt = null;
// 當滑鼠移入圖片時顯示遮罩
searchGallery.addEventListener("mouseover", (e) => {
  const target = e.target.closest(".image-container").querySelector("img");
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
  const target = e.target.closest(".image-container").querySelector("img");
  if (target) {
    hoverImgSrc = target.src;
    hoverImgAlt = target.alt;
  }
});

function copyImage() {
  navigator.clipboard.writeText(hoverImgSrc);
}

$(".copy-btn").click(() => {
  copyImage();
  $(".copy-btn").html("✓");
  setTimeout(() => {
    $(".copy-btn").html("複製");
  }, 500);
});

$(".save-btn").click(() => {
  const link = document.createElement("a");
  link.href = hoverImgSrc;
  link.download = hoverImgSrc.split("/").pop();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  delete link;
});

$(".common-btn").click(() => {
  // Save the img object
  chrome.storage.sync.get(["commonImageList"], function (result) {
    const hoverImg = { url: hoverImgSrc, alt: hoverImgAlt };
    const repos = result.commonImageList || [];
    repos.push(hoverImg);
    chrome.storage.sync.set({ commonImageList: repos });
  });
});

function hideOverlay() {
  overlay.style.opacity = 0;
  overlay.style.pointerEvents = "none";
}

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
