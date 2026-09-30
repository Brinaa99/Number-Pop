/**
 * GAME 1: DIVISIBILITY BALLOON POP — RETRO ARCADE MINI-GAME ENGINE
 * Cambridge Year 4 Tests of Divisibility (Rules for 2, 3, 4, 5, 10)
 * StuCent Sandboxed Runtime Compatible
 */

(() => {
  'use strict';

  const doc = typeof root !== 'undefined' ? root : document;
  const gameCtx = typeof game !== 'undefined' ? game : (window.game || null);

  // ==========================================================================
  // 1. CARNIVAL SOUND & PROCEDURAL BGM SYNTHESIZER
  // ==========================================================================
  let audioCtx = null;
  let isMuted = localStorage.getItem('math_games_sound') === 'false';
  let bgmMasterGain = null;
  let bgmInterval = null;
  let bgmStep = 0;

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

    // Upbeat Playful Carnival Shuffle (124 BPM)
    const bassline = [
      174.6, 0, 261.6, 261.6,  220, 0, 261.6, 261.6,
      233, 0, 293.6, 293.6,    196, 0, 261.6, 261.6,
      174.6, 0, 261.6, 261.6,  220, 0, 261.6, 261.6,
      233, 0, 261.6, 0,        174.6, 0, 196, 0
    ];

    const leadMelody = [
      698.46, 0, 880, 0,       1046.5, 0, 880, 0,
      932.33, 0, 880, 0,       783.99, 0, 698.46, 0,
      698.46, 0, 880, 0,       1046.5, 0, 1174.66, 0,
      1046.5, 0, 880, 0,       698.46, 0, 880, 0
    ];

    const stepDuration = (60 / 124) / 4;
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
          gain.gain.setValueAtTime(0.07, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.6);
          osc.connect(gain);
          gain.connect(bgmMasterGain);
          osc.start(t);
          osc.stop(t + stepDuration * 1.7);
        } catch (e) {}
      }

      const lFreq = leadMelody[idx];
      if (lFreq > 0) {
        try {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(lFreq, t);
          gain.gain.setValueAtTime(0.04, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 1.5);
          osc.connect(gain);
          gain.connect(bgmMasterGain);
          osc.start(t);
          osc.stop(t + stepDuration * 1.6);
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

  function playPopSound(comboMult = 1) {
    const base = 650 + comboMult * 75;
    beep(base, 70, 'sine', 0.25);
    beep(base * 1.45, 90, 'triangle', 0.2, 0.03);
  }

  function playWrongSound() {
    beep(180, 260, 'sawtooth', 0.25);
    beep(130, 260, 'square', 0.2, 0.08);
    triggerScreenShake(12, 16);
  }

  function playRoundWinSound() {
    [523.25, 659.25, 783.99, 1046.50, 1318.5].forEach((f, i) => {
      beep(f, 170, 'sine', 0.2, i * 0.08);
    });
    triggerScreenShake(6, 12);
  }

  function playGameOverSound() {
    [440, 415, 392, 349].forEach((f, i) => {
      beep(f, 250, 'triangle', 0.18, i * 0.12);
    });
  }

  // Screen shake
  let screenShakeIntensity = 0;

  function triggerScreenShake(intensity = 10, frames = 15) {
    screenShakeIntensity = intensity;
  }

  // ==========================================================================
  // 2. CAMBRIDGE YEAR 4 DIVISIBILITY RULES & ROUND DEFINITIONS (10 ROUNDS)
  // ==========================================================================
  const ROUNDS_DATA = [
    {
      roundNum: 1,
      badge: 'ROUND 01 • EVEN NUMBERS',
      title: 'POP NUMBERS DIVISIBLE BY 2',
      tip: 'Last digit must be even: 0, 2, 4, 6, or 8',
      quota: 3,
      balloonSpeed: 1.0,
      spawnInterval: 1400,
      test: (n) => n % 2 === 0,
      explain: (n) => `${n} ends with ${n % 10}. Divisible by 2 only if the last digit is even (0, 2, 4, 6, 8).`,
      pool: [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30],
      distractors: [3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29]
    },
    {
      roundNum: 2,
      badge: 'ROUND 02 • MULTIPLES OF 5',
      title: 'POP NUMBERS DIVISIBLE BY 5',
      tip: 'Last digit must be 0 or 5',
      quota: 3,
      balloonSpeed: 1.15,
      spawnInterval: 1300,
      test: (n) => n % 5 === 0,
      explain: (n) => `${n} ends in ${n % 10}. A number is divisible by 5 only if it ends in 0 or 5.`,
      pool: [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70],
      distractors: [12, 14, 18, 23, 27, 32, 38, 41, 46, 52, 57, 63]
    },
    {
      roundNum: 3,
      badge: 'ROUND 03 • MULTIPLES OF 10',
      title: 'POP NUMBERS DIVISIBLE BY 10',
      tip: 'Last digit must be exactly 0',
      quota: 3,
      balloonSpeed: 1.25,
      spawnInterval: 1250,
      test: (n) => n % 10 === 0,
      explain: (n) => `${n} ends in ${n % 10}. A number is divisible by 10 only if it ends in 0.`,
      pool: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 150],
      distractors: [15, 25, 34, 45, 58, 65, 72, 85, 93, 105, 115]
    },
    {
      roundNum: 4,
      badge: 'ROUND 04 • RULE FOR 3',
      title: 'POP NUMBERS DIVISIBLE BY 3',
      tip: 'Sum the digits! If sum is in the 3x table, it divides by 3',
      quota: 4,
      balloonSpeed: 1.3,
      spawnInterval: 1200,
      test: (n) => n % 3 === 0,
      explain: (n) => {
        const sum = String(n).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        return `Digits of ${n}: ${String(n).split('').join('+')} = ${sum}. ${sum} is not divisible by 3.`;
      },
      pool: [9, 12, 15, 18, 21, 24, 27, 30, 33, 36, 42, 45, 51, 54],
      distractors: [10, 13, 16, 19, 22, 25, 28, 31, 35, 40, 44, 50]
    },
    {
      roundNum: 5,
      badge: 'ROUND 05 • RULE FOR 4',
      title: 'POP NUMBERS DIVISIBLE BY 4',
      tip: 'Look at the last 2 digits: must be a multiple of 4',
      quota: 4,
      balloonSpeed: 1.35,
      spawnInterval: 1150,
      test: (n) => n % 4 === 0,
      explain: (n) => `Last two digits of ${n} (${n % 100}) cannot be divided evenly by 4.`,
      pool: [12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 64],
      distractors: [14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 58, 62]
    },
    {
      roundNum: 6,
      badge: 'ROUND 06 • MULTIPLES OF 3 & 5',
      title: 'POP NUMBERS DIVISIBLE BY 3 AND 5',
      tip: 'Must end in 0 or 5 AND have a digit sum divisible by 3',
      quota: 3,
      balloonSpeed: 1.4,
      spawnInterval: 1100,
      test: (n) => n % 3 === 0 && n % 5 === 0,
      explain: (n) => `${n} must be divisible by BOTH 3 and 5 (Multiples of 15).`,
      pool: [15, 30, 45, 60, 75, 90, 105, 120, 135, 150],
      distractors: [10, 12, 20, 25, 35, 40, 50, 55, 65, 70, 80, 85]
    },
    {
      roundNum: 7,
      badge: 'ROUND 07 • MULTIPLES OF 2 & 4',
      title: 'POP NUMBERS DIVISIBLE BY 4',
      tip: 'Even numbers whose last two digits divide by 4',
      quota: 4,
      balloonSpeed: 1.45,
      spawnInterval: 1050,
      test: (n) => n % 4 === 0,
      explain: (n) => `${n} is even, but not all even numbers divide evenly by 4.`,
      pool: [24, 28, 32, 36, 48, 60, 72, 84, 96, 104, 112, 128],
      distractors: [14, 18, 22, 26, 34, 38, 42, 46, 54, 58, 66, 70]
    },
    {
      roundNum: 8,
      badge: 'ROUND 08 • 3-DIGIT RULE FOR 3',
      title: 'POP 3-DIGIT NUMBERS DIVISIBLE BY 3',
      tip: 'Add all 3 digits! e.g. 102 -> 1+0+2=3 (Divisible!)',
      quota: 4,
      balloonSpeed: 1.5,
      spawnInterval: 1000,
      test: (n) => n % 3 === 0,
      explain: (n) => {
        const sum = String(n).split('').reduce((a, b) => a + parseInt(b, 10), 0);
        return `Digits of ${n}: ${String(n).split('').join('+')} = ${sum}. ${sum} is not in the 3x table.`;
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
      spawnInterval: 950,
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
      spawnInterval: 850,
      test: (n) => n % 2 === 0 || n % 3 === 0 || n % 5 === 0,
      explain: (n) => `${n} is a prime number that is not divisible by 2, 3, or 5.`,
      pool: [12, 15, 20, 24, 30, 36, 40, 45, 50, 60, 72, 84, 90, 100],
      distractors: [11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53]
    }
  ];

  // ==========================================================================
  // 3. GAME STATE
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

  // Animation Systems
  let balloons = [];
  let particles = [];
  let darts = [];
  let floatingTexts = [];

  // Character State
  const player = {
    x: 400,
    y: 500,
    width: 60,
    height: 70,
    targetX: 400,
    speed: 8,
    isThrowing: false,
    throwAnimTimer: 0
  };

  const canvas = doc.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  let animationFrameId = null;

  // Modern 2D Cartoon Balloon Palette
  const BALLOON_COLORS = [
    { body: '#0284c7', highlight: '#7dd3fc', string: '#0369a1' }, // Cyan Blue
    { body: '#ea580c', highlight: '#fdba74', string: '#c2410c' }, // Warm Orange
    { body: '#e11d48', highlight: '#fda4af', string: '#be123c' }, // Crimson
    { body: '#7c3aed', highlight: '#d8b4fe', string: '#6d28d9' }, // Purple
    { body: '#16a34a', highlight: '#86efac', string: '#15803d' }, // Fresh Green
    { body: '#d97706', highlight: '#fde68a', string: '#b45309' }  // Gold
  ];

  // ==========================================================================
  // 4. SCREEN & HUD MANAGEMENT
  // ==========================================================================
  function setScreen(screenId) {
    const screens = ['start-screen', 'countdown-screen', 'instructions-modal', 'game-over-screen'];
    screens.forEach(id => {
      const el = doc.getElementById(id);
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
    const scoreEl = doc.getElementById('score-display');
    const timerEl = doc.getElementById('timer-display');
    const roundEl = doc.getElementById('round-display');
    const comboEl = doc.getElementById('combo-display');
    const quotaEl = doc.getElementById('round-quota');

    if (scoreEl) scoreEl.textContent = String(score).padStart(6, '0');
    if (timerEl) timerEl.textContent = String(Math.max(0, timeRemaining)).padStart(3, '0');
    if (roundEl) roundEl.textContent = `${String(currentRoundIdx + 1).padStart(2, '0')} / 10`;
    if (comboEl) comboEl.textContent = `${combo}x`;

    const rData = ROUNDS_DATA[currentRoundIdx];
    if (quotaEl && rData) {
      quotaEl.textContent = `TARGET: ${roundPoppedCount} / ${rData.quota}`;
    }

    // Lives SVG Hearts (Pure SVG, zero emoji)
    const heartsContainer = doc.getElementById('lives-container');
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

    const badgeEl = doc.getElementById('rule-badge');
    const textEl = doc.getElementById('question-text');
    const hintEl = doc.getElementById('question-hint');

    if (badgeEl) badgeEl.textContent = rData.badge;
    if (textEl) textEl.textContent = rData.title;
    if (hintEl) hintEl.textContent = rData.tip;

    updateHUD();
  }

  function showHint(text) {
    const hintBanner = doc.getElementById('hint-banner');
    const hintText = doc.getElementById('hint-text');
    if (hintBanner && hintText) {
      hintText.textContent = text;
      hintBanner.classList.remove('hidden');
      setTimeout(() => {
        hintBanner.classList.add('hidden');
      }, 3500);
    }
  }

  // ==========================================================================
  // 5. BALLOON SPAWNING & PHYSICS
  // ==========================================================================
  function spawnBalloon() {
    const rData = ROUNDS_DATA[currentRoundIdx];
    if (!rData) return;

    const isCorrect = Math.random() < 0.55;
    const pool = isCorrect ? rData.pool : rData.distractors;
    const number = pool[Math.floor(Math.random() * pool.length)];

    const radius = 34 + Math.min(10, String(number).length * 2);
    const minX = radius + 20;
    const maxX = canvas.width - radius - 20;
    const x = minX + Math.random() * (maxX - minX);
    const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];

    balloons.push({
      x: x,
      y: canvas.height + radius + 10,
      radius: radius,
      number: number,
      isCorrect: isCorrect,
      color: color,
      speedY: (1.2 + Math.random() * 0.8) * rData.balloonSpeed,
      swayFreq: 0.02 + Math.random() * 0.03,
      swayAmp: 15 + Math.random() * 20,
      swayOffset: Math.random() * Math.PI * 2,
      scaleX: 1,
      scaleY: 1,
      shakeTimer: 0
    });
  }

  // ==========================================================================
  // 6. POPPING & SHOOTING ACTIONS
  // ==========================================================================
  function throwDart() {
    if (!isPlaying || isGameOver) return;

    player.isThrowing = true;
    player.throwAnimTimer = 12;

    darts.push({
      x: player.x,
      y: player.y - 30,
      speedY: -16,
      radius: 6
    });

    beep(600, 40, 'triangle', 0.1);
  }

  function popBalloon(balloon) {
    totalAttempts++;
    const rData = ROUNDS_DATA[currentRoundIdx];

    if (balloon.isCorrect) {
      // CORRECT POP
      playPopSound(combo);
      totalPopped++;
      roundPoppedCount++;
      
      const pts = 50 * combo;
      score += pts;
      combo = Math.min(8, combo + 1);
      if (combo > bestCombo) bestCombo = combo;

      floatingTexts.push({
        x: balloon.x,
        y: balloon.y,
        text: `+${pts} PTS!`,
        color: '#fbbf24',
        alpha: 1,
        life: 40
      });

      // Confetti Particles
      for (let i = 0; i < 22; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 6;
        particles.push({
          x: balloon.x,
          y: balloon.y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 2,
          radius: 3 + Math.random() * 4,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)].body,
          alpha: 1,
          life: 30 + Math.random() * 20
        });
      }

      if (roundPoppedCount >= rData.quota) {
        if (currentRoundIdx + 1 < ROUNDS_DATA.length) {
          currentRoundIdx++;
          roundPoppedCount = 0;
          playRoundWinSound();
          floatingTexts.push({
            x: canvas.width / 2,
            y: canvas.height / 2,
            text: `ROUND ${currentRoundIdx} COMPLETE!`,
            color: '#10b981',
            alpha: 1,
            life: 60
          });
          updateMissionBanner();
        } else {
          endGame(true);
        }
      } else {
        updateHUD();
      }

    } else {
      // INCORRECT POP
      playWrongSound();
      lives--;
      combo = 1;
      balloon.shakeTimer = 18;

      floatingTexts.push({
        x: balloon.x,
        y: balloon.y,
        text: `NOT DIVISIBLE! -1 LIFE`,
        color: '#ef4444',
        alpha: 1,
        life: 50
      });

      showHint(rData.explain(balloon.number));
      updateHUD();

      if (lives <= 0) {
        endGame(false);
      }
    }
  }

  // ==========================================================================
  // 7. GAME LOOP & RENDERING
  // ==========================================================================
  function update() {
    if (!isPlaying || isGameOver) return;

    // Player position lerp
    const dx = player.targetX - player.x;
    if (Math.abs(dx) > 2) {
      player.x += Math.sign(dx) * Math.min(Math.abs(dx), player.speed);
    }
    player.x = Math.max(player.width / 2 + 10, Math.min(canvas.width - player.width / 2 - 10, player.x));
    player.y = canvas.height - 50;

    if (player.throwAnimTimer > 0) player.throwAnimTimer--;

    // Spawn Balloons
    const rData = ROUNDS_DATA[currentRoundIdx];
    const now = Date.now();
    if (rData && now - lastSpawnTime > rData.spawnInterval) {
      spawnBalloon();
      lastSpawnTime = now;
    }

    // Darts
    for (let i = darts.length - 1; i >= 0; i--) {
      const dart = darts[i];
      dart.y += dart.speedY;

      let dartHit = false;
      for (let j = balloons.length - 1; j >= 0; j--) {
        const b = balloons[j];
        const dist = Math.hypot(dart.x - b.x, dart.y - b.y);
        if (dist < b.radius + dart.radius) {
          popBalloon(b);
          balloons.splice(j, 1);
          dartHit = true;
          break;
        }
      }

      if (dartHit || dart.y < -20) {
        darts.splice(i, 1);
      }
    }

    // Balloons
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      b.y -= b.speedY;
      b.x += Math.sin(now * b.swayFreq + b.swayOffset) * 0.8;

      if (b.shakeTimer > 0) b.shakeTimer--;

      if (b.y < -b.radius - 20) {
        balloons.splice(i, 1);
      }
    }

    // Confetti Particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.alpha -= 0.02;
      p.life--;
      if (p.life <= 0 || p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    // Floating Texts
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y -= 1;
      ft.alpha -= 0.02;
      ft.life--;
      if (ft.life <= 0 || ft.alpha <= 0) {
        floatingTexts.splice(i, 1);
      }
    }

    if (screenShakeIntensity > 0) {
      screenShakeIntensity *= 0.88;
      if (screenShakeIntensity < 0.5) screenShakeIntensity = 0;
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (screenShakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * screenShakeIntensity;
      const sy = (Math.random() - 0.5) * screenShakeIntensity;
      ctx.translate(sx, sy);
    }

    // 1. Carnival Night Canvas Atmosphere
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#091326');
    grad.addColorStop(0.6, '#0f244a');
    grad.addColorStop(1, '#1b3566');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle carnival vertical marquee stripes
    const stripeWidth = 50;
    for (let x = 0; x < canvas.width; x += stripeWidth * 2) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.03)';
      ctx.fillRect(x, 0, stripeWidth, canvas.height);
    }

    // Festoon string lights across the top
    ctx.strokeStyle = '#1e3a6a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.quadraticCurveTo(canvas.width / 2, 40, canvas.width, 16);
    ctx.stroke();

    const bulbColors = ['#f59e0b', '#ef4444', '#38bdf8', '#a855f7', '#10b981'];
    const numBulbs = 16;
    for (let i = 0; i <= numBulbs; i++) {
      const ratio = i / numBulbs;
      const bx = canvas.width * ratio;
      const by = 16 + Math.sin(ratio * Math.PI) * 24;
      const color = bulbColors[i % bulbColors.length];

      // Glow
      ctx.beginPath();
      ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.3;
      ctx.fill();

      // Bulb
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Wooden Carnival Platform Floor
    ctx.fillStyle = '#111d33';
    ctx.fillRect(0, canvas.height - 24, canvas.width, 24);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, canvas.height - 24, canvas.width, 3);

    // 2. Render Balloons
    balloons.forEach(b => {
      ctx.save();
      const shakeX = b.shakeTimer > 0 ? (Math.random() - 0.5) * 8 : 0;
      ctx.translate(b.x + shakeX, b.y);

      // Balloon string
      ctx.beginPath();
      ctx.moveTo(0, b.radius);
      ctx.quadraticCurveTo(8, b.radius + 16, -4, b.radius + 32);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Balloon knot
      ctx.fillStyle = b.color.highlight;
      ctx.beginPath();
      ctx.moveTo(-4, b.radius - 2);
      ctx.lineTo(4, b.radius - 2);
      ctx.lineTo(0, b.radius + 4);
      ctx.closePath();
      ctx.fill();

      // Balloon Body (Oval)
      ctx.fillStyle = b.color.body;
      ctx.beginPath();
      ctx.ellipse(0, 0, b.radius * 0.9, b.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = b.color.highlight;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Highlight sheen
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-b.radius * 0.35, -b.radius * 0.35, b.radius * 0.25, b.radius * 0.4, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Number Label
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(b.radius * 0.75)}px 'Fredoka', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(b.number, 0, 2);

      ctx.restore();
    });

    // 3. Render Darts
    darts.forEach(d => {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(6, 8);
      ctx.lineTo(-6, 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    });

    // 4. Render Player Character
    ctx.save();
    ctx.translate(player.x, player.y);

    // Player body
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(-16, -20, 32, 34, 8);
    ctx.fill();

    // Vest trim
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-6, -20, 12, 34);

    // Head
    ctx.beginPath();
    ctx.arc(0, -32, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#fed7aa';
    ctx.fill();

    // Arcade Cap
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, -36, 14, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-16, -36, 32, 4);

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-4, -32, 2, 0, Math.PI * 2);
    ctx.arc(4, -32, 2, 0, Math.PI * 2);
    ctx.fill();

    // Raised Hand / Dart
    ctx.fillStyle = '#fed7aa';
    if (player.throwAnimTimer > 0) {
      ctx.fillRect(12, -40, 8, 18);
    } else {
      ctx.fillRect(10, -25, 8, 16);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(14, -34);
      ctx.lineTo(18, -26);
      ctx.lineTo(10, -26);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // 5. Render Confetti Particles
    particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Render Floating Texts
    floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = "bold 20px 'Fredoka', cursive, sans-serif";
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
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
  // 8. START, COUNTDOWN & END GAME
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
    timeRemaining = 90;
    balloons = [];
    particles = [];
    darts = [];
    floatingTexts = [];
    isPlaying = true;
    isGameOver = false;
    gameStartTime = Date.now();

    setScreen(null);
    updateMissionBanner();
    startCarnivalBGM();

    if (gameTimerInterval) clearInterval(gameTimerInterval);
    gameTimerInterval = setInterval(() => {
      if (!isPlaying || isGameOver) return;
      timeRemaining--;
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
    const numEl = doc.getElementById('countdown-number');
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

    localStorage.setItem('math_pop_stars', stars);

    if (isVictory) {
      playRoundWinSound();
    } else {
      playGameOverSound();
    }

    const badgeEl = doc.getElementById('game-over-badge');
    const titleEl = doc.getElementById('game-over-title');
    const scoreEl = doc.getElementById('final-score');
    const roundsEl = doc.getElementById('final-rounds');
    const accuracyEl = doc.getElementById('final-accuracy');
    const comboEl = doc.getElementById('final-combo');
    const timeEl = doc.getElementById('final-time');
    const starsContainer = doc.getElementById('stars-container');

    if (badgeEl) badgeEl.textContent = isVictory ? 'CARNIVAL COMPLETE!' : 'CARNIVAL ADVENTURE FINISHED';
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
  // 9. CONTROLS & RESIZING
  // ==========================================================================
  function resizeCanvas() {
    const container = doc.getElementById('canvas-viewport');
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = rect.height || 560;

    player.x = canvas.width / 2;
    player.y = canvas.height - 50;
    player.targetX = player.x;
  }

  function setupControls() {
    window.addEventListener('resize', resizeCanvas);

    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (!isPlaying || isGameOver) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        player.targetX -= 40;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        player.targetX += 40;
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        throwDart();
      }
    });

    // Touch Controls
    const btnLeft = doc.getElementById('btn-left');
    const btnRight = doc.getElementById('btn-right');
    const btnPop = doc.getElementById('btn-pop');

    let moveInterval = null;

    if (btnLeft) {
      btnLeft.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        player.targetX -= 35;
        moveInterval = setInterval(() => { player.targetX -= 35; }, 100);
      });
      btnLeft.addEventListener('pointerup', () => clearInterval(moveInterval));
      btnLeft.addEventListener('pointercancel', () => clearInterval(moveInterval));
    }

    if (btnRight) {
      btnRight.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        player.targetX += 35;
        moveInterval = setInterval(() => { player.targetX += 35; }, 100);
      });
      btnRight.addEventListener('pointerup', () => clearInterval(moveInterval));
      btnRight.addEventListener('pointercancel', () => clearInterval(moveInterval));
    }

    if (btnPop) {
      btnPop.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        throwDart();
      });
    }

    // Canvas Pointer Click / Drag Aiming
    if (canvas) {
      canvas.addEventListener('pointerdown', (e) => {
        if (!isPlaying || isGameOver) return;
        const rect = canvas.getBoundingClientRect();
        player.targetX = e.clientX - rect.left;
        throwDart();
      });

      canvas.addEventListener('pointermove', (e) => {
        if (!isPlaying || isGameOver) return;
        if (e.buttons > 0) {
          const rect = canvas.getBoundingClientRect();
          player.targetX = e.clientX - rect.left;
        }
      });
    }

    // Modal & Action Buttons
    const startBtn = doc.getElementById('start-game-btn');
    const howToBtn = doc.getElementById('how-to-play-btn');
    const hudRulesBtn = doc.getElementById('hud-how-to-play-btn');
    const closeInstBtn = doc.getElementById('close-instructions-btn');
    const startFromInstBtn = doc.getElementById('start-from-instructions-btn');
    const playAgainBtn = doc.getElementById('play-again-btn');
    const soundBtn = doc.getElementById('sound-toggle-btn');

    if (startBtn) startBtn.addEventListener('click', startCountdown);
    if (howToBtn) howToBtn.addEventListener('click', () => setScreen('instructions-modal'));
    if (hudRulesBtn) hudRulesBtn.addEventListener('click', () => setScreen('instructions-modal'));
    if (closeInstBtn) closeInstBtn.addEventListener('click', () => setScreen('start-screen'));
    if (startFromInstBtn) startFromInstBtn.addEventListener('click', startCountdown);
    if (playAgainBtn) playAgainBtn.addEventListener('click', startCountdown);

    if (soundBtn) {
      soundBtn.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
      soundBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        localStorage.setItem('math_games_sound', isMuted ? 'false' : 'true');
        soundBtn.textContent = isMuted ? 'SOUND: OFF' : 'SOUND: ON';
        if (isMuted) {
          stopCarnivalBGM();
        } else if (isPlaying && !isGameOver) {
          startCarnivalBGM();
        }
      });
    }
  }

  // ==========================================================================
  // 10. STUCENT INIT CONTRACT & BOOTSTRAP
  // ==========================================================================
  window.game = window.game || {};
  window.game.init = function (config) {
    window.game.config = config || {};
  };

  function init() {
    resizeCanvas();
    setupControls();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
