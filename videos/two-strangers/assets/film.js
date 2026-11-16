/* Two Strangers: a wordless story in eight scenes, drawn from the time t alone (0-30 s).
   Times line up with Cinnamon Girl from 0:36.76; scene changes sit on the song's strong hits. */
(function () {
  const W = 1080, H = 1920, FPS = 24, DUR = 30;
  const BEATS = [0, 0.88, 1.74, 2.57, 3.39, 4.15, 5.11, 6.10, 6.92, 7.85, 8.73, 9.59, 10.47,
    11.33, 12.19, 13.07, 13.95, 14.79, 15.67, 16.53, 17.41, 18.27, 19.13, 20.01, 20.87, 21.75,
    22.64, 23.50, 24.38, 25.24, 26.12, 26.98, 27.86, 28.72, 29.60];
  const CUTS = [5.11, 8.73, 12.19, 15.67, 19.13, 22.64, 26.12];
  const C = { night: "#1A0F14", ink: "#120A0D", cinnamon: "#7A3E1D", amber: "#E8A04A", cream: "#F4E6CF", rose: "#D98A8A", neon: "#FF6F7D" };

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
  const easeInOut = (k) => { k = clamp(k); return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
  const easeOutBack = (k) => { k = clamp(k); const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  function pulse(t, rate = 5) { let last = -99; for (const b of BEATS) if (b <= t) last = b; return Math.exp(-(t - last) * rate); }
  function sinceCut(t) { let last = -99; for (const c of CUTS) if (c <= t) last = c; return t - last; }
  function vgrad(ctx, y0, y1, stops) { const g = ctx.createLinearGradient(0, y0, 0, y1); stops.forEach(([o, c]) => g.addColorStop(o, c)); return g; }
  function glow(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace("A", a)); g.addColorStop(1, color.replace("A", 0));
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const STARS = Array.from({ length: 110 }, (_, i) => { const r = mulberry32(2000 + i); return [r() * W, r() * 1100, r() * 1.7 + 0.4, r() * 6]; });
  function stars(ctx, t, a = 1) {
    for (const [x, y, r, ph] of STARS) { ctx.fillStyle = `rgba(244,230,207,${(0.25 + 0.3 * Math.sin(t * 1.5 + ph)) * a})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
  }
  function mesas(ctx, y, colorFar, colorNear) {
    ctx.fillStyle = colorFar; ctx.beginPath(); ctx.moveTo(0, y);
    [[0, y - 40], [120, y - 60], [170, y - 150], [330, y - 150], [380, y - 50], [600, y - 40], [640, y - 95], [760, y - 100], [800, y - 30], [W, y - 55], [W, y]].forEach(([a, b]) => ctx.lineTo(a, b));
    ctx.fill();
    ctx.fillStyle = colorNear; ctx.beginPath(); ctx.moveTo(0, y);
    [[0, y - 18], [240, y - 26], [420, y - 12], [700, y - 22], [900, y - 8], [W, y - 20], [W, y]].forEach(([a, b]) => ctx.lineTo(a, b));
    ctx.fill();
  }

  // ---------- characters (silhouettes) ----------
  // hair: "long" (the traveller in room 7) or "short" (the one in room 8)
  function head(ctx, x, y, s, hair, facing) {
    ctx.beginPath(); ctx.arc(x, y, 34 * s, 0, 7); ctx.fill();
    if (hair === "long") {
      ctx.beginPath();
      ctx.moveTo(x - 36 * s * facing, y - 18 * s);
      ctx.quadraticCurveTo(x - 50 * s * facing, y + 50 * s, x - 30 * s * facing, y + 92 * s);
      ctx.lineTo(x + 6 * s * facing, y + 70 * s); ctx.lineTo(x + 10 * s * facing, y); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(x - 4 * s * facing, y - 18 * s, 38 * s, 24 * s, 0, 0, 7); ctx.fill();
    }
    // nose, so the profile reads
    ctx.beginPath(); ctx.moveTo(x + 30 * s * facing, y - 6 * s); ctx.lineTo(x + 44 * s * facing, y + 8 * s); ctx.lineTo(x + 30 * s * facing, y + 14 * s); ctx.fill();
  }
  function bust(ctx, x, y, s, hair, facing) { // head and shoulders, as seen in a window
    ctx.beginPath(); ctx.moveTo(x - 95 * s, y + 200 * s);
    ctx.quadraticCurveTo(x - 90 * s, y + 70 * s, x - 20 * s, y + 60 * s); ctx.lineTo(x + 20 * s, y + 60 * s);
    ctx.quadraticCurveTo(x + 90 * s, y + 70 * s, x + 95 * s, y + 200 * s); ctx.fill();
    ctx.fillRect(x - 13 * s, y + 20 * s, 26 * s, 50 * s);
    head(ctx, x, y, s, hair, facing);
  }
  function standing(ctx, x, feet, s, hair, facing, arm, step) { // arm: 0 down, 1 reaching forward-up
    const hip = feet - 260 * s, sh = feet - 470 * s;
    const sw = Math.sin(step) * 26 * s;
    ctx.lineCap = "round"; ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 34 * s;
    ctx.beginPath(); ctx.moveTo(x - 10 * s, hip); ctx.lineTo(x - 10 * s + sw, feet - 6 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 10 * s, hip); ctx.lineTo(x + 10 * s - sw, feet - 6 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 46 * s, sh); ctx.lineTo(x + 46 * s, sh); ctx.lineTo(x + (hair === "long" ? 52 : 34) * s, hip + 10 * s); ctx.lineTo(x - (hair === "long" ? 52 : 34) * s, hip + 10 * s); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 24 * s;
    const ax = x + facing * lerp(10, 120, arm) * s, ay = lerp(hip - 10 * s, sh - 40 * s, arm);
    ctx.beginPath(); ctx.moveTo(x + facing * 36 * s, sh + 14 * s); ctx.lineTo(ax, ay); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - facing * 36 * s, sh + 14 * s); ctx.lineTo(x - facing * (30 - sw * 0.6) * s, hip); ctx.stroke();
    ctx.fillRect(x - 12 * s, sh - 40 * s, 24 * s, 44 * s);
    head(ctx, x, sh - 66 * s, s, hair, facing);
  }
  function waving(ctx, x, feet, s, hair, wave) { // facing camera's left, one arm up and waving
    standing(ctx, x, feet, s, hair, -1, 0, 0);
    if (wave > 0) {
      const sh = feet - 470 * s, a = -0.75 + Math.sin(wave * 12) * 0.3;
      ctx.lineWidth = 24 * s; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(x + 36 * s, sh + 14 * s);
      ctx.lineTo(x + 36 * s + Math.cos(a) * 170 * s * clamp(wave * 3), sh + 14 * s + Math.sin(a) * 170 * s * clamp(wave * 3)); ctx.stroke();
    }
  }
  function seatedBack(ctx, x, y, s, hair, tiltHead) { // seen from behind, sitting on the roof edge
    ctx.beginPath(); ctx.moveTo(x - 80 * s, y);
    ctx.quadraticCurveTo(x - 92 * s, y - 120 * s, x - 60 * s, y - 165 * s); ctx.lineTo(x + 60 * s, y - 165 * s);
    ctx.quadraticCurveTo(x + 92 * s, y - 120 * s, x + 80 * s, y); ctx.fill();
    ctx.fillRect(x - 13 * s, y - 200 * s, 26 * s, 44 * s);
    const hx = x + tiltHead * 34 * s, hy = y - 225 * s + Math.abs(tiltHead) * 16 * s;
    ctx.beginPath(); ctx.arc(hx, hy, 36 * s, 0, 7); ctx.fill();
    if (hair === "long") { ctx.beginPath(); ctx.ellipse(hx, hy + 40 * s, 40 * s, 62 * s, tiltHead * 0.5, 0, 7); ctx.fill(); }
  }

  // ---------- vehicles ----------
  function carFront(ctx, x, y, s, lights) {
    ctx.fillStyle = C.ink;
    ctx.beginPath(); ctx.roundRect(x - 180 * s, y - 110 * s, 360 * s, 110 * s, 22 * s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 120 * s, y - 108 * s); ctx.lineTo(x - 95 * s, y - 180 * s); ctx.lineTo(x + 95 * s, y - 180 * s); ctx.lineTo(x + 120 * s, y - 108 * s); ctx.fill();
    ctx.fillStyle = "rgba(120,80,90,0.35)"; ctx.beginPath(); ctx.moveTo(x - 105 * s, y - 112 * s); ctx.lineTo(x - 88 * s, y - 168 * s); ctx.lineTo(x + 88 * s, y - 168 * s); ctx.lineTo(x + 105 * s, y - 112 * s); ctx.fill();
    ctx.fillStyle = "rgba(244,230,207,0.15)"; ctx.fillRect(x - 70 * s, y - 60 * s, 140 * s, 22 * s);
    for (const dx of [-125, 125]) {
      ctx.fillStyle = lights ? "#FFF3D6" : "#3A2A24"; ctx.beginPath(); ctx.arc(x + dx * s, y - 58 * s, 20 * s, 0, 7); ctx.fill();
      if (lights) glow(ctx, x + dx * s, y - 58 * s, 150 * s, "rgba(255,230,180,A)", 0.55);
    }
    ctx.fillStyle = C.ink; ctx.fillRect(x - 160 * s, y - 6 * s, 50 * s, 24 * s); ctx.fillRect(x + 110 * s, y - 6 * s, 50 * s, 24 * s);
  }
  function carRear(ctx, x, y, s) {
    carFront(ctx, x, y, s, false);
    for (const dx of [-130, 130]) {
      ctx.fillStyle = "#FF4A4A"; ctx.fillRect(x + dx * s - 18 * s, y - 72 * s, 36 * s, 22 * s);
      glow(ctx, x + dx * s, y - 61 * s, 110 * s, "rgba(255,70,70,A)", 0.45);
    }
  }
  function roadScene(ctx, t, sky) {
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 1160);
    mesas(ctx, 1160, "#4A2230", "#2E1520");
    ctx.fillStyle = vgrad(ctx, 1160, H, [[0, "#3A1E1A"], [1, "#140B0E"]]); ctx.fillRect(0, 1150, W, H);
    ctx.fillStyle = "#1C1013"; ctx.beginPath(); ctx.moveTo(530, 1160); ctx.lineTo(550, 1160); ctx.lineTo(1150, H); ctx.lineTo(-70, H); ctx.fill();
    ctx.fillStyle = "rgba(232,160,74,0.45)";
    for (let i = 0; i < 9; i++) { const k0 = Math.pow(i / 9, 2.2), k1 = Math.pow((i + 0.45) / 9, 2.2); const y0 = lerp(1160, H, k0), y1 = lerp(1160, H, k1); ctx.beginPath(); ctx.moveTo(540 - 1 - k0 * 6, y0); ctx.lineTo(540 + 1 + k0 * 6, y0); ctx.lineTo(540 + 1 + k1 * 6, y1); ctx.lineTo(540 - 1 - k1 * 6, y1); ctx.fill(); }
  }
  function roadsideSign(ctx, t, on) {
    ctx.fillStyle = C.ink; ctx.fillRect(838, 960, 7, 210); ctx.fillRect(800, 900, 84, 70);
    ctx.font = 'italic 34px "Instrument Serif", serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (on) { ctx.save(); ctx.shadowColor = C.neon; ctx.shadowBlur = 20; ctx.fillStyle = "#FFD6DB"; ctx.fillText("motel", 842, 935); ctx.restore(); glow(ctx, 842, 935, 160, "rgba(255,111,125,A)", 0.3); }
    else { ctx.fillStyle = "rgba(120,60,70,0.7)"; ctx.fillText("motel", 842, 935); }
  }

  // ---------- 1. the road at dusk ----------
  function sceneRoad(ctx, t) {
    roadScene(ctx, t, vgrad(ctx, 0, 1160, [[0, "#2A1530"], [0.45, "#7A3A46"], [0.85, "#D98A5A"], [1, "#F2B56A"]]));
    glow(ctx, 540, 1150, 520, "rgba(255,190,120,A)", 0.35);
    // The sign buzzes during the song's pause
    let on = 1; if (t > 2.57) on = hash(Math.floor(t * 16)) > 0.45 ? 1 : 0;
    roadsideSign(ctx, t, on);
    const k = Math.pow(t / 5.6, 2.1), s = lerp(0.05, 1.05, k);
    const x = lerp(548, 700, k), y = lerp(1170, 1780, k);
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const beam = ctx.createLinearGradient(0, y, 0, H);
    beam.addColorStop(0, `rgba(255,230,180,${0.22 * clamp(s * 2)})`); beam.addColorStop(1, "rgba(255,230,180,0)");
    ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(x - 150 * s, y); ctx.lineTo(x + 150 * s, y); ctx.lineTo(x + 520 * s + 200, H); ctx.lineTo(x - 520 * s - 200, H); ctx.fill(); ctx.restore();
    carFront(ctx, x, y, s, true);
  }

  // ---------- 2-3. the motel wall: rooms 7 and 8 ----------
  function windowBox(ctx, x, y, w, h, lit, who, facing, lean, t) {
    ctx.fillStyle = "#0E0709"; ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
    if (lit > 0) {
      ctx.fillStyle = vgrad(ctx, y, y + h, [[0, "#F6C47E"], [1, "#D9853F"]]); ctx.globalAlpha = lit; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
    }
    ctx.fillStyle = `rgba(40,30,50,${1 - lit * 0.95})`; ctx.fillRect(x, y, w, h);
    if (who) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = lit > 0.3 ? "#2A140E" : "#0E0709";
      bust(ctx, x + w / 2 + lean * 46 * facing, y + 70, 0.95, who, facing);
      ctx.restore();
    }
    // curtains
    ctx.fillStyle = "rgba(122,62,29,0.85)"; ctx.fillRect(x, y, 26, h); ctx.fillRect(x + w - 26, y, 26, h);
    if (lit > 0) glow(ctx, x + w / 2, y + h / 2, 260, "rgba(240,170,90,A)", 0.22 * lit);
  }
  function door(ctx, x, y, num, lamp) {
    ctx.fillStyle = "#24121A"; ctx.fillRect(x, y, 140, 360);
    ctx.strokeStyle = "rgba(244,230,207,0.10)"; ctx.lineWidth = 3; ctx.strokeRect(x + 16, y + 20, 108, 140); ctx.strokeRect(x + 16, y + 190, 108, 150);
    ctx.fillStyle = "#C9A060"; ctx.font = 'italic 54px "Instrument Serif", serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(num, x + 70, y + 92);
    ctx.beginPath(); ctx.arc(x + 118, y + 200, 6, 0, 7); ctx.fill();
    ctx.fillStyle = "#FFE3B0"; ctx.beginPath(); ctx.arc(x + 70, y - 40, 11, 0, 7); ctx.fill();
    glow(ctx, x + 70, y - 40, 200 * lamp, "rgba(255,210,150,A)", 0.4);
  }
  function wall(ctx, t, o) {
    ctx.save(); ctx.translate(540, 1000); ctx.scale(o.zoom, o.zoom); ctx.translate(-(o.cx || 540), -1000);
    ctx.fillStyle = vgrad(ctx, 0, 520, [[0, "#140C17"], [1, "#2E1628"]]); ctx.fillRect(-200, -200, W + 400, 720);
    stars(ctx, t, 0.8);
    ctx.fillStyle = "#3A2028"; ctx.fillRect(-200, 540, W + 400, 910);
    ctx.fillStyle = "#170C10"; ctx.fillRect(-200, 500, W + 400, 70);
    ctx.fillStyle = vgrad(ctx, 1450, H, [[0, "#2A171B"], [1, "#140B0E"]]); ctx.fillRect(-200, 1450, W + 400, 700);
    ctx.fillStyle = "rgba(244,230,207,0.05)"; ctx.fillRect(-200, 1446, W + 400, 8);
    // Neon from the sign off to the right
    glow(ctx, W + 80, 760, 820, "rgba(255,111,125,A)", 0.30 + 0.08 * pulse(t));
    windowBox(ctx, 70, 880, 250, 210, o.aLit, "long", 1, o.lean, t);
    door(ctx, 340, 1080, "7", 1);
    windowBox(ctx, 590, 880, 250, 210, o.bLit, o.bHere ? "short" : null, -1, o.lean, t);
    door(ctx, 860, 1080, "8", 1);
    // light spilling onto the walkway
    if (o.aLit > 0) glow(ctx, 195, 1500, 260, "rgba(240,170,90,A)", 0.18 * o.aLit);
    if (o.bLit > 0) glow(ctx, 715, 1500, 260, "rgba(240,170,90,A)", 0.18 * o.bLit);
    if (o.sweep !== null) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const sx = lerp(-300, W + 300, o.sweep), g = ctx.createLinearGradient(sx - 220, 0, sx + 220, 0);
      g.addColorStop(0, "rgba(255,235,200,0)"); g.addColorStop(0.5, "rgba(255,235,200,0.35)"); g.addColorStop(1, "rgba(255,235,200,0)");
      ctx.fillStyle = g; ctx.fillRect(-200, 540, W + 400, 1100); ctx.restore();
    }
    ctx.restore();
  }
  function stutter(t, at) { const s = t - at; if (s < 0) return 0; if (s < 0.22) return [1, 0, 1, 0, 1][Math.floor(s / 0.045)] ?? 1; return 1; }
  function sceneMotel(ctx, t) {
    const s = t - 5.11;
    const sweep = t > 6.0 && t < 7.2 ? (t - 6.0) / 1.2 : null;
    wall(ctx, t, { zoom: lerp(1.0, 1.06, s / 3.6), aLit: 1, bLit: stutter(t, 7.85), bHere: t >= 7.85, lean: 0, sweep });
  }
  function sceneSignals(ctx, t) {
    const s = t - 8.73;
    let aLit = 1, bLit = 1;
    if (t >= 9.59 && t < 10.47) aLit = 0.04;   // room 7 switches off...
    if (t >= 10.47 && t < 11.33) bLit = 0.04;  // ...room 8 answers
    const lean = smooth(11.33, 12.1, t);       // both lean toward the shared wall
    wall(ctx, t, { cx: 455, zoom: lerp(1.18, 1.26, s / 3.5), aLit, bLit, bHere: true, lean, sweep: null });
  }

  // ---------- 4. the vending machine ----------
  function sceneVending(ctx, t) {
    const s = t - 12.19;
    ctx.save(); const z = lerp(1.0, 1.05, s / 3.5); ctx.translate(540, 1100); ctx.scale(z, z); ctx.translate(-540, -1100);
    ctx.fillStyle = vgrad(ctx, 0, 1540, [[0, "#1E1018"], [1, "#3A2028"]]); ctx.fillRect(-100, -100, W + 200, 1660);
    ctx.fillStyle = vgrad(ctx, 1540, H, [[0, "#2A171B"], [1, "#120A0D"]]); ctx.fillRect(-100, 1540, W + 200, 600);
    // the machine
    const mx = 375, my = 820, mw = 330, mh = 720;
    glow(ctx, 540, 1150, 760, "rgba(255,235,200,A)", 0.28);
    ctx.fillStyle = "#2A1A1E"; ctx.fillRect(mx - 14, my - 14, mw + 28, mh + 28);
    ctx.fillStyle = vgrad(ctx, my, my + mh, [[0, "#FFF1DC"], [1, "#E9CFA8"]]); ctx.fillRect(mx, my, mw, 470);
    const cols = [C.rose, C.amber, C.cinnamon, "#9AA27A"];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
      ctx.fillStyle = cols[(r + c) % 4]; ctx.fillRect(mx + 22 + c * 58, my + 26 + r * 86, 40, 62);
      ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(mx + 26 + c * 58, my + 30 + r * 86, 8, 54);
    }
    ctx.fillStyle = "#3A2A2C"; ctx.fillRect(mx, my + 490, mw, 230);
    ctx.fillStyle = "#120A0D"; ctx.fillRect(mx + 40, my + 590, mw - 80, 90);
    ctx.fillStyle = "#FFB37C"; for (let i = 0; i < 6; i++) ctx.fillRect(mx + 250, my + 500 + i * 14, 40, 8);
    // the can drops into the tray on the beat
    if (t >= 14.79) { const k = easeOutBack((t - 14.79) / 0.35); ctx.fillStyle = C.rose; ctx.fillRect(mx + 140, lerp(my + 560, my + 610, k), 46, 64); glow(ctx, mx + 163, my + 640, 120, "rgba(255,200,170,A)", 0.4); }
    // moths around the light
    for (let i = 0; i < 9; i++) { const r = mulberry32(700 + i); const a = t * (1.5 + r() * 2) + r() * 6; ctx.fillStyle = "rgba(255,240,220,0.7)"; ctx.beginPath(); ctx.arc(540 + Math.cos(a) * (120 + r() * 160), 760 + Math.sin(a * 1.3) * 90, 3, 0, 7); ctx.fill(); }
    // the two walk in from either side and reach for the same button
    const walk = easeOut(s / 1.76);
    const ax = lerp(-120, 300, walk), bx = lerp(1200, 780, walk);
    const arm = smooth(13.95, 14.4, t) * (1 - smooth(15.0, 15.4, t));
    const step = (1 - walk) * s * 9;
    ctx.fillStyle = "#120A0D";
    standing(ctx, ax, 1580, 1.05, "long", 1, arm, step);
    ctx.fillStyle = "#120A0D";
    standing(ctx, bx, 1580, 1.12, "short", -1, arm * 0.9, step + 1);
    // light catching their edges
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const rim = ctx.createLinearGradient(ax, 0, bx, 0);
    rim.addColorStop(0, "rgba(255,220,180,0)"); rim.addColorStop(0.5, "rgba(255,220,180,0.10)"); rim.addColorStop(1, "rgba(255,220,180,0)");
    ctx.fillStyle = rim; ctx.fillRect(ax, 900, bx - ax, 700); ctx.restore();
    ctx.restore();
  }

  // ---------- 5-6. the rooftop: sparkler, then dawn ----------
  function heartPt(u, cx, cy, sc) {
    const x = 16 * Math.pow(Math.sin(u), 3), y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
    return [cx + x * sc, cy - y * sc];
  }
  function sparkler(ctx, s, t, cx, cy, sc, drawT, fade) {
    const tip = (q) => heartPt(Math.PI * 2 * easeOut(clamp(q / drawT) * 0.98 + 0.02), cx, cy, sc);
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    const steps = 140, end = Math.min(s, drawT);
    for (let i = 1; i <= steps; i++) {
      const s1 = (end * (i - 1)) / steps, s2 = (end * i) / steps, a = clamp(Math.exp(-(s - s2) * 0.7) * 0.95) * fade;
      const [x1, y1] = tip(s1), [x2, y2] = tip(s2);
      ctx.strokeStyle = `rgba(255,200,130,${a * 0.35})`; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,240,215,${a})`; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    if (fade > 0.5) {
      for (let k = 0; k < 80; k++) {
        const tb = Math.floor(s * 80) / 80 - k / 160; if (tb < 0) break;
        const age = s - tb; if (age > 0.45) continue;
        const r = mulberry32(Math.floor(tb * 1000) * 7 + 3), ang = r() * 6.283, sp = 220 + r() * 420;
        const [bx, by] = tip(tb), x = bx + Math.cos(ang) * sp * age, y = by + Math.sin(ang) * sp * age + 600 * age * age;
        ctx.strokeStyle = `rgba(255,220,150,${1 - age / 0.45})`; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(ang) * sp * 0.025, y - Math.sin(ang) * sp * 0.025); ctx.stroke();
      }
      const [tx, ty] = tip(s);
      const tg = ctx.createRadialGradient(tx, ty, 0, tx, ty, 80 * (1 + 0.5 * pulse(t, 7)));
      tg.addColorStop(0, "rgba(255,250,235,1)"); tg.addColorStop(0.15, "rgba(255,210,140,0.8)"); tg.addColorStop(1, "rgba(255,160,80,0)");
      ctx.fillStyle = tg; ctx.fillRect(tx - 140, ty - 140, 280, 280);
      ctx.restore();
      return [tx, ty];
    }
    ctx.restore(); return null;
  }
  function rooftop(ctx, t, dawn, lean, sparkS, sparkFade) {
    // night sky, then dawn layered on top
    ctx.fillStyle = vgrad(ctx, 0, 1300, [[0, "#0F0A1A"], [0.6, "#24142A"], [1, "#3A1A2C"]]); ctx.fillRect(0, 0, W, 1300);
    stars(ctx, t, 1 - dawn);
    if (dawn > 0) {
      ctx.globalAlpha = dawn;
      ctx.fillStyle = vgrad(ctx, 0, 1300, [[0, "#5A3A5A"], [0.45, C.rose], [0.8, C.amber], [1, "#FFD9A0"]]); ctx.fillRect(0, 0, W, 1300);
      ctx.globalAlpha = 1;
      const sy = lerp(1330, 1180, dawn);
      glow(ctx, 540, sy, 700, "rgba(255,210,150,A)", 0.5 * dawn);
      ctx.fillStyle = "#FFE6B0"; ctx.beginPath(); ctx.arc(540, sy, 120, 0, 7); ctx.fill();
    }
    mesas(ctx, 1300, dawn > 0 ? `rgba(74,34,48,1)` : "#1E1020", "#170C12");
    // the roof
    ctx.fillStyle = C.ink; ctx.fillRect(0, 1300, W, H - 1300);
    ctx.fillStyle = "rgba(244,230,207,0.06)"; ctx.fillRect(0, 1300, W, 6);
    // top of the neon sign at the edge of the roof
    ctx.fillStyle = "#1C0F14"; ctx.fillRect(900, 980, 140, 330);
    ctx.font = 'italic 96px "Instrument Serif", serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.save(); ctx.shadowColor = C.neon; ctx.shadowBlur = 30; ctx.fillStyle = `rgba(255,214,220,${1 - dawn * 0.7})`; ctx.fillText("M", 970, 1060); ctx.fillText("O", 970, 1170); ctx.restore();
    glow(ctx, 970, 1120, 380, "rgba(255,111,125,A)", 0.25 * (1 - dawn));
    let tip = null;
    if (sparkS !== null) tip = sparkler(ctx, sparkS, t, 540, 620, 17, 2.4, sparkFade);
    // the two of them, seen from behind
    ctx.fillStyle = "#0B0608";
    seatedBack(ctx, 445, 1420, 1.0, "long", lean * 0.9);
    seatedBack(ctx, 640, 1420, 1.08, "short", 0);
    if (tip) { // the sparkler in the right-hand one's raised hand
      ctx.strokeStyle = "#0B0608"; ctx.lineWidth = 22; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(690, 1270); ctx.lineTo(lerp(690, tip[0], 0.35), lerp(1270, tip[1], 0.35)); ctx.stroke();
      ctx.strokeStyle = "rgba(60,40,40,0.9)"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(lerp(690, tip[0], 0.35), lerp(1270, tip[1], 0.35)); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
    }
  }
  function sceneRoof(ctx, t) { rooftop(ctx, t, 0, 0, t - 15.67 + 0.1, 1); }
  function sceneDawn(ctx, t) { const s = t - 19.13; rooftop(ctx, t, easeInOut(s / 3.3), smooth(20.01, 20.8, t), 3.6 + s, Math.exp(-s * 1.4) * 0.6); }

  // ---------- 7. morning: one car leaves ----------
  function sceneLeaving(ctx, t) {
    const s = t - 22.64;
    roadScene(ctx, t, vgrad(ctx, 0, 1160, [[0, "#C98A7A"], [0.5, "#E8B08A"], [1, "#F6D6A8"]]));
    glow(ctx, 760, 1080, 600, "rgba(255,230,190,A)", 0.4);
    roadsideSign(ctx, t, 0);
    const k = easeInOut(s / 3.5), sc = lerp(0.95, 0.07, Math.pow(k, 0.7));
    const x = lerp(640, 548, k), y = lerp(1760, 1172, Math.pow(k, 0.55));
    // dust behind the car
    for (let i = 0; i < 26; i++) { const r = mulberry32(300 + i); ctx.fillStyle = `rgba(232,190,150,${0.10 * (1 - k)})`; ctx.beginPath(); ctx.arc(x + (r() - 0.5) * 420 * sc, y + (r() * 0.2 - 0.1) * 200 * sc, (40 + r() * 70) * sc + 10, 0, 7); ctx.fill(); }
    carRear(ctx, x, y, sc);
    ctx.fillStyle = "#1A0F14";
    waving(ctx, 200, 1700, 0.95, "short", t >= 24.38 ? (t - 24.38) : 0);
  }

  // ---------- 8. the polaroid on the doormat ----------
  let photo = null;
  function buildPhoto() {
    photo = document.createElement("canvas"); photo.width = 470; photo.height = 470;
    const p = photo.getContext("2d"), k = 470 / 900;
    p.scale(k, k); p.translate(-90, -280);
    rooftop(p, 18.4, 0, 0, 2.8, 1);
  }
  const SPECKS = Array.from({ length: 900 }, (_, i) => { const r = mulberry32(8000 + i); return [r() * W, r() * H, r() * 2.2 + 0.4, r()]; });
  function sceneDoorstep(ctx, t) {
    const s = t - 26.12;
    ctx.save(); const z = lerp(1.0, 1.07, s / 3.9); ctx.translate(540, 1000); ctx.scale(z, z); ctx.translate(-540, -1000);
    ctx.fillStyle = "#6E5A50"; ctx.fillRect(-100, -100, W + 200, H + 200);
    for (const [x, y, r, c] of SPECKS) { ctx.fillStyle = c > 0.5 ? "rgba(40,28,26,0.35)" : "rgba(220,200,180,0.18)"; ctx.fillRect(x, y, r, r); }
    // door threshold at the top
    ctx.fillStyle = "#24121A"; ctx.fillRect(-100, -100, W + 200, 520);
    ctx.fillStyle = "#C9A060"; ctx.font = 'italic 64px "Instrument Serif", serif'; ctx.textAlign = "center"; ctx.fillText("8", 900, 330);
    ctx.fillStyle = "#3A2A24"; ctx.fillRect(-100, 420, W + 200, 40);
    // doormat
    ctx.save(); ctx.translate(540, 1080); ctx.rotate(-0.03);
    ctx.fillStyle = "#7A4A28"; ctx.fillRect(-400, -270, 800, 540);
    ctx.strokeStyle = "rgba(60,30,15,0.5)"; ctx.lineWidth = 3; for (let i = -390; i < 400; i += 12) { ctx.beginPath(); ctx.moveTo(i, -260); ctx.lineTo(i, 260); ctx.stroke(); }
    ctx.strokeStyle = "#4A2A16"; ctx.lineWidth = 26; ctx.strokeRect(-372, -242, 744, 484);
    ctx.restore();
    // morning sun across the step
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const sun = ctx.createLinearGradient(0, 300, W, 1800); sun.addColorStop(0, "rgba(255,210,150,0)"); sun.addColorStop(0.5, "rgba(255,210,150,0.22)"); sun.addColorStop(1, "rgba(255,210,150,0)");
    ctx.fillStyle = sun; ctx.fillRect(-100, -100, W + 200, H + 200); ctx.restore();
    // the polaroid drops onto the mat and develops
    const k = (t - 26.12) / 0.6;
    if (k > 0) {
      const y = lerp(-400, 1090, easeOutBack(k)), rot = lerp(0.7, 0.08, easeOut(k)), sc = lerp(1.3, 1, easeOut(k));
      ctx.save(); ctx.translate(560, y); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(-250, -290, 530, 640);
      ctx.fillStyle = C.cream; ctx.fillRect(-260, -310, 520, 630);
      if (photo) ctx.drawImage(photo, -235, -285, 470, 470);
      const milk = 1 - easeOut((t - 26.5) / 1.8);
      if (milk > 0) { ctx.fillStyle = `rgba(232,224,210,${0.95 * milk})`; ctx.fillRect(-235, -285, 470, 470); }
      ctx.fillStyle = `rgba(122,62,29,${clamp((t - 27.2) / 0.6)})`;
      ctx.font = 'italic 50px "Instrument Serif", serif'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("rooms 7 & 8", 0, 252);
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- timeline ----------
  function sceneAt(t) {
    if (t < 5.11) return sceneRoad;
    if (t < 8.73) return sceneMotel;
    if (t < 12.19) return sceneSignals;
    if (t < 15.67) return sceneVending;
    if (t < 19.13) return sceneRoof;
    if (t < 22.64) return sceneDawn;
    if (t < 26.12) return sceneLeaving;
    return sceneDoorstep;
  }

  // ---------- film finish ----------
  let grain = [];
  function buildGrain() {
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
    let since = 99, idx = 0;
    CUTS.forEach((c, i) => { if (t >= c && t - c < since) { since = t - c; idx = i; } });
    if (since < 1.2) {
      fx.fillStyle = `rgba(255,214,160,${Math.exp(-since * 6) * 0.45})`; fx.fillRect(0, 0, W, H);
      const side = idx % 2 ? W + 100 : -100, lx = side + (idx % 2 ? -1 : 1) * since * 500, ly = 500 + idx * 140;
      const lg = fx.createRadialGradient(lx, ly, 0, lx, ly, 900), la = 0.5 * Math.exp(-since * 2.2);
      lg.addColorStop(0, `rgba(255,140,70,${la})`); lg.addColorStop(0.5, `rgba(217,110,110,${la * 0.4})`); lg.addColorStop(1, "rgba(217,110,110,0)");
      fx.globalCompositeOperation = "screen"; fx.fillStyle = lg; fx.fillRect(0, 0, W, H); fx.globalCompositeOperation = "source-over";
    }
    if (t > 4.4 && t < 5.11) { fx.fillStyle = `rgba(255,190,140,${0.16 * smooth(4.4, 5.11, t)})`; fx.fillRect(0, 0, W, H); }
    // the end: fade to warm dark
    if (t > 29.6) { fx.fillStyle = `rgba(20,11,15,${smooth(29.6, 29.98, t)})`; fx.fillRect(0, 0, W, H); }
    const fl = (hash(f + 3) - 0.5) * 0.05;
    fx.fillStyle = fl > 0 ? `rgba(255,230,190,${fl})` : `rgba(10,5,6,${-fl})`; fx.fillRect(0, 0, W, H);
    const vg = fx.createRadialGradient(540, 900, 420, 540, 960, 1250);
    vg.addColorStop(0, "rgba(26,15,20,0)"); vg.addColorStop(1, "rgba(18,9,12,0.7)");
    fx.fillStyle = vg; fx.fillRect(0, 0, W, H);
    if (grain.length) {
      fx.globalCompositeOperation = "overlay"; fx.globalAlpha = 0.11;
      const r = mulberry32(f * 31 + 5); fx.drawImage(grain[f % grain.length], -r() * 40, -r() * 40, W + 60, H + 60);
      fx.globalAlpha = 1; fx.globalCompositeOperation = "source-over";
    }
    if (hash(f * 7 + 1) > 0.84) {
      const r = mulberry32(f * 13 + 2); fx.strokeStyle = "rgba(20,10,10,0.5)"; fx.lineWidth = 1.5;
      fx.beginPath(); const x = r() * W, y = r() * H; fx.moveTo(x, y); fx.quadraticCurveTo(x + 20, y + 15, x + 10 + r() * 30, y + 40); fx.stroke();
    }
  }

  let film, fx, halo;
  function renderAt(t) {
    t = clamp(t, 0, DUR - 1e-4);
    const ctx = film.getContext("2d"), f = Math.floor(t * FPS);
    ctx.save();
    const r = mulberry32(f * 17 + 11);
    ctx.translate(540 + (r() - 0.5) * 2.4, 960 + (r() - 0.5) * 2.4); ctx.scale(1.012, 1.012); ctx.translate(-540, -960);
    const b = 1 + 0.006 * pulse(t, 6);
    ctx.translate(540, 960); ctx.scale(b, b); ctx.translate(-540, -960);
    const sc = sinceCut(t), draw = sceneAt(t);
    if (sc < 0.25) { sceneAt(t - sc - 0.001)(ctx, t); ctx.globalAlpha = smooth(0, 0.25, sc); draw(ctx, t); ctx.globalAlpha = 1; }
    else draw(ctx, t);
    ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = "soft-light"; ctx.fillStyle = "rgba(232,150,80,0.35)"; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighten"; ctx.fillStyle = "rgb(20,11,15)"; ctx.fillRect(0, 0, W, H); ctx.restore();
    const h = halo.getContext("2d");
    h.clearRect(0, 0, 270, 480); h.filter = "blur(6px)"; h.drawImage(film, 0, 0, 270, 480); h.filter = "none";
    ctx.save(); ctx.globalCompositeOperation = "screen"; ctx.globalAlpha = 0.3; ctx.drawImage(halo, 0, 0, W, H); ctx.restore();
    finish(fx.getContext("2d"), t);
  }

  let lastT = 0;
  film = document.getElementById("film"); fx = document.getElementById("fx");
  halo = document.createElement("canvas"); halo.width = 270; halo.height = 480;
  buildGrain();
  window.addEventListener("hf-seek", (e) => { lastT = e.detail.time; renderAt(lastT); });
  renderAt(0);
  const ready = Promise.all([document.fonts.load('italic 100px "Instrument Serif"'), document.fonts.load('100px "Instrument Serif"')])
    .then(() => { buildPhoto(); renderAt(lastT); });
  window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
  window.__hf.buildReady.film = ready;
})();
