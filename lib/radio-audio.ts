import { signalStrength, type RadioPhase } from "./radio404";

/** One local noise bed and an original three-note fragment; no network audio. */
export function createRadioAudio(voiceUrl: string) {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = 0.24;
  const compressor = context.createDynamicsCompressor();
  master.connect(compressor).connect(context.destination);
  const buffer = context.createBuffer(
    1,
    context.sampleRate * 2,
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const noise = context.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  const noiseGain = context.createGain();
  noiseGain.gain.value = 0;
  noise.connect(filter).connect(noiseGain).connect(master);
  noise.start();
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  const tone = context.createGain();
  tone.gain.value = 0;
  oscillator.connect(tone).connect(master);
  oscillator.start();
  let previous: RadioPhase = "search";
  let voiceBuffer: AudioBuffer | null = null;
  let voice: AudioBufferSourceNode | null = null;
  const request = new AbortController();
  // Decode once after opt-in; a missing asset leaves noise and the visual narrative intact.
  void fetch(voiceUrl, { signal: request.signal })
    .then((response) => {
      if (!response.ok) throw new Error("Audio unavailable");
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data))
    .then((buffer) => {
      if (context.state !== "closed") voiceBuffer = buffer;
    })
    .catch(() => {});
  return {
    context,
    update(frequency: number, phase: RadioPhase) {
      const time = context.currentTime;
      const strength = signalStrength(frequency);
      filter.frequency.setTargetAtTime(
        350 + (frequency - 388) * 90,
        time,
        0.05,
      );
      noiseGain.gain.setTargetAtTime(
        phase === "lost" ? 0 : 0.18 * (1 - strength * 0.85),
        time,
        0.06,
      );
      if (phase === "receiving" && previous !== phase) {
        if (voiceBuffer) {
          voice = context.createBufferSource();
          voice.buffer = voiceBuffer;
          voice.connect(master);
          voice.start(time);
        }
        tone.gain.cancelScheduledValues(time);
        tone.gain.setValueAtTime(0, time);
        [220, 277.18, 329.63].forEach((note, index) => {
          const start = time + index * 0.3;
          oscillator.frequency.setValueAtTime(note, start);
          tone.gain.linearRampToValueAtTime(0.15, start + 0.04);
          tone.gain.linearRampToValueAtTime(0, start + 0.26);
        });
      } else if (phase !== "receiving") {
        if (voice) {
          voice.stop();
          voice.disconnect();
          voice = null;
        }
        tone.gain.cancelScheduledValues(time);
        tone.gain.setTargetAtTime(0, time, 0.03);
      }
      previous = phase;
    },
    async close() {
      request.abort();
      if (voice) {
        voice.stop();
        voice.disconnect();
        voice = null;
      }
      noise.stop();
      oscillator.stop();
      await context.close();
    },
  };
}
