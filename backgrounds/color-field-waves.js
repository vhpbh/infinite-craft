/* ================= רקע: שדה גלים צבעוני (Color Field Waves) =================
   נרשם עצמאית ל-window.GameBackgrounds['color-field-waves']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['color-field-waves'] = {
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

      const mouse = { x: width / 2, y: height / 2, targetX: width / 2, targetY: height / 2 };

      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.targetX = e.clientX - rect.left;
        mouse.targetY = e.clientY - rect.top;
      }
      window.addEventListener('mousemove', onMouseMove);

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.015;

        // החלקה רכה של תנועת העכבר לכל שטח המסך
        mouse.x += (mouse.targetX - mouse.x) * 0.08;
        mouse.y += (mouse.targetY - mouse.y) * 0.08;

        // ניקוי הקנבס
        ctx.fillStyle = '#0a0d1a';
        ctx.fillRect(0, 0, width, height);

        const rows = 25;
        const cols = 35;
        const spacingX = width / cols;
        const spacingY = height / rows;

        for (let i = 0; i <= cols; i++) {
          for (let j = 0; j <= rows; j++) {
            const originX = i * spacingX;
            const originY = j * spacingY;

            // חישוב מרחק והשפעת העכבר על כל הנקודות במסך
            const dx = originX - mouse.x;
            const dy = originY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = Math.max(width, height) * 0.5;

            const force = Math.max(0, 1 - dist / 300);
            const offsetX = Math.cos(time + dist * 0.01) * 15 + (dx / (dist || 1)) * force * 50;
            const offsetY = Math.sin(time + dist * 0.01) * 15 + (dy / (dist || 1)) * force * 50;

            const posX = originX + offsetX;
            const posY = originY + offsetY;

            // גוונים דינמיים שמשתנים לפי מיקום העכבר והזמן
            const hue = (time * 40 + (dist / maxDist) * 360 + (mouse.x / width) * 120) % 360;
            const size = Math.max(1.5, (1 - dist / maxDist) * 6 + force * 4);

            ctx.beginPath();
            ctx.arc(posX, posY, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${0.3 + force * 0.6})`;
            ctx.fill();

            // קווי חיבור עדינים ליצירת תחושת רשת תלת-ממדית
            if (i < cols) {
              ctx.beginPath();
              ctx.moveTo(posX, posY);
              ctx.lineTo(posX + spacingX, posY);
              ctx.strokeStyle = `hsla(${hue}, 80%, 50%, ${0.05 + force * 0.25})`;
              ctx.lineWidth = 0.8;
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