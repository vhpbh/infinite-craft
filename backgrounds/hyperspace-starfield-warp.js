/* ================= רקע: קפיצת היפר-חלל (Hyperspace Starfield Warp) =================
   נרשם עצמאית ל-window.GameBackgrounds['hyperspace-starfield-warp']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['hyperspace-starfield-warp'] = {
    init(container) {
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);
      const ctx = canvas.getContext('2d');

      let width, height, dpr, cx, cy;
      function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = container.clientWidth;
        height = container.clientHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = width / 2; cy = height / 2;
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

      const STAR_COUNT = 260;
      function makeStar() {
        return {
          x: (Math.random() - 0.5) * width,
          y: (Math.random() - 0.5) * height,
          z: Math.random() * width,
          hue: Math.random() < 0.15 ? Math.random() * 360 : 210 // רוב הכוכבים לבנים-כחלחלים, מיעוט צבעוני
        };
      }
      const stars = Array.from({ length: STAR_COUNT }, makeStar);

      // עננת נבולה - כמה כתמי צבע ענקיים ומטושטשים שנעים לאט
      const nebulae = Array.from({ length: 4 }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 250 + 200,
        hue: (i * 90) % 360,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.15 + 0.05
      }));

      let time = 0;
      let rafId = null;
      let warpSpeed = 3;

      function animate() {
        time += 0.008;

        // ככל שהעכבר רחוק מהמרכז, מהירות הקפיצה עולה
        const distFromCenter = Math.hypot(mouse.x - cx, mouse.y - cy) / Math.max(cx, cy);
        const targetSpeed = 2 + distFromCenter * 14;
        warpSpeed += (targetSpeed - warpSpeed) * 0.05;

        ctx.fillStyle = 'rgba(2, 2, 8, 1)';
        ctx.fillRect(0, 0, width, height);

        // ציור נבולות מטושטשות ברקע העמוק
        nebulae.forEach(n => {
          n.driftAngle += n.driftSpeed * 0.01;
          const nx = n.x + Math.cos(n.driftAngle) * 20;
          const ny = n.y + Math.sin(n.driftAngle) * 20;
          const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, n.radius);
          grad.addColorStop(0, `hsla(${(n.hue + time * 5) % 360}, 80%, 40%, 0.12)`);
          grad.addColorStop(1, 'transparent');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);
        });

        // מרכז הקפיצה עוקב אחרי העכבר בעדינות
        cx += (mouse.x - cx) * 0.02;
        cy += (mouse.y - cy) * 0.02;

        stars.forEach(s => {
          const prevZ = s.z;
          s.z -= warpSpeed * 2;
          if (s.z <= 1) {
            Object.assign(s, makeStar());
            s.z = width;
            return;
          }

          const k = 128 / s.z;
          const px = s.x * k + cx;
          const py = s.y * k + cy;

          const prevK = 128 / prevZ;
          const ppx = s.x * prevK + cx;
          const ppy = s.y * prevK + cy;

          if (px < 0 || px > width || py < 0 || py > height) return;

          const size = Math.max(0.5, (1 - s.z / width) * 3);
          const trail = warpSpeed > 8;

          ctx.beginPath();
          if (trail) {
            ctx.moveTo(ppx, ppy);
            ctx.lineTo(px, py);
            ctx.strokeStyle = `hsla(${s.hue}, 90%, 75%, ${Math.min(1, (1 - s.z / width) * 1.2)})`;
            ctx.lineWidth = size;
            ctx.stroke();
          } else {
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${s.hue}, 90%, 80%, ${Math.min(1, (1 - s.z / width) * 1.2)})`;
            ctx.fill();
          }
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
