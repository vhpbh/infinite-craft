/* ================= רקע: ניצוצות קוסמיים (Cosmic Sparks) =================
   נרשם עצמאית ל-window.GameBackgrounds['cosmic-sparks']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['cosmic-sparks'] = {
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

      const sparks = [];
      const mouse = { x: null, y: null };

      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;

        // יצירת ניצוצות בצבעים משתנים עם כל הזזת עכבר
        for (let i = 0; i < 3; i++) {
          sparks.push({
            x: mouse.x,
            y: mouse.y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            color: `hsl(${Math.random() * 60 + 180}, 90%, 65%)`, // כחול, טורקיז וסגול
            life: 1.0,
            decay: Math.random() * 0.02 + 0.015
          });
        }
      }
      function onMouseLeave() { mouse.x = null; mouse.y = null; }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseleave', onMouseLeave);

      let rafId = null;
      function animate() {
        // רקע לילי עמוק
        const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // ציור ועדכון הניצוצות
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.x += s.vx;
          s.y += s.vy;
          s.life -= s.decay;

          if (s.life <= 0) {
            sparks.splice(i, 1);
            continue;
          }

          // חיבור בקווי אור דקים אל הסמן אם הוא קרוב
          if (mouse.x !== null && mouse.y !== null) {
            const dx = s.x - mouse.x;
            const dy = s.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(s.x, s.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = s.color;
              ctx.globalAlpha = s.life * (1 - dist / 100) * 0.4;
              ctx.lineWidth = 0.6;
              ctx.stroke();
              ctx.globalAlpha = 1.0;
            }
          }

          // ציור הניצוץ הזוהר
          ctx.beginPath();
          ctx.arc(s.x, s.y, 2.5 * s.life, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.globalAlpha = s.life;
          ctx.shadowBlur = 8;
          ctx.shadowColor = s.color;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1.0;
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