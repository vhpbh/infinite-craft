/* ================= רקע: בועות ורודות חולמניות =================
   נרשם עצמאית ל-window.GameBackgrounds['bubbles-pink']. נטען דינמית ע"י האינדקס רק כשנבחר בחנות
   (ר' loadBackgroundScript ב-index.html) - כדי לא להכביד את קובץ האינדקס עצמו.
   כל רקע מחזיר מ-init() פונקציית teardown שמנקה את ה-canvas/requestAnimationFrame/מאזינים
   כדי שלא יישארו לולאות אנימציה רצות ברקע אחרי מעבר לרקע אחר. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['bubbles-pink'] = {
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

      const palette = ['rgba(255,182,225,ALPHA)', 'rgba(201,167,255,ALPHA)', 'rgba(255,214,236,ALPHA)', 'rgba(178,150,255,ALPHA)'];

      class Bubble {
        constructor() { this.reset(true); }
        reset(initial) {
          this.r = 8 + Math.random() * 34;
          this.x = Math.random() * width;
          this.y = initial ? Math.random() * height : height + this.r + Math.random() * 40;
          this.speed = 0.25 + Math.random() * 0.7;
          this.drift = (Math.random() - 0.5) * 0.5;
          this.wobble = Math.random() * Math.PI * 2;
          this.wobbleSpeed = 0.01 + Math.random() * 0.02;
          this.alpha = 0.15 + Math.random() * 0.35;
          this.color = palette[Math.floor(Math.random() * palette.length)];
        }
        update() {
          this.y -= this.speed;
          this.wobble += this.wobbleSpeed;
          this.x += Math.sin(this.wobble) * 0.4 + this.drift;
          if (this.y < -this.r - 20) this.reset(false);
        }
        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
          const grad = ctx.createRadialGradient(this.x - this.r * 0.3, this.y - this.r * 0.3, this.r * 0.1, this.x, this.y, this.r);
          grad.addColorStop(0, this.color.replace('ALPHA', String(this.alpha + 0.25)));
          grad.addColorStop(1, this.color.replace('ALPHA', String(this.alpha * 0.35)));
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = this.color.replace('ALPHA', String(this.alpha + 0.15));
          ctx.stroke();
        }
      }

      const count = Math.min(Math.floor((width * height) / 16000), 70);
      const bubbles = Array.from({ length: count }, () => new Bubble());

      let rafId = null;
      function animate() {
        ctx.clearRect(0, 0, width, height);
        bubbles.forEach(b => { b.update(); b.draw(); });
        rafId = requestAnimationFrame(animate);
      }
      animate();

      return function teardown() {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        canvas.remove();
      };
    }
  };
})();
