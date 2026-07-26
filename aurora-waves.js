/* ================= רקע: גלי אורורה ירוקים =================
   נרשם עצמאית ל-window.GameBackgrounds['aurora-waves']. ר' הערת הראש ב-bubbles-pink.js
   לגבי איך הטעינה הדינמית והחוזה (init/teardown) עובדים. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['aurora-waves'] = {
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

      // כל שכבה היא "רצועת" גל בגוון ירוק/טורקיז שונה, עם תדר/מופע/שקיפות משלה
      const layers = [
        { color: 'rgba(15,174,122,0.28)', amp: 0.10, freq: 1.4, speed: 0.0009, phase: 0,    yBase: 0.35 },
        { color: 'rgba(34,211,238,0.20)', amp: 0.13, freq: 1.0, speed: 0.0013, phase: 2,    yBase: 0.5  },
        { color: 'rgba(110,231,183,0.22)',amp: 0.08, freq: 1.8, speed: 0.0007, phase: 4,    yBase: 0.62 },
        { color: 'rgba(6,47,42,0.35)',    amp: 0.16, freq: 0.7, speed: 0.0011, phase: 1.3,  yBase: 0.78 },
      ];

      let t = 0;
      let rafId = null;
      function drawWave(layer) {
        ctx.beginPath();
        ctx.moveTo(0, height);
        const baseY = height * layer.yBase;
        for (let x = 0; x <= width; x += 8) {
          const y = baseY + Math.sin(x * 0.004 * layer.freq + t * layer.speed * 1000 + layer.phase) * height * layer.amp
                          + Math.sin(x * 0.0015 * layer.freq - t * layer.speed * 600) * height * layer.amp * 0.4;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
      }

      function animate() {
        // רקע כהה-ירקרק קבוע, ומעליו שכבות הגלים המונפשות בשקיפות
        ctx.fillStyle = '#04140f';
        ctx.fillRect(0, 0, width, height);
        layers.forEach(drawWave);
        t += 1;
        rafId = requestAnimationFrame(animate);
      }
      animate();

      return function teardown() {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        canvas.remove();
      };
    }
  };
})();
