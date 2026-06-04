// Procedural ambient drone via the Web Audio API — no asset files. Default off
// and only created on a user gesture (the mute toggle), satisfying autoplay
// policy. Open-fifth sine drones + filtered noise + a slow LFO give a calm,
// deep-space pad. Gain is ramped, never hard-switched.
export function createAmbient() {
  let ctx = null;
  let master = null;
  let nodes = [];
  let started = false;
  let enabled = false;

  function build() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    ctx = new Ctx();
    master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);

    const freqs = [55, 82.41, 110, 164.81]; // A1, E2, A2, E3
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f * (i % 2 ? 1.002 : 0.998);
      const g = ctx.createGain();
      g.gain.value = 0.12 / (i + 1);
      osc.connect(g);
      g.connect(master);
      osc.start();
      nodes.push(osc, g);
    });

    // Filtered pink-ish noise bed.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 320;
    lp.Q.value = 0.6;
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    noise.connect(lp);
    lp.connect(ng);
    ng.connect(master);
    noise.start();
    nodes.push(noise, lp, ng);

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.05;
    const lg = ctx.createGain();
    lg.gain.value = 120;
    lfo.connect(lg);
    lg.connect(lp.frequency);
    lfo.start();
    nodes.push(lfo, lg);

    started = true;
  }

  return {
    get enabled() {
      return enabled;
    },
    async setEnabled(on) {
      enabled = on;
      if (on) {
        if (!started) build();
        if (ctx.state === "suspended") await ctx.resume();
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.34, ctx.currentTime + 1.6);
      } else if (started) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      }
    },
    dispose() {
      nodes.forEach((n) => {
        try {
          if (n.stop) n.stop();
        } catch {
          /* already stopped */
        }
        try {
          n.disconnect();
        } catch {
          /* noop */
        }
      });
      nodes = [];
      if (ctx) ctx.close().catch(() => {});
      ctx = null;
      started = false;
    },
  };
}
