export class TimelineEngine {
  private startTime: number;
  private endTime: number;
  private currentTime: number;
  private speed = 1;
  private playing = false;
  private lastFrameTime = 0;
  private animationId: number | null = null;
  private onUpdate: (time: number) => void;
  private onComplete: () => void;

  // Full history plays in ~120s at 1x speed
  private get msPerSecond(): number {
    const duration = this.endTime - this.startTime;
    if (duration <= 0) return 1;
    return (duration / 120) * this.speed;
  }

  constructor(
    startTime: number,
    endTime: number,
    onUpdate: (time: number) => void,
    onComplete: () => void
  ) {
    this.startTime = startTime;
    this.endTime = endTime;
    this.currentTime = startTime;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
  }

  play() {
    if (this.playing) return;
    this.playing = true;

    // If at the end, restart from beginning
    if (this.currentTime >= this.endTime) {
      this.currentTime = this.startTime;
    }

    this.lastFrameTime = performance.now();
    this.tick();
  }

  pause() {
    this.playing = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  stop() {
    this.pause();
    this.currentTime = this.endTime;
    this.onUpdate(this.currentTime);
  }

  seek(time: number) {
    this.currentTime = Math.max(this.startTime, Math.min(this.endTime, time));
    this.onUpdate(this.currentTime);
  }

  setSpeed(speed: number) {
    this.speed = speed;
  }

  isPlaying() {
    return this.playing;
  }

  getProgress(): number {
    const range = this.endTime - this.startTime;
    if (range <= 0) return 1;
    return (this.currentTime - this.startTime) / range;
  }

  getCurrentTime() {
    return this.currentTime;
  }

  updateRange(startTime: number, endTime: number) {
    this.startTime = startTime;
    this.endTime = endTime;
  }

  private tick() {
    if (!this.playing) return;

    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000; // seconds
    this.lastFrameTime = now;

    this.currentTime += dt * this.msPerSecond;

    if (this.currentTime >= this.endTime) {
      this.currentTime = this.endTime;
      this.playing = false;
      this.onUpdate(this.currentTime);
      this.onComplete();
      return;
    }

    this.onUpdate(this.currentTime);
    this.animationId = requestAnimationFrame(() => this.tick());
  }

  destroy() {
    this.pause();
  }
}
