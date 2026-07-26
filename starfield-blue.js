/* ================= רקע: שדה כוכבים כחול =================
   נרשם עצמאית ל-window.GameBackgrounds['starfield-blue']. ר' הערת הראש ב-bubbles-pink.js
   לגבי איך הטעינה הדינמית והחוזה (init/teardown) עובדים. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['starfield-blue'] = {
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

      class Star {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.z = Math.random() * 1 + 0.15; // "עומק" - קובע גודל/מהירות/בהירות
          this.twinkle = Math.random() * Math.PI * 2;
          this.twinkleSpeed = 0.02 + Math.random() * 0.04;
          this.driftX = (Math.random() - 0.5) * 0.15;
        }
        update() {
          this.y += 0.12 * this.z;
          this.x += this.driftX;
          this.twinkle += this.twinkleSpeed;
          if (this.y > height + 5) { this.y = -5; this.x = Math.random() * width; }
          if (this.x < -5) this.x = width + 5;
          if (this.x > width + 5) this.x = -5;
        }
        draw() {
          const b = 0.4 + 0.6 * ((Math.sin(this.twinkle) + 1) / 2);
          const size = this.z * 1.8;
          ctx.beginPath();
          ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224,231,255,${b * this.z})`;
          ctx.fill();
        }
      }

      const count = Math.min(Math.floor((width * height) / 3500), 260);
      const stars = Array.from({ length: count }, () => new Star());

      let rafId = null;
      function animate() {
        // רקע כחול-לילה עמוק עם גרדיאנט קבוע, במקום ניקוי מלא - נותן תחושת "שמיים"
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
        grad.addColorStop(0, '#122058');
        grad.addColorStop(1, '#050714');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        stars.forEach(s => { s.update(); s.draw(); });
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
