/* ================= רקע: סופת גבישים מתנפצים (Crystal Shatter Storm) =================
   נרשם עצמאית ל-window.GameBackgrounds['crystal-shatter-storm']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['crystal-shatter-storm'] = {
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
      let lastMouseX = mouse.x, lastMouseY = mouse.y, mouseSpeed = 0;
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      window.addEventListener('mousemove', onMouseMove);

      class Shard {
        constructor() { this.reset(); }
        reset() {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 260 + 60;
          this.x = mouse.x + Math.cos(angle) * dist;
          this.y = mouse.y + Math.sin(angle) * dist;
          this.orbitAngle = angle;
          this.orbitDist = dist;
          this.orbitSpeed = (Math.random() * 0.012 + 0.004) * (Math.random() < 0.5 ? 1 : -1);
          this.rotation = Math.random() * Math.PI * 2;
          this.rotSpeed = (Math.random() - 0.5) * 0.06;
          this.size = Math.random() * 10 + 6;
          this.sides = 3 + Math.floor(Math.random() * 3); // מצולעים חדים: 3-5 צלעות
          this.hue = 190 + Math.random() * 140;
          this.flicker = Math.random() * Math.PI * 2;
        }
        update() {
          this.orbitAngle += this.orbitSpeed + mouseSpeed * 0.0006;
          this.orbitDist += Math.sin(this.orbitAngle * 3) * 0.3;
          this.x = mouse.x + Math.cos(this.orbitAngle) * this.orbitDist;
          this.y = mouse.y + Math.sin(this.orbitAngle) * this.orbitDist;
          this.rotation += this.rotSpeed;
          this.flicker += 0.08;
        }
        draw() {
          const glow = Math.sin(this.flicker) * 0.3 + 0.7;
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation);
          ctx.beginPath();
          for (let i = 0; i < this.sides; i++) {
            const a = (i / this.sides) * Math.PI * 2;
            const r = i % 2 === 0 ? this.size : this.size * 0.5;
            const px = Math.cos(a) * r;
            const py = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.closePath();
          const grad = ctx.createLinearGradient(-this.size, -this.size, this.size, this.size);
          grad.addColorStop(0, `hsla(${this.hue}, 90%, 75%, ${glow})`);
          grad.addColorStop(1, `hsla(${this.hue + 40}, 90%, 55%, ${glow * 0.6})`);
          ctx.fillStyle = grad;
          ctx.shadowBlur = 14 * glow;
          ctx.shadowColor = `hsla(${this.hue}, 100%, 65%, 0.9)`;
          ctx.fill();
          ctx.strokeStyle = `hsla(${this.hue}, 100%, 90%, ${glow * 0.8})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.restore();
        }
      }

      const shards = Array.from({ length: 60 }, () => new Shard());

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.01;
        mouseSpeed = Math.hypot(mouse.x - lastMouseX, mouse.y - lastMouseY);
        lastMouseX = mouse.x; lastMouseY = mouse.y;

        ctx.fillStyle = 'rgba(6, 4, 16, 0.22)';
        ctx.fillRect(0, 0, width, height);

        // הילה מרכזית קריסטלית סביב העכבר
        const coreGrad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90);
        coreGrad.addColorStop(0, 'rgba(200, 240, 255, 0.25)');
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.fillRect(0, 0, width, height);

        // קווי חיבור דקים בין שברים סמוכים - תחושת מבנה גבישי
        for (let i = 0; i < shards.length; i++) {
          const a = shards[i];
          for (let j = i + 1; j < shards.length; j++) {
            const b = shards[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 55) {
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.strokeStyle = `hsla(${(a.hue + b.hue) / 2}, 90%, 75%, ${(1 - d / 55) * 0.25})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }

        shards.forEach(s => { s.update(); s.draw(); });

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
