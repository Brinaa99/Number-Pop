/**
 * NUMBER POP — STANDARD 3 MULTIPLICATION & DIVISION GAME ENGINE
 */

(() => {
  'use strict';

  // ==========================================================================
  // 1. AUDIO SYNTHESIZER
  // ==========================================================================
  class AudioManager {
    constructor() {
      this.enabled = localStorage.getItem('math_games_sound') !== 'false';
      this.ctx = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playTone(freq, type, duration, gainVal = 0.1) {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    }

    playPop() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
      } catch (e) {}
    }

    playWrong() {
      this.playTone(160, 'sawtooth', 0.25, 0.15);
    }

    playVictory() {
      [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
        setTimeout(() => this.playTone(f, 'sine', 0.2, 0.15), i * 80);
      });
    }

    toggle() {
      this.enabled = !this.enabled;
      localStorage.setItem('math_games_sound', this.enabled);
      return this.enabled;
    }
  }

  const audio = new AudioManager();

  // ==========================================================================
  // 2. MATH CHALLENGES (MULTIPLICATION & DIVISION)
  // ==========================================================================
  const CHALLENGES = [
    { q: "3 × 4 = ?", a: 12, distractors: [15, 9, 14, 16] },
    { q: "6 × 5 = ?", a: 30, distractors: [25, 35, 36, 20] },
    { q: "7 × 8 = ?", a: 56, distractors: [54, 58, 64, 48] },
    { q: "9 × 6 = ?", a: 54, distractors: [63, 45, 56, 48] },
    { q: "4 × 8 = ?", a: 32, distractors: [28, 36, 24, 30] },
    { q: "36 ÷ 4 = ?", a: 9, distractors: [8, 6, 7, 12] },
    { q: "45 ÷ 5 = ?", a: 9, distractors: [7, 8, 5, 10] },
    { q: "63 ÷ 7 = ?", a: 9, distractors: [8, 6, 7, 9] },
    { q: "48 ÷ 6 = ?", a: 8, distractors: [6, 7, 9, 12] },
    { q: "72 ÷ 8 = ?", a: 9, distractors: [8, 7, 6, 12] }
  ];

  // ==========================================================================
  // 3. GAME ENGINE
  // ==========================================================================
  class NumberPopGame {
    constructor() {
      this.canvas = document.getElementById('game-canvas');
      this.ctx = this.canvas.getContext('2d');

      this.score = 0;
      this.lives = 3;
      this.timeLeft = 60;
      this.combo = 1;
      this.maxCombo = 1;
      this.poppedCount = 0;
      this.challengeIndex = 0;
      this.isPlaying = false;

      this.balloons = [];
      this.particles = [];
      this.floatingTexts = [];

      this.lastTime = 0;
      this.spawnTimer = 0;
      this.timerInterval = null;

      this.balloonColors = ['#f43f5e', '#38bdf8', '#fbbf24', '#34d399', '#c084fc', '#f97316'];

      this.initEvents();
      this.resizeCanvas();
    }

    resizeCanvas() {
      const rect = this.canvas.parentElement ? this.canvas.parentElement.getBoundingClientRect() : { width: 1000, height: 700 };
      const w = Math.max(800, rect.width || 1000);
      const h = Math.max(600, rect.height || 700);
      this.canvas.width = w;
      this.canvas.height = h;
    }

    initEvents() {
      window.addEventListener('resize', () => this.resizeCanvas());

      const startBtn = document.getElementById('start-game-btn');
      const restartBtn = document.getElementById('play-again-btn');
      const soundBtn = document.getElementById('sound-toggle-btn');
      const howToPlayBtn = document.getElementById('how-to-play-btn');
      const hudHowToPlayBtn = document.getElementById('hud-how-to-play-btn');
      const closeInstBtn = document.getElementById('close-instructions-btn');
      const startFromInstBtn = document.getElementById('start-from-instructions-btn');
      const instModal = document.getElementById('instructions-modal');

      const showInst = () => {
        if (instModal) {
          instModal.classList.remove('hidden');
          instModal.classList.add('active');
        }
      };

      const hideInst = () => {
        if (instModal) {
          instModal.classList.remove('active');
          instModal.classList.add('hidden');
        }
      };

      if (howToPlayBtn) howToPlayBtn.addEventListener('click', showInst);
      if (hudHowToPlayBtn) hudHowToPlayBtn.addEventListener('click', showInst);
      if (closeInstBtn) closeInstBtn.addEventListener('click', hideInst);
      if (startFromInstBtn) {
        startFromInstBtn.addEventListener('click', () => {
          hideInst();
          this.start();
        });
      }

      if (startBtn) startBtn.addEventListener('click', () => this.start());
      if (restartBtn) restartBtn.addEventListener('click', () => this.start());
      if (soundBtn) {
        soundBtn.addEventListener('click', () => {
          const on = audio.toggle();
          const icon = document.getElementById('sound-icon');
          if (icon) icon.textContent = on ? 'Sound: ON' : 'Sound: OFF';
        });
      }

      this.canvas.addEventListener('pointerdown', (e) => this.handlePointer(e));
    }

    start() {
      document.getElementById('start-screen').classList.add('hidden');
      document.getElementById('end-screen').classList.add('hidden');
      const instModal = document.getElementById('instructions-modal');
      if (instModal) {
        instModal.classList.remove('active');
        instModal.classList.add('hidden');
      }

      this.score = 0;
      this.lives = 3;
      this.timeLeft = 60;
      this.combo = 1;
      this.maxCombo = 1;
      this.poppedCount = 0;
      this.challengeIndex = 0;
      this.isPlaying = true;

      if (window.NumberlandFeedback) {
        window.NumberlandFeedback.resetCombo();
      }

      this.balloons = [];
      this.particles = [];
      this.floatingTexts = [];

      this.updateHUD();
      this.loadQuestion();

      const timerEl = document.getElementById('timer-display');
      if (typeof updateTimerWarning === 'function') {
        updateTimerWarning(timerEl, this.timeLeft);
      }

      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (!this.isPlaying) return;
        this.timeLeft--;
        if (timerEl) timerEl.textContent = `${this.timeLeft}s`;

        if (typeof updateTimerWarning === 'function') {
          updateTimerWarning(timerEl, this.timeLeft);
        }

        if (this.timeLeft <= 0) {
          this.gameOver(true);
        }
      }, 1000);

      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.loop(t));
    }

    loadQuestion() {
      if (this.challengeIndex >= CHALLENGES.length) {
        this.challengeIndex = 0; // Loop questions
      }

      if (this.challengeIndex > 0 && typeof showChallengeTransition === 'function') {
        showChallengeTransition(`ROUND ${this.challengeIndex + 1}/${CHALLENGES.length}`, { container: document.getElementById('game-container') });
      }

      const current = CHALLENGES[this.challengeIndex];
      const qText = document.getElementById('question-text');
      if (qText) qText.textContent = current.q;

      // Spawn initial wave of balloons evenly across full width
      this.balloons = [];
      const answers = [current.a, ...current.distractors.slice(0, 3)].sort(() => Math.random() - 0.5);
      const cw = this.canvas.width || 1000;
      const step = (cw - 160) / Math.max(1, answers.length);

      answers.forEach((val, i) => {
        const xPos = 80 + i * step + (step * 0.5) + (Math.random() - 0.5) * 30;
        this.spawnBalloon(val, val === current.a, xPos);
      });
    }

    spawnBalloon(val, isCorrect, xPos = null) {
      const cw = this.canvas.width || 1000;
      const ch = this.canvas.height || 700;
      const x = xPos !== null ? xPos : Math.random() * (cw - 160) + 80;
      const y = ch + 40 + Math.random() * 80;
      const radius = 48;
      const color = this.balloonColors[Math.floor(Math.random() * this.balloonColors.length)];

      this.balloons.push({
        x,
        y,
        radius,
        val,
        isCorrect,
        color,
        speedY: Math.random() * 45 + 75,
        swaySpeed: Math.random() * 2 + 1.5,
        swayAmount: Math.random() * 24 + 12,
        swayOffset: Math.random() * Math.PI * 2,
        startX: x,
        popped: false
      });
    }

    handlePointer(e) {
      if (!this.isPlaying) return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      for (let i = this.balloons.length - 1; i >= 0; i--) {
        const b = this.balloons[i];
        if (b.popped) continue;

        const dist = Math.hypot(clickX - b.x, clickY - (b.y - 10));
        if (dist <= b.radius * 1.1) {
          this.popBalloon(b);
          break;
        }
      }
    }

    popBalloon(b) {
      b.popped = true;
      const container = document.getElementById('game-container');
      const rect = this.canvas.getBoundingClientRect();
      const clientX = rect.left + (b.x / this.canvas.width) * rect.width;
      const clientY = rect.top + (b.y / this.canvas.height) * rect.height;

      this.createPopParticles(b.x, b.y, b.color);

      if (b.isCorrect) {
        const pts = 100 * this.combo;
        const prevScore = this.score;
        this.score += pts;
        this.poppedCount++;
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;

        if (typeof showCorrectFeedback === 'function') {
          showCorrectFeedback({
            points: pts,
            message: this.combo > 2 ? `🔥 ${this.combo}x COMBO!` : 'GREAT POP!',
            container: container,
            x: (b.x / this.canvas.width) * container.clientWidth,
            y: (b.y / this.canvas.height) * container.clientHeight
          });
        } else {
          audio.playPop();
          this.addFloatingText(`+${pts}!`, b.x, b.y, '#34d399');
        }

        if (typeof animateScore === 'function') {
          animateScore(document.getElementById('score-display'), prevScore, this.score, 300);
        }

        this.challengeIndex++;
        this.updateHUD();

        setTimeout(() => {
          if (this.isPlaying) this.loadQuestion();
        }, 500);
      } else {
        const hearts = document.querySelectorAll('#lives-container .heart');
        const lostHeart = hearts[this.lives - 1] || null;

        this.lives--;
        this.combo = 1;

        if (typeof showWrongFeedback === 'function') {
          showWrongFeedback({
            message: 'WRONG BALLOON! 💔',
            container: container,
            heartEl: lostHeart,
            x: (b.x / this.canvas.width) * container.clientWidth,
            y: (b.y / this.canvas.height) * container.clientHeight
          });
        } else {
          audio.playWrong();
          this.addFloatingText('MISS!', b.x, b.y, '#fb7185');
        }

        this.updateHUD();

        if (this.lives <= 0) {
          this.gameOver(false);
        }
      }
    }

    createPopParticles(x, y, color) {
      for (let i = 0; i < 22; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 180 + 60;
        this.particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 6 + 3,
          color,
          alpha: 1,
          life: 0.65
        });
      }
    }

    addFloatingText(text, x, y, color = '#fff') {
      this.floatingTexts.push({
        text,
        x,
        y,
        color,
        alpha: 1,
        life: 0.8
      });
    }

    updateHUD() {
      const scoreEl = document.getElementById('score-display');
      const comboEl = document.getElementById('combo-display');
      const livesContainer = document.getElementById('lives-container');

      if (scoreEl && typeof animateScore !== 'function') scoreEl.textContent = this.score;
      if (comboEl) comboEl.textContent = `${this.combo}x`;

      if (livesContainer) {
        const hearts = livesContainer.querySelectorAll('.heart');
        if (hearts.length === 3) {
          hearts.forEach((h, idx) => {
            if (idx < this.lives) {
              h.classList.remove('lost');
            } else {
              h.classList.add('lost');
            }
          });
        } else {
          livesContainer.innerHTML = '<span class="heart">❤️</span>'.repeat(Math.max(0, this.lives)) + '<span class="heart lost">❤️</span>'.repeat(Math.max(0, 3 - this.lives));
        }
      }
    }

    gameOver(timeOut = false) {
      this.isPlaying = false;
      if (this.timerInterval) clearInterval(this.timerInterval);

      if (typeof updateTimerWarning === 'function') {
        updateTimerWarning(document.getElementById('timer-display'), 60);
      }

      // Calculate Stars
      let stars = 1;
      if (this.score >= 600) stars = 2;
      if (this.score >= 900 && this.lives >= 2) stars = 3;

      if (typeof playGameSound === 'function') {
        playGameSound(stars >= 1 ? 'victory' : 'gameover');
      } else {
        audio.playVictory();
      }

      // Save to Numberland Profile & localStorage
      if (window.NumberlandProfile) {
        window.NumberlandProfile.recordGameResult('pop', this.score, stars, Math.max(0, 60 - this.timeLeft));
      } else {
        const best = parseInt(localStorage.getItem('math_pop_highscore') || '0', 10);
        if (this.score > best) {
          localStorage.setItem('math_pop_highscore', this.score);
        }
        const savedStars = parseInt(localStorage.getItem('math_pop_stars') || '0', 10);
        if (stars > savedStars) {
          localStorage.setItem('math_pop_stars', stars);
        }
      }

      // Show End Screen
      document.getElementById('final-score-val').textContent = this.score;
      document.getElementById('final-popped-val').textContent = this.poppedCount;
      document.getElementById('final-combo-val').textContent = `${this.maxCombo}x`;
      document.getElementById('final-time-val').textContent = `${Math.max(0, this.timeLeft)}s`;

      const slots = document.querySelectorAll('#end-screen .star-slot');
      slots.forEach((slot, i) => {
        slot.classList.remove('earned');
        if (i < stars) {
          setTimeout(() => slot.classList.add('earned'), 300 + i * 250);
        }
      });

      document.getElementById('end-screen').classList.remove('hidden');
    }

    update(dt) {
      // Update balloons
      this.balloons.forEach(b => {
        b.y -= b.speedY * dt;
        b.x = b.startX + Math.sin(b.y * 0.02 + b.swayOffset) * b.swayAmount;
      });

      // Respawn balloons if they go above screen
      this.balloons = this.balloons.filter(b => !b.popped && b.y > -80);
      if (this.balloons.length === 0 && this.isPlaying) {
        this.loadQuestion();
      }

      // Update particles
      this.particles.forEach(p => {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 200 * dt; // Gravity
        p.life -= dt;
        p.alpha = Math.max(0, p.life / 0.65);
      });
      this.particles = this.particles.filter(p => p.life > 0);

      // Update floating texts
      this.floatingTexts.forEach(ft => {
        ft.y -= 40 * dt;
        ft.life -= dt;
        ft.alpha = Math.max(0, ft.life / 0.8);
      });
      this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
    }

    render() {
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      this.ctx.clearRect(0, 0, cw, ch);

      // Atmospheric Sky Ambient Lighting & Sunburst God Rays
      this.ctx.save();
      const sunRayGrad = this.ctx.createRadialGradient(cw * 0.85, 40, 20, cw * 0.85, 40, ch * 0.9);
      sunRayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
      sunRayGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.1)');
      sunRayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = sunRayGrad;
      this.ctx.fillRect(0, 0, cw, ch);
      this.ctx.restore();

      // Draw Balloons with Realistic 3D Latex Shading & Dual Specular Highlights
      this.balloons.forEach(b => {
        if (b.popped) return;

        this.ctx.save();
        this.ctx.translate(b.x, b.y);

        // Physics-based dynamic wavy string with subtle tension shadow
        this.ctx.beginPath();
        this.ctx.moveTo(0, b.radius * 1.05);
        this.ctx.bezierCurveTo(10, b.radius + 16, -10, b.radius + 32, 4, b.radius + 48);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2.2;
        this.ctx.stroke();

        // Realistic Soft Ambient Drop Shadow
        this.ctx.save();
        this.ctx.shadowColor = 'rgba(15, 23, 42, 0.45)';
        this.ctx.shadowBlur = 18;
        this.ctx.shadowOffsetY = 12;

        // Balloon Body: Multi-stop 3D Spherical Latex Radial Gradient
        const grad = this.ctx.createRadialGradient(-b.radius * 0.35, -b.radius * 0.4, 4, 0, 0, b.radius * 1.15);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.18, b.color);
        grad.addColorStop(0.75, b.color);
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.55)');

        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, b.radius * 0.92, b.radius * 1.08, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = grad;
        this.ctx.fill();
        this.ctx.restore();

        // Primary Crisp Oval Specular Glint (Top-Left keylight)
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(-b.radius * 0.38, -b.radius * 0.44, b.radius * 0.28, b.radius * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        this.ctx.fill();

        // Secondary Soft Rim Light (Bottom-Right bounce light)
        this.ctx.beginPath();
        this.ctx.ellipse(b.radius * 0.32, b.radius * 0.42, b.radius * 0.22, b.radius * 0.08, Math.PI / 3, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        this.ctx.fill();
        this.ctx.restore();

        // Realistic Tied Balloon Knot
        this.ctx.beginPath();
        this.ctx.moveTo(-7, b.radius * 1.04);
        this.ctx.lineTo(7, b.radius * 1.04);
        this.ctx.lineTo(0, b.radius * 1.04 + 9);
        this.ctx.closePath();
        this.ctx.fillStyle = b.color;
        this.ctx.fill();

        // 3D Embossed Bold Number Typography
        this.ctx.save();
        this.ctx.font = '900 30px "Fredoka", "Outfit", sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetY = 3;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(b.val, 0, 0);
        this.ctx.restore();

        this.ctx.restore();
      });

      // Draw Particles
      this.particles.forEach(p => {
        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      });

      // Draw Floating Texts
      this.floatingTexts.forEach(ft => {
        this.ctx.save();
        this.ctx.globalAlpha = ft.alpha;
        this.ctx.font = 'bold 22px "Fredoka", sans-serif';
        this.ctx.fillStyle = ft.color;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(ft.text, ft.x, ft.y);
        this.ctx.restore();
      });
    }

    loop(timestamp) {
      const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
      this.lastTime = timestamp;

      if (this.isPlaying) {
        this.update(dt);
      }
      this.render();

      requestAnimationFrame((t) => this.loop(t));
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    new NumberPopGame();
  });

})();
