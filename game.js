/**
 * GAME 1: DIVISIBILITY BALLOON POP — RETRO CARNIVAL SHOOTING GALLERY ENGINE
 * Cambridge Year 4 Tests of Divisibility (Rules for 2, 3, 4, 5, 6, 8, 9, 10)
 * StuCent Sandboxed Runtime Compatible (Allow-Scripts / ShadowRoot Safe)
 */

(() => {
  'use strict';

  const doc = typeof root !== 'undefined' ? root : document;
  const gameCtx = typeof game !== 'undefined' ? game : (window.game || null);

  const safeStorage = {
    getItem(key) {
      try { return (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem(key) : null; } catch (e) { return null; }
    },
    setItem(key, val) {
      try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, val); } catch (e) {}
    }
  };

  function getEl(id) {
    try {
      if (doc && typeof doc.getElementById === 'function') {
        const el = doc.getElementById(id);
        if (el) return el;
      }
      if (doc && typeof doc.querySelector === 'function') {
        const el = doc.querySelector('#' + id);
        if (el) return el;
      }
    } catch (e) {}
    try {
      if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
        return document.getElementById(id);
      }
    } catch (e) {}
    return null;
  }

  function queryAll(sel) {
    try {
      if (doc && typeof doc.querySelectorAll === 'function') {
        const res = doc.querySelectorAll(sel);
        if (res && res.length > 0) return res;
      }
    } catch (e) {}
    try {
      if (typeof document !== 'undefined' && typeof document.querySelectorAll === 'function') {
        return document.querySelectorAll(sel);
      }
    } catch (e) {}
    return [];
  }

  // ==========================================================================
  // 1. SOUND & MUSIC SYNTHESIZER
  // ==========================================================================
  let audioCtx = null;
  let isMuted = safeStorage.getItem('math_games_sound') === 'false';
  let bgmMasterGain = null;
  let bgmInterval = null;
  let bgmStep = 0;
  let screenShakeIntensity = 0;

  function triggerScreenShake(amt = 10) {
    screenShakeIntensity = amt;
  }

  function initAudio() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        bgmMasterGain = audioCtx.createGain();
        bgmMasterGain.gain.setValueAtTime(isMuted ? 0 : 0.05, audioCtx.currentTime);
        bgmMasterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startCarnivalBGM() {
    initAudio();
    if (!audioCtx || bgmInterval) return;

    // Upbeat Playful Carnival Organ Melody (126 BPM)
    const bassline = [
      174.6, 0, 261.6, 261.6,  220.0, 0, 261.6, 261.6,
      233.0, 0, 293.6, 293.6,  196.0, 0, 261.6, 261.6,
      174.6, 0, 261.6, 261.6,  220.0, 0, 261.6, 261.6,
      233.0, 0, 261.6, 0,      174.6, 0, 196.0, 0
    ];

    const leadMelody = [
      698.46, 0, 880.0, 0,     1046.5, 0, 880.0, 0,
      932.33, 0, 880.0, 0,     783.99, 0, 698.46, 0,
      698.46, 0, 880.0, 0,     1046.5, 0, 1174.6, 0,
      1046.5, 0, 880.0, 0,     698.46, 0, 880.0, 0
    ];

    const stepDuration = (60 / 126) / 4;
    bgmStep = 0;

    bgmInterval = setInterval(() => {
      if (isMuted || !audioCtx || !isPlaying || isGameOver) return;
      const t = audioCtx.currentTime;
      const idx = bgmStep % 32;

      const bFreq = bassline[idx];
      if (bFreq > 0) {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(bFreq, t);
          gain.gain.setValueAtTime(0.06, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.5);
          osc.connect(gain);
          gain.connect(bgmMasterGain);
          osc.start(t);
          osc.stop(t + stepDuration * 1.6);
        } catch (e) {}
      }

      const lFreq = leadMelody[idx];
      if (lFreq > 0) {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(lFreq, t);
          gain.gain.setValueAtTime(0.035, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.3);
          osc.connect(gain);
          gain.connect(bgmMasterGain);
          osc.start(t);
          osc.stop(t + stepDuration * 1.4);
        } catch (e) {}
      }

      bgmStep++;
    }, stepDuration * 1000);
  }

  function stopCarnivalBGM() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  function beep(freq, durationMs, type = 'sine', vol = 0.15, delaySec = 0) {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    try {
      const t = audioCtx.currentTime + delaySec;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + durationMs / 1000);
    } catch (e) {}
  }

  function playDartShootSound() {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
    } catch (e) {}
  }

  function playPopSound(comboVal = 1) {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    const baseFreq = 480 + Math.min(800, (comboVal - 1) * 75);
    try {
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq * 1.5, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, t + 0.14);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + 0.15);

      // Latex snap noise
      const bufferSize = audioCtx.sampleRate * 0.05;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.18, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      noise.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noise.start(t);
    } catch (e) {}
    triggerScreenShake(6);
  }

  function playPowerupSound(type) {
    if (isMuted) return;
    initAudio();
    if (type === 'freeze') {
      [880, 1174, 1567, 2093].forEach((f, i) => beep(f, 200, 'sine', 0.15, i * 0.06));
    } else if (type === 'gold') {
      [659, 880, 1318, 1760].forEach((f, i) => beep(f, 220, 'triangle', 0.2, i * 0.07));
    } else if (type === 'bomb') {
      [300, 200, 100, 50].forEach((f, i) => beep(f, 300, 'sawtooth', 0.25, i * 0.05));
      triggerScreenShake(15);
    }
  }

  function playWrongSound() {
    beep(190, 250, 'sawtooth', 0.22);
    beep(135, 280, 'square', 0.18, 0.08);
    triggerScreenShake(12);
  }

  function playRoundWinSound() {
    [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
      beep(f, 180, 'triangle', 0.18, i * 0.09);
    });
    triggerScreenShake(8);
  }

  function playGameOverSound() {
    [440, 392, 349, 293].forEach((f, i) => {
      beep(f, 300, 'sine', 0.18, i * 0.12);
    });
  }

  // ==========================================================================
  // 2. CAMBRIDGE YEAR 4 DIVISIBILITY CURRICULUM (10 ROUNDS)
  // ==========================================================================
  const ROUNDS_DATA = [
    {
      roundNum: 1,
      badge: 'ROUND 01 • RULE FOR 2',
      title: 'POP NUMBERS DIVISIBLE BY 2',
      tip: 'Last digit must be even: 0, 2, 4, 6, or 8',
      quota: 3,
      balloonSpeed: 1.25,
      spawnInterval: 1100,
      test: (n) => n % 2 === 0,
      explain: (n) => `Look at last digit of ${n}: ${n % 10}. It is odd, so ${n} is not divisible by 2.`,
      pool: [4, 8, 12, 16, 20, 24, 28, 30, 36, 42, 50, 64],
      distractors: [3, 7, 9, 15, 21, 27, 33, 41, 55, 63]
    },
    {
      roundNum: 2,
      badge: 'ROUND 02 • RULE FOR 5',
      title: 'POP NUMBERS DIVISIBLE BY 5',
      tip: 'The last digit must be 0 or 5!',
      quota: 3,
      balloonSpeed: 1.3,
      spawnInterval: 1050,
      test: (n) => n % 5 === 0,
      explain: (n) => `Look at the last digit of ${n}: ${n % 10}. It must end in 0 or 5 to be in 5× table.`,
      pool: [15, 20, 25, 30, 45, 55, 60, 75, 80, 95, 100],
      distractors: [12, 18, 23, 31, 42, 54, 67, 73, 89, 94]
    },
    {
      roundNum: 3,
      badge: 'ROUND 03 • RULE FOR 10',
      title: 'POP NUMBERS DIVISIBLE BY 10',
      tip: 'The last digit must always be exactly 0!',
      quota: 3,
      balloonSpeed: 1.35,
      spawnInterval: 1000,
      test: (n) => n % 10 === 0,
      explain: (n) => `${n} does not end in 0, so it cannot be divided evenly by 10.`,
      pool: [20, 30, 50, 70, 90, 100, 120, 140, 150, 180],
      distractors: [25, 35, 48, 52, 65, 78, 93, 105, 125, 137]
    },
    {
      roundNum: 4,
      badge: 'ROUND 04 • RULE FOR 3',
      title: 'POP NUMBERS DIVISIBLE BY 3',
      tip: 'Add the digits together! If the sum is in the 3× table, it is divisible.',
      quota: 4,
      balloonSpeed: 1.35,
      spawnInterval: 1000,
      test: (n) => n % 3 === 0,
      explain: (n) => {
        const sum = String(n).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        return `Digits of ${n}: ${String(n).split('').join('+')} = ${sum}. ${sum} is not in 3× table.`;
      },
      pool: [18, 21, 27, 33, 36, 42, 51, 57, 63, 72, 81, 96],
      distractors: [14, 19, 23, 29, 35, 43, 53, 62, 74, 85]
    },
    {
      roundNum: 5,
      badge: 'ROUND 05 • RULE FOR 4',
      title: 'POP NUMBERS DIVISIBLE BY 4',
      tip: 'Halve the number twice, or check if the last 2 digits divide by 4!',
      quota: 4,
      balloonSpeed: 1.4,
      spawnInterval: 950,
      test: (n) => n % 4 === 0,
      explain: (n) => `Half of ${n} is ${n / 2}. Halving again is not a whole number, so not in 4× table.`,
      pool: [16, 24, 28, 32, 36, 44, 48, 56, 64, 72, 84, 92],
      distractors: [14, 18, 22, 26, 30, 38, 42, 50, 66, 74]
    },
    {
      roundNum: 6,
      badge: 'ROUND 06 • RULE FOR 6',
      title: 'POP NUMBERS DIVISIBLE BY 6',
      tip: 'Must be EVEN (divisible by 2) AND the sum of digits must divide by 3!',
      quota: 4,
      balloonSpeed: 1.45,
      spawnInterval: 950,
      test: (n) => n % 6 === 0,
      explain: (n) => `${n} is not divisible by 6 because it fails either the rule for 2 or the rule for 3.`,
      pool: [18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 84, 96],
      distractors: [15, 21, 26, 32, 38, 45, 52, 64, 75, 86]
    },
    {
      roundNum: 7,
      badge: 'ROUND 07 • RULE FOR 9',
      title: 'POP NUMBERS DIVISIBLE BY 9',
      tip: 'Sum of all digits must add up to 9, 18, 27 (divisible by 9)!',
      quota: 4,
      balloonSpeed: 1.45,
      spawnInterval: 950,
      test: (n) => n % 9 === 0,
      explain: (n) => {
        const sum = String(n).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        return `Digits of ${n}: ${String(n).split('').join('+')} = ${sum}. ${sum} is not a multiple of 9.`;
      },
      pool: [27, 36, 45, 54, 63, 72, 81, 99, 108, 117, 126],
      distractors: [25, 34, 48, 56, 65, 76, 85, 93, 102, 115]
    },
    {
      roundNum: 8,
      badge: 'ROUND 08 • 3-DIGIT RULE FOR 3',
      title: 'POP 3-DIGIT NUMBERS DIVISIBLE BY 3',
      tip: 'Add all 3 digits! e.g. 102 -> 1+0+2=3 (Divisible!)',
      quota: 4,
      balloonSpeed: 1.5,
      spawnInterval: 900,
      test: (n) => n % 3 === 0,
      explain: (n) => {
        const sum = String(n).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        return `Digits of ${n}: ${String(n).split('').join('+')} = ${sum}. ${sum} is not in 3× table.`;
      },
      pool: [102, 111, 114, 123, 126, 135, 141, 153, 162, 174, 183],
      distractors: [101, 103, 112, 115, 122, 125, 134, 143, 151, 160]
    },
    {
      roundNum: 9,
      badge: 'ROUND 09 • 3-DIGIT RULE FOR 4',
      title: 'POP 3-DIGIT NUMBERS DIVISIBLE BY 4',
      tip: 'Check only the last two digits (tens + ones)!',
      quota: 4,
      balloonSpeed: 1.55,
      spawnInterval: 900,
      test: (n) => n % 4 === 0,
      explain: (n) => `Look at last 2 digits of ${n}: ${n % 100}. ${n % 100} cannot be divided by 4.`,
      pool: [104, 108, 116, 124, 132, 136, 144, 152, 164, 172, 188],
      distractors: [102, 106, 114, 122, 130, 134, 142, 150, 162, 170]
    },
    {
      roundNum: 10,
      badge: 'ROUND 10 • GRAND ARCADE FINALE',
      title: 'POP NUMBERS DIVISIBLE BY 2, 3, 4, 5, OR 10',
      tip: 'Any valid divisibility multiple counts! Pop fast!',
      quota: 5,
      balloonSpeed: 1.65,
      spawnInterval: 800,
      test: (n) => n % 2 === 0 || n % 3 === 0 || n % 5 === 0,
      explain: (n) => `${n} is a prime number that is not divisible by 2, 3, or 5.`,
      pool: [12, 15, 20, 24, 30, 36, 40, 45, 50, 60, 72, 84, 90, 100],
      distractors: [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]
    }
  ];

  // ==========================================================================
  // 3. GAME STATE & VARIABLES
  // ==========================================================================
  let currentRoundIdx = 0;
  let score = 0;
  let lives = 3;
  let combo = 1;
  let bestCombo = 1;
  let totalPopped = 0;
  let totalAttempts = 0;
  let roundPoppedCount = 0;
  let timeRemaining = 75;
  let gameTimerInterval = null;
  let lastSpawnTime = 0;
  let gameStartTime = 0;
  let isPlaying = false;
  let isGameOver = false;

  // Powerups State
  let freezeTimer = 0; // ms remaining
  let frenzyTimer = 0; // ms remaining (2x score)

  // Interactive Systems
  let balloons = [];
  let particles = [];
  let darts = [];
  let floatingTexts = [];
  let ambientConfetti = [];

  // Crosshair / Aim State
  const aim = {
    x: 400,
    y: 300,
    isHoveringBalloon: false,
    hoveredBalloonId: null,
    pulseAnim: 0
  };

  // Carnival Launcher Character State
  const player = {
    x: 400,
    y: 540,
    targetAngle: -Math.PI / 2,
    currentAngle: -Math.PI / 2,
    recoil: 0,
    isThrowing: false,
    throwAnimTimer: 0
  };

  let canvas = null;
  let ctx = null;
  let animationFrameId = null;

  // Rich Balloon Color Themes
  const BALLOON_COLORS = [
    { name: 'cyan', body: '#0284c7', light: '#38bdf8', dark: '#0369a1', string: '#60a5fa' },
    { name: 'orange', body: '#ea580c', light: '#fb923c', dark: '#c2410c', string: '#fdba74' },
    { name: 'crimson', body: '#e11d48', light: '#fb7185', dark: '#be123c', string: '#fda4af' },
    { name: 'purple', body: '#7c3aed', light: '#a78bfa', dark: '#6d28d9', string: '#c4b5fd' },
    { name: 'emerald', body: '#059669', light: '#34d399', dark: '#047857', string: '#6ee7b7' },
    { name: 'amber', body: '#d97706', light: '#fbbf24', dark: '#b45309', string: '#fde68a' }
  ];

  // ==========================================================================
  // 4. SCREEN & HUD MANAGEMENT
  // ==========================================================================
  function setScreen(screenId) {
    const screens = ['start-screen', 'countdown-screen', 'instructions-modal', 'game-over-screen'];
    screens.forEach(id => {
      const el = getEl(id);
      if (el) {
        if (id === screenId) {
          el.classList.remove('hidden');
          el.classList.add('active');
        } else {
          el.classList.add('hidden');
          el.classList.remove('active');
        }
      }
    });
  }

  function updateHUD() {
    const scoreEl = getEl('score-display');
    const timerEl = getEl('timer-display');
    const roundEl = getEl('round-display');
    const comboEl = getEl('combo-display');
    const quotaEl = getEl('round-quota');

    if (scoreEl) scoreEl.textContent = String(score).padStart(6, '0');
    if (timerEl) timerEl.textContent = String(Math.max(0, timeRemaining)).padStart(3, '0');
    if (roundEl) roundEl.textContent = `${String(currentRoundIdx + 1).padStart(2, '0')} / 10`;
    if (comboEl) {
      const mult = frenzyTimer > 0 ? combo * 2 : combo;
      comboEl.textContent = `${mult}x` + (frenzyTimer > 0 ? ' ⚡' : '');
    }

    const rData = ROUNDS_DATA[currentRoundIdx];
    if (quotaEl && rData) {
      quotaEl.textContent = `TARGET: ${roundPoppedCount} / ${rData.quota}`;
    }

    const heartsContainer = getEl('lives-container');
    if (heartsContainer) {
      let heartsHtml = '';
      for (let i = 0; i < 3; i++) {
        const isFull = i < lives;
        heartsHtml += `<span class="arcade-heart ${isFull ? 'heart-full' : 'heart-empty'}" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg></span>`;
      }
      heartsContainer.innerHTML = heartsHtml;
    }
  }

  function updateMissionBanner() {
    const rData = ROUNDS_DATA[currentRoundIdx];
    if (!rData) return;

    const badgeEl = getEl('rule-badge');
    const textEl = getEl('question-text');
    const hintEl = getEl('question-hint');

    if (badgeEl) badgeEl.textContent = rData.badge;
    if (textEl) textEl.textContent = rData.title;
    if (hintEl) hintEl.textContent = rData.tip;

    updateHUD();
  }

  function showHint(text) {
    const hintBanner = getEl('hint-banner');
    const hintText = getEl('hint-text');
    if (hintBanner && hintText) {
      hintText.textContent = text;
      hintBanner.classList.remove('hidden');
      setTimeout(() => {
        hintBanner.classList.add('hidden');
      }, 3600);
    }
  }

  // ==========================================================================
  // 5. BALLOON SPAWNING & BALLISTICS
  // ==========================================================================
  let balloonUidCounter = 1;

  function spawnBalloon() {
    const rData = ROUNDS_DATA[currentRoundIdx];
    if (!rData || !canvas) return;

    // Powerup Spawn Chance (12% chance for special balloon)
    const powerRoll = Math.random();
    let specialType = null;
    if (powerRoll < 0.04) specialType = 'gold'; // Gold 2x Frenzy
    else if (powerRoll < 0.08) specialType = 'freeze'; // Freeze Clock
    else if (powerRoll < 0.11) specialType = 'bomb'; // Bomb Blast

    const isCorrect = specialType ? true : (Math.random() < 0.58);
    const pool = isCorrect ? rData.pool : rData.distractors;
    const number = specialType ? (specialType === 'gold' ? '★ 2X' : (specialType === 'freeze' ? '❄ TIME' : '💣 BOMB')) : pool[Math.floor(Math.random() * pool.length)];

    const radius = specialType ? 36 : (34 + Math.min(10, String(number).length * 2));
    const minX = radius + 30;
    const maxX = canvas.width - radius - 30;
    const x = minX + Math.random() * (maxX - minX);
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

    balloons.push({
      id: balloonUidCounter++,
      x: x,
      y: canvas.height + radius + 15,
      radius: radius,
      number: number,
      specialType: specialType,
      isCorrect: isCorrect,
      color: color,
      speedY: (1.2 + Math.random() * 0.7) * rData.balloonSpeed,
      swayFreq: 0.02 + Math.random() * 0.03,
      swayAmp: 16 + Math.random() * 20,
      swayOffset: Math.random() * Math.PI * 2,
      scaleX: 1,
      scaleY: 1,
      shakeTimer: 0,
      sparkleTimer: Math.random() * 10
    });
  }

  function fireDartToward(targetX, targetY) {
    if (!isPlaying || isGameOver || !canvas) return;

    const startX = player.x;
    const startY = player.y - 20;

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy) || 1;
    const angle = Math.atan2(dy, dx);

    player.targetAngle = angle;
    player.recoil = 12;
    player.isThrowing = true;
    player.throwAnimTimer = 10;

    const speed = 24;
    darts.push({
      x: startX,
      y: startY,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      angle: angle,
      radius: 6,
      trail: []
    });

    playDartShootSound();
  }

  function popBalloon(balloon, fromBomb = false) {
    totalAttempts++;
    const rData = ROUNDS_DATA[currentRoundIdx];

    // Check Special Balloon Powerup
    if (balloon.specialType) {
      playPowerupSound(balloon.specialType);

      if (balloon.specialType === 'gold') {
        frenzyTimer = 6000;
        score += 150;
        floatingTexts.push({
          x: balloon.x,
          y: balloon.y,
          text: `GOLDEN FRENZY! 2X SCORE!`,
          color: '#facc15',
          alpha: 1,
          life: 55,
          scale: 1.4
        });
      } else if (balloon.specialType === 'freeze') {
        freezeTimer = 6000;
        floatingTexts.push({
          x: balloon.x,
          y: balloon.y,
          text: `CHILL FREEZE! ❄`,
          color: '#38bdf8',
          alpha: 1,
          life: 55,
          scale: 1.4
        });
      } else if (balloon.specialType === 'bomb') {
        floatingTexts.push({
          x: balloon.x,
          y: balloon.y,
          text: `CARNIVAL BLAST! 💣`,
          color: '#ef4444',
          alpha: 1,
          life: 55,
          scale: 1.4
        });
        // Pop all correct balloons on screen
        const toPop = balloons.filter(b => b.id !== balloon.id && b.isCorrect);
        toPop.forEach(b => {
          const idx = balloons.indexOf(b);
          if (idx !== -1) {
            balloons.splice(idx, 1);
            popBalloon(b, true);
          }
        });
      }

      // Sparkle burst
      for (let i = 0; i < 28; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 3 + Math.random() * 7;
        particles.push({
          x: balloon.x,
          y: balloon.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          radius: 3 + Math.random() * 4,
          color: '#facc15',
          alpha: 1,
          life: 40 + Math.random() * 20
        });
      }
      updateHUD();
      return;
    }

    if (balloon.isCorrect) {
      // CORRECT DIVISIBLE BALLOON POP
      playPopSound(combo);
      totalPopped++;
      roundPoppedCount++;

      const mult = frenzyTimer > 0 ? combo * 2 : combo;
      const pts = 50 * mult;
      score += pts;
      combo = Math.min(8, combo + 1);
      if (combo > bestCombo) bestCombo = combo;

      floatingTexts.push({
        x: balloon.x,
        y: balloon.y,
        text: `+${pts} PTS!` + (combo > 1 ? ` (${combo}x)` : ''),
        color: '#fbbf24',
        alpha: 1,
        life: 45,
        scale: 1.2
      });

      // Rubber fragments
      for (let i = 0; i < 10; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 5;
        particles.push({
          x: balloon.x,
          y: balloon.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 2,
          radius: 4 + Math.random() * 4,
          color: balloon.color.body,
          alpha: 1,
          isShard: true,
          rot: Math.random() * Math.PI,
          vrot: (Math.random() - 0.5) * 0.3,
          life: 35 + Math.random() * 25
        });
      }

      // Confetti glitter
      for (let i = 0; i < 20; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 3 + Math.random() * 6;
        particles.push({
          x: balloon.x,
          y: balloon.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 3,
          radius: 2.5 + Math.random() * 3,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)].light,
          alpha: 1,
          life: 40 + Math.random() * 20
        });
      }

      if (roundPoppedCount >= rData.quota) {
        if (currentRoundIdx + 1 < ROUNDS_DATA.length) {
          currentRoundIdx++;
          roundPoppedCount = 0;
          playRoundWinSound();
          floatingTexts.push({
            x: canvas.width / 2,
            y: canvas.height * 0.45,
            text: `ROUND ${currentRoundIdx} COMPLETE!`,
            color: '#10b981',
            alpha: 1,
            life: 65,
            scale: 1.5
          });
          updateMissionBanner();
        } else {
          endGame(true);
        }
      } else {
        updateHUD();
      }

    } else {
      // INCORRECT BALLOON POP (NOT DIVISIBLE)
      playWrongSound();
      lives--;
      combo = 1;
      balloon.shakeTimer = 20;

      floatingTexts.push({
        x: balloon.x,
        y: balloon.y,
        text: `NOT DIVISIBLE! -1 LIFE`,
        color: '#ef4444',
        alpha: 1,
        life: 55,
        scale: 1.2
      });

      showHint(rData.explain(balloon.number));
      updateHUD();

      if (lives <= 0) {
        endGame(false);
      }
    }
  }

  // ==========================================================================
  // 6. GAME LOOP & RENDERING
  // ==========================================================================
  function initAmbientConfetti() {
    ambientConfetti = [];
    if (!canvas) return;
    for (let i = 0; i < 35; i++) {
      ambientConfetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 3 + Math.random() * 4,
        color: ['#fbbf24', '#38bdf8', '#f43f5e', '#a855f7', '#34d399'][Math.floor(Math.random() * 5)],
        speedY: 0.3 + Math.random() * 0.6,
        speedX: (Math.random() - 0.5) * 0.4,
        rot: Math.random() * Math.PI,
        vrot: (Math.random() - 0.5) * 0.05
      });
    }
  }

  function update() {
    if (!isPlaying || isGameOver || !canvas) return;

    const now = Date.now();

    // Powerup Timers
    if (freezeTimer > 0) freezeTimer -= 16;
    if (frenzyTimer > 0) {
      frenzyTimer -= 16;
      if (frenzyTimer <= 0) updateHUD();
    }

    // Aim Laser & Player Cannon Angle Smooth Lerp
    player.x = canvas.width / 2;
    player.y = canvas.height - 35;

    const dx = aim.x - player.x;
    const dy = aim.y - (player.y - 20);
    player.targetAngle = Math.atan2(dy, dx);

    // Limit angle so player doesn't aim downwards through the floor
    player.targetAngle = Math.max(-Math.PI * 0.95, Math.min(-Math.PI * 0.05, player.targetAngle));
    player.currentAngle += (player.targetAngle - player.currentAngle) * 0.25;

    if (player.recoil > 0) player.recoil *= 0.82;
    if (player.throwAnimTimer > 0) player.throwAnimTimer--;

    // Spawn Balloons
    const rData = ROUNDS_DATA[currentRoundIdx];
    const spawnRate = freezeTimer > 0 ? (rData.spawnInterval * 2) : rData.spawnInterval;
    if (rData && now - lastSpawnTime > spawnRate) {
      spawnBalloon();
      lastSpawnTime = now;
    }

    // Darts Physics
    for (let i = darts.length - 1; i >= 0; i--) {
      const dart = darts[i];
      dart.x += dart.vx;
      dart.y += dart.vy;

      // Trail
      dart.trail.push({ x: dart.x, y: dart.y, alpha: 0.7 });
      if (dart.trail.length > 5) dart.trail.shift();

      let hit = false;
      for (let j = balloons.length - 1; j >= 0; j--) {
        const b = balloons[j];
        const dist = Math.hypot(dart.x - b.x, dart.y - b.y);
        if (dist < b.radius + dart.radius + 6) {
          popBalloon(b);
          balloons.splice(j, 1);
          hit = true;
          break;
        }
      }

      if (hit || dart.x < -40 || dart.x > canvas.width + 40 || dart.y < -40 || dart.y > canvas.height + 40) {
        darts.splice(i, 1);
      }
    }

    // Balloons Physics
    const speedMult = freezeTimer > 0 ? 0.3 : 1.0;
    aim.isHoveringBalloon = false;
    aim.hoveredBalloonId = null;

    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      b.y -= b.speedY * speedMult;
      b.x += Math.sin(now * b.swayFreq + b.swayOffset) * 0.9;

      if (b.shakeTimer > 0) b.shakeTimer--;
      b.sparkleTimer += 0.1;

      // Check Hover Reticle
      const distToAim = Math.hypot(aim.x - b.x, aim.y - b.y);
      if (distToAim < b.radius + 10) {
        aim.isHoveringBalloon = true;
        aim.hoveredBalloonId = b.id;
      }

      if (b.y < -b.radius - 30) {
        balloons.splice(i, 1);
      }
    }

    // Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      p.alpha -= 0.022;
      p.life--;
      if (p.isShard) p.rot += p.vrot;

      if (p.life <= 0 || p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 1.2;
      ft.alpha -= 0.02;
      ft.life--;
      if (ft.life <= 0 || ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    // Ambient Confetti
    ambientConfetti.forEach(c => {
      c.y += c.speedY;
      c.x += c.speedX;
      c.rot += c.vrot;
      if (c.y > canvas.height + 10) {
        c.y = -10;
        c.x = Math.random() * canvas.width;
      }
    });

    if (screenShakeIntensity > 0.1) {
      screenShakeIntensity *= 0.86;
    } else {
      screenShakeIntensity = 0;
    }

    aim.pulseAnim += 0.08;
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (screenShakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * screenShakeIntensity;
      const sy = (Math.random() - 0.5) * screenShakeIntensity;
      ctx.translate(sx, sy);
    }

    // 1. CARNIVAL NIGHT ATMOSPHERE & BOOTH BACKGROUND
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, '#060d1d');
    bgGrad.addColorStop(0.5, '#0b1b38');
    bgGrad.addColorStop(1, '#132c5b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle Carnival Stripes
    const stripeW = 60;
    for (let x = 0; x < canvas.width; x += stripeW * 2) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.035)';
      ctx.fillRect(x, 0, stripeW, canvas.height);
    }

    // Ambient Floating Confetti
    ambientConfetti.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.fillStyle = c.color;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    });

    // Carnival Side Shelves with Plush Prizes
    const shelfY1 = canvas.height * 0.35;
    const shelfY2 = canvas.height * 0.65;

    // Left Shelf
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, shelfY1, 48, 8);
    ctx.fillRect(0, shelfY2, 48, 8);
    // Right Shelf
    ctx.fillRect(canvas.width - 48, shelfY1, 48, 8);
    ctx.fillRect(canvas.width - 48, shelfY2, 48, 8);

    // Left Prize Plush (Teddy & Star)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(24, shelfY1 - 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(24, shelfY2 - 12, 9, 0, Math.PI * 2);
    ctx.fill();

    // Right Prize Plush (Duck & Trophy)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(canvas.width - 24, shelfY1 - 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(canvas.width - 24, shelfY2 - 12, 9, 0, Math.PI * 2);
    ctx.fill();

    // Festoon Canopy Lights Across Top
    ctx.strokeStyle = '#1e3a6a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.quadraticCurveTo(canvas.width / 2, 46, canvas.width, 18);
    ctx.stroke();

    const bulbColors = ['#f59e0b', '#ef4444', '#38bdf8', '#a855f7', '#10b981', '#fbbf24'];
    const numBulbs = 18;
    const nowTime = Date.now() * 0.005;

    for (let i = 0; i <= numBulbs; i++) {
      const ratio = i / numBulbs;
      const bx = canvas.width * ratio;
      const by = 18 + Math.sin(ratio * Math.PI) * 28;
      const colIdx = (i + Math.floor(nowTime)) % bulbColors.length;
      const color = bulbColors[colIdx];

      // Glow Halo
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35 + Math.sin(nowTime + i) * 0.15;
      ctx.fill();

      // Bulb
      ctx.beginPath();
      ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.95;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // 2. RENDER BALLOONS (GLOSSY 3D SPHERES)
    balloons.forEach(b => {
      ctx.save();
      const shakeX = b.shakeTimer > 0 ? (Math.random() - 0.5) * 10 : 0;
      ctx.translate(b.x + shakeX, b.y);

      const isLockedOn = aim.hoveredBalloonId === b.id;
      if (isLockedOn) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, b.radius + 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Sine Wave Balloon String
      ctx.beginPath();
      ctx.moveTo(0, b.radius);
      ctx.bezierCurveTo(
        Math.sin(Date.now() * 0.005 + b.id) * 8, b.radius + 14,
        -Math.sin(Date.now() * 0.005 + b.id) * 8, b.radius + 28,
        0, b.radius + 40
      );
      ctx.strokeStyle = b.color.string;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Knot
      ctx.fillStyle = b.specialType ? '#f59e0b' : b.color.dark;
      ctx.beginPath();
      ctx.moveTo(-5, b.radius - 2);
      ctx.lineTo(5, b.radius - 2);
      ctx.lineTo(0, b.radius + 6);
      ctx.closePath();
      ctx.fill();

      // 3D Balloon Body Radial Gradient
      const grad = ctx.createRadialGradient(-b.radius * 0.3, -b.radius * 0.35, b.radius * 0.1, 0, 0, b.radius * 1.1);

      if (b.specialType === 'gold') {
        grad.addColorStop(0, '#fef08a');
        grad.addColorStop(0.4, '#eab308');
        grad.addColorStop(1, '#a16207');
      } else if (b.specialType === 'freeze') {
        grad.addColorStop(0, '#e0f2fe');
        grad.addColorStop(0.4, '#38bdf8');
        grad.addColorStop(1, '#0369a1');
      } else if (b.specialType === 'bomb') {
        grad.addColorStop(0, '#fecdd3');
        grad.addColorStop(0.4, '#f43f5e');
        grad.addColorStop(1, '#881337');
      } else {
        grad.addColorStop(0, b.color.light);
        grad.addColorStop(0.45, b.color.body);
        grad.addColorStop(1, b.color.dark);
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.radius * 0.92, b.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Specular Glossy Sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-b.radius * 0.35, -b.radius * 0.38, b.radius * 0.22, b.radius * 0.38, -0.45, 0, Math.PI * 2);
      ctx.fill();

      // Secondary Rim Reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.ellipse(b.radius * 0.45, b.radius * 0.35, b.radius * 0.12, b.radius * 0.22, 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Text / Number Label
      ctx.fillStyle = '#ffffff';
      const fontSize = b.specialType ? Math.round(b.radius * 0.44) : Math.round(b.radius * 0.72);
      ctx.font = `900 ${fontSize}px 'Fredoka', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 5;
      ctx.fillText(b.number, 0, 2);

      ctx.restore();
    });

    // 3. RENDER DARTS & FLIGHT TRAILS
    darts.forEach(d => {
      // Trail
      for (let i = 0; i < d.trail.length; i++) {
        const pt = d.trail[i];
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, d.radius * (i / d.trail.length), 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.globalAlpha = (i / d.trail.length) * 0.5;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle + Math.PI / 2);

      // Dart Shaft & Feathers
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-6, 12);
      ctx.lineTo(6, 12);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-2, -6, 4, 14);

      // Metal Tip
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(4, -6);
      ctx.lineTo(-4, -6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    });

    // 4. CARNIVAL AIMING LASER SIGHT & RETICLE
    if (isPlaying && !isGameOver) {
      // Laser Line from Cannon to Aim Point
      const startX = player.x;
      const startY = player.y - 20;

      ctx.save();
      ctx.strokeStyle = aim.isHoveringBalloon ? 'rgba(250, 204, 21, 0.85)' : 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(aim.x, aim.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Crosshairs at aim point
      ctx.translate(aim.x, aim.y);
      const reticleColor = aim.isHoveringBalloon ? '#facc15' : '#38bdf8';
      const reticleSize = 16 + Math.sin(aim.pulseAnim) * 2;

      ctx.strokeStyle = reticleColor;
      ctx.lineWidth = 2.5;

      // Outer Ring
      ctx.beginPath();
      ctx.arc(0, 0, reticleSize, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair Ticks
      ctx.beginPath();
      ctx.moveTo(0, -reticleSize - 6);
      ctx.lineTo(0, -reticleSize + 4);
      ctx.moveTo(0, reticleSize - 4);
      ctx.lineTo(0, reticleSize + 6);
      ctx.moveTo(-reticleSize - 6, 0);
      ctx.lineTo(-reticleSize + 4, 0);
      ctx.moveTo(reticleSize - 4, 0);
      ctx.lineTo(reticleSize + 6, 0);
      ctx.stroke();

      // Center Dot
      ctx.fillStyle = reticleColor;
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 5. CARNIVAL WOODEN BOOTH COUNTER & DART LAUNCHER
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 30);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 6);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, canvas.height - 30, canvas.width, 2);

    // Brass Plaque on Counter
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(canvas.width / 2 - 80, canvas.height - 22, 160, 16, 4);
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = "900 11px 'Fredoka', cursive, sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CARNIVAL BALLOON ARENA', canvas.width / 2, canvas.height - 14);

    // Render Animated Dart Launcher Cannon
    ctx.save();
    ctx.translate(player.x, player.y);

    // Stand base
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, 0, 22, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Rotating Cannon Barrel with Recoil
    ctx.rotate(player.currentAngle + Math.PI / 2);
    const recoilOffset = player.recoil;

    // Cannon Mount
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-12, -8 + recoilOffset, 24, 18);

    // Barrel
    const barrelGrad = ctx.createLinearGradient(-10, 0, 10, 0);
    barrelGrad.addColorStop(0, '#2563eb');
    barrelGrad.addColorStop(0.5, '#60a5fa');
    barrelGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = barrelGrad;
    ctx.beginPath();
    ctx.roundRect(-8, -34 + recoilOffset, 16, 30, 4);
    ctx.fill();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Muzzle Ring
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(-10, -38 + recoilOffset, 20, 6, 2);
    ctx.fill();

    ctx.restore();

    // 6. RENDER PARTICLES & SHARDS
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;

      if (p.isShard) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(p.radius, p.radius);
        ctx.lineTo(-p.radius, p.radius);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 7. RENDER FLOATING TEXTS
    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      const size = Math.round(20 * (ft.scale || 1.0));
      ctx.font = `900 ${size}px 'Fredoka', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });

    ctx.restore();
  }

  function gameLoop() {
    update();
    render();
    if (isPlaying) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  }

  // ==========================================================================
  // 7. START, COUNTDOWN & END GAME
  // ==========================================================================
  function startGame() {
    currentRoundIdx = 0;
    score = 0;
    lives = 3;
    combo = 1;
    bestCombo = 1;
    totalPopped = 0;
    totalAttempts = 0;
    roundPoppedCount = 0;
    timeRemaining = 80;
    freezeTimer = 0;
    frenzyTimer = 0;
    balloons = [];
    particles = [];
    darts = [];
    floatingTexts = [];
    isPlaying = true;
    isGameOver = false;
    gameStartTime = Date.now();

    initAmbientConfetti();
    setScreen(null);
    updateMissionBanner();
    startCarnivalBGM();

    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
      if (!isPlaying || isGameOver) return;
      if (freezeTimer <= 0) {
        timeRemaining--;
      }
      updateHUD();
      if (timeRemaining <= 0) {
        endGame(totalPopped >= 10);
      }
    }, 1000);

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(gameLoop);
  }

  function startCountdown() {
    initAudio();
    setScreen('countdown-screen');
    let count = 3;
    const numEl = getEl('countdown-number');
    if (numEl) numEl.textContent = count;
    beep(440, 100, 'sine', 0.15);

    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        if (numEl) numEl.textContent = count;
        beep(440, 100, 'sine', 0.15);
      } else {
        clearInterval(interval);
        beep(880, 250, 'sine', 0.2);
        startGame();
      }
    }, 750);
  }

  function endGame(isVictory) {
    isPlaying = false;
    isGameOver = true;
    stopCarnivalBGM();
    if (gameTimerInterval) clearInterval(gameTimerInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    const totalTimeTaken = Math.round((Date.now() - gameStartTime) / 1000);
    const accuracy = totalAttempts > 0 ? Math.round((totalPopped / totalAttempts) * 100) : 100;

    let stars = 1;
    if (score >= 450 && lives >= 2) stars = 3;
    else if (score >= 250) stars = 2;

    safeStorage.setItem('math_pop_stars', stars);

    if (isVictory) {
      playRoundWinSound();
    } else {
      playGameOverSound();
    }

    const badgeEl = getEl('game-over-badge');
    const titleEl = getEl('game-over-title');
    const scoreEl = getEl('final-score');
    const roundsEl = getEl('final-rounds');
    const accuracyEl = getEl('final-accuracy');
    const comboEl = getEl('final-combo');
    const timeEl = getEl('final-time');
    const starsContainer = getEl('stars-container');

    if (badgeEl) badgeEl.textContent = isVictory ? 'CARNIVAL COMPLETE!' : 'CARNIVAL FINISHED';
    if (titleEl) titleEl.textContent = isVictory ? 'CONGRATULATIONS!' : 'NICE EFFORT!';
    if (scoreEl) scoreEl.textContent = String(score).padStart(6, '0');
    if (roundsEl) roundsEl.textContent = `${Math.min(10, currentRoundIdx + (isVictory ? 1 : 0))} / 10`;
    if (accuracyEl) accuracyEl.textContent = `${accuracy}%`;
    if (comboEl) comboEl.textContent = `${bestCombo}x`;
    if (timeEl) timeEl.textContent = `${totalTimeTaken}s`;

    if (starsContainer) {
      let starsHtml = '';
      for (let s = 1; s <= 3; s++) {
        const active = s <= stars ? 'star-filled' : 'star-empty';
        starsHtml += `<svg class="arcade-star-icon ${active}" viewBox="0 0 24 24"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`;
      }
      starsContainer.innerHTML = starsHtml;
    }

    setScreen('game-over-screen');

    // StuCent Reporting Contract
    if (gameCtx && typeof gameCtx.end === 'function') {
      const targetMax = (gameCtx.config && gameCtx.config.maxPoints) || 100;
      const normalizedScore = Math.min(targetMax, Math.round((score / 800) * targetMax));
      gameCtx.end({
        score: normalizedScore,
        maxScore: targetMax,
        timeTaken: totalTimeTaken,
        success: isVictory || normalizedScore >= 50
      });
    }
  }

  // ==========================================================================
  // 8. CONTROLS & RESIZING
  // ==========================================================================
  function resizeCanvas() {
    if (!canvas) {
      canvas = getEl('game-canvas');
      if (canvas) ctx = canvas.getContext('2d');
    }
    const container = getEl('canvas-viewport');
    if (!container || !canvas || !ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 800;
    const h = rect.height || 600;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    player.x = w / 2;
    player.y = h - 35;
    initAmbientConfetti();
  }

  function setupControls() {
    window.addEventListener('resize', resizeCanvas);

    // Pointer Aim & Direct Shooting
    if (canvas) {
      canvas.addEventListener('pointermove', (e) => {
        const rect = canvas.getBoundingClientRect();
        aim.x = e.clientX - rect.left;
        aim.y = e.clientY - rect.top;
      });

      canvas.addEventListener('pointerdown', (e) => {
        if (!isPlaying || isGameOver) return;
        const rect = canvas.getBoundingClientRect();
        aim.x = e.clientX - rect.left;
        aim.y = e.clientY - rect.top;
        fireDartToward(aim.x, aim.y);
      });
    }

    // Keyboard Aim & Fire
    window.addEventListener('keydown', (e) => {
      if (!isPlaying || isGameOver) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        aim.x = Math.max(40, aim.x - 45);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        aim.x = Math.min(canvas.width - 40, aim.x + 45);
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        fireDartToward(aim.x, aim.y);
      }
    });

    // Modal & Action Buttons
    const startBtn = getEl('start-game-btn');
    const howToBtn = getEl('how-to-play-btn');
    const hudRulesBtn = getEl('hud-how-to-play-btn');
    const closeInstBtn = getEl('close-instructions-btn');
    const startFromInstBtn = getEl('start-from-instructions-btn');
    const playAgainBtn = getEl('play-again-btn');
    const soundBtn = getEl('sound-toggle-btn');

    if (startBtn) startBtn.addEventListener('click', startCountdown);
    if (howToBtn) howToBtn.addEventListener('click', () => setScreen('instructions-modal'));
    if (hudRulesBtn) hudRulesBtn.addEventListener('click', () => setScreen('instructions-modal'));
    if (closeInstBtn) closeInstBtn.addEventListener('click', () => setScreen('start-screen'));
    if (startFromInstBtn) startFromInstBtn.addEventListener('click', startCountdown);
    if (playAgainBtn) playAgainBtn.addEventListener('click', startCountdown);

    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        safeStorage.setItem('math_games_sound', isMuted ? 'false' : 'true');
        if (isMuted) {
          stopCarnivalBGM();
        } else if (isPlaying && !isGameOver) {
          startCarnivalBGM();
        }
      });
    }
  }

  // ==========================================================================
  // 9. STUCENT INIT CONTRACT & BOOTSTRAP
  // ==========================================================================
  window.game = window.game || {};
  window.game.init = function (config) {
    window.game.config = config || {};
  };

  function init() {
    canvas = getEl('game-canvas');
    if (canvas) ctx = canvas.getContext('2d');
    resizeCanvas();
    setupControls();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
