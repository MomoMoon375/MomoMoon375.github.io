var tips = [
  "Каждый звук может стоить вам жизни. В тишине можно услышать всё: шаги врагов, шорохи зомби. Двигайтесь бесшумно и не оставляйте следов.",
  "Ожидайте худшего. В этом мире надежда — это роскошь. Каждый день приносит новые испытания, и вам придется быть готовыми ко всему.",
  "Выбор — это не роскошь. Каждое ваше решение может оказаться роковым. В этом мире нет лёгких путей, ваша жизнь зависит от мудрого выбора.",
  "Голод и жажда — ваши главные враги. Еда и вода теперь дефицит, и без них вам не выжить. Каждая капля воды и кусок пищи могут быть последними.",
  "Технологии против вас. Умные машины Союза следят за каждым вашим шагом. Избегайте их и используйте окружение, чтобы оставаться незамеченными.",
  "Смерть не имеет пощады. Здесь умирают быстро и без предупреждения. Одна ошибка, одно неверное решение — и вас больше нет.",
  "Вы здесь один. В этом мире вы не можете рассчитывать ни на кого. Полагайтесь только на себя и свою смекалку, если хотите выжить и продолжить борьбу.",
  "Не доверяйте никому. В этом мире друзей нет. Каждый может оказаться предателем, готовым продать вас Союзу. Будьте осторожны в своих связях.",
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
  hasFilesNeeded: false,
  hasFileProgress: false,
  currentDownload: "",
  progress: 0,
  loadingComplete: false,
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
var progressTrack = document.getElementById("progressTrack");
var projectTitle = document.getElementById("projectTitle");
var titleLetters = document.querySelectorAll(".title-letter");
var titleProgress = 0;
var titleTargetProgress = 0;
var titleAnimationFrame = 0;
var titleAnimationTimeout = 0;
var titleInkTop = 0;
var titleInkBottom = 0;
var fileStatus = document.getElementById("fileStatus");
var fileCounter = document.getElementById("fileCounter");
var consoleTrack = document.getElementById("consoleTrack");
var serverName = document.getElementById("serverName");
var mapName = document.getElementById("mapName");
var serverMapName = document.getElementById("serverMapName");
var maxPlayersLabel = document.getElementById("maxPlayers");
var tipCounter = document.getElementById("tipCounter");
var gameMode = document.getElementById("gameMode");
var backgroundMusic = document.getElementById("backgroundMusic");
var musicToggle = document.getElementById("musicToggle");
var musicLabel = document.getElementById("musicLabel");
var loadingScreen = document.querySelector(".loading-screen");

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

function setScreenBackground(path) {
  if (!loadingScreen || !path) {
    return;
  }

  var imagePath = resolveAssetPath(path);

  loadingScreen.style.backgroundColor = "#050607";
  loadingScreen.style.backgroundImage = "radial-gradient(circle at 78% 24%, rgba(154, 59, 45, 0.26), transparent 34%), radial-gradient(circle at 18% 80%, rgba(214, 150, 50, 0.15), transparent 34%), url('" + imagePath + "')";
  loadingScreen.style.backgroundPosition = "center center, center center, center center";
  loadingScreen.style.backgroundRepeat = "no-repeat, no-repeat, no-repeat";
  loadingScreen.style.backgroundSize = "auto, auto, cover";
}

function createSlides() {
  var existingSlides = document.querySelectorAll(".slide");
  if (existingSlides.length) {
    var images = getBackgroundImages();

    if (images.length) {
      setScreenBackground(images[0]);
    }

    addConsoleLine("background / static slides " + existingSlides.length);
    window.setTimeout(function () {
      var loadedCount = 0;
      var slideImages = document.querySelectorAll(".slide img");

      for (var i = 0; i < slideImages.length; i += 1) {
        if (slideImages[i].complete && slideImages[i].width > 0) {
          loadedCount += 1;
        }
      }

      addConsoleLine("background / visible " + loadedCount + " of " + slideImages.length);
    }, 1400);
    return;
  }

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
    slide.style.backgroundImage = "url('" + imagePath + "')";
    image.src = imagePath;
    image.alt = "";
    image.draggable = false;

    image.onload = (function (path) {
      return function () {
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
}

function cycleSlides() {
  var slides = document.querySelectorAll(".slide");
  var images = getBackgroundImages();

  if (slides.length < 2) {
    if (images.length) {
      state.currentSlide = (state.currentSlide + 1) % images.length;
      setScreenBackground(images[state.currentSlide]);
    }

    return;
  }

  removeClass(slides[state.currentSlide], "is-active");
  state.currentSlide = (state.currentSlide + 1) % slides.length;
  addClass(slides[state.currentSlide], "is-active");

  if (images.length) {
    setScreenBackground(images[state.currentSlide % images.length]);
  }
}

function swapText(element, value) {
  window.clearTimeout(element.textSwapTimer);
  addClass(element, "is-changing");

  element.textSwapTimer = window.setTimeout(function () {
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
  var number = Number(value);
  return isFinite(number) ? Math.max(0, Math.min(100, Math.round(number))) : state.progress;
}

function renderTitleProgress(value) {
  var filledLetters = (value / 100) * titleLetters.length;

  for (var i = 0; i < titleLetters.length; i += 1) {
    var letter = titleLetters[i];
    var fill = Math.max(0, Math.min(1, filledLetters - i));
    var cutoff = titleInkBottom - fill * (titleInkBottom - titleInkTop);

    letter.style.setProperty("--letter-cutoff", fill === 0 ? "100%" : fill === 1 ? "0px" : cutoff + "px");

    if (fill === 1) {
      addClass(letter, "is-complete");
    } else {
      removeClass(letter, "is-complete");
    }

    if (fill > 0 && fill < 1) {
      addClass(letter, "is-active");
    } else {
      removeClass(letter, "is-active");
    }
  }
}

function measureTitleInk() {
  var style = window.getComputedStyle(projectTitle);
  var fontSize = parseFloat(style.fontSize);
  var lineHeight = parseFloat(style.lineHeight) || fontSize * 1.15;
  var context = document.createElement("canvas").getContext("2d");
  context.font = style.fontWeight + " " + style.fontSize + " " + style.fontFamily;
  var metrics = context.measureText("INTERVAL");

  // Use the visible glyph bounds so filling starts at the foot of each letter.
  if (typeof metrics.fontBoundingBoxAscent === "number" && typeof metrics.actualBoundingBoxAscent === "number") {
    var baseline = (lineHeight - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent) / 2 + metrics.fontBoundingBoxAscent;
    titleInkTop = baseline - metrics.actualBoundingBoxAscent;
    titleInkBottom = baseline + metrics.actualBoundingBoxDescent;
  } else {
    titleInkTop = fontSize * 0.25;
    titleInkBottom = fontSize * 1.02;
  }

  renderTitleProgress(titleProgress);
}

function finishTitleAnimation() {
  if (window.cancelAnimationFrame) {
    window.cancelAnimationFrame(titleAnimationFrame);
  }
  window.clearTimeout(titleAnimationTimeout);
  titleAnimationFrame = 0;
  titleProgress = titleTargetProgress;
  renderTitleProgress(titleProgress);
}

function animateTitleProgress(target) {
  if (target === titleTargetProgress && (titleAnimationFrame || target === titleProgress)) {
    return;
  }

  titleTargetProgress = target;

  // Commit completion immediately, even when animation frames are paused.
  if (target === 100 || target === titleProgress || !window.requestAnimationFrame ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    finishTitleAnimation();
    return;
  }

  // Also finish if the embedded browser pauses requestAnimationFrame during loading.
  window.clearTimeout(titleAnimationTimeout);
  titleAnimationTimeout = window.setTimeout(finishTitleAnimation, 800);

  // Keep the running animation alive when many file events arrive between frames.
  if (titleAnimationFrame) {
    return;
  }

  var lastTick = Date.now();

  function tick() {
    var now = Date.now();
    var elapsed = Math.max(0, now - lastTick);
    lastTick = now;
    titleProgress += (titleTargetProgress - titleProgress) * (1 - Math.exp(-elapsed / 120));

    if (Math.abs(titleTargetProgress - titleProgress) < 0.05) {
      finishTitleAnimation();
      return;
    }

    renderTitleProgress(titleProgress);
    titleAnimationFrame = window.requestAnimationFrame(tick);
  }

  titleAnimationFrame = window.requestAnimationFrame(tick);
}

function renderProgress(value) {
  // File lists can be refreshed or delivered out of order within one connection.
  var progress = Math.max(state.progress, clampProgress(value));
  state.progress = progress;
  state.simulatedProgress = Math.max(state.simulatedProgress, progress);
  progressFill.style.width = progress + "%";
  progressValue.textContent = progress + "%";
  progressTrack.setAttribute("aria-valuenow", progress);
  animateTitleProgress(progress);
}

function renderTipCounter() {
  tipCounter.textContent = ("0" + (state.tipIndex + 1)).slice(-2) + " / " + ("0" + tips.length).slice(-2);
}

function renderFileCounter() {
  var loaded = Math.max(0, Math.min(state.filesTotal, state.filesTotal - state.filesNeeded));
  fileCounter.textContent = loaded + " / " + state.filesTotal;
}

function updateProgressFromFiles() {
  if (!state.filesTotal || !state.hasFilesNeeded || state.loadingComplete) {
    return;
  }

  state.hasFileProgress = true;
  var loaded = state.filesTotal - state.filesNeeded;
  renderProgress((loaded / state.filesTotal) * 100);
  renderFileCounter();
}

function readFileCount(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  var count = Number(value);
  return isFinite(count) && count >= 0 ? Math.floor(count) : null;
}

function finishCurrentDownload() {
  if (!state.currentDownload) {
    return;
  }

  state.currentDownload = "";

  // GMod reports the start of each file, but may not refresh the remaining count.
  if (state.hasFileProgress && !state.loadingComplete) {
    state.filesNeeded = Math.max(0, state.filesNeeded - 1);
    updateProgressFromFiles();
  }
}

function finishLoading() {
  state.loadingComplete = true;
  state.currentDownload = "";
  state.filesNeeded = 0;
  fileStatus.textContent = "Ресурсы загружены";
  renderFileCounter();
  renderProgress(100);
}

function setStatus(message) {
  if (!message) {
    return;
  }

  swapText(footerStatus, message);
  addConsoleLine(message);
}

function playMusic() {
  var playResult = backgroundMusic.play();
  if (playResult && playResult.catch) {
    playResult.catch(updateMusicControl);
  }
}

function updateMusicControl() {
  var playing = !backgroundMusic.paused;
  musicToggle.setAttribute("aria-pressed", playing ? "true" : "false");
  musicToggle.setAttribute("aria-label", playing ? "Выключить музыку" : "Включить музыку");
  musicLabel.textContent = playing ? "Музыка включена" : "Включить музыку";

  if (playing) {
    addClass(musicToggle, "is-playing");
  } else {
    removeClass(musicToggle, "is-playing");
  }
}

function startMusic() {
  if (!backgroundMusic) {
    return;
  }

  backgroundMusic.volume = 0.34;
  backgroundMusic.addEventListener("play", updateMusicControl);
  backgroundMusic.addEventListener("pause", updateMusicControl);
  musicToggle.addEventListener("click", function () {
    if (backgroundMusic.paused) {
      playMusic();
    } else {
      backgroundMusic.pause();
    }
  });

  playMusic();
  updateMusicControl();
}

function startFallbackMotion() {
  window.setInterval(cycleSlides, 14000);

  window.setInterval(function () {
    state.tipIndex = (state.tipIndex + 1) % tips.length;
    swapText(tipText, tips[state.tipIndex]);
    renderTipCounter();
  }, 12000);

  window.setInterval(function () {
    state.statusIndex = (state.statusIndex + 1) % fallbackStatuses.length;
    if (!state.hasRealProgress) {
      setStatus(fallbackStatuses[state.statusIndex]);
    }
  }, 3000);

  window.setInterval(function () {
    if (state.hasFileProgress || state.loadingComplete) {
      return;
    }

    state.simulatedProgress = Math.min(90, state.simulatedProgress + Math.random() * 4.8);
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
  serverMapName.textContent = mapName.textContent;
  maxPlayersLabel.textContent = Number(maxPlayers) > 0 ? maxPlayers : "—";

  if (mode) {
    gameMode.textContent = mode;
  }

  addConsoleLine("session / " + (name || "server") + " " + (serverUrl || ""));
  addConsoleLine("client / steam " + (steamId || "pending") + " maxplayers " + (maxPlayers || "?"));
};

window.SetStatusChanged = function setStatusChanged(status) {
  if (!status) {
    return;
  }

  state.hasRealProgress = true;
  setStatus(status);

  if (/(error|fail|cancel|disconnect|timed?\s*out|ошиб|отмен|отключ)/i.test(status)) {
    state.currentDownload = "";
  } else if (/(starting\s+lua|lua\s+(started|initialized)|sending\s+client\s+info|запуск\s+lua|lua\s+запущен|отправка\s+(данных|информации)\s+клиент)/i.test(status)) {
    finishLoading();
  } else {
    finishCurrentDownload();
  }
};

window.SetFilesTotal = function setFilesTotal(total) {
  var count = readFileCount(total);
  if (count === null || state.loadingComplete) {
    return;
  }

  state.hasRealProgress = true;
  state.filesTotal = count;
  // RefreshDownloadables sends SetFilesNeeded BEFORE SetFilesTotal.
  if (!state.hasFilesNeeded) {
    state.filesNeeded = state.filesTotal;
  }
  renderFileCounter();
  updateProgressFromFiles();
};

window.SetFilesNeeded = function setFilesNeeded(needed) {
  var count = readFileCount(needed);
  if (count === null || state.loadingComplete) {
    return;
  }

  state.hasRealProgress = true;
  // An authoritative decrease already accounts for the previous file finishing.
  if (state.hasFilesNeeded && count < state.filesNeeded) {
    state.currentDownload = "";
  }
  state.hasFilesNeeded = true;
  state.filesNeeded = count;
  if (count === 0) {
    state.currentDownload = "";
  }
  renderFileCounter();
  updateProgressFromFiles();
};

window.DownloadingFile = function downloadingFile(fileName) {
  if (state.loadingComplete) {
    return;
  }

  state.hasRealProgress = true;
  if (fileName && fileName !== state.currentDownload) {
    finishCurrentDownload();
    state.currentDownload = fileName;
  }
  fileStatus.textContent = fileName || "Загрузка файла";
  addConsoleLine("download / " + (fileName || "resource"));
};

measureTitleInk();
window.addEventListener("resize", measureTitleInk);
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(measureTitleInk);
}

createSlides();
startMusic();
startFallbackMotion();
renderProgress(0);
renderFileCounter();
renderTipCounter();

for (var i = 0; i < 4; i += 1) {
  addConsoleLine(consoleMessages[i]);
}
