/* ================= רקע: גחליליות ביער הקסום (Glowing Fireflies) =================
   נרשם עצמאית ל-window.GameBackgrounds['glowing-fireflies']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['glowing-fireflies'] = {
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

      // מעקב עכבר ליצירת אינטראקציה עדינה
      const mouse = { x: -1000, y: -1000 };
      function onMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      window.addEventListener('mousemove', onMouseMove);

      // מחלקת גחלילית
      class Firefly {
        constructor() { this.reset(); }
        reset() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.size = Math.random() * 2.5 + 1.5;
          this.angle = Math.random() * Math.PI * 2;
          this.speed = Math.random() * 0.4 + 0.2;
          this.pulse = Math.random() * Math.PI * 2;
          this.pulseSpeed = Math.random() * 0.03 + 0.01;
          this.hue = Math.random() * 30 + 45; // גווני זהב-ירקרק עדינים
        }
        update() {
          // תנועה אורגנית רכה
          this.angle += (Math.random() - 0.5) * 0.1;
          this.x += Math.cos(this.angle) * this.speed;
          this.y += Math.sin(this.angle) * this.speed;

          // דחייה עדינה מהעכבר
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            this.x += (dx / dist) * 1.5;
            this.y += (dy / dist) * 1.5;
          }

          // פעימת אור
          this.pulse += this.pulseSpeed;

          // שמירה על גבולות המסך
          if (this.x < -10) this.x = width + 10;
          if (this.x > width + 10) this.x = -10;
          if (this.y < -10) this.y = height + 10;
          if (this.y > height + 10) this.y = -10;
        }
        draw() {
          const alpha = (Math.sin(this.pulse) + 1) / 2 * 0.8 + 0.2;

          // הילת אור זוהרת
          const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 6);
          grad.addColorStop(0, `hsla(${this.hue}, 100%, 75%, ${alpha})`);
          grad.addColorStop(0.4, `hsla(${this.hue}, 90%, 50%, ${alpha * 0.3})`);
          grad.addColorStop(1, 'transparent');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 6, 0, Math.PI * 2);
          ctx.fill();

          // ליבה בהירה
          ctx.fillStyle = `rgba(255, 255, 240, ${alpha})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const fireflies = Array.from({ length: 45 }, () => new Firefly());
      let rafId = null;

      function animate() {
        // רקע לילי עמוק ומדורג
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#030712');
        bgGrad.addColorStop(0.6, '#0f172a');
        bgGrad.addColorStop(1, '#064e3b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // צלליות עצים עדינות ברקע
        ctx.fillStyle = 'rgba(2, 6, 23, 0.6)';
        for (let i = 0; i < width; i += 120) {
          ctx.beginPath();
          ctx.moveTo(i, height);
          ctx.lineTo(i + 40, height - 150 - Math.sin(i) * 40);
          ctx.lineTo(i + 80, height);
          ctx.fill();
        }

        // עדכון וציור הגחליליות
        fireflies.forEach(f => {
          f.update();
          f.draw();
        });

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