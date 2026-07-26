/* ================= רקע: גשם דיגיטלי ירוק (מטריקס) =================
   נרשם עצמאית ל-window.GameBackgrounds['matrix-rain']. ר' הערת הראש ב-bubbles-pink.js
   לגבי איך הטעינה הדינמית והחוזה (init/teardown) עובדים. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['matrix-rain'] = {
    init(container) {
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      const chars = '01アイウエオカキクケコサシスセソタチツテト';
      const fontSize = 15;
      let width, height, dpr, columns, drops;

      function setup() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        columns = Math.ceil(width / fontSize);
        drops = new Array(columns).fill(0).map(() => Math.random() * -40);
      }
      setup();
      window.addEventListener('resize', setup);

      let rafId = null;
      let frame = 0;
      function animate() {
        // עקבות דהייה (fade trail) במקום ניקוי מלא - זה מה שיוצר את "זנב" הגשם
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, 0, width, height);

        ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < columns; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;
          // התו המוביל בהיר יותר, לתחושת "ראש" הזרם
          ctx.fillStyle = Math.random() > 0.94 ? '#c9ffe0' : 'rgba(30,220,120,0.85)';
          ctx.fillText(char, x, y);
          if (y > height && Math.random() > 0.975) drops[i] = 0;
          drops[i] += 0.55 + Math.random() * 0.35;
        }
        frame++;
        rafId = requestAnimationFrame(animate);
      }
      // רקע שחור התחלתי מלא (לפני שהעקבות מתחילות להצטבר)
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, width, height);
      animate();

      return function teardown() {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', setup);
        canvas.remove();
      };
    }
  };
})();
