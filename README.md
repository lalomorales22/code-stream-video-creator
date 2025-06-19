# CodeStream

**Create stunning vertical videos with streaming code animations**
<img width="811" alt="Screenshot 2025-06-19 at 12 04 09 PM" src="https://github.com/user-attachments/assets/9808b09c-1d73-4dcb-a0d8-79f52985a524" />

[![Built with Bolt](https://img.shields.io/badge/Built%20with-Bolt-blue?style=for-the-badge&logo=lightning&logoColor=white)](https://bolt.new)


## Inspiration

The inspiration for CodeStream came from the growing popularity of vertical video content on platforms like TikTok, Instagram Reels, and YouTube Shorts. As developers, we often want to share our code in an engaging, visual way that captures attention in today's short-form content landscape. Traditional screen recordings of code are often boring, hard to follow, and don't translate well to mobile-first vertical formats.

We envisioned a tool that could transform any piece of code into a captivating, cinema-quality vertical video with smooth streaming animations - perfect for social media, educational content, and developer portfolios.

## What it does

CodeStream is a web application that transforms static code files into dynamic, vertical video content. Here's what it offers:

### Core Features
- **File Upload & Management**: Upload multiple code files in various programming languages
- **Real-time Code Streaming**: Watch your code appear character by character with customizable speed
- **High-Quality Recording**: Record streaming animations as MP4 videos optimized for vertical viewing (9:16 aspect ratio)
- **Video Gallery**: Save, organize, and manage all your recorded code videos
- **Multi-language Support**: Supports JavaScript, TypeScript, Python, Java, C++, HTML, CSS, and many more

### Key Capabilities
- **Customizable Speed Control**: Adjust streaming speed from slow and detailed to quick preview
- **Pause/Resume Functionality**: Full control over playback with proper pause/resume states
- **Professional UI**: Clean, modern interface with high contrast black and white design
- **Local Storage**: All videos are saved locally in your browser using IndexedDB
- **Download & Share**: Export videos as MP4 files for sharing on social platforms

## How we built it

### Technology Stack
- **Frontend**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS for rapid, responsive design
- **Icons**: Lucide React for consistent, beautiful iconography
- **Database**: SQL.js with IndexedDB for client-side video storage
- **Video Recording**: Canvas API with MediaRecorder for high-quality MP4 generation
- **Build Tool**: Vite for fast development and optimized production builds
- **Development Platform**: Built with [Bolt](https://bolt.new) for rapid prototyping and deployment

### Architecture Decisions
1. **Component-Based Design**: Modular React components for maintainability
   - `FileManager`: Handles file uploads and selection
   - `CodeStreamer`: Core streaming animation and recording logic
   - `ControlPanel`: Playback controls and settings
   - `VideoGallery`: Video management and playback

2. **Canvas-Based Rendering**: Used HTML5 Canvas for precise control over video output
   - Ensures consistent 720x1280 resolution for vertical videos
   - Enables custom styling and animations
   - Provides smooth 30fps recording

3. **Client-Side Storage**: Implemented local database using SQL.js + IndexedDB
   - No server required - everything runs in the browser
   - Persistent storage across sessions
   - Efficient binary blob handling for video files

4. **Real-Time Animation**: Character-by-character streaming with configurable timing
   - Smooth cursor animations
   - Auto-scrolling for long files
   - Pause/resume state management

## Challenges we ran into

### 1. Video Recording Quality
**Challenge**: Initial recordings were low quality and didn't maintain consistent vertical aspect ratios.
**Solution**: Implemented custom Canvas rendering with fixed 720x1280 resolution and 30fps recording for professional-quality output.

### 2. Browser Storage Limitations
**Challenge**: Large video files quickly exceeded localStorage quotas, causing save failures.
**Solution**: Migrated to IndexedDB with SQL.js for efficient binary data storage and better quota management.

### 3. Streaming Animation Performance
**Challenge**: Character-by-character rendering caused performance issues with large files.
**Solution**: Optimized rendering pipeline with requestAnimationFrame and efficient DOM updates.

### 4. Cross-Browser Compatibility
**Challenge**: MediaRecorder API support varied across browsers, especially for MP4 output.
**Solution**: Implemented codec fallback system (H.264 → VP9 → VP8 → WebM) for maximum compatibility.

### 5. State Management Complexity
**Challenge**: Coordinating streaming, recording, and playback states across multiple components.
**Solution**: Centralized state management in the main App component with clear prop drilling patterns.

## Accomplishments that we're proud of

### Technical Achievements
- **Zero-Server Architecture**: Built a fully functional video creation tool that runs entirely in the browser
- **Professional Video Quality**: Achieved broadcast-quality 720p vertical videos with smooth 30fps recording
- **Robust File Handling**: Successfully processes and displays code from 15+ programming languages
- **Efficient Storage**: Implemented a local database system that handles large video files gracefully

### User Experience
- **Intuitive Interface**: Created a clean, professional UI that's easy to use for developers of all skill levels
- **Real-Time Feedback**: Provides immediate visual feedback for all user actions
- **Mobile-Optimized Output**: Videos are perfectly formatted for modern social media platforms
- **Accessibility**: High contrast design ensures readability across different viewing conditions

### Performance
- **Fast Load Times**: Optimized bundle size and lazy loading for quick startup
- **Smooth Animations**: Maintained 60fps UI animations even during video recording
- **Memory Efficient**: Proper cleanup and garbage collection for long recording sessions

## What we learned

### Technical Insights
- **Canvas API Mastery**: Gained deep understanding of HTML5 Canvas for video generation
- **Browser Storage Evolution**: Learned the limitations and capabilities of modern browser storage APIs
- **Video Codec Complexity**: Understanding the intricacies of web video formats and browser support
- **Performance Optimization**: Techniques for maintaining smooth animations while processing large files

### Development Process
- **Component Architecture**: The importance of clear separation of concerns in React applications
- **State Management**: How to effectively manage complex state across multiple components
- **Error Handling**: Building robust error handling for file operations and browser APIs
- **User Testing**: The value of iterative design based on real user feedback

### Product Development
- **Market Research**: Understanding the growing demand for developer-focused content creation tools
- **Feature Prioritization**: Balancing feature richness with simplicity and performance
- **Cross-Platform Considerations**: Designing for both desktop development and mobile consumption

## What's next for CodeStream

### Short-term Enhancements (Next 3 months)
- **Syntax Highlighting**: Add proper color coding for different programming languages
- **Custom Themes**: Multiple color schemes (dark mode, high contrast, custom branding)
- **Audio Integration**: Add background music and typing sound effects
- **Export Options**: Support for different video formats and resolutions
- **Batch Processing**: Upload and process multiple files simultaneously

### Medium-term Features (3-6 months)
- **Cloud Storage Integration**: Optional cloud backup with services like Google Drive or Dropbox
- **Collaboration Tools**: Share projects and collaborate on code videos
- **Template System**: Pre-built templates for common use cases (tutorials, demos, presentations)
- **Advanced Animations**: Zoom effects, highlighting, and custom transitions
- **Analytics Dashboard**: Track video performance and engagement metrics

### Long-term Vision (6+ months)
- **AI-Powered Features**: Automatic code explanation and commenting
- **Live Streaming**: Real-time code streaming for educational purposes
- **Mobile App**: Native iOS and Android apps for on-the-go editing
- **Marketplace**: Community-driven template and theme marketplace
- **Enterprise Features**: Team management, branding controls, and advanced analytics

### Platform Expansion
- **Social Media Integration**: Direct publishing to TikTok, Instagram, and YouTube
- **Educational Partnerships**: Integration with coding bootcamps and online learning platforms
- **Developer Tool Integration**: Plugins for VS Code, GitHub, and other developer tools
- **API Development**: Public API for third-party integrations and custom workflows

---

## Getting Started

### Prerequisites
- Modern web browser with ES2020 support
- Node.js 16+ (for development)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/codestream.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage
1. Upload your code files using the File Manager
2. Select a file to preview in the Code Streamer
3. Adjust streaming speed and start playback
4. Record your streaming animation
5. Save to gallery and download as MP4

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the developer community**

*Powered by [Bolt](https://bolt.new) - The fastest way to build and deploy web applications*
