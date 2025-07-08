import AudioEngine from '../utils/audioEngine';

class GlobalAudioService {
  constructor() {
    this.audioEngine = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (!this.audioEngine) {
      this.audioEngine = new AudioEngine();
      this.isInitialized = true;
      console.log('Global audio service initialized');
    }
    return this.audioEngine;
  }

  async start(bpm, beats = 4, accentFirstBeat = true, clickSoundId = 'classic', volume = 0.7, subdivisionValue = 1, subdivisionVolume = 0.5, onBeat = null, onSubdivision = null) {
    if (!this.audioEngine) {
      await this.initialize();
    }

    console.log('Starting global audio engine with BPM:', bpm);
    
    return await this.audioEngine.start(
      bpm,
      beats,
      accentFirstBeat,
      clickSoundId,
      volume,
      subdivisionValue,
      subdivisionVolume,
      onBeat,
      onSubdivision
    );
  }

  stop() {
    if (this.audioEngine) {
      console.log('Stopping global audio engine');
      this.audioEngine.stop();
    }
  }

  updateTempo(bpm) {
    if (this.audioEngine) {
      console.log('Updating global audio engine tempo to:', bpm);
      this.audioEngine.updateTempo(bpm);
    }
  }

  updateSettings(settings) {
    if (this.audioEngine) {
      this.audioEngine.updateSettings(settings);
    }
  }

  destroy() {
    if (this.audioEngine) {
      this.audioEngine.destroy();
      this.audioEngine = null;
      this.isInitialized = false;
    }
  }

  getEngine() {
    return this.audioEngine;
  }

  // Test method to verify audio is working
  async testAudio() {
    if (!this.audioEngine) {
      await this.initialize();
    }
    
    console.log('Testing audio engine...');
    
    // Test immediate click
    const result = await this.audioEngine.testImmediateClick();
    
    // Get timing info for debugging
    const timingInfo = this.audioEngine.getTimingInfo();
    console.log('Audio timing info:', timingInfo);
    
    return result;
  }

  // Get timing information for debugging mobile issues
  getTimingInfo() {
    if (!this.audioEngine) return null;
    return this.audioEngine.getTimingInfo();
  }
}

// Create a singleton instance
const globalAudioService = new GlobalAudioService();

export default globalAudioService;
