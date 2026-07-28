/* ================= רקע: קבוצות כוכבים זורמות (Constellation Flow) =================
   נרשם עצמאית ל-window.GameBackgrounds['constellation-flow']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['constellation-flow'] = {
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

      const mouse = { x: null, y: null, radius: 160 };
      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      function onMouseLeave() { mouse.x = null; mouse.y = null; }
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseleave', onMouseLeave);

      class Node {
        constructor() {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.size = Math.random() * 1.5 + 0.8;
          this.vx = (Math.random() - 0.5) * 0.4;
          this.vy = (Math.random() - 0.5) * 0.4;
          this.alpha = Math.random() * 0.5 + 0.3;
        }
        update() {
          this.x += this.vx;
          this.y += this.vy;

          if (this.x < 0) this.x = width;
          if (this.x > width) this.x = 0;
          if (this.y < 0) this.y = height;
          if (this.y > height) this.y = 0;
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(199, 210, 254, ${this.alpha})`;
          ctx.fill();
        }
      }

      const count = Math.min(Math.floor((width * height) / 10000), 90);
      const nodes = Array.from({ length: count }, () => new Node());

      let rafId = null;
      function animate() {
        // רקע מדורג כהה ועדין
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.75);
        grad.addColorStop(0, '#111827');
        grad.addColorStop(1, '#030712');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        for (let i = 0; i < nodes.length; i++) {
          nodes[i].update();
          nodes[i].draw();

          // חיבורים בין נקודות קרובות
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.strokeStyle = `rgba(165, 180, 252, ${(1 - dist / 100) * 0.25})`;
              ctx.lineWidth = 0.4;
              ctx.stroke();
            }
          }

          // אינטראקציה עדינה עם העכבר
          if (mouse.x !== null && mouse.y !== null) {
            const dx = nodes[i].x - mouse.x;
            const dy = nodes[i].y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < mouse.radius) {
              const factor = (1 - dist / mouse.radius);
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = `rgba(224, 231, 255, ${factor * 0.5})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }

        rafId = requestAnimationFrame(animate);
      }
      animate();

      return function teardown() {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseleave', onMouseLeave);
        canvas.remove();
      };
    }
  };
})();