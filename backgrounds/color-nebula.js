/* ================= רקע: ערפילית צבעים זוהרת (Color Nebula) =================
   נרשם עצמאית ל-window.GameBackgrounds['color-nebula']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['color-nebula'] = {
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

      const particles = [];
      let hue = 220; // גוון משתנה דינמית

      function addParticles(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 2.5 + 0.5;
          particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: Math.random() * 4 + 2,
            hue: (hue + Math.random() * 40 - 20) % 360,
            alpha: 1,
            decay: Math.random() * 0.015 + 0.008
          });
        }
      }

      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        hue = (hue + 1) % 360; // שינוי גוון הדרגתי עם התנועה
        addParticles(x, y, 6);
      }
      window.addEventListener('mousemove', onMouseMove);

      let rafId = null;
      function animate() {
        // שבילים רכים (Trail effect)
        ctx.fillStyle = 'rgba(10, 14, 26, 0.2)';
        ctx.fillRect(0, 0, width, height);

        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= p.decay;
          p.size *= 0.98;

          if (p.alpha <= 0 || p.size <= 0.2) {
            particles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${p.alpha})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsla(${p.hue}, 90%, 50%, ${p.alpha})`;
          ctx.fill();
          ctx.shadowBlur = 0;
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