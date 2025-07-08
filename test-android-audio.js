// Test script for Android audio improvements
// Open browser console and run this script to test audio performance

console.log('=== Android Audio Test ===');

// Check if global audio service is available
if (typeof window.audioService === 'undefined') {
  console.error('Global audio service not available. Make sure the app is loaded.');
} else {
  console.log('Global audio service found!');
  
  // Test immediate audio response
  window.audioService.testAudio().then(result => {
    console.log('Immediate audio test result:', result);
    
    // Get timing information
    const timingInfo = window.audioService.getTimingInfo();
    console.log('=== Audio Timing Info ===');
    console.log('Is Mobile:', timingInfo?.isMobile);
    console.log('Is Android:', timingInfo?.isAndroid);
    console.log('Schedule Ahead Time:', timingInfo?.scheduleAheadTime + 'ms');
    console.log('Lookahead:', timingInfo?.lookahead + 'ms');
    console.log('Output Latency:', timingInfo?.outputLatency + 'ms');
    console.log('Sample Rate:', timingInfo?.sampleRate + 'Hz');
    console.log('Audio Context State:', timingInfo?.state);
    
    // Test metronome start
    console.log('\n=== Testing Metronome Start ===');
    console.log('Starting metronome - first click should be immediate...');
    
    const startTime = performance.now();
    window.audioService.start(120, 4, true, 'classic', 0.8).then(success => {
      const endTime = performance.now();
      console.log('Metronome start result:', success);
      console.log('Time to start:', (endTime - startTime) + 'ms');
      
      // Stop after 5 seconds
      setTimeout(() => {
        window.audioService.stop();
        console.log('Metronome stopped');
      }, 5000);
    });
  });
}
