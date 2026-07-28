/* ================= רקע: מבט מקבינת הספינה (Ship Cabin Voyage) =================
   נרשם עצמאית ל-window.GameBackgrounds['ocean-voyage']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['ocean-voyage'] = {
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

      // כוכבים בלילה
      const stars = Array.from({ length: 80 }, () => ({
        x: Math.random() * width,
        y: Math.random() * (height * 0.5),
        size: Math.random() * 1.5 + 0.5
      }));

      // דגים קופצים
      class JumpingFish {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * (width * 0.6) + width * 0.2;
          this.startY = height * 0.65;
          this.y = this.startY;
          this.vx = (Math.random() - 0.5) * 3;
          this.vy = -(Math.random() * 4 + 5);
          this.gravity = 0.25;
          this.active = false;
          this.timer = Math.random() * 300;
        }
        update() {
          if (!this.active) {
            this.timer--;
            if (this.timer <= 0) this.active = true;
            return;
          }
          this.x += this.vx;
          this.y += this.vy;
          this.vy += this.gravity;
          if (this.y > this.startY + 20) this.reset();
        }
        draw() {
          if (!this.active) return;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(this.x, this.y, 8, 3, Math.atan2(this.vy, this.vx), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      const fishList = Array.from({ length: 3 }, () => new JumpingFish());

      let cycle = 0;
      let rafId = null;

      function animate() {
        cycle += 0.0006;
        const timeFactor = (Math.sin(cycle) + 1) / 2; // 1=יום, 0=לילה
        const horizon = height * 0.55;

        // --- 1. שמיים ---
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
        if (timeFactor > 0.4) {
          skyGrad.addColorStop(0, `rgb(${10 + 100 * timeFactor}, ${20 + 140 * timeFactor}, ${40 + 180 * timeFactor})`);
          skyGrad.addColorStop(1, `rgb(${240 - 80 * timeFactor}, ${140 - 60 * timeFactor}, ${20 + 80 * timeFactor})`);
        } else {
          skyGrad.addColorStop(0, '#030712');
          skyGrad.addColorStop(1, '#1e1b4b');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizon);

        // כוכבים
        if (timeFactor < 0.3) {
          ctx.fillStyle = `rgba(255,255,255,${(0.3 - timeFactor) * 3})`;
          stars.forEach(s => { ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill(); });
        }

        // --- 2. שמש / ירח ---
        const sunY = horizon - Math.sin(cycle) * (height * 0.3);
        const sunX = width * 0.5 + Math.cos(cycle) * (width * 0.35);
        ctx.beginPath();
        ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
        ctx.fillStyle = timeFactor > 0.3 ? '#fef08a' : '#f1f5f9';
        ctx.shadowBlur = 25;
        ctx.shadowColor = timeFactor > 0.3 ? '#f59e0b' : '#cbd5e1';
        ctx.fill();
        ctx.shadowBlur = 0;

        // --- 3. גלים שוצפים ---
        const waveTime = Date.now() * 0.003;
        for (let i = 0; i < 6; i++) {
          const waveY = horizon + (i * (height - horizon) / 6);
          ctx.beginPath();
          ctx.moveTo(0, height);
          for (let x = 0; x <= width; x += 15) {
            const dy = Math.sin(x * 0.015 + waveTime + i * 1.2) * (10 + i * 4);
            ctx.lineTo(x, waveY + dy);
          }
          ctx.lineTo(width, height);
          const seaR = Math.floor(5 + 15 * timeFactor);
          const seaG = Math.floor(20 + 80 * timeFactor);
          const seaB = Math.floor(40 + 120 * timeFactor);
          ctx.fillStyle = `rgba(${seaR}, ${seaG}, ${seaB}, ${0.5 + i * 0.1})`;
          ctx.fill();
        }

        // דגים
        fishList.forEach(f => { f.update(); f.draw(); });

        // --- 4. מסגרת חלון קבינה (Porthole) ---
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) * 0.42;

        // רקע הקבינה הכהה (הקיר מסביב לחלון)
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.arc(cx, cy, radius, 0, Math.PI * 2, true); // חיתוך החור
        ctx.fillStyle = '#0a0d14';
        ctx.fill();

        // טבעת המתכת של החלון
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.lineWidth = 18;
        ctx.strokeStyle = '#1e293b';
        ctx.stroke();

        ctx.lineWidth = 4;
        ctx.strokeStyle = '#475569';
        ctx.stroke();

        // ברגים על מסגרת החלון
        const bolts = 8;
        for (let i = 0; i < bolts; i++) {
          const angle = (i * Math.PI * 2) / bolts;
          const bx = cx + Math.cos(angle) * (radius + 2);
          const by = cy + Math.sin(angle) * (radius + 2);
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#94a3b8';
          ctx.fill();
        }
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