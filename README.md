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
│   ├── CircularBPMDial.js    # Interactive BPM control
│   ├── MetronomeControls.js  # Main metronome interface
│   └── SongManager.js        # Song CRUD operations
├── stores/             # State management
│   └── metronomeStore.js     # Zustand store
├── theme/              # Material UI theming
│   └── theme.js              # Custom theme configuration
├── utils/              # Utilities
│   └── audioEngine.js        # Web Audio API wrapper
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

## 📄 License

This project is licensed under the MIT License.

## 🎉 Acknowledgments

- Material UI team for the excellent component library
- Web Audio API community for timing techniques
- React team for the amazing framework
