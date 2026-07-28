/* ================= רקע: רשת סייבר תלת-ממדית (3D Terrain Grid) =================
   נרשם עצמאית ל-window.GameBackgrounds['cyber-matrix-grid'].
   משתמש בהטלה פרספקטיבית וחישובי טריגונומטריה ליצירת גלי שטח 3D. */
(function () {
  window.GameBackgrounds = window.GameBackgrounds || {};

  window.GameBackgrounds['cyber-matrix-grid'] = {
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

      let time = 0;
      let rafId = null;

      // פרמטרים של הגריד
      const cols = 35;
      const rows = 25;
      const spacing = 40;

      // פונקציית הטלה מ-3D ל-2D
      function project(x, y, z) {
        const fov = 300;
        const scale = fov / (fov + z);
        const x2d = (x * scale) + width / 2;
        const y2d = (y * scale) + height / 2 + 80; // הדמיית זווית מנגד
        return { x: x2d, y: y2d, scale };
      }

      function animate() {
        // רקע כהה עמוק
        ctx.fillStyle = '#030712';
        ctx.fillRect(0, 0, width, height);

        time += 0.03;

        const gridPoints = [];

        // חישוב מיקומי הנקודות ב-3D
        for (let r = 0; r < rows; r++) {
          gridPoints[r] = [];
          for (let c = 0; c < cols; c++) {
            const x = (c - cols / 2) * spacing;
            const z = (r + 1) * spacing - (time * 20 % spacing); // תנועה רציפה קדימה
            
            // חישוב גובה הנישאת (Wave) לפי מרחק וזמן
            const distFromCenter = Math.sqrt(x * x + z * z);
            const y = Math.sin(distFromCenter * 0.01 - time) * 35 +
                      Math.cos(c * 0.4 + time) * 15;

            gridPoints[r][c] = project(x, y, z);
          }
        }

        // ציור הקווים
        ctx.lineWidth = 1;

        for (let r = 0; r < rows - 1; r++) {
          for (let c = 0; c < cols - 1; c++) {
            const p1 = gridPoints[r][c];
            const p2 = gridPoints[r][c + 1];
            const p3 = gridPoints[r + 1][c];

            // שקיפות לפי עומק ה-Z
            const alpha = Math.max(0, 1 - (r / rows));
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.6})`;

            // קווים אופקיים
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // קווים אנכיים
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.stroke();
          }
        }

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