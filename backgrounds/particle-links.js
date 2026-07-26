/* ================= רקע: רשת חלקיקים אינטראקטיבית (פרימיום) =================
   נרשם עצמאית ל-window.GameBackgrounds['particle-links']. ר' הערת הראש ב-bubbles-pink.js
   לגבי איך הטעינה הדינמית והחוזה (init/teardown) עובדים.
   שונה מהיתר: מאזין לתנועת עכבר על כל החלון (כי ל-bg-layer עצמו pointer-events:none, כדי לא
   לחסום גרירת אלמנטים על הלוח) - ולכן חובה להסיר את מאזיני ה-window ב-teardown, אחרת הם יישארו
   פעילים גם אחרי מעבר לרקע אחר. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['particle-links'] = {
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

      const mouse = { x: null, y: null, radius: 150 };
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      function onMouseLeave() { mouse.x = null; mouse.y = null; }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseleave', onMouseLeave);

      class Particle {
        constructor() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.size = Math.random() * 2 + 1;
          this.vx = (Math.random() - 0.5) * 0.8;
          this.vy = (Math.random() - 0.5) * 0.8;
        }
        update() {
          this.x += this.vx;
          this.y += this.vy;
          if (this.x < 0 || this.x > width) this.vx *= -1;
          if (this.y < 0 || this.y > height) this.vy *= -1;
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(165,180,252,0.7)';
          ctx.fill();
        }
      }

      const particleCount = Math.min(Math.floor((width * height) / 9000), 120);
      const particles = Array.from({ length: particleCount }, () => new Particle());

      let rafId = null;
      function animate() {
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
        grad.addColorStop(0, '#1a1e29');
        grad.addColorStop(1, '#0a0c10');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < particles.length; i++) {
          particles[i].update();
          particles[i].draw();

          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(165,180,252,${1 - distance / 120})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }

          if (mouse.x !== null && mouse.y !== null) {
            const dx = particles[i].x - mouse.x;
            const dy = particles[i].y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = `rgba(224,231,255,${1 - distance / mouse.radius})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }
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
