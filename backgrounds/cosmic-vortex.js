/* ================= רקע: מערבולת קוסמית (Cosmic Vortex) =================
   נרשם עצמאית ל-window.GameBackgrounds['cosmic-vortex'].
   חלקיקים נמשכים בספירלה אל המרכז עם אפקט זריחה שובל אור. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['cosmic-vortex'] = {
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

      const center = { x: width / 2, y: height / 2 };
      
      // תגובת עכבר להזזת מרכז המערבולת
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        center.x = e.clientX - rect.left;
        center.y = e.clientY - rect.top;
      }
      function onMouseLeave() {
        center.x = width / 2;
        center.y = height / 2;
      }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseleave', onMouseLeave);

      class VortexParticle {
        constructor() { this.reset(); }
        reset() {
          this.radius = Math.random() * Math.max(width, height) * 0.6 + 20;
          this.angle = Math.random() * Math.PI * 2;
          this.speed = (Math.random() * 0.02 + 0.005);
          this.size = Math.random() * 2 + 0.8;
          this.colorHue = Math.floor(Math.random() * 60 + 180); // גווני כחול-סגול-טורקיז
        }
        update() {
          this.angle += this.speed;
          this.radius -= 0.3; // כיווץ איטי לכיוון המרכז

          if (this.radius <= 5) {
            this.reset();
          }
        }
        draw() {
          const x = center.x + Math.cos(this.angle) * this.radius;
          const y = center.y + Math.sin(this.angle) * this.radius;

          ctx.beginPath();
          ctx.arc(x, y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${this.colorHue}, 85%, 65%)`;
          ctx.fill();
        }
      }

      const count = Math.min(Math.floor((width * height) / 3000), 300);
      const particles = Array.from({ length: count }, () => new VortexParticle());

      let rafId = null;
      function animate() {
        // טשטוש עדין ליצירת שובלי אור (Motion Blur)
        ctx.fillStyle = 'rgba(5, 5, 12, 0.15)';
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