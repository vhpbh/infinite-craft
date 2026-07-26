/* ================= רקע: קונפטי צבעוני מרחף =================
   נרשם עצמאית ל-window.GameBackgrounds['confetti-drift']. ר' הערת הראש ב-bubbles-pink.js
   לגבי איך הטעינה הדינמית והחוזה (init/teardown) עובדים. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['confetti-drift'] = {
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

      const colors = ['#ff9ad5', '#ffd166', '#7ee8fa', '#a78bfa', '#f472b6', '#67e8f9', '#fbbf24'];

      class Confetto {
        constructor() { this.reset(true); }
        reset(initial) {
          this.x = Math.random() * width;
          this.y = initial ? Math.random() * height : -20 - Math.random() * 40;
          this.w = 5 + Math.random() * 6;
          this.h = 8 + Math.random() * 8;
          this.color = colors[Math.floor(Math.random() * colors.length)];
          this.speedY = 0.6 + Math.random() * 1.4;
          this.speedX = (Math.random() - 0.5) * 0.8;
          this.rot = Math.random() * Math.PI * 2;
          this.rotSpeed = (Math.random() - 0.5) * 0.08;
          this.sway = Math.random() * Math.PI * 2;
          this.swaySpeed = 0.02 + Math.random() * 0.02;
        }
        update() {
          this.y += this.speedY;
          this.sway += this.swaySpeed;
          this.x += this.speedX + Math.sin(this.sway) * 0.6;
          this.rot += this.rotSpeed;
          if (this.y > height + 20) this.reset(false);
        }
        draw() {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rot);
          ctx.fillStyle = this.color;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
          ctx.restore();
        }
      }

      const count = Math.min(Math.floor((width * height) / 9000), 140);
      const pieces = Array.from({ length: count }, () => new Confetto());

      let rafId = null;
      function animate() {
        ctx.clearRect(0, 0, width, height);
        pieces.forEach(p => { p.update(); p.draw(); });
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
