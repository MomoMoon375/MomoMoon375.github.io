var tips = [
  "Каждый звук может стоить вам жизни. В тишине можно услышать всё: шаги врагов, шорохи зомби. Двигайтесь бесшумно и не оставляйте следов.",
  "Ожидайте худшего. В этом мире надежда — это роскошь. Каждый день приносит новые испытания, и вам придется быть готовыми ко всему.",
  "Выбор — это не роскошь. Каждое ваше решение может оказаться роковым. В этом мире нет лёгких путей, ваша жизнь зависит от мудрого выбора.",
  "Голод и жажда — ваши главные враги. Еда и вода теперь дефицит, и без них вам не выжить. Каждая капля воды и кусок пищи могут быть последними.",
  "Технологии против вас. Умные машины Альянса следят за каждым вашим шагом. Избегайте их и используйте окружение, чтобы оставаться незамеченными.",
  "Смерть не имеет пощады. Здесь умирают быстро и без предупреждения. Одна ошибка, одно неверное решение — и вас больше нет.",
  "Вы здесь один. В этом мире вы не можете рассчитывать ни на кого. Полагайтесь только на себя и свою смекалку, если хотите выжить и продолжить борьбу.",
  "Не доверяйте никому. В этом мире друзей нет. Каждый может оказаться предателем, готовым продать вас Альянсу. Будьте осторожны в своих связях.",
  "Каждая пуля на счету. В этой войне патронов не хватает, и каждый выстрел должен быть точным. Берегите свои боеприпасы."
];

var fallbackStatuses = [
  "Подключение к серверу...",
  "Получение данных сессии...",
  "Проверка контента...",
  "Загрузка Workshop ресурсов...",
  "Синхронизация клиента...",
  "Подготовка к входу..."
];

var consoleMessages = [
  "interval.auth / handshake accepted",
  "imperial.assets / manifest received",
  "reinz.core / route verified",
  "workshop.stream / waiting for files",
  "map.cache / rp_localinterval",
  "client.sync / loading interface",
  "audio.bus / music layer armed",
  "session / awaiting final spawn"
];

var state = {
  filesTotal: 0,
  filesNeeded: 0,
  simulatedProgress: 0,
  currentSlide: 0,
  statusIndex: 0,
  tipIndex: 0,
  hasRealProgress: false
};

var backgroundSlides = document.getElementById("backgroundSlides");
var tipText = document.getElementById("tipText");
var footerStatus = document.getElementById("footerStatus");
var progressValue = document.getElementById("progressValue");
var progressFill = document.getElementById("progressFill");
var fileStatus = document.getElementById("fileStatus");
var fileCounter = document.getElementById("fileCounter");
var consoleTrack = document.getElementById("consoleTrack");
var serverName = document.getElementById("serverName");
var mapName = document.getElementById("mapName");
var gameMode = document.getElementById("gameMode");
var backgroundMusic = document.getElementById("backgroundMusic");

function addClass(element, className) {
  if (element.classList) {
    element.classList.add(className);
    return;
  }

  if ((" " + element.className + " ").indexOf(" " + className + " ") === -1) {
    element.className += " " + className;
  }
}

function removeClass(element, className) {
  if (element.classList) {
    element.classList.remove(className);
    return;
  }

  element.className = (" " + element.className + " ").replace(" " + className + " ", " ");
}

function getBackgroundImages() {
  if (window.l_bgImages && window.l_bgImages.length) {
    return window.l_bgImages;
  }

  return [];
}

function resolveAssetPath(path) {
  var link = document.createElement("a");
  link.href = path;
  return link.href;
}

function fitSlideImage(image) {
  var viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1920;
  var viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1080;
  var imageWidth = image.naturalWidth || image.width || 16;
  var imageHeight = image.naturalHeight || image.height || 9;
  var viewportRatio = viewportWidth / viewportHeight;
  var imageRatio = imageWidth / imageHeight;
  var targetWidth;
  var targetHeight;

  if (imageRatio > viewportRatio) {
    targetHeight = viewportHeight;
    targetWidth = Math.ceil(targetHeight * imageRatio);
  } else {
    targetWidth = viewportWidth;
    targetHeight = Math.ceil(targetWidth / imageRatio);
  }

  image.style.width = targetWidth + "px";
  image.style.height = targetHeight + "px";
  image.style.left = Math.floor((viewportWidth - targetWidth) / 2) + "px";
  image.style.top = Math.floor((viewportHeight - targetHeight) / 2) + "px";
}

function fitAllSlideImages() {
  var images = document.querySelectorAll(".slide img");

  for (var i = 0; i < images.length; i += 1) {
    fitSlideImage(images[i]);
  }
}

function createSlides() {
  var images = getBackgroundImages();

  if (!images.length) {
    addConsoleLine("backgrounds / config is empty", "warn");
    return;
  }

  for (var i = 0; i < images.length; i += 1) {
    var slide = document.createElement("div");
    var image = document.createElement("img");
    var imagePath = resolveAssetPath(images[i]);

    slide.className = i === 0 ? "slide is-active" : "slide";
    image.src = imagePath;
    image.alt = "";
    image.draggable = false;

    image.onload = (function (path) {
      return function () {
        fitSlideImage(this);
        addConsoleLine("background / loaded " + path);
      };
    })(images[i]);

    image.onerror = (function (path) {
      return function () {
        addConsoleLine("background / missing " + path, "warn");
      };
    })(images[i]);

    slide.appendChild(image);
    backgroundSlides.appendChild(slide);
  }

  fitAllSlideImages();
}

function cycleSlides() {
  var slides = document.querySelectorAll(".slide");
  if (slides.length < 2) {
    return;
  }

  removeClass(slides[state.currentSlide], "is-active");
  state.currentSlide = (state.currentSlide + 1) % slides.length;
  addClass(slides[state.currentSlide], "is-active");
}

function swapText(element, value) {
  addClass(element, "is-changing");

  window.setTimeout(function () {
    element.textContent = value;
    removeClass(element, "is-changing");
  }, 220);
}

function addConsoleLine(message, variant) {
  var line = document.createElement("div");
  line.className = "log-line" + (variant ? " " + variant : "");
  line.textContent = "[" + new Date().toLocaleTimeString("ru-RU") + "] " + message;
  consoleTrack.insertBefore(line, consoleTrack.firstChild);

  while (consoleTrack.children.length > 12) {
    consoleTrack.removeChild(consoleTrack.lastElementChild);
  }
}

function clampProgress(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function renderProgress(value) {
  var progress = clampProgress(value);
  progressFill.style.width = progress + "%";
  progressValue.textContent = progress + "%";
}

function renderFileCounter() {
  var loaded = Math.max(0, state.filesTotal - state.filesNeeded);
  fileCounter.textContent = loaded + " / " + state.filesTotal;
}

function updateProgressFromFiles() {
  if (!state.filesTotal) {
    return;
  }

  var loaded = state.filesTotal - state.filesNeeded;
  renderProgress((loaded / state.filesTotal) * 100);
  renderFileCounter();
}

function setStatus(message) {
  if (!message) {
    return;
  }

  swapText(footerStatus, message);
  addConsoleLine(message);
}

function startMusic() {
  if (!backgroundMusic) {
    return;
  }

  backgroundMusic.volume = 0.34;

  var playResult = backgroundMusic.play();
  if (playResult && playResult.catch) {
    playResult.catch(function () {
      document.addEventListener("click", function playAfterClick() {
        backgroundMusic.play();
        document.removeEventListener("click", playAfterClick);
      });
    });
  }
}

function startFallbackMotion() {
  window.setInterval(cycleSlides, 5600);

  window.setInterval(function () {
    state.tipIndex = (state.tipIndex + 1) % tips.length;
    swapText(tipText, tips[state.tipIndex]);
  }, 6400);

  window.setInterval(function () {
    state.statusIndex = (state.statusIndex + 1) % fallbackStatuses.length;
    if (!state.hasRealProgress) {
      setStatus(fallbackStatuses[state.statusIndex]);
    }
  }, 3000);

  window.setInterval(function () {
    if (state.hasRealProgress) {
      return;
    }

    state.simulatedProgress = Math.min(96, state.simulatedProgress + Math.random() * 4.8);
    renderProgress(state.simulatedProgress);
  }, 900);

  window.setInterval(function () {
    var message = consoleMessages[Math.floor(Math.random() * consoleMessages.length)];
    addConsoleLine(message, Math.random() > 0.78 ? "warn" : "");
  }, 1450);
}

window.GameDetails = function gameDetails(name, serverUrl, map, maxPlayers, steamId, mode) {
  if (name) {
    serverName.textContent = name;
  }

  mapName.textContent = map || "rp_localinterval";

  if (mode) {
    gameMode.textContent = mode;
  }

  addConsoleLine("session / " + (name || "server") + " " + (serverUrl || ""));
  addConsoleLine("client / steam " + (steamId || "pending") + " maxplayers " + (maxPlayers || "?"));
};

window.SetStatusChanged = function setStatusChanged(status) {
  state.hasRealProgress = true;
  setStatus(status);
};

window.SetFilesTotal = function setFilesTotal(total) {
  state.hasRealProgress = true;
  state.filesTotal = Number(total) || 0;
  state.filesNeeded = state.filesTotal;
  renderFileCounter();
  updateProgressFromFiles();
};

window.SetFilesNeeded = function setFilesNeeded(needed) {
  state.hasRealProgress = true;
  state.filesNeeded = Number(needed) || 0;
  updateProgressFromFiles();
};

window.DownloadingFile = function downloadingFile(fileName) {
  state.hasRealProgress = true;
  fileStatus.textContent = fileName || "Загрузка файла";
  addConsoleLine("download / " + (fileName || "resource"));
};

createSlides();
window.onresize = fitAllSlideImages;
startMusic();
startFallbackMotion();
renderProgress(0);
renderFileCounter();

for (var i = 0; i < 4; i += 1) {
  addConsoleLine(consoleMessages[i]);
}
