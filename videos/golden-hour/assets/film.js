/* Golden Hour Motel: every frame is drawn from the time t alone (seconds, 0-30).
   Times are relative to 0:36.76 in the song; BEATS are its measured beats. */
(function () {
  const W = 1080, H = 1920, FPS = 24, DUR = 30;
  const BEATS = [0, 0.88, 1.74, 2.57, 3.39, 4.15, 5.11, 6.10, 6.92, 7.85, 8.73, 9.59, 10.47,
    11.33, 12.19, 13.07, 13.95, 14.79, 15.67, 16.53, 17.41, 18.27, 19.13, 20.01, 20.87, 21.75,
    22.64, 23.50, 24.38, 25.24, 26.12, 26.98, 27.86, 28.72, 29.60];
  // Scene changes land on the song's strong hits (every fourth beat after the swell).
  const CUTS = [5.11, 8.73, 12.19, 15.67, 19.13, 22.64, 26.12, 29.60];
  const C = {
    night: "#1A0F14", cinnamon: "#7A3E1D", amber: "#E8A04A", cream: "#F4E6CF",
    rose: "#D98A8A", neon: "#FF6F7D", rust: "#C8643A",
  };

  // ---------- helpers ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (n) => mulberry32(n * 9301 + 49297)();
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
  const easeOut = (k) => 1 - Math.pow(1 - clamp(k), 3);
  const easeOutBack = (k) => { k = clamp(k); const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  // Strength of the most recent beat at time t (1 on the beat, decaying).
  function pulse(t, rate = 5) {
    let last = -99;
    for (const b of BEATS) if (b <= t) last = b;
    return Math.exp(-(t - last) * rate);
  }
  function sinceCut(t) { let last = -99; for (const c of CUTS) if (c <= t) last = c; return t - last; }

  function vgrad(ctx, y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  }
  function bokeh(ctx, seed, n, yMin, yMax, color, t, rMax = 60) {
    const r = mulberry32(seed);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < n; i++) {
      const x = r() * W + Math.sin(t * 0.3 + i) * 12, y = lerp(yMin, yMax, r());
      const rad = 14 + r() * rMax, a = 0.05 + r() * 0.12;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
      g.addColorStop(0, color.replace("A", a.toFixed(3)));
      g.addColorStop(0.7, color.replace("A", (a * 0.6).toFixed(3)));
      g.addColorStop(1, color.replace("A", "0"));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- scene: sunbeam through blinds with dust ----------
  const MOTES = Array.from({ length: 170 }, (_, i) => {
    const r = mulberry32(1000 + i);
    return { x: r() * W, y: r() * H, vx: 6 + r() * 14, vy: -4 - r() * 10, ph: r() * 6.28, f: 0.3 + r() * 0.6, s: 1 + r() * 3.2 };
  });
  function beamLight(x, y) {
    // Distance from the beam's centre line (from the window at top-left, falling to the lower right).
    const ax = -200, ay = 150, bx = 1300, by = 1750;
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy);
    const d = Math.abs((x - ax) * dy - (y - ay) * dx) / L;
    return clamp(1 - d / 330);
  }
  function drawDust(ctx, t, intensity, neonGlow) {
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#2B1813"], [0.55, "#24130F"], [1, C.night]]);
    ctx.fillRect(0, 0, W, H);
    // Floor line and skirting
    ctx.fillStyle = "rgba(10,5,6,0.45)"; ctx.fillRect(0, 1480, W, H - 1480);
    ctx.fillStyle = "rgba(244,230,207,0.04)"; ctx.fillRect(0, 1472, W, 8);

    // Volumetric beam
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createLinearGradient(-200, 150, 1300, 1750);
    g.addColorStop(0, `rgba(232,160,74,${0.30 * intensity})`);
    g.addColorStop(1, `rgba(232,160,74,${0.05 * intensity})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-200, -60); ctx.lineTo(260, -60); ctx.lineTo(1300, 1500); ctx.lineTo(1300, 2050); ctx.closePath(); ctx.fill();

    // Blind stripes landing on the wall, slightly breathing with the light
    for (let i = 0; i < 9; i++) {
      const y = 700 + i * 72 + Math.sin(t * 0.4) * 4;
      const a = (0.20 + 0.06 * Math.sin(i * 1.7)) * intensity;
      ctx.fillStyle = `rgba(247,200,130,${a})`;
      ctx.beginPath(); ctx.moveTo(420 + i * 30, y); ctx.lineTo(1100, y + 150); ctx.lineTo(1100, y + 190); ctx.lineTo(420 + i * 30, y + 34); ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    // Shadow of a palm leaf swaying across the stripes
    ctx.save();
    ctx.translate(820, 980); ctx.rotate(-0.5 + Math.sin(t * 0.9) * 0.05);
    ctx.fillStyle = `rgba(26,15,20,${0.55 * intensity})`;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-140, -60, -330, 10);
    for (let i = 0; i < 9; i++) { const x = -330 + i * 36; ctx.lineTo(x + 10, 10 + (i % 2 ? 40 : 4)); }
    ctx.quadraticCurveTo(-120, 40, 0, 0); ctx.fill();
    ctx.restore();

    // Neon from outside, buzzing during the pause
    if (neonGlow > 0) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const ng = ctx.createRadialGradient(W + 60, 760, 0, W + 60, 760, 700);
      ng.addColorStop(0, `rgba(255,111,125,${0.45 * neonGlow})`); ng.addColorStop(1, "rgba(255,111,125,0)");
      ctx.fillStyle = ng; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    // Dust motes, bright inside the beam
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const m of MOTES) {
      let x = (m.x + m.vx * t + Math.sin(t * m.f + m.ph) * 22) % W; if (x < 0) x += W;
      let y = (m.y + m.vy * t + Math.cos(t * m.f * 0.8 + m.ph) * 16) % H; if (y < 0) y += H;
      const a = (0.08 + 0.85 * beamLight(x, y)) * (0.35 + 0.65 * intensity);
      ctx.fillStyle = `rgba(255,226,180,${a.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, m.s, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  // ---------- scene: neon motel ----------
  const STARS = Array.from({ length: 70 }, (_, i) => { const r = mulberry32(2000 + i); return [r() * W, r() * 760, r() * 1.6 + 0.4, r() * 6]; });
  const WINDOWS = Array.from({ length: 12 }, (_, i) => ({ x: -30 + i * 64, lit: hash(i + 7) > 0.35 }));
  function neonState(t, scene) {
    // Snaps on with a stutter at the start of each motel scene; snaps off at 29.60.
    const s = t - scene;
    let on = s < 0 ? 0 : 1;
    if (s >= 0 && s < 0.30) on = [1, 0, 1, 1, 0, 1, 1][Math.floor(s / 0.045)] ?? 1;
    if (t >= 29.60) { const o = t - 29.60; on = o < 0.15 ? [0, 1, 0, 0][Math.floor(o / 0.04)] ?? 0 : 0; }
    return on;
  }
  function neonText(ctx, text, x, y, size, color, glow, on) {
    ctx.font = `italic ${size}px "Instrument Serif", serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (on) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = color; ctx.shadowBlur = glow; ctx.fillStyle = color;
      ctx.fillText(text, x, y); ctx.shadowBlur = glow * 0.4; ctx.fillText(text, x, y);
      ctx.restore();
      ctx.fillStyle = "#FFE9EC"; ctx.globalAlpha = 0.85; ctx.fillText(text, x, y); ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "rgba(90,40,50,0.55)"; ctx.fillText(text, x, y);
    }
  }
  function drawMotel(ctx, t, scene, wide) {
    const s = Math.max(0, t - scene), on = neonState(t, scene);
    ctx.save();
    const zoom = wide ? lerp(1.0, 1.05, s / 3.5) : lerp(1.04, 1.12, s / 3.6);
    ctx.translate(780, 900); ctx.scale(zoom, zoom); ctx.translate(-780, -900);

    ctx.fillStyle = vgrad(ctx, 0, 1300, [[0, "#140C17"], [0.45, "#3A1A2C"], [0.8, "#8A3D33"], [1, C.rust]]);
    ctx.fillRect(-100, -100, W + 200, 1420);
    for (const [x, y, r, ph] of STARS) {
      ctx.fillStyle = `rgba(244,230,207,${0.25 + 0.25 * Math.sin(t * 1.5 + ph)})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    // Ground and road
    ctx.fillStyle = vgrad(ctx, 1290, H, [[0, "#1E1014"], [1, "#0E0709"]]);
    ctx.fillRect(-100, 1290, W + 200, H);
    ctx.strokeStyle = "rgba(232,160,74,0.18)"; ctx.lineWidth = 6; ctx.setLineDash([60, 50]);
    ctx.beginPath(); ctx.moveTo(-100, 1640); ctx.lineTo(W + 100, 1560); ctx.stroke(); ctx.setLineDash([]);

    // Motel block
    ctx.fillStyle = "#170C10";
    ctx.fillRect(-60, 1110, 720, 200);
    ctx.beginPath(); ctx.moveTo(-80, 1110); ctx.lineTo(680, 1110); ctx.lineTo(640, 1070); ctx.lineTo(-40, 1070); ctx.fill();
    for (let i = 0; i < WINDOWS.length; i++) {
      const w = WINDOWS[i];
      const lit = w.lit !== (Math.floor((t + i * 0.37) / 3.48) % 5 === i % 5);
      const a = (lit ? 0.9 : 0.12) * (t >= 29.65 ? 0.25 : 1);
      ctx.fillStyle = `rgba(240,170,90,${a})`; ctx.fillRect(w.x + 14, 1160, 30, 40);
      if (lit) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = `rgba(240,170,90,${0.12 * a})`; ctx.fillRect(w.x + 2, 1148, 54, 64); ctx.restore(); }
      ctx.fillStyle = "rgba(240,170,90,0.10)"; ctx.fillRect(w.x + 14, 1230, 30, 60);
    }
    // Pole and sign box
    ctx.fillStyle = "#120A0D"; ctx.fillRect(772, 980, 22, 340);
    ctx.fillStyle = "#1C0F14"; ctx.strokeStyle = "rgba(244,230,207,0.12)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(700, 330, 166, 660, 18); ctx.fill(); ctx.stroke();
    // Vertical MOTEL
    "MOTEL".split("").forEach((ch, i) => neonText(ctx, ch, 783, 410 + i * 122, 118, C.neon, 46, on));
    // Arrow with chasing bulbs
    ctx.save(); ctx.translate(560, 1015);
    ctx.fillStyle = "#1C0F14"; ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(60, -50); ctx.lineTo(60, -22); ctx.lineTo(330, -22); ctx.lineTo(330, 22); ctx.lineTo(60, 22); ctx.lineTo(60, 50); ctx.closePath(); ctx.fill();
    const chase = Math.floor(t * 8);
    for (let i = 0; i < 12; i++) {
      const bx = 300 - i * 24, lit = on && (chase - i) % 3 === 0;
      ctx.fillStyle = lit ? "#FFD79A" : "rgba(120,80,50,0.6)";
      if (lit) { ctx.shadowColor = C.amber; ctx.shadowBlur = 18; }
      ctx.beginPath(); ctx.arc(bx, 0, 6, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    }
    ctx.restore();
    // VACANCY flickers on the off-beats
    const vacOn = on && !(hash(Math.floor(t * 12)) > 0.86);
    neonText(ctx, "vacancy", 690, 1090, 54, C.amber, 26, vacOn);
    // Sign glow across the sky and the ground
    if (on) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(783, 660, 40, 783, 660, 640);
      g.addColorStop(0, `rgba(255,111,125,${0.20 + 0.10 * pulse(t)})`); g.addColorStop(1, "rgba(255,111,125,0)");
      ctx.fillStyle = g; ctx.fillRect(-100, -100, W + 200, H + 200);
      const g2 = ctx.createRadialGradient(783, 1420, 10, 783, 1420, 420);
      g2.addColorStop(0, "rgba(255,111,125,0.16)"); g2.addColorStop(1, "rgba(255,111,125,0)");
      ctx.fillStyle = g2; ctx.fillRect(-100, 1290, W + 200, 700);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- scene: palms at sunset with heat haze ----------
  let hazeCanvas = null;
  function palm(ctx, x, y, h, lean, t, ph, scale) {
    const sway = Math.sin(t * 1.1 + ph) * 0.04;
    const tx = x + lean * h + Math.sin(t * 1.1 + ph) * 8, ty = y - h;
    ctx.fillStyle = C.night; ctx.strokeStyle = C.night;
    ctx.beginPath(); ctx.moveTo(x - 16 * scale, y);
    ctx.quadraticCurveTo(x + lean * h * 0.2, y - h * 0.5, tx - 6 * scale, ty);
    ctx.lineTo(tx + 6 * scale, ty);
    ctx.quadraticCurveTo(x + lean * h * 0.2 + 18 * scale, y - h * 0.5, x + 16 * scale, y); ctx.fill();
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.42 + sway + Math.sin(t * 1.6 + i + ph) * 0.03;
      const len = (150 + (i % 3) * 30) * scale;
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + len * 0.42;
      const mx = tx + Math.cos(a) * len * 0.5, my = ty + Math.sin(a) * len * 0.6 - 30 * scale;
      ctx.lineWidth = 13 * scale; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
      for (let k = 1; k < 9; k++) {
        const u = k / 9, px = (1 - u) * (1 - u) * tx + 2 * (1 - u) * u * mx + u * u * ex;
        const py = (1 - u) * (1 - u) * ty + 2 * (1 - u) * u * my + u * u * ey;
        ctx.lineWidth = 7 * scale;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a + 1.2) * 34 * scale * (1 - u * 0.5), py + 38 * scale); ctx.stroke();
      }
    }
  }
  function drawPalmsRaw(ctx, t, s) {
    ctx.fillStyle = vgrad(ctx, 0, 1200, [[0, "#6E3346"], [0.35, C.rose], [0.7, C.amber], [1, "#F6C98A"]]);
    ctx.fillRect(0, 0, W, 1200);
    // Retro sun with bands
    const sy = lerp(1020, 990, s / 3.5);
    const sg = ctx.createLinearGradient(0, sy - 300, 0, sy + 300);
    sg.addColorStop(0, "#FFE6B0"); sg.addColorStop(1, "#F08A4A");
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const halo = ctx.createRadialGradient(540, sy, 200, 540, sy, 700);
    halo.addColorStop(0, `rgba(255,214,150,${0.35 + 0.15 * pulse(t)})`); halo.addColorStop(1, "rgba(255,214,150,0)");
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, 1200); ctx.restore();
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(540, sy, 290, 0, 7); ctx.fill();
    for (let i = 0; i < 6; i++) {
      const by = sy + 40 + i * 44 + ((t * 16) % 44), bh = 4 + i * 3.2;
      ctx.fillStyle = vgrad(ctx, 0, 1200, [[0, "#6E3346"], [0.35, C.rose], [0.7, C.amber], [1, "#F6C98A"]]);
      ctx.fillRect(200, by, 680, bh);
    }
    // Sea
    ctx.fillStyle = vgrad(ctx, 1180, H, [[0, "#8A4A33"], [0.3, "#4A2420"], [1, C.night]]);
    ctx.fillRect(0, 1180, W, H - 1180);
    for (let i = 0; i < 26; i++) {
      const y = 1195 + i * i * 1.3, w = 140 + i * 16 + Math.sin(t * 2 + i) * 30;
      ctx.fillStyle = `rgba(255,210,150,${0.5 - i * 0.017})`;
      ctx.fillRect(540 - w / 2 + Math.sin(t * 1.4 + i * 0.8) * 20, y, w, 3 + i * 0.25);
    }
    // Wires
    ctx.strokeStyle = "rgba(26,15,20,0.7)"; ctx.lineWidth = 3;
    for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(-20, 420 + k * 40); ctx.quadraticCurveTo(540, 560 + k * 40, W + 20, 380 + k * 40); ctx.stroke(); }
    palm(ctx, 160, 1330, 900, 0.10, t, 0, 1.15);
    palm(ctx, 300, 1300, 640, -0.08, t, 2, 0.8);
    palm(ctx, 920, 1360, 1000, -0.12, t, 4, 1.25);
    ctx.fillStyle = C.night; ctx.fillRect(0, 1290, W, H);
    ctx.fillStyle = vgrad(ctx, 1280, 1340, [[0, "rgba(26,15,20,0)"], [1, C.night]]); ctx.fillRect(0, 1240, W, 60);
  }
  function drawPalms(ctx, t, scene) {
    const s = Math.max(0, t - scene);
    if (!hazeCanvas) { hazeCanvas = document.createElement("canvas"); hazeCanvas.width = W; hazeCanvas.height = H; }
    const h = hazeCanvas.getContext("2d");
    h.save(); h.translate(0, lerp(40, 0, easeOut(s / 3.5))); drawPalmsRaw(h, t, s); h.restore();
    // Heat haze: shift thin strips sideways, strongest near the horizon.
    for (let y = 0; y < H; y += 6) {
      const amp = 3.5 * Math.exp(-Math.pow((y - 1190) / 70, 2));
      const dx = Math.sin(y * 0.07 + t * 7) * amp;
      ctx.drawImage(hazeCanvas, 0, y, W, 6, dx, y, W, 6);
    }
  }

  // ---------- scene: spinning record ----------
  const WOOD = Array.from({ length: 40 }, (_, i) => { const r = mulberry32(3000 + i); return [r() * W, r() * 0.25 + 0.03, r() * 3 + 1]; });
  function drawVinyl(ctx, t, scene) {
    const s = Math.max(0, t - scene);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#3A2016"], [0.5, "#4A2A1A"], [1, "#24130E"]]);
    ctx.fillRect(0, 0, W, H);
    for (const [x, a, w] of WOOD) { ctx.fillStyle = `rgba(20,10,8,${a})`; ctx.fillRect(x, 0, w, H); }
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const pool = ctx.createRadialGradient(400, 600, 50, 400, 600, 1100);
    pool.addColorStop(0, "rgba(232,160,74,0.28)"); pool.addColorStop(1, "rgba(232,160,74,0)");
    ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H); ctx.restore();

    const cx = 540, cy = 900, R = 440;
    const zoom = lerp(1.0, 1.08, s / 3.5);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(zoom, zoom);
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.beginPath(); ctx.arc(14, 26, R + 10, 0, 7); ctx.fill();
    ctx.fillStyle = "#120A0C"; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
    for (let i = 0; i < 70; i++) {
      const r = 160 + i * 3.9;
      ctx.strokeStyle = `rgba(255,235,210,${0.025 + 0.03 * hash(i)})`; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.stroke();
    }
    // Fixed sheen from the light (it does not turn with the record)
    const cg = ctx.createConicGradient(-0.7, 0, 0);
    const p = 0.16 + 0.10 * pulse(t);
    [[0, 0], [0.06, p], [0.12, 0], [0.5, 0], [0.56, p * 0.7], [0.62, 0], [1, 0]].forEach(([o, a]) => cg.addColorStop(o, `rgba(255,214,160,${a})`));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, R - 4, 0, 7); ctx.arc(0, 0, 150, 0, 7, true); ctx.fill();
    // Label turns at 33 rpm
    ctx.rotate(t * Math.PI * 2 * 0.55);
    ctx.fillStyle = C.cinnamon; ctx.beginPath(); ctx.arc(0, 0, 140, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(244,230,207,0.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 118, 0, 7); ctx.stroke();
    ctx.fillStyle = C.cream; ctx.font = 'italic 46px "Instrument Serif", serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("slow days", 0, -52);
    ctx.font = '22px "Instrument Serif", serif'; ctx.fillText("SIDE A  ·  33⅓", 0, 62);
    ctx.fillStyle = "#0E0709"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill();
    ctx.restore();
    // Tonearm swings in
    const ang = lerp(-0.55, 0, easeOut(s / 0.8));
    ctx.save(); ctx.translate(960, 330); ctx.rotate(ang);
    ctx.fillStyle = "#2A1A14"; ctx.beginPath(); ctx.arc(0, 0, 54, 0, 7); ctx.fill();
    ctx.strokeStyle = "#D9CBB4"; ctx.lineWidth = 14; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-40, 520); ctx.lineTo(-120, 640); ctx.stroke();
    ctx.fillStyle = "#D9CBB4"; ctx.fillRect(-150, 630, 64, 34);
    ctx.restore();
  }

  // ---------- scene: sparkler drawing a heart ----------
  function heartPt(u) {
    const x = 16 * Math.pow(Math.sin(u), 3);
    const y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
    return [540 + x * 24, 860 - y * 24];
  }
  const DRAW_T = 2.6; // seconds to draw the heart
  function tipAt(s) { const k = clamp(s / DRAW_T); return heartPt(Math.PI * 2 * easeOut(k * 0.98 + 0.02) ); }
  function drawSparkler(ctx, t, scene) {
    const s = Math.max(0, t - scene);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#140E22"], [0.6, "#2A1726"], [1, "#3A1F2A"]]);
    ctx.fillRect(0, 0, W, H);
    bokeh(ctx, 77, 28, 1250, 1700, "rgba(232,160,74,A)", t, 70);
    bokeh(ctx, 78, 10, 200, 700, "rgba(217,138,138,A)", t, 90);
    // Trail
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    const steps = 160, end = Math.min(s, DRAW_T);
    for (let i = 1; i <= steps; i++) {
      const s1 = (end * (i - 1)) / steps, s2 = (end * i) / steps;
      const age = s - s2, a = clamp(Math.exp(-age * 0.9) * 0.95);
      const [x1, y1] = tipAt(s1), [x2, y2] = tipAt(s2);
      ctx.strokeStyle = `rgba(255,200,130,${a * 0.35})`; ctx.lineWidth = 22;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,240,215,${a})`; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    // Sparks from the tip
    const [tx, ty] = tipAt(s);
    for (let k = 0; k < 90; k++) {
      const tb = Math.floor(s * 90) / 90 - k / 180; if (tb < 0) break;
      const age = s - tb; if (age > 0.5) continue;
      for (let j = 0; j < 2; j++) {
        const r = mulberry32(Math.floor(tb * 1000) * 7 + j);
        const ang = r() * 6.283, sp = 250 + r() * 500;
        const [bx, by] = tipAt(Math.min(tb, DRAW_T + 10));
        const x = bx + Math.cos(ang) * sp * age, y = by + Math.sin(ang) * sp * age + 600 * age * age;
        const a = 1 - age / 0.5;
        ctx.strokeStyle = `rgba(255,${200 + (j * 40)},140,${a})`; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(ang) * sp * 0.025, y - Math.sin(ang) * sp * 0.025); ctx.stroke();
      }
    }
    const fl = 1 + 0.6 * pulse(t, 7);
    const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 90 * fl);
    tg.addColorStop(0, "rgba(255,250,235,1)"); tg.addColorStop(0.15, "rgba(255,210,140,0.8)"); tg.addColorStop(1, "rgba(255,160,80,0)");
    ctx.fillStyle = tg; ctx.beginPath(); ctx.arc(tx, ty, 90 * fl, 0, 7); ctx.fill();
    ctx.restore();
    // The stick, held from below
    ctx.strokeStyle = "rgba(60,40,40,0.9)"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(tx, ty + 6); ctx.lineTo(tx + 90, ty + 380); ctx.stroke();
  }

  // ---------- scene: rose from particles ----------
  const ROSE = (() => {
    const pts = [], r = mulberry32(4242);
    const cx = 540, cy = 800;
    for (let L = 0; L < 6; L++) {
      const petals = 3 + L, R = 34 + L * 40;
      for (let p = 0; p < petals; p++) {
        const a0 = (p / petals) * 6.283 + L * 0.9;
        for (let k = 0; k < 46 + L * 6; k++) {
          const u = r(), ang = a0 + (u - 0.5) * (6.283 / petals) * 1.25;
          const cup = Math.sin(u * Math.PI);
          const rad = R * (0.75 + 0.35 * cup) + (r() - 0.5) * 10;
          pts.push({ tx: cx + Math.cos(ang) * rad, ty: cy + Math.sin(ang) * rad * 0.82 - cup * 12, L });
        }
      }
    }
    for (let k = 0; k < 160; k++) { const u = k / 160; pts.push({ tx: 540 + Math.sin(u * 3) * 18 + (r() - 0.5) * 6, ty: 1050 + u * 430, L: 9 }); }
    for (let k = 0; k < 120; k++) { const u = r(), v = r() - 0.5; pts.push({ tx: 560 + u * 190, ty: 1250 - u * 90 + v * 60 * Math.sin(u * Math.PI), L: 10 }); }
    return pts.map((p, i) => { const q = mulberry32(5000 + i); return { ...p, sx: q() * W, sy: q() * H, d: q() * 0.6, sz: 1.6 + q() * 2.6, c: q() }; });
  })();
  function drawRose(ctx, t, scene) {
    const s = Math.max(0, t - scene);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#3A1A22"], [0.5, "#5A2A2C"], [1, "#2A1418"]]);
    ctx.fillRect(0, 0, W, H);
    bokeh(ctx, 91, 22, 0, H, "rgba(217,138,138,A)", t, 80);
    const pl = pulse(t, 4);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const p of ROSE) {
      const k = easeOut((s - p.d) / 1.8);
      const dx = p.tx - 540, dy = p.ty - 800, push = 1 + pl * 0.05 * (p.L < 9 ? 1 : 0.2);
      const x = lerp(p.sx, 540 + dx * push, k) + Math.sin(t * 1.3 + p.c * 9) * 2;
      const y = lerp(p.sy, 800 + dy * push, k) + Math.cos(t * 1.1 + p.c * 9) * 2;
      let col;
      if (p.L >= 9) col = `rgba(160,170,110,${0.55})`;
      else col = p.c < 0.5 ? `rgba(217,138,138,0.75)` : p.c < 0.8 ? `rgba(232,160,74,0.7)` : `rgba(244,230,207,0.8)`;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, p.sz, 0, 7); ctx.fill();
    }
    const g = ctx.createRadialGradient(540, 800, 0, 540, 800, 360);
    g.addColorStop(0, `rgba(255,180,160,${0.18 * clamp(s / 1.8) + 0.1 * pl})`); g.addColorStop(1, "rgba(255,180,160,0)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // ---------- scene: polaroids on a table ----------
  const SHOTS = [];
  function buildShots() {
    const specs = [[drawMotel, 7.2, 5.11, 560], [drawPalms, 10.4, 8.73, 640], [drawVinyl, 13.6, 12.19, 640], [drawRose, 21.6, 19.13, 560]];
    for (const [fn, tt, sc, cy] of specs) {
      const c = document.createElement("canvas"); c.width = 470; c.height = 470;
      const cx2 = c.getContext("2d"); const k = 470 / 760;
      cx2.scale(k, k); cx2.translate(-160, -(cy - 380));
      fn(cx2, tt, sc, false);
      SHOTS.push(c);
    }
  }
  const CARDS = [
    { x: 520, y: 760, rot: -0.12, beat: 22.64 }, { x: 570, y: 860, rot: 0.09, beat: 23.50 },
    { x: 500, y: 930, rot: -0.04, beat: 24.38 }, { x: 545, y: 1010, rot: 0.05, beat: 25.24 },
  ];
  function drawPolaroids(ctx, t, scene) {
    const s = Math.max(0, t - scene);
    ctx.fillStyle = vgrad(ctx, 0, H, [[0, "#3A1E12"], [0.5, "#5A3019"], [1, "#2A140C"]]);
    ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const pool = ctx.createRadialGradient(540, 900, 50, 540, 900, 900);
    pool.addColorStop(0, "rgba(232,160,74,0.30)"); pool.addColorStop(1, "rgba(232,160,74,0)");
    ctx.fillStyle = pool; ctx.fillRect(0, 0, W, H); ctx.restore();
    const zoom = lerp(1.0, 1.06, s / 3.5);
    ctx.save(); ctx.translate(540, 900); ctx.scale(zoom, zoom); ctx.translate(-540, -900);
    CARDS.forEach((cd, i) => {
      const k = (t - cd.beat) / 0.55; if (k < 0) return;
      const e = easeOutBack(k);
      const y = lerp(-500, cd.y, e), rot = lerp(cd.rot + 0.6 * (i % 2 ? 1 : -1), cd.rot, easeOut(k));
      const sc = lerp(1.25, 1, easeOut(k));
      ctx.save(); ctx.translate(cd.x, y); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(-250, -290, 520, 640);
      ctx.fillStyle = C.cream; ctx.fillRect(-260, -310, 520, 630);
      if (SHOTS[i]) ctx.drawImage(SHOTS[i], -235, -285, 470, 470);
      // Developing: the photo comes up out of a milky white
      const dev = i === 3 ? 1.6 : 0.6, milk = 1 - easeOut((t - cd.beat - 0.2) / dev);
      if (milk > 0) { ctx.fillStyle = `rgba(232,224,210,${0.95 * milk})`; ctx.fillRect(-235, -285, 470, 470); }
      if (i === 3) {
        ctx.fillStyle = `rgba(122,62,29,${clamp((t - cd.beat - 0.6) / 0.6)})`;
        ctx.font = 'italic 52px "Instrument Serif", serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("slow days", 0, 252);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  // ---------- timeline of scenes ----------
  function sceneAt(t) {
    if (t < 5.11) return (c, tt) => drawDust(c, tt, dustLight(tt), dustNeon(tt));
    if (t < 8.73) return (c, tt) => drawMotel(c, tt, 5.11, false);
    if (t < 12.19) return (c, tt) => drawPalms(c, tt, 8.73);
    if (t < 15.67) return (c, tt) => drawVinyl(c, tt, 12.19);
    if (t < 19.13) return (c, tt) => drawSparkler(c, tt, 15.67);
    if (t < 22.64) return (c, tt) => drawRose(c, tt, 19.13);
    if (t < 26.12) return (c, tt) => drawPolaroids(c, tt, 22.64);
    return (c, tt) => drawMotel(c, tt, 26.12, true);
  }
  // The pause: the sun dims at 2.57 and the neon outside starts to buzz.
  function dustLight(t) { return t < 2.57 ? 1 : lerp(1, 0.28, smooth(2.57, 3.4, t)); }
  function dustNeon(t) {
    if (t < 3.3) return 0;
    const buzz = hash(Math.floor(t * 18)) > 0.55 ? 1 : 0.15;
    return buzz * smooth(3.3, 5.0, t);
  }

  // ---------- film finish ----------
  let grain = [];
  function buildGrain() {
    grain = [];
    for (let n = 0; n < 6; n++) {
      const c = document.createElement("canvas"); c.width = 540; c.height = 960;
      const g = c.getContext("2d"), img = g.createImageData(540, 960), r = mulberry32(9000 + n);
      for (let i = 0; i < img.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
      g.putImageData(img, 0, 0); grain.push(c);
    }
  }
  function finish(fx, t) {
    fx.clearRect(0, 0, W, H);
    const f = Math.floor(t * FPS);
    // Flash and light leak on every scene change
    let since = 99, idx = 0;
    CUTS.forEach((c, i) => { if (t >= c && t - c < since) { since = t - c; idx = i; } });
    if (since < 1.2 && CUTS[idx] < 29.6) {
      const a = Math.exp(-since * 6) * 0.5;
      fx.fillStyle = `rgba(255,214,160,${a})`; fx.fillRect(0, 0, W, H);
      const side = idx % 2 ? W + 100 : -100, lx = side + (idx % 2 ? -1 : 1) * since * 500;
      const lg = fx.createRadialGradient(lx, 500 + idx * 140, 0, lx, 500 + idx * 140, 900);
      const la = 0.55 * Math.exp(-since * 2.2);
      lg.addColorStop(0, `rgba(255,140,70,${la})`); lg.addColorStop(0.5, `rgba(217,110,110,${la * 0.4})`); lg.addColorStop(1, "rgba(217,110,110,0)");
      fx.globalCompositeOperation = "screen"; fx.fillStyle = lg; fx.fillRect(0, 0, W, H); fx.globalCompositeOperation = "source-over";
    }
    // Pre-swell glow just before the lift
    if (t > 4.4 && t < 5.11) { fx.fillStyle = `rgba(255,190,140,${0.18 * smooth(4.4, 5.11, t)})`; fx.fillRect(0, 0, W, H); }
    // Film flicker
    const fl = (hash(f + 3) - 0.5) * 0.05;
    fx.fillStyle = fl > 0 ? `rgba(255,230,190,${fl})` : `rgba(10,5,6,${-fl})`; fx.fillRect(0, 0, W, H);
    // Vignette
    const vg = fx.createRadialGradient(540, 900, 420, 540, 960, 1250);
    vg.addColorStop(0, "rgba(26,15,20,0)"); vg.addColorStop(1, "rgba(18,9,12,0.72)");
    fx.fillStyle = vg; fx.fillRect(0, 0, W, H);
    // Grain
    if (grain.length) {
      fx.globalCompositeOperation = "overlay"; fx.globalAlpha = 0.11;
      const r = mulberry32(f * 31 + 5), ox = r() * 40, oy = r() * 40;
      fx.drawImage(grain[f % grain.length], -ox, -oy, W + 60, H + 60);
      fx.globalAlpha = 1; fx.globalCompositeOperation = "source-over";
    }
    // Occasional dust and hair on the film
    if (hash(f * 7 + 1) > 0.82) {
      const r = mulberry32(f * 13 + 2); fx.strokeStyle = "rgba(20,10,10,0.55)"; fx.lineWidth = 1.5;
      fx.beginPath(); const x = r() * W, y = r() * H; fx.moveTo(x, y); fx.quadraticCurveTo(x + 20, y + 15, x + 10 + r() * 30, y + 40); fx.stroke();
    }
  }

  // ---------- render ----------
  let film, fx, warm;
  function renderAt(t) {
    t = clamp(t, 0, DUR - 1e-4);
    const ctx = film.getContext("2d"), f = Math.floor(t * FPS);
    ctx.save();
    // Gate weave: the frame drifts by a pixel or two, like film in a projector
    const r = mulberry32(f * 17 + 11);
    ctx.translate(540 + (r() - 0.5) * 2.4, 960 + (r() - 0.5) * 2.4); ctx.scale(1.012, 1.012); ctx.translate(-540, -960);
    // A soft "breath" zoom on every beat
    const b = 1 + 0.008 * pulse(t, 6);
    ctx.translate(540, 960); ctx.scale(b, b); ctx.translate(-540, -960);

    if (t >= 29.75) {
      // Outro: neon is off, the room comes back so the loop is seamless.
      drawMotel(ctx, t, 26.12, true);
      ctx.globalAlpha = smooth(29.75, 29.98, t); drawDust(ctx, t - DUR, 1, 0); ctx.globalAlpha = 1;
    } else {
      const sc = sinceCut(t), draw = sceneAt(t);
      if (sc < 0.25 && t >= 5.11 && t < 29.6) {
        const prev = sceneAt(t - sc - 0.001);
        prev(ctx, t); ctx.globalAlpha = smooth(0, 0.25, sc); draw(ctx, t); ctx.globalAlpha = 1;
      } else draw(ctx, t);
    }
    ctx.restore();
    // Warm grade: lift the blacks and push everything toward amber
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(232,150,80,0.35)"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighten"; ctx.fillStyle = "rgb(20,11,15)"; ctx.fillRect(0, 0, W, H); ctx.restore();
    // Halation: a soft bloom around the bright parts
    const w = warm.getContext("2d");
    w.clearRect(0, 0, 270, 480); w.filter = "blur(6px)"; w.drawImage(film, 0, 0, 270, 480); w.filter = "none";
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.32; ctx.drawImage(warm, 0, 0, W, H); ctx.restore();
    finish(fx.getContext("2d"), t);
  }

  let lastT = 0;
  function init() {
    film = document.getElementById("film"); fx = document.getElementById("fx");
    warm = document.createElement("canvas"); warm.width = 270; warm.height = 480;
    buildGrain();
    window.addEventListener("hf-seek", (e) => { lastT = e.detail.time; renderAt(lastT); });
    renderAt(0);
    const ready = Promise.all([
      document.fonts.load('italic 100px "Instrument Serif"'), document.fonts.load('100px "Instrument Serif"'),
    ]).then(() => { buildShots(); renderAt(lastT); });
    window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
    window.__hf.buildReady.film = ready;
    window.__goldenHour = { renderAt };
  }
  init();
})();
