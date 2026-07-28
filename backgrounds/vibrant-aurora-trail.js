/* ================= רקע: זהר צפוני דינמי (Vibrant Aurora Trail) =================
   נרשם עצמאית ל-window.GameBackgrounds['vibrant-aurora-trail']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['vibrant-aurora-trail'] = {
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

      const trailParticles = [];
      let baseHue = 180; // גוון בסיס משתנה

      function addTrail(x, y) {
        for (let i = 0; i < 5; i++) {
          trailParticles.push({
            x: x + (Math.random() - 0.5) * 10,
            y: y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 2.5,
            vy: (Math.random() - 0.5) * 2.5,
            size: Math.random() * 6 + 3,
            hue: (baseHue + Math.random() * 60) % 360,
            life: 1.0,
            decay: Math.random() * 0.02 + 0.01
          });
        }
      }

      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        baseHue = (baseHue + 1.5) % 360;
        addTrail(x, y);
      }
      window.addEventListener('mousemove', onMouseMove);

      let step = 0;
      let rafId = null;

      function animate() {
        step += 0.01;

        // 1. רקע צבעוני עשיר בתנועה (Aurora Background)
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        const color1 = `hsl(${(step * 10) % 360}, 65%, 15%)`;
        const color2 = `hsl(${(step * 10 + 120) % 360}, 70%, 12%)`;
        const color3 = `hsl(${(step * 10 + 240) % 360}, 60%, 10%)`;

        bgGrad.addColorStop(0, color1);
        bgGrad.addColorStop(0.5, color2);
        bgGrad.addColorStop(1, color3);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // 2. גלי אור זוהרים ברקע
        ctx.lineWidth = 30;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          for (let x = 0; x <= width; x += 30) {
            const y = height * 0.5 + Math.sin(x * 0.003 + step + i) * 80 + Math.cos(x * 0.002 - step) * 40;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const waveHue = (step * 15 + i * 80) % 360;
          ctx.strokeStyle = `hsla(${waveHue}, 80%, 55%, 0.15)`;
          ctx.shadowBlur = 25;
          ctx.shadowColor = `hsla(${waveHue}, 90%, 60%, 0.4)`;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // 3. חלקיקי שביל העכבר
        for (let i = trailParticles.length - 1; i >= 0; i--) {
          const p = trailParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          p.size *= 0.97;

          if (p.life <= 0 || p.size <= 0.3) {
            trailParticles.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, ${p.life})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, ${p.life})`;
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