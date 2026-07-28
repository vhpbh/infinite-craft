/* ================= רקע: סבכת ניאון תלת-ממדית (Neon Hyper Grid) =================
   נרשם עצמאית ל-window.GameBackgrounds['neon-hyper-grid']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['neon-hyper-grid'] = {
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

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.02;

        // רקע לילי עמוק
        ctx.fillStyle = '#040612';
        ctx.fillRect(0, 0, width, height);

        const rows = 18;
        const cols = 28;
        const cellW = width / cols;
        const cellH = height / rows;

        for (let i = 0; i <= cols; i++) {
          for (let j = 0; j <= rows; j++) {
            const baseX = i * cellW;
            const baseY = j * cellH;

            // חישוב המרחק וההשפעה של העכבר
            const dx = baseX - mouse.x;
            const dy = baseY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 250;

            let offsetX = 0;
            let offsetY = 0;

            if (dist < maxDist) {
              const factor = Math.sin((1 - dist / maxDist) * Math.PI);
              offsetX = (dx / dist) * factor * 35;
              offsetY = (dy / dist) * factor * 35;
            }

            const x = baseX + offsetX;
            const y = baseY + offsetY;

            const hue = (time * 30 + i * 12 + j * 12) % 360;

            // ציור הנקודות הזוהרות
            ctx.beginPath();
            ctx.arc(x, y, dist < maxDist ? 3.5 : 2, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${dist < maxDist ? 0.9 : 0.4})`;
            if (dist < maxDist) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.8)`;
            }
            ctx.fill();
            ctx.shadowBlur = 0;

            // חיבור קווי רשת אופקיים
            if (i < cols) {
              const nextDx = (i + 1) * cellW - mouse.x;
              const nextDy = j * cellH - mouse.y;
              const nextDist = Math.sqrt(nextDx * nextDx + nextDy * nextDy);
              let nextOffX = 0, nextOffY = 0;
              if (nextDist < maxDist) {
                const f = Math.sin((1 - nextDist / maxDist) * Math.PI);
                nextOffX = (nextDx / nextDist) * f * 35;
                nextOffY = (nextDy / nextDist) * f * 35;
              }

              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo((i + 1) * cellW + nextOffX, j * cellH + nextOffY);
              ctx.strokeStyle = `hsla(${hue}, 80%, 55%, ${dist < maxDist ? 0.35 : 0.1})`;
              ctx.lineWidth = 1;
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
        canvas.remove();
      };
    }
  };
})();