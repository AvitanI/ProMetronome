import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import globalAudioService from '../services/globalAudioService';

// Time signatures
export const TIME_SIGNATURES = [
  { value: '4/4', beats: 4, noteValue: 4 },
  { value: '3/4', beats: 3, noteValue: 4 },
  { value: '2/4', beats: 2, noteValue: 4 },
  { value: '6/8', beats: 6, noteValue: 8 },
  { value: '9/8', beats: 9, noteValue: 8 },
  { value: '12/8', beats: 12, noteValue: 8 },
];

// Click sounds
export const CLICK_SOUNDS = [
  { id: 'classic', name: 'Classic', frequency: 800 },
  { id: 'wood', name: 'Wood Block', frequency: 1000 },
  { id: 'electronic', name: 'Electronic', frequency: 1200 },
  { id: 'sine', name: 'Sine Wave', frequency: 600 },
];

// Subdivisions
export const SUBDIVISIONS = [
  { id: 'none', name: 'None', value: 1, label: 'Quarter Notes' },
  { id: 'eighth', name: 'Eighth Notes', value: 2, label: '8th Notes' },
  { id: 'triplets', name: 'Triplets', value: 3, label: 'Triplets' },
  { id: 'sixteenth', name: 'Sixteenth Notes', value: 4, label: '16th Notes' },
];

const useMetronomeStore = create(
  persist(
    (set, get) => ({
      // Metronome state
      bpm: 120,
      isPlaying: false,
      timeSignature: TIME_SIGNATURES[0],
      currentBeat: 0,
      currentSubdivision: 0,
      accentFirstBeat: true,
      clickSound: CLICK_SOUNDS[0],
      subdivision: SUBDIVISIONS[0],
      subdivisionVolume: 0.5,
      volume: 0.7,
      
      // Timer state
      timerEnabled: false,
      timerDuration: 60, // seconds
      timeRemaining: 0,
      
      // Theme state
      isDarkMode: false,
      
      // Songs state
      songs: [],
      currentSong: null,
      
      // History tracking
      sessions: [],
      currentSessionStart: null,
      currentSessionBpms: [],
      
      // Actions
      setBpm: (bpm) => set((state) => {
        const newBpm = Math.max(30, Math.min(300, bpm));
        const updates = { bpm: newBpm };
        
        // Track BPM changes during active session
        if (state.currentSessionStart && state.isPlaying) {
          updates.currentSessionBpms = [...state.currentSessionBpms, newBpm];
        }
        
        // Update global audio engine if playing
        if (state.isPlaying) {
          globalAudioService.updateTempo(newBpm);
        }
        
        return updates;
      }),
      
      setIsPlaying: (isPlaying) => set((state) => {
        console.log('setIsPlaying called:', isPlaying, 'currentSessionStart:', state.currentSessionStart);
        
        if (isPlaying && !state.currentSessionStart) {
          // Start new session
          console.log('Starting new session');
          return {
            isPlaying,
            currentSessionStart: Date.now(),
            currentSessionBpms: [state.bpm]
          };
        } else if (!isPlaying && state.currentSessionStart) {
          // End session
          const sessionDuration = Date.now() - state.currentSessionStart;
          const sessionBpms = [...state.currentSessionBpms];
          const averageBpm = sessionBpms.reduce((sum, bpm) => sum + bpm, 0) / sessionBpms.length;
          
          const newSession = {
            id: Date.now(),
            date: new Date().toISOString(),
            duration: sessionDuration,
            averageBpm: Math.round(averageBpm),
            bpmRange: {
              min: Math.min(...sessionBpms),
              max: Math.max(...sessionBpms)
            },
            timeSignature: state.timeSignature.value,
            subdivision: state.subdivision.name
          };
          
          console.log('Ending session:', newSession);
          
          return {
            isPlaying,
            currentSessionStart: null,
            currentSessionBpms: [],
            sessions: [...state.sessions, newSession]
          };
        }
        return { isPlaying };
      }),
      
      setTimeSignature: (timeSignature) => set({ 
        timeSignature,
        currentBeat: 0 
      }),
      
      setCurrentBeat: (currentBeat) => set({ currentBeat }),
      
      setCurrentSubdivision: (currentSubdivision) => set({ currentSubdivision }),
      
      incrementBeat: () => set((state) => ({
        currentBeat: (state.currentBeat + 1) % state.timeSignature.beats
      })),
      
      setAccentFirstBeat: (accentFirstBeat) => set({ accentFirstBeat }),
      
      setClickSound: (clickSound) => set({ clickSound }),
      
      setSubdivision: (subdivision) => set({ subdivision }),
      
      setSubdivisionVolume: (subdivisionVolume) => set({ subdivisionVolume }),
      
      setVolume: (volume) => set({ volume }),
      
      setTimerEnabled: (timerEnabled) => set({ timerEnabled }),
      
      setTimerDuration: (timerDuration) => set({ timerDuration }),
      
      setTimeRemaining: (timeRemaining) => set({ timeRemaining }),
      
      decrementTimeRemaining: () => set((state) => ({
        timeRemaining: Math.max(0, state.timeRemaining - 1)
      })),
      
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      // Song management
      addSong: (song) => set((state) => ({
        songs: [...state.songs, { ...song, id: Date.now() }]
      })),
      
      updateSong: (id, updatedSong) => set((state) => ({
        songs: state.songs.map(song => 
          song.id === id ? { ...song, ...updatedSong } : song
        )
      })),
      
      deleteSong: (id) => set((state) => ({
        songs: state.songs.filter(song => song.id !== id),
        currentSong: state.currentSong?.id === id ? null : state.currentSong
      })),
      
      setCurrentSong: (song) => set({ currentSong: song }),
      
      loadSong: (song) => set({
        currentSong: song,
        bpm: song.bpm,
        timeSignature: song.timeSignature,
        timerEnabled: !!song.duration,
        timerDuration: song.duration || 60,
        timeRemaining: song.duration || 0,
      }),
      
      // Coach Mode
      coachMode: {
        isActive: false,
        currentExercise: null,
        sessionProgress: null,
        settings: {
          difficulty: 'intermediate',
          autoProgression: true,
          sessionDuration: 300, // 5 minutes default
        },
        history: []
      },

      // Coach Actions
      startCoachExercise: (exercise) => set((state) => ({
        coachMode: {
          ...state.coachMode,
          isActive: true,
          currentExercise: exercise,
          sessionProgress: {
            startTime: Date.now(),
            currentStep: 0,
            completedSteps: 0,
            performance: []
          }
        }
      })),

      stopCoachExercise: () => set((state) => {
        const session = state.coachMode.sessionProgress;
        if (session) {
          const completedSession = {
            id: Date.now(),
            exercise: state.coachMode.currentExercise,
            startTime: session.startTime,
            endTime: Date.now(),
            duration: Date.now() - session.startTime,
            performance: session.performance,
            completedSteps: session.completedSteps,
            success: session.completedSteps >= (state.coachMode.currentExercise?.totalSteps || 1)
          };
          
          return {
            coachMode: {
              ...state.coachMode,
              isActive: false,
              currentExercise: null,
              sessionProgress: null,
              history: [...state.coachMode.history, completedSession]
            }
          };
        }
        return {
          coachMode: {
            ...state.coachMode,
            isActive: false,
            currentExercise: null,
            sessionProgress: null
          }
        };
      }),

      updateCoachProgress: (stepData) => set((state) => ({
        coachMode: {
          ...state.coachMode,
          sessionProgress: {
            ...state.coachMode.sessionProgress,
            currentStep: stepData.currentStep,
            completedSteps: stepData.completedSteps,
            performance: [...(state.coachMode.sessionProgress?.performance || []), stepData]
          }
        }
      })),

      updateCoachSettings: (settings) => set((state) => ({
        coachMode: {
          ...state.coachMode,
          settings: { ...state.coachMode.settings, ...settings }
        }
      })),
      
      // History management
      clearHistory: () => set({ sessions: [] }),
      
      deleteSession: (sessionId) => set((state) => ({
        sessions: state.sessions.filter(session => session.id !== sessionId)
      })),
      
      getHistoryStats: () => {
        const state = get();
        const sessions = state.sessions;
        
        if (sessions.length === 0) {
          return {
            totalSessions: 0,
            totalPracticeTime: 0,
            averageBpm: 0,
            totalPracticeTimeFormatted: '0m 0s'
          };
        }
        
        const totalPracticeTime = sessions.reduce((sum, session) => sum + session.duration, 0);
        const averageBpm = sessions.reduce((sum, session) => sum + session.averageBpm, 0) / sessions.length;
        
        const hours = Math.floor(totalPracticeTime / (1000 * 60 * 60));
        const minutes = Math.floor((totalPracticeTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((totalPracticeTime % (1000 * 60)) / 1000);
        
        let timeFormatted = '';
        if (hours > 0) timeFormatted += `${hours}h `;
        if (minutes > 0) timeFormatted += `${minutes}m `;
        timeFormatted += `${seconds}s`;
        
        return {
          totalSessions: sessions.length,
          totalPracticeTime,
          averageBpm: Math.round(averageBpm),
          totalPracticeTimeFormatted: timeFormatted.trim()
        };
      },

      // Generate sample data for demo purposes
      generateSampleData: () => {
        const sampleSessions = [];
        const now = new Date();
        
        // Generate 20 sample sessions over the last 30 days
        for (let i = 0; i < 20; i++) {
          const daysAgo = Math.floor(Math.random() * 30);
          const sessionDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
          
          // Random session duration between 5-45 minutes
          const duration = (Math.random() * 40 + 5) * 60 * 1000;
          
          // Random BPM between 60-180
          const baseBpm = Math.floor(Math.random() * 120 + 60);
          const bpmVariation = Math.floor(Math.random() * 20 - 10);
          const averageBpm = Math.max(60, Math.min(200, baseBpm + bpmVariation));
          
          const minBpm = Math.max(60, averageBpm - Math.floor(Math.random() * 15));
          const maxBpm = Math.min(200, averageBpm + Math.floor(Math.random() * 15));
          
          const timeSignatures = ['4/4', '3/4', '2/4', '6/8'];
          const subdivisions = ['None', 'Eighth Notes', 'Triplets', 'Sixteenth Notes'];
          
          sampleSessions.push({
            id: Date.now() + i,
            date: sessionDate.toISOString(),
            duration: duration,
            averageBpm: averageBpm,
            bpmRange: {
              min: minBpm,
              max: maxBpm
            },
            timeSignature: timeSignatures[Math.floor(Math.random() * timeSignatures.length)],
            subdivision: subdivisions[Math.floor(Math.random() * subdivisions.length)]
          });
        }
        
        // Sort by date
        sampleSessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        set((state) => ({
          sessions: [...state.sessions, ...sampleSessions]
        }));
      },
      
      // Reset metronome
      reset: () => set((state) => ({
        isPlaying: false,
        currentBeat: 0,
        currentSubdivision: 0,
        timeRemaining: state.timerDuration,
      })),
    }),
    {
      name: 'metronome-storage',
      partialize: (state) => ({
        bpm: state.bpm,
        timeSignature: state.timeSignature,
        accentFirstBeat: state.accentFirstBeat,
        clickSound: state.clickSound,
        subdivision: state.subdivision,
        subdivisionVolume: state.subdivisionVolume,
        volume: state.volume,
        timerEnabled: state.timerEnabled,
        timerDuration: state.timerDuration,
        isDarkMode: state.isDarkMode,
        songs: state.songs,
        sessions: state.sessions,
        coachMode: {
          ...state.coachMode,
          isActive: false, // Don't persist active state
          currentExercise: null, // Don't persist current exercise
          sessionProgress: null, // Don't persist session progress
        },
      }),
    }
  )
);

export default useMetronomeStore;
