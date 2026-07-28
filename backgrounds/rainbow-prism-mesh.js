/* ================= רקע: רשת פריזמה צבעונית (Rainbow Prism Mesh) =================
   נרשם עצמאית ל-window.GameBackgrounds['rainbow-prism-mesh']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['rainbow-prism-mesh'] = {
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

      const mouse = { x: -1000, y: -1000 };
      const sparkles = [];

      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;

        // הוספת ניצוצות צבעוניים
        for (let i = 0; i < 3; i++) {
          sparkles.push({
            x: mouse.x,
            y: mouse.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            hue: Math.random() * 360,
            radius: Math.random() * 4 + 2,
            life: 1.0
          });
        }
      }
      window.addEventListener('mousemove', onMouseMove);

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.005;

        // 1. רקע רדיאלי צבעוני עמוק ודינמי
        const cx = width / 2;
        const cy = height / 2;
        const bgGrad = ctx.createRadialGradient(
          cx + Math.sin(time) * 100, cy + Math.cos(time) * 100, 50,
          cx, cy, Math.max(width, height) * 0.8
        );

        const h1 = (time * 20) % 360;
        const h2 = (h1 + 140) % 360;
        bgGrad.addColorStop(0, `hsla(${h1}, 70%, 20%, 1)`);
        bgGrad.addColorStop(0.6, `hsla(${h2}, 80%, 12%, 1)`);
        bgGrad.addColorStop(1, '#050714');

        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. קווי רשת פריזמה שמתעקמים לכיוון העכבר
        const cols = 12;
        const rows = 8;
        const cellW = width / cols;
        const cellH = height / rows;

        ctx.lineWidth = 1.2;
        for (let i = 0; i <= cols; i++) {
          for (let j = 0; j <= rows; j++) {
            let px = i * cellW;
            let py = j * cellH;

            // כיפוף אלמנטים לכיוון העכבר
            const dx = mouse.x - px;
            const dy = mouse.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
              const pull = (1 - dist / 200) * 35;
              px += (dx / dist) * pull;
              py += (dy / dist) * pull;
            }

            const gridHue = (time * 30 + i * 20 + j * 15) % 360;
            ctx.fillStyle = `hsla(${gridHue}, 85%, 65%, 0.6)`;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // קווים מחברים
            if (i < cols) {
              const nextX = (i + 1) * cellW;
              ctx.strokeStyle = `hsla(${gridHue}, 75%, 55%, 0.15)`;
              ctx.beginPath();
              ctx.moveTo(px, py);
              ctx.lineTo(nextX, j * cellH);
              ctx.stroke();
            }
          }
        }

        // 3. עדכון וציור ניצוצות העכבר
        for (let i = sparkles.length - 1; i >= 0; i--) {
          const s = sparkles[i];
          s.x += s.vx;
          s.y += s.vy;
          s.life -= 0.02;

          if (s.life <= 0) {
            sparkles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * s.life, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${s.hue}, 90%, 60%, ${s.life})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsla(${s.hue}, 100%, 50%, ${s.life})`;
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