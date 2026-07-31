/* ================= רקע: סופת ברקים חשמלית (Electric Storm Arcs) =================
   נרשם עצמאית ל-window.GameBackgrounds['electric-storm-arcs']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['electric-storm-arcs'] = {
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

      // עוגני ברק - נקודות קבועות שממתינות "להיטען" ולירות קשת לעכבר
      const anchors = Array.from({ length: 9 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        cooldown: Math.random() * 100
      }));

      // מבנה נתונים לקשתות ברק פעילות
      let bolts = [];

      function buildBoltPath(x1, y1, x2, y2, roughness) {
        const points = [{ x: x1, y: y1 }];
        const segments = 10;
        for (let i = 1; i < segments; i++) {
          const t = i / segments;
          const mx = x1 + (x2 - x1) * t;
          const my = y1 + (y2 - y1) * t;
          const offset = (Math.random() - 0.5) * roughness * (1 - Math.abs(t - 0.5) * 1.3);
          const nx = -(y2 - y1), ny = (x2 - x1);
          const len = Math.sqrt(nx * nx + ny * ny) || 1;
          points.push({ x: mx + (nx / len) * offset, y: my + (ny / len) * offset });
        }
        points.push({ x: x2, y: y2 });
        return points;
      }

      function spawnBolt(anchor) {
        const path = buildBoltPath(anchor.x, anchor.y, mouse.x, mouse.y, 70);
        bolts.push({ path, life: 1, hue: 190 + Math.random() * 80 });
        // הסתעפויות קטנות לאורך הקשת הראשית
        for (let k = 0; k < 2; k++) {
          const idx = 2 + Math.floor(Math.random() * (path.length - 4));
          const branchEnd = {
            x: path[idx].x + (Math.random() - 0.5) * 120,
            y: path[idx].y + (Math.random() - 0.5) * 120
          };
          const branchPath = buildBoltPath(path[idx].x, path[idx].y, branchEnd.x, branchEnd.y, 30);
          bolts.push({ path: branchPath, life: 0.7, hue: 190 + Math.random() * 80 });
        }
      }

      let time = 0;
      let rafId = null;

      function animate() {
        time += 1;

        ctx.fillStyle = 'rgba(4, 4, 10, 0.25)';
        ctx.fillRect(0, 0, width, height);

        // רשת עדינה ברקע שמהבהבת חלש
        ctx.strokeStyle = 'rgba(80, 100, 160, 0.05)';
        ctx.lineWidth = 1;
        const gridSize = 60;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }

        anchors.forEach(a => {
          a.cooldown -= 1;
          const dist = Math.hypot(a.x - mouse.x, a.y - mouse.y);
          if (a.cooldown <= 0 && dist < width * 0.6) {
            spawnBolt(a);
            a.cooldown = Math.random() * 90 + 40;
          }
          // ציור עוגן זוהר קטן
          const pulse = Math.sin(time * 0.05 + a.x) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(a.x, a.y, 3 + pulse * 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(140, 200, 255, 0.6)';
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(140, 200, 255, 0.8)';
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // ציור וכיבוי קשתות ברק
        bolts.forEach(b => {
          ctx.beginPath();
          ctx.moveTo(b.path[0].x, b.path[0].y);
          for (let i = 1; i < b.path.length; i++) ctx.lineTo(b.path[i].x, b.path[i].y);
          ctx.strokeStyle = `hsla(${b.hue}, 100%, 75%, ${b.life})`;
          ctx.lineWidth = 2.5 * b.life;
          ctx.shadowBlur = 15 * b.life;
          ctx.shadowColor = `hsla(${b.hue}, 100%, 70%, 0.9)`;
          ctx.stroke();
          ctx.shadowBlur = 0;
          b.life -= 0.12;
        });
        bolts = bolts.filter(b => b.life > 0);

        // זוהר סביב סמן העכבר - נקודת ההתכנסות
        const glow = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 40);
        glow.addColorStop(0, 'rgba(180, 220, 255, 0.5)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 40, 0, Math.PI * 2);
        ctx.fill();

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
