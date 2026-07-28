/* ================= רקע: סופרנובה קוסמית (Cosmic Supernova) =================
   נרשם עצמאית ל-window.GameBackgrounds['cosmic-supernova']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['cosmic-supernova'] = {
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

      const mouse = { x: width / 2, y: height / 2 };
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      window.addEventListener('mousemove', onMouseMove);

      class Particle {
        constructor() {
          this.reset();
        }
        reset() {
          this.angle = Math.random() * Math.PI * 2;
          this.radius = Math.random() * (Math.max(width, height) * 0.4) + 20;
          this.speed = (Math.random() * 0.005 + 0.002) * (Math.random() > 0.5 ? 1 : -1);
          this.size = Math.random() * 2.5 + 0.8;
          this.hue = Math.random() * 60 + 200; // גווני כחול-סגול-טורקיז
          this.alpha = Math.random() * 0.7 + 0.3;
        }
        update() {
          this.angle += this.speed;
        }
        draw(centerX, centerY) {
          const x = centerX + Math.cos(this.angle) * this.radius;
          const y = centerY + Math.sin(this.angle) * (this.radius * 0.6); // פרספקטיבה אליפטית

          ctx.beginPath();
          ctx.arc(x, y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${this.hue}, 90%, 65%, ${this.alpha})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsl(${this.hue}, 100%, 50%)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      const count = Math.min(Math.floor((width * height) / 3000), 300);
      const particles = Array.from({ length: count }, () => new Particle());
      let currentX = width / 2;
      let currentY = height / 2;
      let rafId = null;

      function animate() {
        // עקומת החלקה לתנועת המרכז לכיוון העכבר
        currentX += (mouse.x - currentX) * 0.03;
        currentY += (mouse.y - currentY) * 0.03;

        // רקע כהה עמוק עם שבלונה של טשטוש תנועה
        ctx.fillStyle = 'rgba(5, 7, 15, 0.25)';
        ctx.fillRect(0, 0, width, height);

        // הילה מרכזית זוהרת
        const coreGlow = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, 180);
        coreGlow.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        coreGlow.addColorStop(0.5, 'rgba(168, 85, 247, 0.15)');
        coreGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGlow;
        ctx.fillRect(0, 0, width, height);

        particles.forEach(p => {
          p.update();
          p.draw(currentX, currentY);
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