/* ================= רקע: גיאומטריית ניאון (Neon Geometry) - תנועה חלקה =================
   נרשם עצמאית ל-window.GameBackgrounds['neon-geometry']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['neon-geometry'] = {
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

      let speedProgress = 0;
      let rafId = null;

      function animate() {
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);

        const horizon = height * 0.45;
        const cx = width / 2;

        // 1. קווים אנכיים מלוכסנים (פרספקטיבה לאופק)
        const linesCount = 32;
        for (let i = -linesCount; i <= linesCount; i++) {
          const xEnd = cx + i * (width / linesCount) * 2.8;

          const grad = ctx.createLinearGradient(cx, horizon, xEnd, height);
          grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
          grad.addColorStop(0.3, 'rgba(129, 140, 248, 0.35)');
          grad.addColorStop(1, 'rgba(192, 132, 252, 0.75)');

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(cx, horizon);
          ctx.lineTo(xEnd, height);
          ctx.stroke();
        }

        // 2. קווים אופקיים בתנועה מעריכית חלקה ללא קפיצות
        // התקדמות רציפה בזמן
        speedProgress += 0.006; 
        if (speedProgress >= 1) speedProgress -= 1;

        const totalHorizontalLines = 20;
        for (let i = 0; i < totalHorizontalLines; i++) {
          // חישוב המיקום היחסי על בסיס חזקה ליצירת עומק תלת-ממדי אמיתי
          const lineUnit = (i + speedProgress) / totalHorizontalLines;
          const k = Math.pow(lineUnit, 2.5); // מעבר מעריכי רציף
          const y = horizon + k * (height - horizon);

          if (y <= horizon || y >= height) continue;

          // שקיפות מתגברת ככל שהקו קרוב יותר לשחקן
          const opacity = Math.min(1, Math.pow(k, 0.8) * 0.9);
          ctx.strokeStyle = `rgba(168, 85, 247, ${opacity})`;
          ctx.lineWidth = 1 + k * 1.2;

          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // 3. הילת זריחה מלטפת על קו האופק
        const horizonGlow = ctx.createRadialGradient(cx, horizon, 0, cx, horizon, width * 0.45);
        horizonGlow.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        horizonGlow.addColorStop(0.4, 'rgba(147, 51, 234, 0.15)');
        horizonGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = horizonGlow;
        ctx.fillRect(0, 0, width, height);

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