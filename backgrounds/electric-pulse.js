/* ================= רקע: פעימות חשמליות (Electric Pulse) =================
   נרשם עצמאית ל-window.GameBackgrounds['electric-pulse'].
   יוצר גלי פעימה מעגליים המתרחבים במרכז ובאזור סמן העכבר. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['electric-pulse'] = {
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

      const pulses = [];
      const mouse = { x: width / 2, y: height / 2 };

      function onMouseMove(e) {
        const rect = container.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }
      window.addEventListener('mousemove', onMouseMove);

      class Pulse {
        constructor(x, y) {
          this.x = x;
          this.y = y;
          this.radius = 1;
          this.maxRadius = Math.random() * 150 + 100;
          this.speed = Math.random() * 1.5 + 0.8;
          this.alpha = 1;
        }
        update() {
          this.radius += this.speed;
          this.alpha = 1 - (this.radius / this.maxRadius);
        }
        draw() {
          if (this.alpha <= 0) return;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(56, 189, 248, ${this.alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      let frame = 0;
      let rafId = null;

      function animate() {
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);

        frame++;
        if (frame % 25 === 0) {
          pulses.push(new Pulse(mouse.x, mouse.y));
          pulses.push(new Pulse(width / 2, height / 2));
        }

        for (let i = pulses.length - 1; i >= 0; i--) {
          pulses[i].update();
          pulses[i].draw();
          if (pulses[i].alpha <= 0) {
            pulses.splice(i, 1);
          }
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