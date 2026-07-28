/* ================= רקע: סופרנובה כרומטית (Chromatic Supernova) =================
   נרשם עצמאית ל-window.GameBackgrounds['chromatic-supernova']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['chromatic-supernova'] = {
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

      const particleCount = 120;
      const particles = Array.from({ length: particleCount }, (_, i) => ({
        angle: (i / particleCount) * Math.PI * 2,
        dist: Math.random() * 200 + 30,
        speed: Math.random() * 0.03 + 0.01,
        radius: Math.random() * 5 + 2,
        hueOffset: (i * 3) % 360
      }));

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.015;

        ctx.fillStyle = 'rgba(5, 5, 16, 0.2)';
        ctx.fillRect(0, 0, width, height);

        const globalHue = (time * 40) % 360;

        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 350);
        glow.addColorStop(0, `hsla(${globalHue}, 100%, 65%, 0.35)`);
        glow.addColorStop(0.5, `hsla(${(globalHue + 120) % 360}, 90%, 45%, 0.15)`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);

        particles.forEach((p, idx) => {
          p.angle += p.speed;

          const currentHue = (globalHue + p.hueOffset) % 360;
          const x = mouse.x + Math.cos(p.angle) * (p.dist + Math.sin(time * 2 + idx) * 20);
          const y = mouse.y + Math.sin(p.angle) * (p.dist + Math.cos(time * 2 + idx) * 20);

          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `hsla(${currentHue}, 90%, 60%, 0.08)`;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(x, y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${currentHue}, 95%, 65%, 0.9)`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsla(${currentHue}, 100%, 50%, 0.9)`;
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