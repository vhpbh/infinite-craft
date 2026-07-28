/* ================= רקע: בועות אור עדינות (Soft Bubbles) =================
   נרשם עצמאית ל-window.GameBackgrounds['soft-bubbles']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['soft-bubbles'] = {
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

      const mouse = { x: null, y: null };
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      function onMouseLeave() { mouse.x = null; mouse.y = null; }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseleave', onMouseLeave);

      class Bubble {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * width;
          this.y = height + Math.random() * 100;
          this.radius = Math.random() * 15 + 8;
          this.speedY = Math.random() * 0.6 + 0.3;
          this.swingAngle = Math.random() * Math.PI * 2;
          this.swingSpeed = Math.random() * 0.02 + 0.01;
          this.alpha = Math.random() * 0.25 + 0.1;
        }
        update() {
          this.y -= this.speedY;
          this.swingAngle += this.swingSpeed;
          this.x += Math.sin(this.swingAngle) * 0.4;

          // דחייה קלה מהעכבר
          if (mouse.x !== null && mouse.y !== null) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              this.x += (dx / dist) * 1.2;
              this.y += (dy / dist) * 1.2;
            }
          }

          if (this.y < -this.radius * 2) this.reset();
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(186, 230, 253, ${this.alpha})`;
          ctx.strokeStyle = `rgba(224, 242, 254, ${this.alpha * 1.8})`;
          ctx.lineWidth = 1;
          ctx.fill();
          ctx.stroke();
        }
      }

      const count = Math.min(Math.floor((width * height) / 18000), 45);
      const bubbles = Array.from({ length: count }, () => new Bubble());

      let rafId = null;
      function animate() {
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#1e1b4b');
        bgGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        bubbles.forEach(b => {
          b.update();
          b.draw();
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