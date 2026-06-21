// Web Audio based alert beep — no external file (avoids NotSupportedError) and
// respects the browser autoplay policy (must be unlocked by a user gesture).

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  return ctx;
}

/**
 * Unlock audio. Must be called from within a user gesture handler
 * (click / keydown / pointerdown) or the AudioContext stays suspended.
 */
export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') {
    c.resume().catch(() => {});
  }
  unlocked = true;
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

/**
 * Play a short two-tone alert beep. Safe to call anytime: if audio hasn't been
 * unlocked yet it simply no-ops instead of throwing.
 */
export function playAlertBeep(): void {
  // Use the existing context only. Never create it here — creating an
  // AudioContext outside a user gesture triggers a console warning.
  const c = ctx;
  if (!c || c.state !== 'running') return;

  try {
    const now = c.currentTime;
    const gain = c.createGain();
    gain.connect(c.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1175, now + 0.18);
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.5);
  } catch {
    // Ignore — audio is best-effort.
  }
}
