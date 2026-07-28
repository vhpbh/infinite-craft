/* ================= רקע: מערבולת מנסרה צבעונית (Prismatic Vortex) =================
   נרשם עצמאית ל-window.GameBackgrounds['prismatic-vortex']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['prismatic-vortex'] = {
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
      let hueShift = 0;

      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      window.addEventListener('mousemove', onMouseMove);

      const particles = Array.from({ length: 80 }, () => ({
        angle: Math.random() * Math.PI * 2,
        dist: Math.random() * 300 + 50,
        speed: (Math.random() * 0.02 + 0.01) * (Math.random() < 0.5 ? 1 : -1),
        size: Math.random() * 4 + 2,
        hueOffset: Math.random() * 360
      }));

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.01;
        hueShift = (hueShift + 0.8) % 360;

        // שבילים רכים לכל המסך
        ctx.fillStyle = 'rgba(5, 7, 20, 0.25)';
        ctx.fillRect(0, 0, width, height);

        // טבעות מנסרה צבעוניות מסתובבות סביב העכבר
        const ringCount = 5;
        for (let i = 0; i < ringCount; i++) {
          const radius = 40 + i * 35 + Math.sin(time * 2 + i) * 15;
          const hue = (hueShift + i * 50) % 360;

          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, radius, time + i, time + i + Math.PI * 1.5);
          ctx.strokeStyle = `hsla(${hue}, 90%, 60%, 0.4)`;
          ctx.lineWidth = 3;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsla(${hue}, 100%, 50%, 0.8)`;
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // חלקיקים צבעוניים שמסתובבים במערבולת
        particles.forEach(p => {
          p.angle += p.speed;

          // התכנסות עדינה לעכבר
          p.dist += Math.sin(time + p.angle) * 0.5;
          if (p.dist < 20) p.dist = 300;
          if (p.dist > 350) p.dist = 50;

          const x = mouse.x + Math.cos(p.angle) * p.dist;
          const y = mouse.y + Math.sin(p.angle) * p.dist;

          const pHue = (hueShift + p.hueOffset) % 360;

          ctx.beginPath();
          ctx.arc(x, y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${pHue}, 95%, 65%, 0.85)`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsla(${pHue}, 100%, 50%, 0.9)`;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

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