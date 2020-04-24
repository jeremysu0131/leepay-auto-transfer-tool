class SoundHelper {
  private _errorAudio: HTMLAudioElement;
  private _warnAudio: HTMLAudioElement;

  constructor() {
    this._errorAudio = new Audio(require("@/assets/sounds/alarm.mp3"));
    this._warnAudio = new Audio(require("@/assets/sounds/alarm.mp3"));
  }
  play(type: "danger" | "warning" | "info" | "success") {
    switch (type) {
      case "danger":
        this._errorAudio.play();
        break;
      case "warning":
        this._warnAudio.play();
        break;
    }
  }

  stop(type: "danger" | "warning" | "info" | "success") {
    switch (type) {
      case "danger":
        this._errorAudio.pause();
        break;
      case "warning":
        this._warnAudio.pause();
        break;
    }
  }
}

export default new SoundHelper();
