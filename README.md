# 🥁 Pro Metronome

A professional, responsive metronome web application built with React and Material UI. Perfect for musicians, drummers, and music practice sessions.

## ✨ Features

### 🎵 Core Metronome
- **Adjustable BPM**: 30-300 BPM range with precise timing
- **Interactive Circular Dial**: Modern radial BPM control with touch support
- **Multiple Time Signatures**: 4/4, 3/4, 2/4, 6/8, 9/8, 12/8
- **Accent Controls**: Customizable accent on first beat
- **Multiple Click Sounds**: Classic, Wood Block, Electronic, Sine Wave
- **Volume Control**: Adjustable click volume
- **Visual Beat Indicators**: Real-time beat visualization

### ⏲️ Timer & Practice
- **Practice Timer**: Set duration for focused practice sessions
- **Auto-stop**: Automatically stops when timer reaches zero
- **Visual Countdown**: Real-time timer display

### 🎶 Song Management
- **Save Songs**: Store practice routines with BPM, time signature, and duration
- **Song Library**: Organized list of saved songs
- **Quick Load**: Instantly load song settings
- **Search & Filter**: Find songs quickly
- **Edit & Delete**: Full CRUD operations for song management

### 🎤 Live BPM Detector
- **Real-Time Analysis**: Detect BPM from live microphone input
- **Drum Detection**: Optimized for drum and percussion instruments
- **Auto-Sync**: Automatically sync detected BPM to metronome
- **Visual Feedback**: Audio level monitoring and beat visualization
- **Confidence Scoring**: Shows detection accuracy
- **Manual Sync**: One-click sync to metronome when ready

### 🎨 UI & Design
- **Dark/Light Theme**: Persistent theme preference
- **Responsive Design**: Optimized for mobile, tablet, and desktop
- **Material UI**: Clean, professional interface
- **Smooth Animations**: Visual feedback and beat pulse animation
- **Touch-Friendly**: Optimized for mobile interaction

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ProMetronome
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## 🛠️ Technologies Used

- **React 18** - Modern React with hooks
- **Material UI v5** - Component library and theming
- **Zustand** - Lightweight state management
- **Web Audio API** - High-precision audio timing
- **Web Workers** - Precise metronome timing
- **LocalStorage** - Persistent data storage

## 📱 Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🎯 Key Features Explained

### Circular BPM Dial
The interactive circular dial provides an intuitive way to adjust BPM:
- Drag the handle to change tempo
- Visual feedback with color gradients
- Touch-friendly for mobile devices
- Real-time BPM display

### Audio Engine
High-precision timing using:
- Web Audio API for sound generation
- Web Workers for accurate scheduling
- Multiple waveform types for different click sounds
- Dynamic volume and accent control

### Song Management
Save and organize your practice routines:
- Store BPM, time signature, and practice duration
- Add notes for each song
- Quick search and filtering
- Load songs instantly to metronome

### Responsive Design
Optimized layouts for all devices:
- Mobile-first approach
- Touch-friendly controls
- Adaptive grid layouts
- Scalable UI components

## 🔧 Architecture

```
src/
├── components/          # React components
│   ├── CircularBPMDial.js      # Interactive BPM control
│   ├── MetronomeControls.js    # Main metronome interface
│   ├── SongManager.js          # Song CRUD operations
│   └── LiveBPMDetector.js      # Real-time BPM detection
├── stores/             # State management
│   └── metronomeStore.js       # Zustand store
├── theme/              # Material UI theming
│   └── theme.js                # Custom theme configuration
├── utils/              # Utilities
│   └── audioEngine.js          # Web Audio API wrapper
└── App.js              # Main application component
```

## 🎼 Usage Guide

### Basic Operation
1. **Set BPM**: Use the circular dial or +/- buttons
2. **Choose Time Signature**: Select from dropdown menu
3. **Start/Stop**: Large play button to control metronome
4. **Adjust Volume**: Use volume slider
5. **Enable Timer**: Toggle timer and set duration

### Advanced Features
- **Accent First Beat**: Toggle to emphasize the first beat of each measure
- **Click Sounds**: Choose from different click sound types
- **Save Songs**: Create practice routines with specific settings
- **Dark Mode**: Toggle between light and dark themes
- **Live BPM Detection**: Real-time tempo detection from microphone input

### Live BPM Detector Usage
1. **Grant Microphone Access**: Click "Start Listening" and allow microphone permissions
2. **Play Your Instrument**: Start playing drums or any percussive instrument
3. **Monitor Detection**: Watch the audio level meter and detected BPM
4. **Check Confidence**: Higher confidence scores indicate more accurate detection
5. **Sync to Metronome**: Use "Sync to Metronome" button or enable auto-sync
6. **Optimize Setup**: Position microphone close to drums, minimize background noise

### BPM Detection Tips
- **Best Results**: Works optimally with drums, cajons, and percussion
- **Steady Playing**: Play consistent, steady beats for accurate detection
- **Clean Audio**: Reduce background noise and echo
- **Give It Time**: Allow 4-8 beats for the algorithm to analyze your tempo
- **Confidence Threshold**: Auto-sync only activates with >70% confidence

### Mobile Tips
- **Responsive Touch**: All controls are optimized for touch
- **Screen Rotation**: Works in both portrait and landscape
- **Audio Context**: Tap play to initialize audio on mobile browsers

## 🔊 Audio Features

The metronome uses the Web Audio API for:
- **Precise Timing**: Sub-millisecond accuracy
- **Multiple Sounds**: Square, triangle, sawtooth, and sine waves
- **Dynamic Filtering**: Different frequency profiles for each sound
- **Accent Control**: Louder, higher-pitched accents
- **Volume Control**: Real-time volume adjustment

### Live BPM Detection Engine
Advanced real-time tempo detection using:
- **Energy-Based Onset Detection**: Analyzes audio energy peaks to identify beats
- **Median Filtering**: Reduces noise in tempo calculations
- **Confidence Scoring**: Statistical analysis of beat consistency
- **Web Workers**: Audio processing in background thread for smooth performance
- **Adaptive Thresholding**: Automatically adjusts to different playing volumes
- **Beat Memory**: Tracks recent beats for stable BPM calculation

## 💾 Data Persistence

User preferences and songs are automatically saved:
- **Settings**: BPM, time signature, theme preference
- **Songs**: Complete song library with metadata
- **Theme**: Dark/light mode preference
- **Volume**: Last used volume setting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## � Troubleshooting

### Live BPM Detector Issues

**Microphone Access Denied**
- Check browser permissions for microphone access
- Ensure microphone is not being used by another application
- Try refreshing the page and granting permission again

**Poor Detection Accuracy**
- Move microphone closer to your drums/instrument
- Reduce background noise and echo
- Play more consistently with steady timing
- Check that your microphone is working properly

**No BPM Detected**
- Ensure you're playing loud enough for the microphone to pick up
- Try playing with more attack/transient sounds (snare, hi-hat)
- Check audio level meter shows green activity
- Reset detection and try again

**Browser Compatibility**
- Live BPM detection requires a modern browser with Web Audio API support
- Works best in Chrome, Firefox, Safari, and Edge
- Mobile browsers may have limited microphone access

## �📄 License

This project is licensed under the MIT License.

## 🎉 Acknowledgments

- Material UI team for the excellent component library
- Web Audio API community for timing techniques
- React team for the amazing framework
