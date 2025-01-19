const $ = window.jQuery;

// Tab Menu

const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
  });
});

// Search Image

const searchInput = document.getElementById('searchInput');
let searchTimeoutInstance = null;

function createSearch(inputValue) {
  const gallery = document.querySelector('.gallery');
  if (!inputValue) {
    gallery.innerHTML = '';
    return
  };

  searchTimeoutInstance = setTimeout(function () {
    searchTimeoutInstance = null;
    const url = `https://mygoapi.miyago9267.com/mygo/img?keyword=${inputValue}`;
    $.ajax({
      url,
    }).done(function (data) {
      gallery.innerHTML = '';
      data.urls.forEach((url) => {
        const imgContainer = document.createElement('div');
        imgContainer.setAttribute('class', 'image-container');

        const img = document.createElement('img');
        img.src = url.url;
        img.alt = url.alt;
        img.width = 200;
        img.height = 100;
        imgContainer.appendChild(img);
        gallery.appendChild(imgContainer);
      });
    });
  }, 500);
}

const gallery = document.querySelector('.gallery');
// 當滑鼠移入圖片時顯示遮罩
gallery.addEventListener('mouseover', (e) => {
  const target = e.target.closest('.image-container');
  if (target) {
    const rect = target.getBoundingClientRect();
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.opacity = 1;
    overlay.style.pointerEvents = 'auto';

    // 更新按鈕行為
    const imgSrc = target.querySelector('img').src;
    copyButton.onclick = () => {
      navigator.clipboard.writeText(imgSrc).then(() => {
        alert('已複製圖片 URL！');
      });
    };
    saveButton.onclick = () => {
      const link = document.createElement('a');
      link.href = imgSrc;
      link.download = imgSrc.split('/').pop();
      link.click();
    };
  }
});

// 當滑鼠移出時隱藏遮罩
gallery.addEventListener('mouseout', () => {
  overlay.style.opacity = 0;
  overlay.style.pointerEvents = 'none';
});

searchInput.addEventListener('input', function () {
  inputValue = searchInput.value.trim();
  if (searchTimeoutInstance) {
    clearTimeout(searchTimeoutInstance);
    createSearch(inputValue);
  } else {
    createSearch(inputValue);
  }
});