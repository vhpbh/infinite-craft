/* ================= רקע: קלידוסקופ נוזלי (Kaleidoscope Fluid) =================
   נרשם עצמאית ל-window.GameBackgrounds['kaleidoscope-fluid']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['kaleidoscope-fluid'] = {
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

      let step = 0;
      let rafId = null;

      function animate() {
        step += 0.01;

        // חישוב אחוז מיקום העכבר על המסך
        const mouseNormX = mouse.x / width;
        const mouseNormY = mouse.y / height;

        // יצירת מפה מורכבת של גרדיאנטים רדיאליים שנעים עם העכבר
        const grad1 = ctx.createRadialGradient(
          mouse.x, mouse.y, 10,
          width - mouse.x, height - mouse.y, Math.max(width, height)
        );

        const baseHue = (step * 20 + mouseNormX * 180) % 360;
        const secondaryHue = (baseHue + 120 + mouseNormY * 90) % 360;
        const tertiaryHue = (baseHue + 240) % 360;

        grad1.addColorStop(0, `hsla(${baseHue}, 90%, 55%, 1)`);
        grad1.addColorStop(0.4, `hsla(${secondaryHue}, 85%, 35%, 1)`);
        grad1.addColorStop(0.8, `hsla(${tertiaryHue}, 80%, 18%, 1)`);
        grad1.addColorStop(1, '#030511');

        ctx.fillStyle = grad1;
        ctx.fillRect(0, 0, width, height);

        // טבעות אור גמישות שמגיבות לתזמון ולעכבר
        ctx.lineWidth = 2;
        const rings = 8;
        for (let i = 1; i <= rings; i++) {
          const radius = (i / rings) * Math.max(width, height) * 0.7;
          const flexX = Math.sin(step + i * 0.5) * (mouseNormX - 0.5) * 80;
          const flexY = Math.cos(step + i * 0.5) * (mouseNormY - 0.5) * 80;

          ctx.beginPath();
          ctx.arc(mouse.x + flexX, mouse.y + flexY, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${(baseHue + i * 25) % 360}, 90%, 70%, ${0.15 + (i / rings) * 0.15})`;
          ctx.stroke();
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