/* ================= רקע: גלי אורורה נוזליים (Aurora Liquid Waves) =================
   נרשם עצמאית ל-window.GameBackgrounds['aurora-liquid-waves']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['aurora-liquid-waves'] = {
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

      const mouse = { x: width / 2, y: height / 2, vx: 0, vy: 0 };
      let lastMouseX = mouse.x, lastMouseY = mouse.y;
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      window.addEventListener('mousemove', onMouseMove);

      // כמה "רצועות" אורורה, כל אחת עם שכבת גלים משלה
      const bands = Array.from({ length: 6 }, (_, i) => ({
        baseY: (i + 0.5) / 6,
        amp: Math.random() * 60 + 40,
        freq: Math.random() * 0.015 + 0.006,
        speed: Math.random() * 0.4 + 0.2,
        thickness: Math.random() * 50 + 30,
        hueBase: (i * 55) % 360,
        phase: Math.random() * Math.PI * 2
      }));

      // חלקיקי אבק זוהר שצפים בין הגלים
      const dust = Array.from({ length: 90 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vy: -(Math.random() * 0.3 + 0.1),
        size: Math.random() * 2 + 0.5,
        twinkle: Math.random() * Math.PI * 2
      }));

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.01;
        mouse.vx = (mouse.x - lastMouseX) * 0.5;
        mouse.vy = (mouse.y - lastMouseY) * 0.5;
        lastMouseX = mouse.x; lastMouseY = mouse.y;

        // רקע ליל קוטבי עמוק עם דעיכה עדינה ליצירת שובל נוזלי
        ctx.fillStyle = 'rgba(2, 4, 14, 0.14)';
        ctx.fillRect(0, 0, width, height);

        // כוכבים סטטיים עדינים ברקע
        ctx.fillStyle = 'rgba(255,255,255,0.5)';

        bands.forEach((b, bi) => {
          ctx.beginPath();
          const centerY = b.baseY * height;
          const mouseInfluence = 1 - Math.min(1, Math.abs(mouse.y - centerY) / (height * 0.6));

          for (let x = -10; x <= width + 10; x += 8) {
            const distortion = Math.sin((x - mouse.x) * 0.006) * mouseInfluence * 40;
            const y = centerY
              + Math.sin(x * b.freq + time * b.speed + b.phase) * b.amp
              + Math.sin(x * b.freq * 2.3 + time * b.speed * 1.7) * b.amp * 0.3
              + distortion;
            if (x === -10) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }

          const hue = (b.hueBase + time * 15 + mouse.x * 0.05) % 360;
          const grad = ctx.createLinearGradient(0, centerY - b.thickness, 0, centerY + b.thickness);
          grad.addColorStop(0, `hsla(${hue}, 90%, 60%, 0)`);
          grad.addColorStop(0.5, `hsla(${hue}, 95%, 65%, ${0.35 + mouseInfluence * 0.25})`);
          grad.addColorStop(1, `hsla(${(hue + 40) % 360}, 90%, 55%, 0)`);

          ctx.lineWidth = b.thickness;
          ctx.strokeStyle = grad;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsla(${hue}, 100%, 60%, 0.4)`;
          ctx.stroke();
          ctx.shadowBlur = 0;
        });

        // אבק זוהר צף כלפי מעלה, נמשך קלות לכיוון תנועת העכבר
        dust.forEach(d => {
          d.y += d.vy;
          d.x += mouse.vx * 0.02;
          d.twinkle += 0.05;
          if (d.y < -10) { d.y = height + 10; d.x = Math.random() * width; }
          if (d.x < -10) d.x = width + 10;
          if (d.x > width + 10) d.x = -10;

          const alpha = (Math.sin(d.twinkle) * 0.4 + 0.6) * 0.7;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(220, 240, 255, ${alpha})`;
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
