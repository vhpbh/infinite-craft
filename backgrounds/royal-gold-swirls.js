/* ================= רקע: ספירלות זהב מלכותיות (Royal Gold Swirls) =================
   נרשם עצמאית ל-window.GameBackgrounds['royal-gold-swirls']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['royal-gold-swirls'] = {
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

      class GoldParticle {
        constructor() {
          this.reset(true);
        }

        reset(initial = false) {
          // יצירה בקצוות המסך כשהם מתחדשים
          if (initial) {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
          } else {
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { this.x = Math.random() * width; this.y = -10; }
            else if (edge === 1) { this.x = width + 10; this.y = Math.random() * height; }
            else if (edge === 2) { this.x = Math.random() * width; this.y = height + 10; }
            else { this.x = -10; this.y = Math.random() * height; }
          }

          this.angle = Math.random() * Math.PI * 2;
          this.orbitRadius = Math.random() * 40 + 10;
          this.speed = Math.random() * 0.03 + 0.01;
          this.size = Math.random() * 2.5 + 1;
          this.alpha = 1;
          this.fadeSpeed = Math.random() * 0.02 + 0.01;
        }

        update() {
          this.angle += this.speed;

          // תנועה מתמדת לכיוון העכבר
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          this.x += (dx / dist) * 2.2 + Math.cos(this.angle) * 0.8;
          this.y += (dy / dist) * 2.2 + Math.sin(this.angle) * 0.8;

          // דעיכה והעלמות כשהחלקיק מגיע למרכז
          if (dist < 35) {
            this.alpha -= 0.08;
          }

          if (this.alpha <= 0) {
            this.reset(false);
          }
        }

        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(253, 224, 71, ${Math.max(0, this.alpha)})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(234, 179, 8, 0.9)';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // כמות חלקיקים עשירה לרציפות מלאה
      const particles = Array.from({ length: 100 }, () => new GoldParticle());
      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.015;

        // רקע מלכותי עמוק
        const bgGrad = ctx.createRadialGradient(
          mouse.x, mouse.y, 20,
          width / 2, height / 2, Math.max(width, height)
        );
        bgGrad.addColorStop(0, '#1e1b4b');
        bgGrad.addColorStop(0.4, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // טבעות אור פועמות במרכז העכבר
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 3; i++) {
          const r = 30 + i * 25 + Math.sin(time * 2 + i) * 8;
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(234, 179, 8, ${0.25 - i * 0.06})`;
          ctx.stroke();
        }

        particles.forEach(p => {
          p.update();
          p.draw();
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