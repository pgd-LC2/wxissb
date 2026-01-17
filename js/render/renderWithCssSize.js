(() => {
  "use strict";

  const GameApp = window.GameApp = window.GameApp || {};
  const { ctx } = GameApp.DOM;
  const { TAU, clamp, rand, colorWithAlpha } = GameApp.Deps.utils;
  const runtime = GameApp.Runtime;

  function renderWithCssSize(g, t, w, h){
    // camera shake (only if shake is enabled)
    let camX = g.camera.x;
    let camY = g.camera.y;
    if (runtime.shakeEnabled && t < g.camera.shakeEnd) {
      const amp = g.camera.shakeAmp;
      camX += rand(-amp, amp);
      camY += rand(-amp, amp);
    }

    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = "#000";
    ctx.fillRect(0,0,w,h);

    // grid
    const gridSize = 200;
    const worldLeft = camX - w/2;
    const worldRight = camX + w/2;
    const worldTop = camY - h/2;
    const worldBottom = camY + h/2;

    const gx0 = Math.floor(worldLeft / gridSize) - 1;
    const gx1 = Math.floor(worldRight / gridSize) + 1;
    const gy0 = Math.floor(worldTop / gridSize) - 1;
    const gy1 = Math.floor(worldBottom / gridSize) + 1;

    ctx.fillStyle = "rgba(255,255,255,0.08)";
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        if (((gx + gy) & 1) === 0) {
          const x = gx * gridSize - camX + w/2;
          const y = gy * gridSize - camY + h/2;
          ctx.fillRect(x - gridSize/2, y - gridSize/2, gridSize, gridSize);
        }
      }
    }

    const sx = (x) => (x - camX + w/2);
    const sy = (y) => (y - camY + h/2);

    // black holes
    for (let i = 0; i < g.blackHoles.length; i++) {
      const bh = g.blackHoles[i];
      const alpha = (t > bh.end) ? clamp(1 - (t - bh.end)/0.3, 0, 1) : 1;
      ctx.beginPath();
      ctx.arc(sx(bh.x), sy(bh.y), bh.radius, 0, TAU);
      ctx.fillStyle = `rgba(168,85,247,${0.35*alpha})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(168,85,247,${0.8*alpha})`;
      ctx.stroke();
    }

    // poison clouds
    for (let i = 0; i < g.poisonClouds.length; i++) {
      const pc = g.poisonClouds[i];
      let alpha = 0.4;
      if (t > pc.fadeStart) alpha *= clamp(1 - (t - pc.fadeStart)/(pc.fadeEnd - pc.fadeStart), 0, 1);
      ctx.beginPath();
      ctx.arc(sx(pc.x), sy(pc.y), pc.radius, 0, TAU);
      ctx.fillStyle = `rgba(52,199,89,${alpha})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(52,199,89,${alpha})`;
      ctx.stroke();
    }

    // fire trails
    for (let i = 0; i < g.fireTrails.length; i++) {
      const ft = g.fireTrails[i];
      const life = clamp((ft.die - t) / 1.5, 0, 1);
      ctx.beginPath();
      ctx.arc(sx(ft.x), sy(ft.y), ft.r * (0.5 + 0.5*life), 0, TAU);
      ctx.fillStyle = `rgba(255,149,0,${0.55*life})`;
      ctx.fill();
    }

    // mines
    for (let i = 0; i < g.mines.length; i++) {
      const m = g.mines[i];
      const pulse = 0.5 + 0.5*Math.sin((t - m.born)*8);
      ctx.beginPath();
      ctx.arc(sx(m.x), sy(m.y), m.r, 0, TAU);
      ctx.fillStyle = `rgba(255,149,0,${0.65 + 0.2*pulse})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255,59,48,0.9)";
      ctx.stroke();
    }

    // exp orbs
    for (let i = 0; i < g.expOrbs.length; i++) {
      const o = g.expOrbs[i];
      ctx.beginPath();
      ctx.arc(sx(o.x), sy(o.y), o.r, 0, TAU);
      ctx.fillStyle = "#34c759";
      ctx.fill();
    }

    // enemies
    for (let i = 0; i < g.enemies.length; i++) {
      const e = g.enemies[i];
      ctx.save();
      ctx.translate(sx(e.x), sy(e.y));
      ctx.rotate(e.rot);

      // base
      ctx.fillStyle = e.color;
      ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);

      // hit flash overlay (mainly for blade hits)
      if (e.hitFlashEnd && t < e.hitFlashEnd) {
        const a = clamp((e.hitFlashEnd - t) / 0.08, 0, 1);
        ctx.fillStyle = `rgba(255,255,255,${0.85 * a})`;
        ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h);
      }

      ctx.restore();
    }

    // orbitals
    for (let i = 0; i < g.orbitals.length; i++) {
      const o = g.orbitals[i];
      if (o.type === "shield") {
        ctx.beginPath();
        ctx.arc(sx(o.x), sy(o.y), o.r, 0, TAU);
        ctx.fillStyle = "rgba(0,122,255,0.55)";
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(0,215,255,0.95)";
        ctx.stroke();
      } else {
        ctx.save();
        ctx.translate(sx(o.x), sy(o.y));
        ctx.rotate(o.rot);
        ctx.shadowBlur = 14;
        ctx.shadowColor = "rgba(255,255,255,0.55)";
        const bw = o.w, bh = o.h;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fillRect(-bw/2, -bh/2, bw, bh);
        ctx.beginPath();
        ctx.moveTo(bw/2, -bh/2);
        ctx.lineTo(bw/2 + bh*1.2, 0);
        ctx.lineTo(bw/2, bh/2);
        ctx.closePath();
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.fill();
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(-bw/2 - 2, -bh/2, 4, bh);
        ctx.restore();
      }
    }

    // drones
    for (let i = 0; i < g.drones.length; i++) {
      const d = g.drones[i];
      ctx.fillStyle = "rgba(180,180,180,0.95)";
      ctx.fillRect(sx(d.x) - 10, sy(d.y) - 10, 20, 20);
    }

    // ghosts
    for (let i = 0; i < g.ghosts.length; i++) {
      const gh = g.ghosts[i];
      ctx.beginPath();
      ctx.arc(sx(gh.x), sy(gh.y), 15, 0, TAU);
      ctx.fillStyle = "rgba(168,85,247,0.45)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(168,85,247,0.85)";
      ctx.stroke();
    }

    // bullets
    for (let i = 0; i < g.bullets.length; i++) {
      const b = g.bullets[i];
      ctx.save();
      ctx.translate(sx(b.x), sy(b.y));
      ctx.rotate(b.rot);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillRect(-1, 2, 2, 10);
      ctx.fillStyle = b.droneBullet ? "rgba(255,149,0,0.95)" : "rgba(255,214,10,0.95)";
      ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h);
      ctx.restore();
    }

    // particles (sparks)
    for (let i = 0; i < g.particles.length; i++) {
      const p = g.particles[i];
      const life = clamp((t - p.born) / (p.die - p.born), 0, 1);
      const inv = 1 - life;
      ctx.strokeStyle = colorWithAlpha(p.color, inv);
      ctx.lineWidth = p.r;
      ctx.beginPath();
      ctx.moveTo(sx(p.px), sy(p.py));
      ctx.lineTo(sx(p.x), sy(p.y));
      ctx.stroke();
    }

    // meteor warnings
    for (let i = 0; i < g.warnings.length; i++) {
      const w0 = g.warnings[i];
      const alpha = clamp(1 - (t - w0.born)/1.0, 0, 1);
      ctx.beginPath();
      ctx.arc(sx(w0.x), sy(w0.y), 50, 0, TAU);
      ctx.fillStyle = `rgba(255,59,48,${0.20 + 0.15*alpha})`;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255,59,48,${0.65 + 0.25*alpha})`;
      ctx.stroke();
    }

    // player
    ctx.fillStyle = g.player.color;
    ctx.fillRect(sx(g.player.x) - 15, sy(g.player.y) - 15, 30, 30);

    // effects
    for (let i = 0; i < g.effects.length; i++) {
      const ef = g.effects[i];
      const life = clamp((t - ef.start) / (ef.end - ef.start), 0, 1);
      const inv = 1 - life;

      if (ef.kind === "hit") {
        ctx.beginPath();
        ctx.arc(sx(ef.x), sy(ef.y), 3 * inv, 0, TAU);
        ctx.fillStyle = `rgba(255,214,10,${inv})`;
        ctx.fill();
      } else if (ef.kind === "explosion") {
        ctx.beginPath();
        ctx.arc(sx(ef.x), sy(ef.y), ef.r, 0, TAU);
        ctx.fillStyle = `rgba(255,149,0,${0.5*inv})`;
        ctx.fill();
      } else if (ef.kind === "damageText") {
        const y = ef.y - life * 30;
        const fs = ef.isLucky ? 32 : (ef.isCrit ? 24 : 16);
        ctx.font = `bold ${fs}px sans-serif`;
        const col = ef.isLucky ? "#a855f7" : (ef.isCrit ? "#ffd60a" : "#ffffff");
        ctx.fillStyle = colorWithAlpha(col, inv);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(ef.val), sx(ef.x), sy(y));
      } else if (ef.kind === "label") {
        const y = ef.y - life * 30;
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = colorWithAlpha(ef.color || "#ffffff", inv);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(ef.text, sx(ef.x), sy(y));
      } else if (ef.kind === "phoenix") {
        const scale = 1 + life;
        ctx.beginPath();
        ctx.arc(sx(ef.x), sy(ef.y), 100 * scale, 0, TAU);
        ctx.fillStyle = `rgba(255,149,0,${0.35*inv})`;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(255,149,0,${0.85*inv})`;
        ctx.stroke();
      } else if (ef.kind === "line") {
        ctx.beginPath();
        ctx.moveTo(sx(ef.x1), sy(ef.y1));
        ctx.lineTo(sx(ef.x2), sy(ef.y2));
        ctx.strokeStyle = `rgba(0,215,255,${inv})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (ef.kind === "muzzle") {
        ctx.save();
        ctx.translate(sx(ef.x), sy(ef.y));
        ctx.rotate(ef.ang || 0);
        const s = 26 * inv;
        ctx.fillStyle = `rgba(255,214,10,${0.85 * inv})`;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(s, -s * 0.28);
        ctx.lineTo(s, s * 0.28);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (ef.kind === "slash") {
        ctx.save();
        ctx.translate(sx(ef.x), sy(ef.y));
        ctx.rotate(ef.ang || 0);
        ctx.strokeStyle = `rgba(255,255,255,${0.80 * inv})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 22, -0.65, 0.65);
        ctx.stroke();
        ctx.restore();
      } else if (ef.kind === "enemyHit") {
        ctx.beginPath();
        ctx.arc(sx(ef.x), sy(ef.y), 16 * inv, 0, TAU);
        ctx.strokeStyle = `rgba(255,255,255,${0.45*inv})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // screen flash
    if (g.screenFlash && t < g.screenFlash.end) {
      const a = clamp(1 - (t - g.screenFlash.start) / (g.screenFlash.end - g.screenFlash.start), 0, 1);
      const col = g.screenFlash.color || "#ff3b30";
      const intensity = (g.screenFlash.intensity != null) ? g.screenFlash.intensity : 0.30;
      ctx.fillStyle = colorWithAlpha(col, intensity * a);
      ctx.fillRect(0,0,w,h);
    }
  }

  GameApp.Render = { renderWithCssSize };
})();
