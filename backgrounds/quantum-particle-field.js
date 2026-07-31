/* ================= רקע: שדה חלקיקים קוונטי (Quantum Particle Field) =================
   נרשם עצמאית ל-window.GameBackgrounds['quantum-particle-field']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['quantum-particle-field'] = {
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

      const mouse = { x: width / 2, y: height / 2, down: false };
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      function onMouseDown() { mouse.down = true; }
      function onMouseUp() { mouse.down = false; }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mouseup', onMouseUp);

      const NODE_COUNT = 70;
      const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1.5,
        hue: Math.random() * 360,
        phase: Math.random() * Math.PI * 2,
        // כל חלקיק "קופץ קוונטית" מדי פעם למיקום חדש קרוב
        nextJump: Math.random() * 200 + 100
      }));

      let time = 0;
      let rafId = null;
      let shockwave = 0; // אנרגיית פולס בלחיצה

      function animate() {
        time += 1;

        ctx.fillStyle = 'rgba(3, 2, 10, 0.22)';
        ctx.fillRect(0, 0, width, height);

        if (mouse.down) shockwave = Math.min(shockwave + 3, 60);
        if (shockwave > 0) {
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 60 - shockwave, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(190, 100%, 65%, ${shockwave / 100})`;
          ctx.lineWidth = 2;
          ctx.stroke();
          shockwave -= mouse.down ? 0 : 1.5;
        }

        // עדכון תנועה
        nodes.forEach(n => {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > width) n.vx *= -1;
          if (n.y < 0 || n.y > height) n.vy *= -1;

          // משיכה עדינה לכיוון העכבר, דחייה חזקה בלחיצה
          const dx = mouse.x - n.x;
          const dy = mouse.y - n.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (mouse.down && dist < 180) {
            n.x -= (dx / dist) * (180 - dist) * 0.08;
            n.y -= (dy / dist) * (180 - dist) * 0.08;
          } else if (dist < 150) {
            n.x += (dx / dist) * 0.15;
            n.y += (dy / dist) * 0.15;
          }

          // קפיצה קוונטית מדי פעם - טלפורט קטן עם הבזק
          n.nextJump -= 1;
          if (n.nextJump <= 0) {
            n.x += (Math.random() - 0.5) * 60;
            n.y += (Math.random() - 0.5) * 60;
            n.nextJump = Math.random() * 250 + 150;
            n.flash = 8;
          }
        });

        // קווי חיבור בין חלקיקים קרובים - "שזירה קוונטית"
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            const dx = a.x - b.x, dy = a.y - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 110) {
              const hue = (a.hue + b.hue) / 2;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${(1 - dist / 110) * 0.5})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
          }
        }

        // ציור הצמתים עצמם
        nodes.forEach(n => {
          const pulse = Math.sin(time * 0.05 + n.phase) * 0.5 + 0.5;
          const flashBoost = n.flash > 0 ? n.flash-- * 1.5 : 0;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius + pulse + flashBoost * 0.1, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${(n.hue + time * 0.3) % 360}, 95%, ${65 + flashBoost}%, 0.95)`;
          ctx.shadowBlur = 10 + flashBoost;
          ctx.shadowColor = `hsla(${n.hue}, 100%, 60%, 0.9)`;
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
        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mouseup', onMouseUp);
        canvas.remove();
      };
    }
  };
})();
