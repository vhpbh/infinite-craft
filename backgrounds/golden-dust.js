/* ================= רקע: אבק זהב קסום (Golden Dust) =================
   נרשם עצמאית ל-window.GameBackgrounds['golden-dust'].
   חלקיקים זהובים שצפים מעלה ברכות ומגיבים למרחק מהעכבר. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['golden-dust'] = {
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

      const mouse = { x: null, y: null, radius: 120 };
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      function onMouseLeave() { mouse.x = null; mouse.y = null; }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseleave', onMouseLeave);

      class Particle {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * width;
          this.y = height + Math.random() * 20;
          this.size = Math.random() * 2.5 + 0.5;
          this.speedY = Math.random() * 0.6 + 0.2;
          this.speedX = (Math.random() - 0.5) * 0.3;
          this.alpha = Math.random() * 0.8 + 0.2;
          this.pulseSpeed = 0.01 + Math.random() * 0.03;
          this.pulse = Math.random() * Math.PI * 2;
        }
        update() {
          this.y -= this.speedY;
          this.x += this.speedX + Math.sin(this.pulse) * 0.2;
          this.pulse += this.pulseSpeed;

          // תגובה לעכבר (דחיפה קלה)
          if (mouse.x !== null && mouse.y !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
              const force = (mouse.radius - dist) / mouse.radius;
              this.x += (dx / dist) * force * 2;
              this.y += (dy / dist) * force * 2;
            }
          }

          if (this.y < -10) this.reset();
        }
        draw() {
          const opacity = this.alpha * (0.6 + 0.4 * Math.sin(this.pulse));
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(251, 191, 36, ${opacity})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
          ctx.fill();
          ctx.shadowBlur = 0; // איפוס
        }
      }

      const count = Math.min(Math.floor((width * height) / 4500), 180);
      const particles = Array.from({ length: count }, () => {
        const p = new Particle();
        p.y = Math.random() * height; // התחלה מפוזרת
        return p;
      });

      let rafId = null;
      function animate() {
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
        grad.addColorStop(0, '#1c1917');
        grad.addColorStop(1, '#0c0a09');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        particles.forEach(p => {
          p.update();
          p.draw();
        });

        rafId = requestAnimationFrame(animate);
      }
      animate();

      return function teardown() {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseleave', onMouseLeave);
        canvas.remove();
      };
    }
  };
})();