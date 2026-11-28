// "Build it in 30 seconds": a glowing card with a spinning rainbow border.
// The code typed on screen is exactly the code in buildit.json (tested in a real browser).
import React, { useEffect, useState } from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import data from './buildit.json';

export const BUILD_FPS = 30;
const HOOK_END = 2.0;
const END_START = 23.0;
export const BUILD_SECONDS = 28.5;

const MONO = 'BuildMono';
const DISPLAY = 'BuildDisplay';
const TEXT = 'BuildText';
const CYAN = '#3EC8FF';

type Step = { file: string; caption: string; dur: number; code: string; start: number; end: number };
const STEPS = data.steps as Step[];

const useFonts = () => {
  const [h] = useState(() => delayRender('build fonts'));
  useEffect(() => {
    Promise.all(
      [
        new FontFace(MONO, `url(${staticFile('fonts/JetBrainsMono-Regular.woff2')})`, { weight: '400' }),
        new FontFace(DISPLAY, `url(${staticFile('fonts/InterDisplay-Bold.otf')})`, { weight: '700' }),
        new FontFace(TEXT, `url(${staticFile('fonts/Inter-SemiBold.otf')})`, { weight: '600' }),
      ].map((f) => f.load().then((l) => document.fonts.add(l))),
    )
      .catch(() => undefined)
      .finally(() => continueRender(h));
  }, [h]);
};

// ── Syntax highlighting (VS Code dark colours) ──
const C = { tag: '#569cd6', attr: '#9cdcfe', str: '#ce9178', text: '#d4d4d4', punc: '#808080', sel: '#d7ba7d', at: '#c586c0', prop: '#9cdcfe', num: '#b5cea8', fn: '#dcdcaa', var: '#9cdcfe' };
type Tok = { t: string; c: string };

const tokenizeHtml = (line: string): Tok[] => {
  const out: Tok[] = [];
  const re = /(<\/?[a-z0-9]+)|(\s[a-z-]+)(?==)|(=)|("[^"]*")|(>)|([^<>="]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ t: m[1], c: C.tag });
    else if (m[2]) out.push({ t: m[2], c: C.attr });
    else if (m[3]) out.push({ t: m[3], c: C.text });
    else if (m[4]) out.push({ t: m[4], c: C.str });
    else if (m[5]) out.push({ t: m[5], c: C.tag });
    else out.push({ t: m[6], c: C.text });
  }
  return out;
};

const tokenizeCssValue = (v: string): Tok[] => {
  const out: Tok[] = [];
  const re = /("[^"]*")|(#[0-9a-f]{3,8})|(--[a-z-]+)|([a-z-]+)(?=\()|(-?\d+(?:\.\d+)?(?:px|deg|s|%)?)|([a-z-]+)|([^\w"#-]+|.)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(v))) {
    if (m[1]) out.push({ t: m[1], c: C.str });
    else if (m[2]) out.push({ t: m[2], c: C.str });
    else if (m[3]) out.push({ t: m[3], c: C.var });
    else if (m[4]) out.push({ t: m[4], c: C.fn });
    else if (m[5]) out.push({ t: m[5], c: C.num });
    else if (m[6]) out.push({ t: m[6], c: C.str });
    else out.push({ t: m[7] ?? m[0], c: C.text });
  }
  return out;
};

const tokenizeCss = (line: string): Tok[] => {
  if (/^@/.test(line)) {
    const [, at, rest] = line.match(/^(@[a-z-]+)(.*)$/i) ?? [];
    return [{ t: at, c: C.at }, ...tokenizeCssValue(rest ?? '')];
  }
  if (/^[.#a-z]/i.test(line)) return [{ t: line.replace(/\s*[{,]\s*$/, ''), c: C.sel }, { t: line.slice(line.replace(/\s*[{,]\s*$/, '').length), c: C.text }];
  const pm = line.match(/^(\s*)([a-z-]+)(:)(.*)$/i);
  if (pm && !/^\s*to\b/.test(line)) return [{ t: pm[1], c: C.text }, { t: pm[2], c: C.prop }, { t: pm[3], c: C.text }, ...tokenizeCssValue(pm[4])];
  return tokenizeCssValue(line);
};

// Colour the `to { --angle: 360deg; }` line nicely
const tokenizeKeyframeLine = (line: string): Tok[] | null => {
  const m = line.match(/^(\s*)(to)( \{ )(--angle)(: )(360deg)(; \})$/);
  if (!m) return null;
  return [{ t: m[1], c: C.text }, { t: m[2], c: C.sel }, { t: m[3], c: C.text }, { t: m[4], c: C.var }, { t: m[5], c: C.text }, { t: m[6], c: C.num }, { t: m[7], c: C.text }];
};

const CodeLine: React.FC<{ line: string; shown: number; html: boolean }> = ({ line, shown, html }) => {
  const toks = html ? tokenizeHtml(line) : tokenizeKeyframeLine(line) ?? tokenizeCss(line);
  let left = shown;
  return (
    <>
      {toks.map((tk, i) => {
        if (left <= 0) return null;
        const part = tk.t.slice(0, left);
        left -= tk.t.length;
        return (
          <span key={i} style={{ color: tk.c }}>
            {part}
          </span>
        );
      })}
    </>
  );
};

// ── Editor window ──
const LINE_H = 44;
const VISIBLE = 14;
const Editor: React.FC<{ t: number }> = ({ t }) => {
  const f = useCurrentFrame();
  const html = STEPS[0];
  const css = STEPS.slice(1);
  const onHtml = t < css[0].start;
  // Build the visible file contents with typing progress
  const progress = (s: Step) => Math.max(0, Math.min(1, (t - s.start) / s.dur));
  type L = { text: string; shown: number };
  const lines: L[] = [];
  let cursorLine = 0;
  let cursorCol = 0;
  const pushCode = (s: Step, gap: boolean) => {
    const p = progress(s);
    if (p <= 0) return;
    if (gap) lines.push({ text: '', shown: 0 });
    let chars = Math.round(p * s.code.length);
    s.code.split('\n').forEach((ln) => {
      const shown = Math.max(0, Math.min(ln.length, chars));
      if (chars >= 0) {
        lines.push({ text: ln, shown });
        if (chars <= ln.length && p < 1) {
          cursorLine = lines.length - 1;
          cursorCol = shown;
        }
      }
      chars -= ln.length + 1;
    });
    if (p >= 1) {
      cursorLine = lines.length - 1;
      cursorCol = lines[lines.length - 1].text.length;
    }
  };
  if (onHtml) pushCode(html, false);
  else css.forEach((s, i) => pushCode(s, i > 0));
  const scroll = Math.max(0, cursorLine - (VISIBLE - 3));
  const caretOn = Math.floor(f / 8) % 2 === 0;
  const files = ['index.html', 'style.css'];
  return (
    <div
      style={{
        position: 'absolute', left: 40, right: 40, top: 930, height: 720, borderRadius: 26, overflow: 'hidden',
        background: '#1e1e1e', boxShadow: '0 30px 80px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.06)',
      }}
    >
      <div style={{ height: 54, background: '#252526', display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c }} />
        ))}
        <div style={{ display: 'flex', marginLeft: 24, height: '100%' }}>
          {files.map((fn) => {
            const active = (fn === 'index.html') === onHtml;
            return (
              <div
                key={fn}
                style={{
                  padding: '0 26px', display: 'flex', alignItems: 'center', fontFamily: TEXT, fontSize: 26,
                  color: active ? 'white' : '#8a8a8a', background: active ? '#1e1e1e' : 'transparent', borderTop: active ? `3px solid ${CYAN}` : '3px solid transparent',
                }}
              >
                {fn}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'relative', padding: '20px 0', fontFamily: MONO, fontSize: 29, lineHeight: `${LINE_H}px`, whiteSpace: 'pre' }}>
        {lines.slice(scroll, scroll + VISIBLE).map((ln, i) => {
          const idx = scroll + i;
          return (
            <div key={idx} style={{ display: 'flex' }}>
              <div style={{ width: 70, textAlign: 'right', paddingRight: 22, color: idx === cursorLine ? '#c6c6c6' : '#5a5a5a', flex: '0 0 auto' }}>{idx + 1}</div>
              <div style={{ position: 'relative' }}>
                <CodeLine line={ln.text} shown={ln.shown} html={onHtml} />
                {idx === cursorLine && caretOn && (
                  <span style={{ position: 'absolute', left: `${cursorCol}ch`, top: 6, width: 3, height: LINE_H - 12, background: '#aeafad' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Live preview of the card ──
const Card: React.FC<{ stage: number; angle: number; scale: number; pop: number }> = ({ stage, angle, scale, pop }) => {
  const border = stage >= 3;
  const glow = stage >= 4;
  const ring = (blur: number) => (
    <div
      style={{
        position: 'absolute', inset: -4, zIndex: -1, borderRadius: 20,
        background: `conic-gradient(from ${angle}deg, #ff0080, #7928ca, #00d4ff, #ff0080)`, filter: blur ? `blur(${blur}px)` : undefined,
      }}
    />
  );
  return (
    <div style={{ transform: `scale(${scale * pop})`, isolation: 'isolate' }}>
      {stage >= 2 ? (
        <div style={{ position: 'relative', width: 300, height: 400, background: '#111', borderRadius: 16, display: 'grid', placeItems: 'center', color: 'white' }}>
          {border && ring(0)}
          {border && ring(glow ? 30 : 0)}
          <h2 style={{ fontFamily: 'sans-serif', fontSize: 24, margin: 0 }}>Coding Wizard</h2>
        </div>
      ) : stage >= 1 ? (
        <h2 style={{ fontFamily: 'Times New Roman, serif', fontSize: 24, color: 'white', margin: 0 }}>Coding Wizard</h2>
      ) : (
        <div style={{ fontFamily: TEXT, fontSize: 22, color: '#555' }}>preview</div>
      )}
    </div>
  );
};

const stageAt = (t: number) => STEPS.filter((s) => t >= s.end).length; // 0..5
const lastStageTime = (t: number) => STEPS.filter((s) => t >= s.end).map((s) => s.end).pop() ?? -10;

const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background: '#08090d',
      backgroundImage: 'radial-gradient(ellipse 70% 40% at 50% 30%, rgba(121,40,202,0.18), transparent 70%), linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
      backgroundSize: 'auto, 60px 60px, 60px 60px',
    }}
  />
);

const Title: React.FC<{ text: string; top: number; size?: number; step?: number }> = ({ text, top, size = 60, step }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f, fps, config: { damping: 16, stiffness: 200 } });
  return (
    <div style={{ position: 'absolute', top, left: 50, right: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, opacity: pop, transform: `translateY(${(1 - pop) * 20}px)` }}>
      {step !== undefined && (
        <div style={{ width: 78, height: 78, borderRadius: 39, background: CYAN, color: '#04121c', fontFamily: DISPLAY, fontWeight: 700, fontSize: 46, display: 'grid', placeItems: 'center', flex: '0 0 auto' }}>
          {step}
        </div>
      )}
      <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: size, color: 'white', letterSpacing: -1.5, lineHeight: 1.08, textAlign: step !== undefined ? 'left' : 'center' }}>{text}</div>
    </div>
  );
};

export const BuildIt: React.FC = () => {
  useFonts();
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = f / fps;
  const angle = (t / 3) * 360; // spin 3s linear infinite
  const total = Math.round(BUILD_SECONDS * fps);

  const hook = t < HOOK_END;
  const end = t >= END_START;
  const stage = hook || end ? 5 : stageAt(t);
  const since = t - lastStageTime(t);
  const pop = !hook && !end && since < 0.5 ? 1 + 0.08 * Math.max(0, 1 - since / 0.35) : 1;

  const currentStep = STEPS.findIndex((s) => t >= s.start - 0.3 && t < s.end + 0.55);
  const stepIdx = currentStep >= 0 ? currentStep : stage >= 5 ? -1 : 0;

  // Preview position: big for hook/end, smaller above the editor while coding
  const big = hook || end;
  const previewTop = big ? 1010 : 600;
  const previewScale = big ? 2.0 : 1.2;
  const enter = interpolate(t, [END_START, END_START + 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill>
      <Background />
      {/* preview */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: previewTop, height: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: end ? enter : 1 }}>
        <Card stage={stage} angle={angle} scale={previewScale} pop={pop} />
      </div>

      {hook && (
        <Sequence durationInFrames={Math.round(HOOK_END * fps)}>
          <Title text="Build this glowing card in 30 seconds 👇" top={170} size={66} />
        </Sequence>
      )}

      {!hook && !end && (
        <>
          <Editor t={t} />
          {STEPS.map((s, i) =>
            i === stepIdx ? (
              <Sequence key={i} from={Math.round((s.start - 0.3) * fps)} durationInFrames={Math.round((s.end + 0.55 - s.start + 0.3) * fps)}>
                <Title text={s.caption} top={150} step={i + 1} />
              </Sequence>
            ) : null,
          )}
          {t >= STEPS[4].end + 0.55 && (
            <Sequence from={Math.round((STEPS[4].end + 0.55) * fps)}>
              <Title text="That's it! ✨" top={150} />
            </Sequence>
          )}
        </>
      )}

      {end && (
        <Sequence from={Math.round(END_START * fps)}>
          <Title text="Save this & follow for more 🧙‍♂️" top={190} size={64} />
          <div style={{ position: 'absolute', top: 1560, left: 0, right: 0, textAlign: 'center', fontFamily: TEXT, fontSize: 40, color: '#bbb', opacity: enter }}>
            Comment “CODE” and I’ll send it 👇
          </div>
        </Sequence>
      )}

      <Audio src={staticFile('build/clicks.wav')} volume={(fr) => interpolate(fr, [total - 20, total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
    </AbsoluteFill>
  );
};
