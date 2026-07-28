/* ================= רקע: מעמקי הים החיים (Ocean Deep View - Upgraded) =================
   נרשם עצמאית ל-window.GameBackgrounds['ocean-deep-view']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['ocean-deep-view'] = {
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

      // להקות דגים
      const fishes = Array.from({ length: 20 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.8 + height * 0.1,
        speed: Math.random() * 2 + 1,
        dir: Math.random() < 0.5 ? 1 : -1,
        size: Math.random() * 8 + 6,
        color: `hsl(${Math.random() * 40 + 180}, 80%, 55%)`,
        tailAngle: 0
      }));

      // מדוזות
      const jellyfish = Array.from({ length: 4 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 15 + 10,
        speedY: -(Math.random() * 0.5 + 0.2),
        pulse: Math.random() * Math.PI * 2,
        hue: Math.random() * 40 + 260
      }));

      // בועות
      const bubbles = Array.from({ length: 40 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 3 + 1,
        speed: Math.random() * 1.5 + 0.5
      }));

      // פלנקטון זוהר (מגיב לעכבר)
      const plankton = Array.from({ length: 80 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        baseAlpha: Math.random() * 0.1 + 0.05
      }));

      // יצור נדיר 1: חתול ים ענק (Manta Ray) עדין
      const mantaRay = {
        x: -200, y: height * 0.4,
        speed: 0.8, flap: 0, size: 80
      };

      // יצור נדיר 2: דג חכאי (Anglerfish) מתחבא
      const anglerfish = {
        x: width + 100, y: height * 0.85,
        speed: -0.5, tailAngle: 0
      };

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.03;

        // רקע מעמקים חשוך ומסתורי
        const bg = ctx.createLinearGradient(0, 0, 0, height);
        bg.addColorStop(0, '#0369a1');
        bg.addColorStop(0.4, '#0f172a');
        bg.addColorStop(0.8, '#020617');
        bg.addColorStop(1, '#000000');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        // קרני אור עליונות
        ctx.fillStyle = 'rgba(224, 242, 254, 0.05)';
        for (let i = 0; i < 4; i++) {
          const rayX = (width / 4) * i + Math.sin(time + i) * 30;
          ctx.beginPath();
          ctx.moveTo(rayX, 0); ctx.lineTo(rayX + 150, height);
          ctx.lineTo(rayX - 80, height); ctx.closePath();
          ctx.fill();
        }

        // פלנקטון זוהר שמגיב לעכבר
        plankton.forEach(p => {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          let alpha = p.baseAlpha;
          
          if (dist < 150) {
            alpha += (1 - dist / 150) * 0.8; // מאיר כשמתקרבים
            p.x += dx * 0.01;
            p.y += dy * 0.01;
          }

          ctx.fillStyle = `rgba(167, 243, 208, ${alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // יצור נדיר: חתול ים (Manta Ray) מלכותי בתנועה גלית
        mantaRay.x += mantaRay.speed;
        mantaRay.flap += 0.04;
        if (mantaRay.x > width + 200) { mantaRay.x = -200; mantaRay.y = Math.random() * height * 0.6; }
        
        ctx.save();
        ctx.translate(mantaRay.x, mantaRay.y + Math.sin(time * 0.5) * 15);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // צבע כחול כהה
        ctx.beginPath();
        // גוף וכנפיים מעוצבים בקווים אלגנטיים
        ctx.moveTo(0, 0); // ראש
        const wingFlap = Math.sin(mantaRay.flap) * 30;
        ctx.quadraticCurveTo(-mantaRay.size*0.5, -wingFlap - 20, -mantaRay.size, -15); // כנף שמאל
        ctx.quadraticCurveTo(-mantaRay.size*1.2, 5, -mantaRay.size*1.5, 0); // זנב
        ctx.quadraticCurveTo(-mantaRay.size*1.2, -5, -mantaRay.size, 15); // חזרה לזנב
        ctx.quadraticCurveTo(-mantaRay.size*0.5, wingFlap + 20, 0, 0); // כנף ימין
        ctx.fill();
        ctx.restore();

        // יצור נדיר: דג חכאי (Anglerfish) חשוך עם פנס מאיר
        anglerfish.x += anglerfish.speed;
        anglerfish.tailAngle += 0.08;
        if (anglerfish.x < -100) { anglerfish.x = width + 100; anglerfish.y = height * 0.7 + Math.random() * 150; }

        ctx.save();
        ctx.translate(anglerfish.x, anglerfish.y);
        
        // גוף החכאי
        ctx.fillStyle = '#09090b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 25, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        // זנב
        ctx.beginPath();
        const aTailW = Math.sin(anglerfish.tailAngle) * 8;
        ctx.moveTo(25, 0); ctx.lineTo(40, -10 + aTailW); ctx.lineTo(40, 10 + aTailW);
        ctx.closePath();
        ctx.fill();
        
        // חכה ופנס
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-10, -15);
        ctx.quadraticCurveTo(-30, -30, -40, -5 + Math.sin(time)*5);
        ctx.stroke();

        // אור הפנס
        const bulbX = -40;
        const bulbY = -5 + Math.sin(time)*5;
        const distToAngler = Math.sqrt((mouse.x - (anglerfish.x + bulbX))**2 + (mouse.y - (anglerfish.y + bulbY))**2);
        
        ctx.beginPath();
        ctx.arc(bulbX, bulbY, 4, 0, Math.PI*2);
        ctx.fillStyle = distToAngler < 100 ? '#ef4444' : '#67e8f9'; // כועס (אדום) אם העכבר קרוב
        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();

        // דגים רגילים
        fishes.forEach(f => {
          f.x += f.speed * f.dir;
          f.tailAngle += 0.15;
          const dx = f.x - mouse.x;
          const dy = f.y - mouse.y;
          if (Math.sqrt(dx * dx + dy * dy) < 100) { f.dir = dx > 0 ? 1 : -1; f.x += f.dir * 4; }
          if (f.x > width + 30) f.x = -30;
          if (f.x < -30) f.x = width + 30;

          ctx.save();
          ctx.translate(f.x, f.y);
          if (f.dir < 0) ctx.scale(-1, 1);
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, f.size, f.size * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          const tailW = Math.sin(f.tailAngle) * 4;
          ctx.moveTo(-f.size, 0); ctx.lineTo(-f.size - 8, -5 + tailW); ctx.lineTo(-f.size - 8, 5 + tailW);
          ctx.fill();
          ctx.restore();
        });

        // בועות ומדוזות
        bubbles.forEach(b => {
          b.y -= b.speed;
          b.x += Math.sin(time + b.y * 0.05) * 0.5;
          if (b.y < -10) { b.y = height + 10; b.x = Math.random() * width; }
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
        });

        jellyfish.forEach(j => {
          j.y += j.speedY;
          j.pulse += 0.04;
          if (j.y < -50) j.y = height + 50;
          const pScale = Math.sin(j.pulse) * 0.15 + 1;
          ctx.save();
          ctx.translate(j.x, j.y);
          ctx.beginPath();
          ctx.arc(0, 0, j.radius * pScale, Math.PI, 0, false);
          ctx.fillStyle = `hsla(${j.hue}, 80%, 70%, 0.4)`;
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsla(${j.hue}, 90%, 60%, 0.5)`;
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.strokeStyle = `hsla(${j.hue}, 80%, 80%, 0.3)`;
          ctx.lineWidth = 1;
          for (let k = -2; k <= 2; k++) {
            ctx.beginPath();
            ctx.moveTo(k * (j.radius * 0.3), 0);
            const wave = Math.sin(time * 2 + k) * 5;
            ctx.quadraticCurveTo(k * 4 + wave, j.radius, k * 2 + wave, j.radius * 1.8);
            ctx.stroke();
          }
          ctx.restore();
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