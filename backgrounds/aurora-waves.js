/* ================= רקע: גלי אור זרחניים (Aurora Waves) =================
   נרשם עצמאית ל-window.GameBackgrounds['aurora-waves'].
   יוצר אפקט של גלי אור רכים, זורמים ומעוררי השראה. */
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

      let step = 0;
      let rafId = null;

      function drawWave(color, speed, amplitude, frequency) {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 10) {
          const y = Math.sin(x * frequency + step * speed) * amplitude + height * 0.5;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.fillStyle = color;
        ctx.fill();
      }

      function animate() {
        // רקע כהה ועמוק
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0a0915');
        bgGrad.addColorStop(1, '#1a1829');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // שכבות של גלים בלנד מוד עדין
        ctx.globalCompositeOperation = 'screen';
        drawWave('rgba(99, 102, 241, 0.25)', 0.015, 60, 0.003);
        drawWave('rgba(168, 85, 247, 0.20)', 0.02, 80, 0.002);
        drawWave('rgba(45, 212, 191, 0.18)', 0.01, 50, 0.004);
        ctx.globalCompositeOperation = 'source-over';

        step += 1;
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