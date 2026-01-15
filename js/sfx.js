/**
 * 音效系统模块
 * 使用 WebAudio API 合成音效，无需外部资源
 */

const SFX = (() => {
  let ctx = null;
  let master = null;
  let muted = false;

  const last = { shoot: 0, hit: 0, blade: 0, pick: 0, kill: 0 };

  function ensure() {
    if (muted) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  async function unlock() {
    const c = ensure();
    if (!c) return;
    try { if (c.state === "suspended") await c.resume(); } catch {}
  }

  function setMuted(v) {
    muted = !!v;
    if (master) master.gain.value = muted ? 0 : 0.35;
  }

  function isMuted() { return muted; }

  function throttle(name, minIntervalSec, t) {
    const lt = last[name] || 0;
    if ((t - lt) < minIntervalSec) return false;
    last[name] = t;
    return true;
  }

  function envGain(dur, peak) {
    const c = ensure();
    if (!c || !master || muted) return null;
    const g = c.createGain();
    const t0 = c.currentTime;

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.02, dur));
    g.connect(master);
    return g;
  }

  function tone({ type = "square", freq = 440, dur = 0.06, gain = 0.12, slide = 0, slideTime = 0.05 }) {
    const c = ensure();
    if (!c || muted) return;

    const g = envGain(dur, gain);
    if (!g) return;

    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(40, freq), c.currentTime);
    if (slide !== 0) {
      o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), c.currentTime + slideTime);
    }
    o.connect(g);
    o.start();
    o.stop(c.currentTime + dur + 0.02);
  }

  function noise({ dur = 0.08, gain = 0.10, filterFreq = 900, type = "bandpass" }) {
    const c = ensure();
    if (!c || muted) return;

    const g = envGain(dur, gain);
    if (!g) return;

    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);

    const src = c.createBufferSource();
    src.buffer = buf;

    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterFreq;

    src.connect(f);
    f.connect(g);
    src.start();
    src.stop(c.currentTime + dur + 0.02);
  }

  function shoot(t) {
    if (!throttle("shoot", 0.035, t)) return;
    tone({ type: "square", freq: 420 + Math.random() * 70, dur: 0.05, gain: 0.10, slide: -160, slideTime: 0.05 });
    noise({ dur: 0.03, gain: 0.05, filterFreq: 2200, type: "highpass" });
  }

  function hit(t, crit = false) {
    if (!throttle("hit", crit ? 0.03 : 0.02, t)) return;
    noise({ dur: crit ? 0.09 : 0.06, gain: crit ? 0.15 : 0.10, filterFreq: crit ? 700 : 1100, type: "bandpass" });
    tone({ type: "triangle", freq: crit ? 220 : 280, dur: crit ? 0.09 : 0.06, gain: crit ? 0.10 : 0.06, slide: crit ? -120 : -80, slideTime: 0.07 });
  }

  function blade(t) {
    if (!throttle("blade", 0.045, t)) return;
    tone({ type: "sawtooth", freq: 560 + Math.random() * 140, dur: 0.06, gain: 0.07, slide: -280, slideTime: 0.05 });
    noise({ dur: 0.03, gain: 0.04, filterFreq: 3200, type: "highpass" });
  }

  function kill(t, big = false) {
    if (!throttle("kill", big ? 0.07 : 0.05, t)) return;
    noise({ dur: big ? 0.18 : 0.12, gain: big ? 0.22 : 0.15, filterFreq: big ? 360 : 520, type: "lowpass" });
    tone({ type: "square", freq: big ? 110 : 140, dur: big ? 0.18 : 0.12, gain: big ? 0.12 : 0.08, slide: -40, slideTime: 0.12 });
  }

  function pickup(t) {
    if (!throttle("pick", 0.03, t)) return;
    tone({ type: "sine", freq: 880 + Math.random() * 140, dur: 0.05, gain: 0.05, slide: 180, slideTime: 0.04 });
  }

  function levelup(t) {
    tone({ type: "triangle", freq: 440, dur: 0.08, gain: 0.11, slide: 220, slideTime: 0.08 });
    setTimeout(() => tone({ type: "triangle", freq: 660, dur: 0.10, gain: 0.12, slide: 260, slideTime: 0.10 }), 40);
    setTimeout(() => tone({ type: "triangle", freq: 880, dur: 0.12, gain: 0.14, slide: 320, slideTime: 0.12 }), 90);
  }

  return { unlock, setMuted, isMuted, shoot, hit, blade, kill, pickup, levelup };
})();

// 导出音效系统供其他模块使用
window.SFX = SFX;
