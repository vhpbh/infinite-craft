/* ================= רקע: תא טייס וקרב אוויר (Cockpit Dogfight) =================
   נרשם עצמאית ל-window.GameBackgrounds['cockpit-dogfight']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['cockpit-dogfight'] = {
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

      let shakeTimer = 0;
      let shakeIntensity = 0;

      function triggerHit() {
        shakeTimer = 18;
        shakeIntensity = 15;
      }

      const enemies = Array.from({ length: 3 }, () => ({
        x: (Math.random() - 0.5) * width * 0.8,
        y: (Math.random() - 0.5) * height * 0.4,
        z: Math.random() * 800 + 400,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 1.5,
        shootCooldown: Math.random() * 100 + 50
      }));

      const projectiles = [];
      const clouds = Array.from({ length: 15 }, () => ({
        x: (Math.random() - 0.5) * width * 2,
        y: Math.random() * height * 0.8 - height * 0.2,
        z: Math.random() * 1000 + 100,
        size: Math.random() * 80 + 50
      }));

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.02;

        const offsetX = (mouse.x - width / 2) * 0.25;
        const offsetY = (mouse.y - height / 2) * 0.25;

        let shakeX = 0, shakeY = 0;
        if (shakeTimer > 0) {
          shakeTimer--;
          shakeX = (Math.random() - 0.5) * shakeIntensity;
          shakeY = (Math.random() - 0.5) * shakeIntensity;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // שמיים
        const skyGrad = ctx.createLinearGradient(0, -height, 0, height * 2);
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.4, '#38bdf8');
        skyGrad.addColorStop(0.5, '#cbd5e1');
        skyGrad.addColorStop(0.55, '#334155');
        skyGrad.addColorStop(1, '#0f172a');

        ctx.save();
        ctx.translate(-offsetX, -offsetY);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(-width, -height, width * 3, height * 3);

        // עננים
        clouds.forEach(c => {
          c.z -= 4;
          if (c.z < 10) c.z = 1000;
          const scale = 300 / c.z;
          const cx = width / 2 + c.x * scale;
          const cy = height / 2 + c.y * scale;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(cx, cy, c.size * scale, 0, Math.PI * 2);
          ctx.fill();
        });

        // מטוסי אויב
        enemies.forEach(e => {
          e.z -= 3;
          e.x += e.vx;
          e.y += e.vy;

          if (e.z < 50) {
            e.z = 900;
            e.x = (Math.random() - 0.5) * width;
            e.y = (Math.random() - 0.5) * height * 0.5;
          }

          const scale = 350 / e.z;
          const ex = width / 2 + e.x * scale;
          const ey = height / 2 + e.y * scale;

          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.moveTo(ex, ey - 10 * scale);
          ctx.lineTo(ex + 25 * scale, ey + 15 * scale);
          ctx.lineTo(ex, ey + 8 * scale);
          ctx.lineTo(ex - 25 * scale, ey + 15 * scale);
          ctx.closePath();
          ctx.fill();

          e.shootCooldown--;
          if (e.shootCooldown <= 0 && e.z < 600) {
            projectiles.push({
              x: e.x, y: e.y, z: e.z,
              speed: 16
            });
            e.shootCooldown = Math.random() * 90 + 40;
          }
        });

        // קליעים שפוגעים במטוס
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.z -= p.speed;

          const scale = 350 / p.z;
          const px = width / 2 + p.x * scale;
          const py = height / 2 + p.y * scale;

          if (p.z <= 20) {
            triggerHit();
            projectiles.splice(i, 1);
            continue;
          }

          ctx.fillStyle = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ef4444';
          ctx.beginPath();
          ctx.arc(px, py, 4 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        ctx.restore();

        // כוונת HUD ומסגרת תא הטייס
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 25, 0, Math.PI * 2);
        ctx.moveTo(width / 2 - 40, height / 2);
        ctx.lineTo(width / 2 - 15, height / 2);
        ctx.moveTo(width / 2 + 15, height / 2);
        ctx.lineTo(width / 2 + 40, height / 2);
        ctx.moveTo(width / 2, height / 2 - 40);
        ctx.lineTo(width / 2, height / 2 - 15);
        ctx.moveTo(width / 2, height / 2 + 15);
        ctx.lineTo(width / 2, height / 2 + 40);
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(width * 0.15, height);
        ctx.lineTo(0, height);
        ctx.moveTo(width, 0);
        ctx.lineTo(width * 0.85, height);
        ctx.lineTo(width, height);
        ctx.fill();

        if (shakeTimer > 0) {
          ctx.fillStyle = `rgba(239, 68, 68, ${shakeTimer / 36})`;
          ctx.fillRect(0, 0, width, height);
        }

        ctx.restore();

        rafId = requestAnimationFrame(animate);
      }
      animate();

      return function teardown() {
        if (rafId) cancelAnimationFrame(rafId);
        window.removeEventListener('resize', resize);
        window.removeEventListener/* ================= רקע: תא טייס וקרב אוויר (Cockpit Dogfight - Upgraded) =================
   נרשם עצמאית ל-window.GameBackgrounds['cockpit-dogfight']. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['cockpit-dogfight'] = {
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

      let shakeTimer = 0;
      let shakeIntensity = 0;

      function triggerHit() {
        shakeTimer = 20;
        shakeIntensity = 18;
      }

      const enemies = Array.from({ length: 4 }, () => ({
        x: (Math.random() - 0.5) * width * 0.8,
        y: (Math.random() - 0.5) * height * 0.4,
        z: Math.random() * 800 + 400,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 2,
        shootCooldown: Math.random() * 100 + 50
      }));

      const projectiles = [];
      const clouds = Array.from({ length: 20 }, () => ({
        x: (Math.random() - 0.5) * width * 2,
        y: Math.random() * height * 0.8 - height * 0.2,
        z: Math.random() * 1000 + 100,
        size: Math.random() * 80 + 60
      }));

      let time = 0;
      let rafId = null;

      function animate() {
        time += 0.02;

        const offsetX = (mouse.x - width / 2) * 0.3;
        const offsetY = (mouse.y - height / 2) * 0.3;

        let shakeX = 0, shakeY = 0;
        if (shakeTimer > 0) {
          shakeTimer--;
          shakeX = (Math.random() - 0.5) * shakeIntensity;
          shakeY = (Math.random() - 0.5) * shakeIntensity;
        }

        ctx.save();
        ctx.translate(shakeX, shakeY);

        // --- שמיים ועולם חיצון ---
        const skyGrad = ctx.createLinearGradient(0, -height, 0, height * 2);
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(0.4, '#38bdf8');
        skyGrad.addColorStop(0.5, '#cbd5e1');
        skyGrad.addColorStop(0.55, '#1e293b');
        skyGrad.addColorStop(1, '#020617');

        ctx.save();
        ctx.translate(-offsetX, -offsetY);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(-width, -height, width * 3, height * 3);

        // עננים
        clouds.forEach(c => {
          c.z -= 5;
          if (c.z < 10) { c.z = 1000; c.x = (Math.random() - 0.5) * width * 2; }
          const scale = 300 / c.z;
          const cx = width / 2 + c.x * scale;
          const cy = height / 2 + c.y * scale;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.arc(cx, cy, c.size * scale, 0, Math.PI * 2);
          ctx.fill();
        });

        // מטוסי אויב
        let targetLocked = false;
        enemies.forEach(e => {
          e.z -= 4;
          e.x += e.vx;
          e.y += e.vy;

          if (e.z < 50) {
            e.z = 900;
            e.x = (Math.random() - 0.5) * width;
            e.y = (Math.random() - 0.5) * height * 0.5;
          }

          const scale = 400 / e.z;
          const ex = width / 2 + e.x * scale;
          const ey = height / 2 + e.y * scale;

          // בדיקת נעילת מטרה
          const distToCenter = Math.sqrt((ex - width/2)**2 + (ey - height/2)**2);
          if (distToCenter < 60) targetLocked = true;

          // ציור המטוס
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(ex, ey - 12 * scale);
          ctx.lineTo(ex + 30 * scale, ey + 10 * scale);
          ctx.lineTo(ex, ey + 5 * scale);
          ctx.lineTo(ex - 30 * scale, ey + 10 * scale);
          ctx.closePath();
          ctx.fill();

          // אש מנועים
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(ex - 10*scale, ey + 8*scale, 3*scale, 0, Math.PI*2);
          ctx.arc(ex + 10*scale, ey + 8*scale, 3*scale, 0, Math.PI*2);
          ctx.fill();

          e.shootCooldown--;
          if (e.shootCooldown <= 0 && e.z < 700) {
            projectiles.push({ x: e.x, y: e.y, z: e.z, speed: 20 });
            e.shootCooldown = Math.random() * 80 + 30;
          }
        });

        // קליעים וטילים
        for (let i = projectiles.length - 1; i >= 0; i--) {
          const p = projectiles[i];
          p.z -= p.speed;

          const scale = 350 / p.z;
          const px = width / 2 + p.x * scale;
          const py = height / 2 + p.y * scale;

          if (p.z <= 20) {
            triggerHit();
            projectiles.splice(i, 1);
            continue;
          }

          ctx.fillStyle = '#f59e0b';
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ef4444';
          ctx.beginPath();
          ctx.arc(px, py, 5 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore(); // חזרה מתזוזת עולם חיצון

        // --- HUD (תצוגה עילית) ---
        ctx.save();
        // תזוזה נגדית קלה כדי לתת תחושת הטיה
        ctx.translate(offsetX * 0.1, offsetY * 0.1); 
        
        ctx.strokeStyle = targetLocked ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.8)';
        ctx.lineWidth = 2;

        // כוונת מרכזית
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
        ctx.moveTo(width / 2 - 45, height / 2); ctx.lineTo(width / 2 - 20, height / 2);
        ctx.moveTo(width / 2 + 20, height / 2); ctx.lineTo(width / 2 + 45, height / 2);
        ctx.moveTo(width / 2, height / 2 - 45); ctx.lineTo(width / 2, height / 2 - 20);
        ctx.moveTo(width / 2, height / 2 + 20); ctx.lineTo(width / 2, height / 2 + 45);
        ctx.stroke();

        // סולמות גובה (Pitch Ladder)
        ctx.lineWidth = 1;
        for (let i = -3; i <= 3; i++) {
          if(i === 0) continue;
          let py = height / 2 + i * 50 + offsetY * 0.5;
          ctx.beginPath();
          ctx.moveTo(width / 2 - 80, py);
          ctx.lineTo(width / 2 - 40, py);
          ctx.lineTo(width / 2 - 40, py + (i>0?-10:10));
          ctx.moveTo(width / 2 + 80, py);
          ctx.lineTo(width / 2 + 40, py);
          ctx.lineTo(width / 2 + 40, py + (i>0?-10:10));
          ctx.stroke();
        }
        ctx.restore();

        // --- פנים תא הטייס (Dashboard) ---
        // פאנל תחתון
        const dashGrad = ctx.createLinearGradient(0, height * 0.7, 0, height);
        dashGrad.addColorStop(0, '#1e293b');
        dashGrad.addColorStop(1, '#020617');
        
        ctx.fillStyle = dashGrad;
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, height * 0.65);
        ctx.lineTo(width * 0.25, height * 0.8);
        ctx.lineTo(width * 0.75, height * 0.8);
        ctx.lineTo(width, height * 0.65);
        ctx.lineTo(width, height);
        ctx.fill();

        // קורות צד (מסגרת תא טייס)
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(width * 0.15, height * 0.65); ctx.lineTo(0, height * 0.65);
        ctx.moveTo(width, 0); ctx.lineTo(width * 0.85, height * 0.65); ctx.lineTo(width, height * 0.65);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 4;
        ctx.stroke();

        // מסכים דיגיטליים זוהרים בפאנל
        ctx.fillStyle = 'rgba(6, 78, 59, 0.8)'; // מסך ירוק
        ctx.fillRect(width * 0.3, height * 0.83, 100, 60);
        ctx.fillStyle = 'rgba(52, 211, 153, 0.4)';
        ctx.fillRect(width * 0.3 + 10, height * 0.83 + 10, 80, Math.sin(time)*15 + 20); // גרף זז

        ctx.fillStyle = 'rgba(127, 29, 29, 0.8)'; // מסך אדום (רדאר)
        ctx.fillRect(width * 0.7 - 100, height * 0.83, 100, 60);
        ctx.beginPath(); // קו רדאר
        ctx.arc(width * 0.7 - 50, height * 0.83 + 30, 25, time * 3, time * 3 + Math.PI/2);
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 3;
        ctx.stroke();

        if (shakeTimer > 0) {
          ctx.fillStyle = `rgba(239, 68, 68, ${shakeTimer / 40})`;
          ctx.fillRect(0, 0, width, height);
        }

        ctx.restore();
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
})();('mousemove', onMouseMove);
        canvas.remove();
      };
    }
  };
})();