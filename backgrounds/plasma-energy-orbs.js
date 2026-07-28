/* ================= רקע: כדורי פלאזמה ואנרגיה (Plasma Energy Orbs) =================
   נרשם עצמאית ל-window.GameBackgrounds['plasma-energy-orbs']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['plasma-energy-orbs'] = {
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

      const orbs = Array.from({ length: 12 }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 60 + 40,
        hue: (i * 30) % 360
      }));

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.01;

        // רקע עמוק ומתכהה הדרגתית
        ctx.fillStyle = 'rgba(6, 9, 24, 0.3)';
        ctx.fillRect(0, 0, width, height);

        orbs.forEach((orb) => {
          orb.x += orb.vx;
          orb.y += orb.vy;

          if (orb.x < -50) orb.x = width + 50;
          if (orb.x > width + 50) orb.x = -50;
          if (orb.y < -50) orb.y = height + 50;
          if (orb.y > height + 50) orb.y = -50;

          // אינטראקציה עשירה עם העכבר
          const dx = mouse.x - orb.x;
          const dy = mouse.y - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 220) {
            ctx.beginPath();
            ctx.moveTo(orb.x, orb.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `hsla(${orb.hue}, 90%, 65%, ${0.5 * (1 - dist / 220)})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // ציור כדור הפלאזמה הזוהר
          const grad = ctx.createRadialGradient(
            orb.x, orb.y, 0,
            orb.x, orb.y, orb.radius
          );
          const currentHue = (orb.hue + time * 20) % 360;
          grad.addColorStop(0, `hsla(${currentHue}, 90%, 65%, 0.6)`);
          grad.addColorStop(0.5, `hsla(${currentHue}, 80%, 45%, 0.25)`);
          grad.addColorStop(1, 'transparent');

          ctx.beginPath();
          ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
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