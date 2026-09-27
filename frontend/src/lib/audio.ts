// Sound system disabled as per user instruction.
// All methods are permanent no-ops to ensure zero audio playback.
class SoundFX {
  public enabled: boolean = false;
  playBeep() {}
  playSuccessChime() {}
  playAlert() {}
  playTick() {}
}

export const sound = new SoundFX();
