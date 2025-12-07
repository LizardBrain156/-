let selectedHairStyle = '';
let selectedHairColor = 'white';
let selectedSkin = '';
let selectedEyes = 'empty';
let selectedLips = '';
let lashesAdded = false;
let hairIsSingle = false;
let selectedHairAccessory = '';
let selectedTights = '';
let hairUpdateInProgress = false;  // ← сюда
let isRandomizing = false;

// === Управление слоями ===
function updateLayers() {
  const baseOrder = [
    'base',      // 1
    'skin',      // 2
    'tights',    // 3
    'hair-back', // 4
    'boots',     // 5
    'dress',     // 6
    'gloves',    // 7
    'coat'       // 8
  ];

  baseOrder.forEach((id, idx) => {
    const el = document.getElementById(id);
    if (el) el.style.zIndex = idx + 1;
  });

  const hairFront = document.getElementById('hair-front');
  const hairAccessory = document.getElementById('hair-accessory');
  const eyes = document.getElementById('eyes');
  const lashes = document.getElementById('lashes');
  const lips = document.getElementById('lips');

  if (hairFront) {
    if (hairIsSingle) {
      hairFront.style.zIndex = 4;
      const boots = document.getElementById('boots');
      const dress = document.getElementById('dress');
      const gloves = document.getElementById('gloves');
      const coat = document.getElementById('coat');
      if (boots) boots.style.zIndex = 5;
      if (dress) dress.style.zIndex = 6;
      if (gloves) gloves.style.zIndex = 7;
      if (coat) coat.style.zIndex = 8;
    } else {
      hairFront.style.zIndex = 9;
      const boots = document.getElementById('boots');
      const dress = document.getElementById('dress');
      const gloves = document.getElementById('gloves');
      const coat = document.getElementById('coat');
      if (boots) boots.style.zIndex = 4;
      if (dress) dress.style.zIndex = 5;
      if (gloves) gloves.style.zIndex = 6;
      if (coat) coat.style.zIndex = 7;
    }
  }

  if (hairAccessory) hairAccessory.style.zIndex = 10;
  if (eyes) eyes.style.zIndex = 11;
  if (lashes) lashes.style.zIndex = 12;
  if (lips) lips.style.zIndex = 13;
}

// === Функция безопасной установки слоя с проверкой файла ===
function setLayerWithCheck(id, src) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!src || src.trim() === '') {
    el.style.display = 'none';   // ← новое
    el.src = '';                 // ← новое (вместо removeAttribute)
    updateLayers();
    return;
}

  fetch(src, { method: 'HEAD' })
    .then(res => {
      if (res.ok) {
        el.src = src;
        el.style.display = 'block';
      } else {
        el.style.display = 'none';
        el.src = '';

      }
      updateLayers();
    })
    .catch(() => {
      el.removeAttribute('src');
      el.style.display = 'none';
      updateLayers();
    });
}

// === Внешность ===
function setSkin(color) { selectedSkin = color; updateSkin(); }
function updateSkin() {
  const skin = document.getElementById('skin');
  if (!skin) return;

  skin.onerror = () => { skin.style.display = 'none'; skin.src = ''; }; // ← вставить

  if (!selectedSkin) {
    skin.style.display = 'none';
    skin.src = '';
  } else {
    skin.src = `assets/skin/skin_${selectedSkin}.png`;
    skin.style.display = 'block';
  }

  updateLayers();
}

function setEyes(color) { selectedEyes = color; updateEyes(); }
function updateEyes() {
  const eyes = document.getElementById('eyes');
  if (!eyes) return;

  eyes.onerror = () => { eyes.style.display = 'none'; eyes.src = ''; }; // ← сюда

  if (!selectedEyes) { eyes.removeAttribute('src'); eyes.style.display = 'none'; }
  else { eyes.src = `assets/eyes/eyes_${selectedEyes}.png`; eyes.style.display = 'block'; }
  updateLayers();
}

function setLips(color) { selectedLips = color; updateLips(); }
function updateLips() {
  const lips = document.getElementById('lips');
  if (!lips) return;

  lips.onerror = () => { lips.style.display = 'none'; lips.src = ''; }; // ← сюда

  if (!selectedLips) { lips.removeAttribute('src'); lips.style.display = 'none'; }
  else { lips.src = `assets/lips/lips_${selectedLips}.png`; lips.style.display = 'block'; }
  updateLayers();
}

// === Ресницы ===
function addLashes() { setLayerWithCheck('lashes', "assets/lashes/lashes1.png"); lashesAdded = true; }
function removeLashes() { setLayerWithCheck('lashes', ''); lashesAdded = false; }

// === Волосы ===
function selectHairStyle(name) {
  selectedHairStyle = name;
  if (!isRandomizing) updateHair();
}

function setHairColor(color) {
  // валидация входа — ничего не делаем для пустых/неопределённых значений
  if (!color && color !== '') return;

  // сохраняем выбранный цвет
  selectedHairColor = color;

  // обновляем прическу (updateHair сам защитится, если сейчас идёт обновление)
  try {
    updateHair();
  } catch (e) {
    // на всякий случай — не даём ошибке поломать остальное
    console.warn('updateHair error:', e);
  }

  // подсветка иконок: сначала снимаем со всех
  try {
    const icons = document.querySelectorAll('.color-grid img');
    if (icons && icons.length) {
      icons.forEach(img => {
        img.classList.remove('selected');
      });

      // пытаемся найти по data-color (надежнее). Если нет — пробуем по onclick как запасной вариант.
      let icon = document.querySelector(`.color-grid img[data-color="${CSS.escape(String(color))}"]`);
      if (!icon) {
        // запасной поиск: ищем img с onclick="setHairColor('...')" — только если data-color не настроен
        icon = Array.from(icons).find(img => {
          const onclick = img.getAttribute('onclick') || '';
          return onclick.includes(`setHairColor('${color}')`) || onclick.includes(`setHairColor("${color}")`);
        }) || null;
      }

      if (icon) icon.classList.add('selected');
    }
  } catch (e) {
    // ничего критичного — просто логируем
    console.warn('hair color icon highlight error:', e);
  }
}

// === Волосы ===
function updateHair() {
  if (hairUpdateInProgress) return; // пока идёт обновление — игнорируем повторные вызовы
  hairUpdateInProgress = true;

  const hairBack = document.getElementById('hair-back');
  const hairFront = document.getElementById('hair-front');

  if (hairBack) hairBack.onerror = () => { hairBack.style.display = 'none'; hairBack.src = ''; };
  if (hairFront) hairFront.onerror = () => { hairFront.style.display = 'none'; hairFront.src = ''; };

  if (!selectedHairStyle) {
    hairIsSingle = false;
    if (hairBack) { hairBack.style.display = 'none'; hairBack.src = ''; }
    if (hairFront) { hairFront.style.display = 'none'; hairFront.src = ''; }
    updateLayers();
    hairUpdateInProgress = false;
    return;
  }

  const base = `assets/hair/${selectedHairStyle}_${selectedHairColor}`;
  const backPath = `${base}_back.png`;
  const frontPath = `${base}_front.png`;
  const singlePath = `${base}.png`;

  fetch(backPath, { method: 'HEAD' })
    .then(res => {
      if (res.ok) {
        hairIsSingle = false;
        hairBack.src = backPath; hairBack.style.display = 'block';
        hairFront.src = frontPath; hairFront.style.display = 'block';
      } else {
        hairIsSingle = true;
        hairBack.style.display = 'none'; hairBack.src = '';
        hairFront.src = singlePath; hairFront.style.display = 'block';
      }
      updateLayers();
      hairUpdateInProgress = false;
    })
    .catch(() => {
      hairIsSingle = true;
      hairBack.style.display = 'none'; hairBack.src = '';
      hairFront.src = singlePath; hairFront.style.display = 'block';
      updateLayers();
      hairUpdateInProgress = false;
    });
}

// === Украшения для волос ===
function setHairAccessory(src) { setLayerWithCheck('hair-accessory', src); }

// === Одежда ===
function changeDress(src) { setLayerWithCheck('dress', src); }
function changeCoat(src) { setLayerWithCheck('coat', src); }
function changeGloves(src) { setLayerWithCheck('gloves', src); }
function changeBoots(src) { setLayerWithCheck('boots', src); }
function changeTights(src) { setLayerWithCheck('tights', src); }

// === Рандомизация ===
function randomizeCharacter() {
  isRandomizing = true;
  const hairStyles = ['hair1','hair2','hair3','hair4']; 
  const hairColors = ['blonde','black','brown','darkbrown','red','white','fair','cherry','blue','crimson','teal',
    'bluegradient','purplegradient','pink'];
  selectHairStyle(hairStyles[Math.floor(Math.random() * hairStyles.length)]);
  setHairColor(hairColors[Math.floor(Math.random() * hairColors.length)]);

  const skinColors = ['light','dark','yellow','white','tanned','starry'];
  setSkin(skinColors[Math.floor(Math.random() * skinColors.length)]);

  const eyesColors = ['blue','green','brown','black','grey','darkblue','red','amber','wild','cosmic','pink','empty'];
  setEyes(eyesColors[Math.floor(Math.random() * eyesColors.length)]);

  const lipsColors = ['pink','red','nude','orange','amber','lilac','black','peachy','magenta','golden','brown','blue',
    'violet','wine','white'];
  setLips(lipsColors[Math.floor(Math.random() * lipsColors.length)]);

  Math.random() < 0.5 ? addLashes() : removeLashes();

  const accessories = [null,
    'assets/hair/flower1.png',
    'assets/hair/flower2.png',
    'assets/hair/flower3.png',
    'assets/hair/flower4.png',
    'assets/hair/flower5.png',
    'assets/hair/flower6.png',
    'assets/hair/flower7.png',
    'assets/hair/flower8.png',
    'assets/hair/flower9.png',
    'assets/hair/flower10.png',
    'assets/hair/flower11.png',
    'assets/hair/flower12.png',
    'assets/hair/flower13.png',
    'assets/hair/flower14.png',
    'assets/hair/flower15.png',
    'assets/hair/blue_headband.png',
    'assets/hair/green_headband.png',
    'assets/hair/orange_headband.png',
    'assets/hair/white_headband.png',
    'assets/hair/black_headband.png',
    'assets/hair/pink_headband.png',
    'assets/hair/yellow_headband.png',
    'assets/hair/teal_headband.png',
    'assets/hair/violet_headband.png',
    'assets/hair/lilac_headband.png',
    'assets/hair/red_headband.png',
    'assets/hair/grey_headband.png',
    'assets/hair/darkblue_headband.png'];
  setHairAccessory(accessories[Math.floor(Math.random() * accessories.length)]);

  const dresses = [
    'assets/clothes/dresses/pink_dress.png',
    'assets/clothes/dresses/blue_dress.png',
    'assets/clothes/dresses/green_dress.png',
    'assets/clothes/dresses/yellow_dress.png',
    'assets/clothes/dresses/black_dress.png',
    'assets/clothes/dresses/white_dress.png',
    'assets/clothes/dresses/red_dress.png',
    'assets/clothes/dresses/orange_dress.png',
    'assets/clothes/dresses/darkblue_dress.png',
    'assets/clothes/dresses/violet_dress.png',
    'assets/clothes/dresses/lilac_dress.png',
    'assets/clothes/dresses/grey_dress.png'
  ];
  const coats = [
    null,
    'assets/clothes/coats/red_coat.png',
    'assets/clothes/coats/orange_coat.png',
    'assets/clothes/coats/yellow_coat.png',
    'assets/clothes/coats/green_coat.png',
    'assets/clothes/coats/blue_coat.png',
    'assets/clothes/coats/darkblue_coat.png',
    'assets/clothes/coats/violet_coat.png',
    'assets/clothes/coats/lilac_coat.png',
    'assets/clothes/coats/black_coat.png',
    'assets/clothes/coats/grey_coat.png',
    'assets/clothes/coats/white_coat.png',
    'assets/clothes/coats/pink_coat.png'
  ];
  const gloves = [
    null,
    'assets/clothes/gloves/pink_gloves.png',
    'assets/clothes/gloves/blue_gloves.png',
    'assets/clothes/gloves/green_gloves.png',
    'assets/clothes/gloves/yellow_gloves.png',
    'assets/clothes/gloves/black_gloves.png',
    'assets/clothes/gloves/white_gloves.png',
    'assets/clothes/gloves/red_gloves.png',
    'assets/clothes/gloves/orange_gloves.png',
    'assets/clothes/gloves/darkblue_gloves.png',
    'assets/clothes/gloves/violet_gloves.png',
    'assets/clothes/gloves/lilac_gloves.png',
    'assets/clothes/gloves/grey_gloves.png'
  ];
  const boots = [
    null,
    'assets/clothes/boots/red_boots.png',
    'assets/clothes/boots/orange_boots.png',
    'assets/clothes/boots/yellow_boots.png',
    'assets/clothes/boots/green_boots.png',
    'assets/clothes/boots/blue_boots.png',
    'assets/clothes/boots/darkblue_boots.png',
    'assets/clothes/boots/violet_boots.png',
    'assets/clothes/boots/pink_boots.png',
    'assets/clothes/boots/black_boots.png',
    'assets/clothes/boots/white_boots.png',
    'assets/clothes/boots/grey_boots.png',
    'assets/clothes/boots/lilac_boots.png'
  ];
  const tights = [
    null,
    'assets/clothes/tights/black_tights.png',
    'assets/clothes/tights/white_tights.png',
    'assets/clothes/tights/grey_tights.png',
    'assets/clothes/tights/red_tights.png',
    'assets/clothes/tights/orange_tights.png',
    'assets/clothes/tights/yellow_tights.png',
    'assets/clothes/tights/green_tights.png',
    'assets/clothes/tights/blue_tights.png',
    'assets/clothes/tights/darkblue_tights.png',
    'assets/clothes/tights/violet_tights.png',
    'assets/clothes/tights/lilac_tights.png',
    'assets/clothes/tights/pink_tights.png'
  ];

  changeDress(dresses[Math.floor(Math.random() * dresses.length)]);
  changeCoat(coats[Math.floor(Math.random() * coats.length)]);
  changeGloves(gloves[Math.floor(Math.random() * gloves.length)]);
  changeBoots(boots[Math.floor(Math.random() * boots.length)]);
  changeTights(tights[Math.floor(Math.random() * tights.length)]);

  isRandomizing = false;
  updateHair(); // ← финальный вызов, гарантия согласованности слоёв
}

function saveOutfit() {
  const char = document.querySelector(".character");
  if (!char) return;

  // Сохраняем исходные стили
  const origWidth = char.style.width;
  const origHeight = char.style.height;

  // Задаём фиксированную ширину и автоматическую высоту, чтобы сохранить пропорции
  char.style.width = "360px";
  char.style.height = "auto";

  html2canvas(char, { scale: 2, useCORS: true }).then(canvas => {
    const link = document.createElement("a");
    link.download = "my_outfit.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

    // Восстанавливаем исходные стили
    char.style.width = origWidth;
    char.style.height = origHeight;
  });
}

// === Сброс персонажа ===
function resetCharacter() {
  selectedHairStyle = '';
  selectedHairColor = 'white';
  selectedSkin = '';
  selectedEyes = 'empty';
  selectedLips = '';
  lashesAdded = false;
  selectedHairAccessory = '';
  selectedTights = '';

  // Базовые слои
  updateSkin();
  updateEyes();
  updateLips();

  // Волосы и аксессуары
  const hairBack = document.getElementById('hair-back');
  const hairFront = document.getElementById('hair-front');
  if (hairBack) { hairBack.removeAttribute('src'); hairBack.style.display = 'none'; }
  if (hairFront) { hairFront.removeAttribute('src'); hairFront.style.display = 'none'; }
  hairIsSingle = false;
  setHairAccessory('');

  // Ресницы
  removeLashes();

  // Одежда и колготки
  changeTights('');
  changeDress('');
  changeCoat('');
  changeGloves('');
  changeBoots('');

  // Снимаем выделение иконок
  try {
    document.querySelectorAll('.color-grid img, .icon-grid img').forEach(img => img.classList.remove('selected'));
    document.querySelectorAll('.small-icon-btn.selected').forEach(btn => btn.classList.remove('selected'));
  } catch(e){}

  setHairColor('white');
  updateLayers();

  const leftPanelContent = document.querySelector('.left-panel .panel-content') || document.querySelector('.left-panel');
  if (leftPanelContent) leftPanelContent.scrollTop = 0;
}

// === Категории ===
function showCategory(category) {
  const menu = document.querySelector('.categories-menu');
  const screen = document.getElementById('category-screen');
  if (!menu || !screen) return;
  menu.style.display = 'none';
  screen.style.display = 'flex';
  document.querySelectorAll('.screen-content').forEach(div => div.style.display = 'none');
  if (category === 'cosmetics') document.querySelector('.cosmetics-screen').style.display = 'block';
  if (category === 'hairstyle') document.querySelector('.hairstyle-screen').style.display = 'block';
  if (category === 'wardrobe') document.querySelector('.wardrobe-screen').style.display = 'block';
}

function showMainCategories() {
  const menu = document.querySelector('.categories-menu');
  const screen = document.getElementById('category-screen');
  if (!menu || !screen) return;
  menu.style.display = 'flex';
  screen.style.display = 'none';
  document.querySelectorAll('.screen-content').forEach(div => div.style.display = 'none');
}

// === Инициализация волос на загрузке ===
function initHairLayers() {
  const hairBack = document.getElementById('hair-back');
  const hairFront = document.getElementById('hair-front');
  if (!hairBack || !hairFront) return;

  // 🔥 Защитные обработчики
  hairBack.onerror = () => { hairBack.style.display = 'none'; hairBack.src = ''; };
  hairFront.onerror = () => { hairFront.style.display = 'none'; hairFront.src = ''; };

  if (!selectedHairStyle) {
    hairBack.style.display = 'none'; hairBack.src = '';
    hairFront.style.display = 'none'; hairFront.src = '';
    return;
  }

  // используем updateHair(), чтобы не дублировать логику
  updateHair();
}

// === Привязка кнопки рандома ===
document.getElementById('random-btn').addEventListener('click', randomizeCharacter);

// === Загрузка страницы ===
window.addEventListener('DOMContentLoaded', () => {
  setHairColor('white');
  setEyes('empty');
  initHairLayers();
});

window.onload = function() { updateLayers(); };
