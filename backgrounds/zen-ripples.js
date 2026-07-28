/* ================= רקע: אגם זן ואדוות (Zen Ripples) =================
   נרשם עצמאית ל-window.GameBackgrounds['zen-ripples']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['zen-ripples'] = {
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

      // מחלקת אדווה
      class Ripple {
        constructor(x, y, maxRadius = 120) {
          this.x = x;
          this.y = y;
          this.radius = 2;
          this.maxRadius = maxRadius;
          this.alpha = 0.8;
          this.speed = Math.random() * 0.8 + 0.6;
        }
        update() {
          this.radius += this.speed;
          this.alpha = 1 - (this.radius / this.maxRadius);
        }
        draw() {
          if (this.alpha <= 0) return;

          ctx.lineWidth = 1.5;
          ctx.strokeStyle = `rgba(186, 230, 253, ${this.alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.stroke();

          // אדווה משנית עדינה פנימית
          if (this.radius > 15) {
            ctx.strokeStyle = `rgba(125, 211, 252, ${this.alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius - 10, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      let ripples = [];

      // הוספת אדווה בהזזת עכבר
      let lastMouseTime = 0;
      function onMouseMove(e) {
        const now = Date.now();
        if (now - lastMouseTime > 80) { // הגבלה למניעת עומס
          const rect = canvas.getBoundingClientRect();
          ripples.push(new Ripple(e.clientX - rect.left, e.clientY - rect.top, 80));
          lastMouseTime = now;
        }
      }
      window.addEventListener('mousemove', onMouseMove);

      let rafId = null;

      function animate() {
        // טיפות גשם מקוריות אקראיות
        if (Math.random() < 0.03) {
          ripples.push(new Ripple(Math.random() * width, Math.random() * height, Math.random() * 80 + 60));
        }

        // רקע מים עמוק וצלול
        const waterGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width * 0.8);
        waterGrad.addColorStop(0, '#0f172a');
        waterGrad.addColorStop(0.5, '#0c4a6e');
        waterGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, 0, width, height);

        // ציור ועדכון האדוות
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.update();
          r.draw();
          if (r.alpha <= 0) {
            ripples.splice(i, 1);
          }
        }

        rafId = requestAnimationFrame(animate);
      }
      animate();

      return function teardown() {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMouseMove);
        canvas.remove();
      };
    }
  };
})();