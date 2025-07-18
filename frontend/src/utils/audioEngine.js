class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.nextNoteTime = 0.0;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isAndroid = /Android/i.test(navigator.userAgent);
    
    // Mobile devices need MORE lookahead and schedule ahead time due to higher latency
    // Android devices especially need more buffer time
    this.lookahead = this.isMobile ? (this.isAndroid ? 50.0 : 25.0) : 25.0;
    this.scheduleAheadTime = this.isMobile ? (this.isAndroid ? 0.4 : 0.3) : 0.1;
    
    this.notesInQueue = [];
    this.timerWorker = null;
    this.rafId = null;
    this.isRunning = false;
    this.initializeAudioContext();
  }

  async initializeAudioContext() {
    try {
      // Don't create audio context until user interaction
      // Audio context will be created when user first clicks play
      this.createTimerWorker();
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }

  async ensureAudioContext() {
    if (!this.audioContext) {
      try {
        // Create audio context on first user interaction
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Set mobile-specific optimizations
        if (this.isMobile && this.audioContext.outputLatency !== undefined) {
          // Account for output latency on mobile devices
          const baseLatency = this.audioContext.outputLatency;
          const androidBonus = this.isAndroid ? 0.1 : 0.05; // Extra buffer for Android
          this.scheduleAheadTime = Math.max(this.scheduleAheadTime, baseLatency + androidBonus);
        }
        
        // Android-specific optimizations
        if (this.isAndroid) {
          // Force higher sample rate if supported for better timing
          if (this.audioContext.sampleRate < 44100) {
            console.log('Android device with low sample rate detected');
          }
        }
        
        console.log('AudioContext created, state:', this.audioContext.state);
        console.log('Mobile device detected:', this.isMobile);
        console.log('Android device detected:', this.isAndroid);
        console.log('Output latency:', this.audioContext.outputLatency || 'unknown');
        console.log('Schedule ahead time:', this.scheduleAheadTime);
        console.log('Lookahead time:', this.lookahead);
      } catch (error) {
        console.error('Failed to create audio context:', error);
        return false;
      }
    }

    // Resume audio context if suspended (required for mobile browsers)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed, state:', this.audioContext.state);
      } catch (error) {
        console.error('Failed to resume audio context:', error);
        return false;
      }
    }

    return this.audioContext.state === 'running';
  }

  createTimerWorker() {
    // Use both Web Worker and requestAnimationFrame for better mobile compatibility
    if (typeof Worker !== 'undefined') {
      const workerScript = `
        var timerID = null;
        var interval = 100;
        
        self.onmessage = function(e) {
          if (e.data === "start") {
            timerID = setInterval(function() {
              postMessage("tick");
            }, interval);
          } else if (e.data.interval) {
            interval = e.data.interval;
            if (timerID) {
              clearInterval(timerID);
              timerID = setInterval(function() {
                postMessage("tick");
              }, interval);
            }
          } else if (e.data === "stop") {
            clearInterval(timerID);
            timerID = null;
          }
        };
      `;
      
      try {
        const blob = new Blob([workerScript], { type: 'application/javascript' });
        this.timerWorker = new Worker(URL.createObjectURL(blob));
        
        this.timerWorker.onmessage = (e) => {
          if (e.data === 'tick') {
            this.scheduler();
          }
        };
        
        this.timerWorker.onerror = (error) => {
          console.error('Timer worker error:', error);
          this.useRafTimer();
        };
      } catch (error) {
        console.error('Failed to create timer worker:', error);
        this.useRafTimer();
      }
    } else {
      this.useRafTimer();
    }
  }

  useRafTimer() {
    // Fallback to requestAnimationFrame for timing
    console.log('Using requestAnimationFrame for timing');
    let lastTime = 0;
    
    const rafTimer = (currentTime) => {
      if (this.isRunning) {
        // Use different timing intervals for mobile vs desktop
        const interval = this.isMobile ? (this.isAndroid ? 30 : 20) : 16.67; // ~60fps for desktop, slower for mobile
        
        if (currentTime - lastTime >= interval) {
          this.scheduler();
          lastTime = currentTime;
        }
        this.rafId = requestAnimationFrame(rafTimer);
      }
    };
    
    this.startRafTimer = () => {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.rafId = requestAnimationFrame(rafTimer);
    };
    
    this.stopRafTimer = () => {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    };
  }

  createClickSound(frequency, isAccent, volume = 0.7, clickSound = 'classic') {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filterNode = this.audioContext.createBiquadFilter();

    // Connect the audio graph
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configure based on click sound type and accent
    switch (clickSound) {
      case 'classic':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(
          isAccent ? frequency * 1.5 : frequency, 
          this.audioContext.currentTime
        );
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        break;
      
      case 'wood':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(
          isAccent ? frequency * 1.3 : frequency, 
          this.audioContext.currentTime
        );
        filterNode.type = 'bandpass';
        filterNode.frequency.setValueAtTime(800, this.audioContext.currentTime);
        filterNode.Q.setValueAtTime(3, this.audioContext.currentTime);
        break;
      
      case 'electronic':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(
          isAccent ? frequency * 1.4 : frequency, 
          this.audioContext.currentTime
        );
        filterNode.type = 'highpass';
        filterNode.frequency.setValueAtTime(300, this.audioContext.currentTime);
        break;
      
      case 'sine':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(
          isAccent ? frequency * 1.2 : frequency, 
          this.audioContext.currentTime
        );
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(1500, this.audioContext.currentTime);
        break;
      
      default:
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    }

    // Set volume and envelope with mobile-optimized settings
    const baseVolume = isAccent ? volume * 1.2 : volume * 0.8;
    const now = this.audioContext.currentTime;
    
    // Longer attack and release times for mobile, especially Android
    const attackTime = this.isAndroid ? 0.003 : (this.isMobile ? 0.002 : 0.001);
    const releaseTime = this.isAndroid ? 0.2 : (this.isMobile ? 0.15 : 0.1);
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(baseVolume, now + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);

    // Start and stop the oscillator
    oscillator.start(now);
    oscillator.stop(now + releaseTime);

    // Clean up
    setTimeout(() => {
      try {
        oscillator.disconnect();
        gainNode.disconnect();
        filterNode.disconnect();
      } catch (e) {
        // Ignore errors when disconnecting already disconnected nodes
      }
    }, Math.max(200, releaseTime * 1000 + 50));
  }

  nextNote() {
    // Advance current note and time by a subdivision
    const secondsPerBeat = 60.0 / this.currentBpm;
    const secondsPerSubdivision = secondsPerBeat / this.subdivisionValue;
    this.nextNoteTime += secondsPerSubdivision;
    
    // Advance the subdivision number
    this.currentSubdivision = (this.currentSubdivision + 1) % this.subdivisionValue;
    
    // If we've completed all subdivisions, advance to next beat
    if (this.currentSubdivision === 0) {
      this.currentNote = (this.currentNote + 1) % this.beatsPerMeasure;
    }
  }

  scheduleNote(beatNumber, subdivisionNumber, time) {
    // Push the note on the queue, even if we're not playing
    this.notesInQueue.push({ 
      note: beatNumber, 
      subdivision: subdivisionNumber,
      time: time 
    });

    // Clean up old notes from the queue (mobile optimization)
    const currentTime = this.audioContext.currentTime;
    this.notesInQueue = this.notesInQueue.filter(note => note.time > currentTime - 1.0);

    // Determine if this is a main beat or subdivision
    const isMainBeat = subdivisionNumber === 0;
    const isAccent = this.accentFirstBeat && beatNumber === 0 && isMainBeat;
    
    // Use different volume for subdivisions
    const noteVolume = isMainBeat ? this.volume : this.subdivisionVolume;
    
    // Create the click sound
    this.createClickSound(
      this.clickFrequency, 
      isAccent, 
      noteVolume, 
      this.clickSoundType
    );
    
    // Call the callback if provided
    if (this.onBeat && isMainBeat) {
      this.onBeat(beatNumber);
    }
    if (this.onSubdivision) {
      this.onSubdivision(beatNumber, subdivisionNumber);
    }
  }

  scheduler() {
    if (!this.isRunning || !this.audioContext) return;

    // While there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.currentNote, this.currentSubdivision, this.nextNoteTime);
      this.nextNote();
    }
    
    // Android optimization: Schedule additional notes if we have room
    if (this.isAndroid) {
      let extraScheduleTime = this.scheduleAheadTime * 1.5; // 50% more buffer for Android
      while (this.nextNoteTime < this.audioContext.currentTime + extraScheduleTime && this.notesInQueue.length < 10) {
        this.scheduleNote(this.currentNote, this.currentSubdivision, this.nextNoteTime);
        this.nextNote();
      }
    }
  }

  async start(bpm, beatsPerMeasure = 4, accentFirstBeat = true, clickSound = 'classic', volume = 0.7, subdivisionValue = 1, subdivisionVolume = 0.5, onBeat = null, onSubdivision = null) {
    if (this.isRunning) return;

    // Ensure audio context is created and running
    const audioReady = await this.ensureAudioContext();
    if (!audioReady) {
      console.error('Failed to initialize audio context');
      return false;
    }

    this.currentBpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.accentFirstBeat = accentFirstBeat;
    this.clickSoundType = clickSound;
    this.volume = volume;
    this.subdivisionValue = subdivisionValue;
    this.subdivisionVolume = subdivisionVolume;
    this.onBeat = onBeat;
    this.onSubdivision = onSubdivision;
    this.currentNote = 0;
    this.currentSubdivision = 0;
    this.notesInQueue = [];
    this.isRunning = true;

    // Set click frequency based on sound type
    switch (clickSound) {
      case 'classic': this.clickFrequency = 800; break;
      case 'wood': this.clickFrequency = 1000; break;
      case 'electronic': this.clickFrequency = 1200; break;
      case 'sine': this.clickFrequency = 600; break;
      default: this.clickFrequency = 800;
    }

    // CRITICAL FIX: Schedule the first note immediately for instant response
    this.nextNoteTime = this.audioContext.currentTime + 0.005; // 5ms delay for immediate response
    
    // Schedule the first note right away
    this.scheduleNote(this.currentNote, this.currentSubdivision, this.nextNoteTime);
    this.nextNote();

    // Start the timer worker or RAF timer
    if (this.timerWorker) {
      this.timerWorker.postMessage({ interval: this.lookahead });
      this.timerWorker.postMessage('start');
    } else if (this.startRafTimer) {
      this.startRafTimer();
    }

    return true;
  }

  stop() {
    this.isRunning = false;
    if (this.timerWorker) {
      this.timerWorker.postMessage('stop');
    }
    if (this.stopRafTimer) {
      this.stopRafTimer();
    }
    this.notesInQueue = [];
  }

  updateTempo(bpm) {
    this.currentBpm = bpm;
  }

  updateSettings({ beatsPerMeasure, accentFirstBeat, clickSound, volume, subdivisionValue, subdivisionVolume }) {
    if (beatsPerMeasure !== undefined) this.beatsPerMeasure = beatsPerMeasure;
    if (accentFirstBeat !== undefined) this.accentFirstBeat = accentFirstBeat;
    if (clickSound !== undefined) this.clickSoundType = clickSound;
    if (volume !== undefined) this.volume = volume;
    if (subdivisionValue !== undefined) this.subdivisionValue = subdivisionValue;
    if (subdivisionVolume !== undefined) this.subdivisionVolume = subdivisionVolume;
  }

  // Test method to verify immediate audio response
  async testImmediateClick() {
    const audioReady = await this.ensureAudioContext();
    if (!audioReady) return false;
    
    console.log('Testing immediate click - Android optimizations:', this.isAndroid);
    
    // Create immediate click sound
    this.createClickSound(800, true, 0.8, 'classic');
    
    return true;
  }

  // Debug method to get timing information
  getTimingInfo() {
    if (!this.audioContext) return null;
    
    return {
      currentTime: this.audioContext.currentTime,
      nextNoteTime: this.nextNoteTime,
      scheduleAheadTime: this.scheduleAheadTime,
      lookahead: this.lookahead,
      isMobile: this.isMobile,
      isAndroid: this.isAndroid,
      outputLatency: this.audioContext.outputLatency,
      sampleRate: this.audioContext.sampleRate,
      state: this.audioContext.state,
      queueLength: this.notesInQueue.length
    };
  }

  // Clean up resources
  destroy() {
    this.stop();
    if (this.timerWorker) {
      this.timerWorker.terminate();
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export default AudioEngine;
