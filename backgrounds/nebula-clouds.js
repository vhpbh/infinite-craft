/* ================= רקע: ערפילית קוסמית (Nebula Clouds) =================
   נרשם עצמאית ל-window.GameBackgrounds['nebula-clouds'].
   מציג ענני ערפילית רכים זורחים בשילוב חלקיקי אבק כוכבים. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['nebula-clouds'] = {
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

      class Cloud {
        constructor() {
          this.reset();
        }
        reset() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.radius = Math.random() * 200 + 100;
          this.vx = (Math.random() - 0.5) * 0.3;
          this.vy = (Math.random() - 0.5) * 0.3;
          this.hue = Math.random() > 0.5 ? 240 : 280; // כחול או סגול
          this.alpha = Math.random() * 0.15 + 0.05;
        }
        update() {
          this.x += this.vx;
          this.y += this.vy;
          if (this.x < -this.radius || this.x > width + this.radius) this.vx *= -1;
          if (this.y < -this.radius || this.y > height + this.radius) this.vy *= -1;
        }
        draw() {
          const grad = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
          );
          grad.addColorStop(0, `hsla(${this.hue}, 80%, 55%, ${this.alpha})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const clouds = Array.from({ length: 8 }, () => new Cloud());
      let rafId = null;

      function animate() {
        ctx.fillStyle = '#060814';
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        clouds.forEach(c => {
          c.update();
          c.draw();
        });
        ctx.globalCompositeOperation = 'source-over';

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