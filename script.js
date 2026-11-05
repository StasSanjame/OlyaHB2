// ============================================================================
// УПРАВЛЕНИЕ СТРАНИЦАМИ И НАВИГАЦИЕЙ
// ============================================================================
let currentPage = 1;
const totalPages = 13;
let isAnimatingAnswer = false;

// Состояние каруселей на 9 и 10 страницах
const carouselState = {
  q6: 1,
  q7: 1
};

/**
 * Автоматический фоллбэк регистра расширений файлов для GitHub Pages (Linux чувствителен к регистру)
 */
function setupImageCaseFallback() {
  const images = document.querySelectorAll('img');
  images.forEach((img) => {
    img.addEventListener('error', function onImgError() {
      const currentSrc = img.getAttribute('src');
      if (!currentSrc || img.dataset.fallbackTried === 'all') return;

      const dotIndex = currentSrc.lastIndexOf('.');
      if (dotIndex === -1) return;

      const base = currentSrc.substring(0, dotIndex);
      const ext = currentSrc.substring(dotIndex + 1);
      const candidates = ['jpg', 'JPG', 'jpeg', 'JPEG', 'png', 'PNG'];
      let tried = img.dataset.triedExts ? img.dataset.triedExts.split(',') : [ext];

      const nextExt = candidates.find((c) => !tried.includes(c));
      if (nextExt) {
        tried.push(nextExt);
        img.dataset.triedExts = tried.join(',');
        img.src = `${base}.${nextExt}`;
      } else {
        img.dataset.fallbackTried = 'all';
      }
    });
  });
}

/**
 * Остановка всех видео при уходе со страницы 4 и при запуске другого видео
 */
function setupVideoControls() {
  const videos = document.querySelectorAll('video');
  videos.forEach((vid) => {
    vid.addEventListener('play', () => {
      videos.forEach((other) => {
        if (other !== vid && !other.paused) {
          other.pause();
        }
      });
    });
  });
}

function pauseAllVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach((vid) => {
    if (!vid.paused) vid.pause();
  });
}

/**
 * Переход на указанную страницу (1..13)
 */
function goToPage(pageNumber) {
  if (pageNumber < 1 || pageNumber > totalPages) return;

  pauseAllVideos();

  // Сброс анимаций на кнопках целевой страницы
  const targetSection = document.querySelector(`.page[data-page="${pageNumber}"]`);
  if (targetSection) {
    const btns = targetSection.querySelectorAll('.btn');
    btns.forEach((b) => {
      b.classList.remove('correct-anim', 'wrong-anim');
      b.disabled = false;
    });
  }

  // Переключение видимости секций
  document.querySelectorAll('.page').forEach((sec) => {
    sec.classList.remove('active');
  });
  if (targetSection) {
    targetSection.classList.add('active');
  }

  currentPage = pageNumber;
  window.scrollTo({ top: 0, behavior: 'smooth' });

  updateCornerNavigation();
  updateCelebrationEffects();

  // Инициализация спойлеров при переходе на 11 или 13 страницу
  if (currentPage === 11) {
    requestAnimationFrame(() => initSpoilerCanvas('spoiler-1'));
  } else if (currentPage === 13) {
    requestAnimationFrame(() => initSpoilerCanvas('spoiler-2'));
  }
}

/**
 * Возврат на предыдущую страницу (кнопка-стрелочка слева внизу)
 */
function goBack() {
  if (isAnimatingAnswer) return;
  if (currentPage > 1) {
    goToPage(currentPage - 1);
  }
}

/**
 * Обновление видимости маленьких кнопок навигации внизу по углам
 */
function updateCornerNavigation() {
  const backBtn = document.getElementById('nav-back-btn');
  const restartBtn = document.getElementById('nav-restart-btn');

  // Кнопка "Назад" слева внизу есть на всех страницах, кроме 1-й
  if (currentPage === 1) {
    backBtn.classList.add('hidden');
  } else {
    backBtn.classList.remove('hidden');
  }

  // Кнопка "Вперёд (на 1-ю страницу)" справа внизу есть только на 13-й странице
  if (currentPage === 13) {
    restartBtn.classList.remove('hidden');
  } else {
    restartBtn.classList.add('hidden');
  }
}

// ============================================================================
// ОБРАБОТКА ОТВЕТОВ ВИКТОРИНЫ И АНИМАЦИИ ПРАВИЛЬНО / НЕПРАВИЛЬНО
// ============================================================================
function handleAnswer(buttonEl, isCorrect, nextPage) {
  if (isAnimatingAnswer) return;
  isAnimatingAnswer = true;

  // Блокируем кнопки на текущей странице во время проигрывания анимации
  const currentSection = document.querySelector(`.page[data-page="${currentPage}"]`);
  if (currentSection) {
    currentSection.querySelectorAll('.btn').forEach((b) => (b.disabled = true));
  }

  // 1. Анимация на самой кнопке (зелёная или красная)
  if (isCorrect) {
    buttonEl.classList.add('correct-anim');
  } else {
    buttonEl.classList.add('wrong-anim');
  }

  // 2. Через 550 мс показываем полноэкранный анимированный оверлей "Правильно!" / "Неправильно!"
  setTimeout(() => {
    showFullScreenFeedback(isCorrect);
  }, 550);

  // 3. Через 1950 мс скрываем оверлей и переходим на следующую страницу
  setTimeout(() => {
    hideFullScreenFeedback();
    isAnimatingAnswer = false;
    goToPage(nextPage);
  }, 1950);
}

function showFullScreenFeedback(isCorrect) {
  const overlay = document.getElementById('feedback-overlay');
  const icon = document.getElementById('feedback-icon');
  const text = document.getElementById('feedback-text');

  overlay.classList.remove('is-correct', 'is-wrong');
  if (isCorrect) {
    overlay.classList.add('is-correct');
    icon.textContent = '✅';
    text.textContent = 'Правильно!';
    spawnConfettiBurst(window.innerWidth / 2, window.innerHeight / 2, 70);
  } else {
    overlay.classList.add('is-wrong');
    icon.textContent = '❌';
    text.textContent = 'Неправильно!';
  }

  overlay.classList.add('show');
}

function hideFullScreenFeedback() {
  const overlay = document.getElementById('feedback-overlay');
  overlay.classList.remove('show');
}

// ============================================================================
// КАРУСЕЛИ НА 9 И 10 СТРАНИЦАХ (ВОПРОСЫ 6 И 7)
// ============================================================================
function setSlide(quizId, slideNum) {
  let num = parseInt(slideNum, 10);
  if (isNaN(num) || num < 1) num = 1;
  if (num > 7) num = 7;

  carouselState[quizId] = num;

  // Обновляем слайды
  const slidesContainer = document.getElementById(`slides-${quizId}`);
  if (slidesContainer) {
    const slides = slidesContainer.querySelectorAll('.carousel-slide');
    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx + 1 === num);
    });
  }

  // Обновляем точки
  const dotsContainer = document.getElementById(`dots-${quizId}`);
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('.dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx + 1 === num);
    });
  }

  // Обновляем счётчик
  const counter = document.getElementById(`counter-${quizId}`);
  if (counter) {
    counter.textContent = `Фото ${num} из 7`;
  }

  // Синхронизируем поле ввода числа и текст кнопки ответа
  const input = document.getElementById(`input-${quizId}`);
  if (input && parseInt(input.value, 10) !== num) {
    input.value = num;
  }

  const submitBtn = document.getElementById(`submit-${quizId}`);
  if (submitBtn) {
    submitBtn.textContent = `Выбрать фото №${num}`;
  }
}

function changeSlide(quizId, delta) {
  let next = carouselState[quizId] + delta;
  if (next < 1) next = 7;
  if (next > 7) next = 1;
  setSlide(quizId, next);
}

function stepNumber(quizId, delta) {
  let next = carouselState[quizId] + delta;
  if (next < 1) next = 1;
  if (next > 7) next = 7;
  setSlide(quizId, next);
}

function onInputNumberChange(quizId, value) {
  setSlide(quizId, value);
}

function submitCarouselAnswer(quizId, buttonEl, correctNumber, nextPage) {
  const chosen = carouselState[quizId];
  const isCorrect = chosen === correctNumber;
  handleAnswer(buttonEl, isCorrect, nextPage);
}

// ============================================================================
// СПОЙЛЕР В СТИЛЕ TELEGRAM (СТРАНИЦЫ 11 И 13)
// ============================================================================
const spoilerAnimations = {};

function initSpoilerCanvas(spoilerId) {
  const container = document.getElementById(spoilerId);
  if (!container || container.classList.contains('revealed')) return;

  const canvas = container.querySelector('.spoiler-canvas');
  if (!canvas) return;

  const rect = container.getBoundingClientRect();
  const width = Math.max(rect.width, 300);
  const height = Math.max(rect.height, 380);
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const particleCount = 260;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.5) * 0.65,
      vy: (Math.random() - 0.5) * 0.65,
      alpha: Math.random() * 0.75 + 0.2,
      da: (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? 1 : -1)
    });
  }

  if (spoilerAnimations[spoilerId]) {
    cancelAnimationFrame(spoilerAnimations[spoilerId]);
  }

  function renderParticles() {
    if (container.classList.contains('revealed')) return;
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha += p.da;

      if (p.alpha <= 0.15 || p.alpha >= 0.95) p.da *= -1;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < 0) p.y = height;
      if (p.y > height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.fill();
    }

    spoilerAnimations[spoilerId] = requestAnimationFrame(renderParticles);
  }

  renderParticles();
}

function revealSpoiler(spoilerId) {
  const container = document.getElementById(spoilerId);
  if (!container || container.classList.contains('revealed')) return;

  container.classList.add('revealed');
  if (spoilerAnimations[spoilerId]) {
    cancelAnimationFrame(spoilerAnimations[spoilerId]);
  }

  const rect = container.getBoundingClientRect();
  spawnConfettiBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 85);
}

// ============================================================================
// ПРАЗДНИЧНЫЕ АНИМАЦИИ: КОНФЕТТИ, САЛЮТЫ И ВОЗДУШНЫЕ ШАРИКИ (СТР. 1 и 11)
// ============================================================================
const canvas = document.getElementById('celebration-canvas');
const ctx = canvas.getContext('2d');
let confettiList = [];
let fireworkParticles = [];
let celebrationActive = true;
let balloonInterval = null;

const FESTIVE_COLORS = [
  '#ff3e9d', '#ffd166', '#06d6a0', '#4cc9f0',
  '#9d4edd', '#ff9f1c', '#f72585', '#a8ff78'
];

function resizeCelebrationCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCelebrationCanvas);
resizeCelebrationCanvas();

function createConfettiPiece(x, y, isBurst = false) {
  const color = FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)];
  return {
    x: x !== undefined ? x : Math.random() * canvas.width,
    y: y !== undefined ? y : -20,
    w: Math.random() * 9 + 5,
    h: Math.random() * 6 + 4,
    color,
    vx: isBurst ? (Math.random() - 0.5) * 14 : (Math.random() - 0.5) * 2.2,
    vy: isBurst ? (Math.random() - 0.7) * 14 : Math.random() * 2.4 + 1.2,
    gravity: isBurst ? 0.25 : 0.02,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    opacity: 1,
    isBurst
  };
}

function spawnConfettiBurst(x, y, count = 60) {
  for (let i = 0; i < count; i++) {
    confettiList.push(createConfettiPiece(x, y, true));
  }
}

function spawnFirework() {
  if (!celebrationActive) return;
  const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
  const y = Math.random() * (canvas.height * 0.45) + canvas.height * 0.08;
  const color = FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)];
  const count = 42;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = Math.random() * 4.5 + 1.5;
    fireworkParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color,
      alpha: 1,
      size: Math.random() * 2.8 + 1.5
    });
  }
}

function spawnBalloon() {
  if (!celebrationActive) return;
  const container = document.getElementById('balloons-container');
  if (!container || container.children.length > 14) return;

  const balloon = document.createElement('div');
  balloon.className = 'balloon';
  const color = FESTIVE_COLORS[Math.floor(Math.random() * FESTIVE_COLORS.length)];
  const left = Math.random() * 92 + 2;
  const duration = Math.random() * 7 + 9;
  const scale = Math.random() * 0.35 + 0.75;

  balloon.style.left = `${left}%`;
  balloon.style.background = `radial-gradient(circle at 35% 30%, #ffffff, ${color} 45%, #1a0933 140%)`;
  balloon.style.animationDuration = `${duration}s`;
  balloon.style.transform = `scale(${scale})`;

  container.appendChild(balloon);
  setTimeout(() => {
    balloon.remove();
  }, duration * 1000);
}

function updateCelebrationEffects() {
  // На 1, 11 и 13 страницах включаем полную праздничную феерию (конфетти, шарики, салюты)
  const isFestivePage = currentPage === 1 || currentPage === 11 || currentPage === 13;
  celebrationActive = isFestivePage;

  const balloonsContainer = document.getElementById('balloons-container');
  if (isFestivePage) {
    balloonsContainer.style.display = 'block';
    spawnConfettiBurst(window.innerWidth / 2, window.innerHeight * 0.3, 65);
    spawnBalloon();
  } else {
    balloonsContainer.style.display = 'none';
    balloonsContainer.innerHTML = '';
  }
}

function animateCelebrationCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Постоянный мягкий дождь из конфетти на праздничных страницах
  if (celebrationActive && confettiList.length < 75 && Math.random() < 0.35) {
    confettiList.push(createConfettiPiece());
  }

  for (let i = confettiList.length - 1; i >= 0; i--) {
    const c = confettiList[i];
    c.x += c.vx;
    c.y += c.vy;
    c.vy += c.gravity;
    c.rotation += c.rotationSpeed;
    if (c.isBurst) c.opacity -= 0.012;

    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate((c.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(c.opacity, 0);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();

    if (c.y > canvas.height + 30 || c.opacity <= 0) {
      confettiList.splice(i, 1);
    }
  }

  for (let i = fireworkParticles.length - 1; i >= 0; i--) {
    const p = fireworkParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.alpha -= 0.018;

    ctx.save();
    ctx.globalAlpha = Math.max(p.alpha, 0);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (p.alpha <= 0) {
      fireworkParticles.splice(i, 1);
    }
  }

  requestAnimationFrame(animateCelebrationCanvas);
}

// ============================================================================
// СТАРТ ПРИЛОЖЕНИЯ
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupImageCaseFallback();
  setupVideoControls();
  updateCornerNavigation();
  updateCelebrationEffects();
  animateCelebrationCanvas();

  // Периодический запуск воздушных шариков и салютов на праздничных страницах
  balloonInterval = setInterval(() => {
    if (celebrationActive) {
      spawnBalloon();
      if (Math.random() < 0.65) spawnFirework();
    }
  }, 1800);
});
