/* ================= רקע: גלי אור מינימליסטיים (Gentle Waves) =================
   נרשם עצמאית ל-window.GameBackgrounds['gentle-waves']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['gentle-waves'] = {
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

      let step = 0;
      let rafId = null;

      function animate() {
        step += 0.008;

        // רקע כהה ורגוע
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const linesCount = 6;
        for (let i = 0; i < linesCount; i++) {
          ctx.beginPath();
          const baseY = height * 0.5 + i * 25;

          for (let x = 0; x <= width; x += 20) {
            let dy = Math.sin(x * 0.005 + step + i * 0.8) * (20 + i * 5);

            // השפעה עדינה של העכבר
            if (mouse.x !== null && mouse.y !== null) {
              const dx = x - mouse.x;
              const distY = baseY - mouse.y;
              const dist = Math.sqrt(dx * dx + distY * distY);
              if (dist < 150) {
                dy += Math.sin(dist * 0.05) * (15 - dist * 0.1);
              }
            }

            if (x === 0) ctx.moveTo(x, baseY + dy);
            else ctx.lineTo(x, baseY + dy);
          }

          ctx.strokeStyle = `rgba(148, 163, 184, ${0.15 + (i / linesCount) * 0.25})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
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