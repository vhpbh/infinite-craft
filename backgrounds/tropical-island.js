/* ================= רקע: טבע דינמי ואירועי קצה (Realistic Nature & Events) =================
   נרשם עצמאית ל-window.GameBackgrounds['island-invasion']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['island-invasion'] = {
    init(container) {
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      let width, height, dpr;
      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener('resize', resize);

      // --- 1. ציפורים ריאליסטיות ---
      class RealisticBird {
        constructor() { this.reset(); }
        reset() {
          this.x = -Math.random() * 100 - 50;
          this.y = Math.random() * (height * 0.35) + 30;
          this.vx = Math.random() * 1.2 + 1.5;
          this.vy = (Math.random() - 0.5) * 0.4;
          this.wingPhase = Math.random() * Math.PI * 2;
          this.size = Math.random() * 4 + 5;
        }
        update() {
          this.x += this.vx;
          this.y += Math.sin(this.wingPhase * 0.5) * 0.3 + this.vy;
          this.wingPhase += 0.12;
          if (this.x > width + 50) this.reset();
        }
        draw() {
          const wingY = Math.sin(this.wingPhase) * (this.size * 0.8);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(this.x - this.size, this.y + wingY);
          ctx.quadraticCurveTo(this.x - this.size * 0.4, this.y - this.size * 0.6, this.x, this.y);
          ctx.quadraticCurveTo(this.x + this.size * 0.4, this.y - this.size * 0.6, this.x + this.size, this.y + wingY);
          ctx.stroke();
        }
      }
      const birdFlock = Array.from({ length: 14 }, () => new RealisticBird());

      // --- 2. גשם בסערה ---
      const rainDrops = Array.from({ length: 120 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        len: Math.random() * 15 + 10,
        speed: Math.random() * 10 + 12
      }));

      // --- 3. משתני אירועים ---
      let stormFactor = 0; // 0 = בהיר, 1 = סערה מלאה
      let isStormy = false;
      let stormTimer = 400;

      let sharkAttack = { stage: 'idle', timer: 0, shake: 0 }; // idle, charge, inside, release
      let ufoTimer = 2500; // טיימר ארוך מאוד לחייזרים
      let ufoActive = false;
      let ufoX = -100;

      let cycle = 0;
      let lightningFlash = 0;
      let rafId = null;

      function animate() {
        cycle += 0.0006;
        const timeFactor = (Math.sin(cycle) + 1) / 2;
        const horizon = height * 0.6;

        // --- לוגיקת סערה דינמית ---
        stormTimer--;
        if (stormTimer <= 0) {
          isStormy = !isStormy;
          stormTimer = Math.floor(Math.random() * 600 + 500);
        }
        if (isStormy && stormFactor < 1) stormFactor += 0.003;
        if (!isStormy && stormFactor > 0) stormFactor -= 0.003;

        // --- לוגיקת כריש ענק ---
        if (sharkAttack.stage === 'idle' && Math.random() < 0.0008 && stormFactor < 0.3) {
          sharkAttack.stage = 'charge';
          sharkAttack.timer = 120;
        }

        // --- לוגיקת חייזרים (מגיעים לעיתים רחוקות מאוד) ---
        ufoTimer--;
        if (ufoTimer <= 0 && !ufoActive && stormFactor < 0.2) {
          ufoActive = true;
          ufoX = -100;
        }

        // --- רעידות מסך (כשנבלעים על ידי הכריש) ---
        ctx.save();
        if (sharkAttack.shake > 0) {
          const offsetX = (Math.random() - 0.5) * sharkAttack.shake;
          const offsetY = (Math.random() - 0.5) * sharkAttack.shake;
          ctx.translate(offsetX, offsetY);
          sharkAttack.shake *= 0.95;
        }

        // 1. שמיים (משתנים לפי סערה/שעה)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
        if (stormFactor > 0.1) {
          const r = Math.floor(20 * (1 - stormFactor) + 10 * stormFactor);
          const g = Math.floor(100 * (1 - stormFactor) + 15 * stormFactor);
          const b = Math.floor(180 * (1 - stormFactor) + 25 * stormFactor);
          skyGrad.addColorStop(0, `rgb(${r},${g},${b})`);
          skyGrad.addColorStop(1, '#0f172a');
        } else {
          skyGrad.addColorStop(0, timeFactor > 0.3 ? '#38bdf8' : '#020617');
          skyGrad.addColorStop(1, timeFactor > 0.3 ? '#fbcfe8' : '#0f172a');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizon);

        // הברקה של ברק
        if (stormFactor > 0.6 && Math.random() < 0.015) {
          lightningFlash = 1;
        }
        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${lightningFlash})`;
          ctx.fillRect(0, 0, width, horizon);
          lightningFlash -= 0.15;
        }

        // 2. שמש/ירח
        if (stormFactor < 0.7) {
          const sunY = horizon - Math.sin(cycle) * (height * 0.38);
          const sunX = width * 0.5 - Math.cos(cycle) * (width * 0.35);
          ctx.beginPath();
          ctx.arc(sunX, sunY, 24, 0, Math.PI * 2);
          ctx.fillStyle = timeFactor > 0.3 ? '#fef08a' : '#f1f5f9';
          ctx.fill();
        }

        // ציפורים טבעיות (עפות רק במזג אוויר חצי רגוע)
        if (stormFactor < 0.5) {
          birdFlock.forEach(b => { b.update(); b.draw(); });
        }

        // 3. הים והגלים הסוערים
        const waveSpeed = Date.now() * (0.003 + stormFactor * 0.01);
        const waveHeight = 8 + stormFactor * 22;

        for (let i = 0; i < 5; i++) {
          const waveY = horizon + (i * (height - horizon) / 5);
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 15) {
            const dy = Math.sin(x * 0.012 + waveSpeed + i * 1.5) * waveHeight;
            ctx.lineTo(x, waveY + dy);
          }
          ctx.lineTo(width, height);
          ctx.fillStyle = `rgba(${10 + stormFactor * 5}, ${80 - stormFactor * 50}, ${130 - stormFactor * 80}, ${0.6 + i * 0.08})`;
          ctx.fill();
        }

        // גשם בזמן סערה
        if (stormFactor > 0.3) {
          ctx.strokeStyle = `rgba(224, 242, 254, ${stormFactor * 0.5})`;
          ctx.lineWidth = 1.2;
          rainDrops.forEach(r => {
            r.y += r.speed;
            r.x -= 3;
            if (r.y > height) { r.y = -20; r.x = Math.random() * width; }
            ctx.beginPath();
            ctx.moveTo(r.x, r.y);
            ctx.lineTo(r.x - 4, r.y + r.len);
            ctx.stroke();
          });
        }

        // 4. חללית חייזרים נדירה
        if (ufoActive) {
          ufoX += 1.8;
          const ufoY = height * 0.2 + Math.sin(ufoX * 0.02) * 10;

          // קרן אור
          const beam = ctx.createLinearGradient(ufoX, ufoY, ufoX, horizon);
          beam.addColorStop(0, 'rgba(74, 222, 128, 0.4)');
          beam.addColorStop(1, 'rgba(74, 222, 128, 0)');
          ctx.fillStyle = beam;
          ctx.beginPath();
          ctx.moveTo(ufoX - 10, ufoY);
          ctx.lineTo(ufoX + 10, ufoY);
          ctx.lineTo(ufoX + 50, horizon);
          ctx.lineTo(ufoX - 50, horizon);
          ctx.fill();

          // גוף החללית
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.ellipse(ufoX, ufoY, 25, 7, 0, 0, Math.PI * 2);
          ctx.fill();

          if (ufoX > width + 100) {
            ufoActive = false;
            ufoTimer = Math.floor(Math.random() * 3000 + 2500); // הפסקה ארוכה מאוד
          }
        }

        // 5. אירוע כריש ענק ובליעה
        if (sharkAttack.stage === 'charge') {
          sharkAttack.timer--;
          const finX = width * 0.5;
          const finY = horizon + 30;

          // סנפיר כריש ענק מגיח מהמים
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(finX - 30, finY);
          ctx.lineTo(finX, finY - 45);
          ctx.lineTo(finX + 20, finY);
          ctx.fill();

          if (sharkAttack.timer <= 0) {
            sharkAttack.stage = 'inside';
            sharkAttack.timer = 150; // זמן השהייה בתוך הבטן בחשיכה
            sharkAttack.shake = 35; // מכה חזקה
          }
        } else if (sharkAttack.stage === 'inside') {
          sharkAttack.timer--;

          // הכל נהיה שחור ומוחלט!
          ctx.fillStyle = '#020617';
          ctx.fillRect(-50, -50, width + 100, height + 100);

          // שיניים ענקיות בצדדים לשניות הראשונות
          ctx.fillStyle = '#f8fafc';
          for (let i = 0; i < width; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 20, 50);
            ctx.lineTo(i + 40, 0);
            ctx.fill();
          }

          if (sharkAttack.timer <= 0) {
            sharkAttack.stage = 'release';
            sharkAttack.shake = 20;
          }
        } else if (sharkAttack.stage === 'release') {
          sharkAttack.stage = 'idle';
        }

        // 6. האי במרכז
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.ellipse(width * 0.5, horizon + 6, width * 0.22, height * 0.08, 0, Math.PI, 0);
        ctx.fill();

        ctx.restore();
        rafId = requestAnimationFrame(animate);
      }
      animate();

      return function teardown() {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        canvas.remove();
      };
    }
  };
})();