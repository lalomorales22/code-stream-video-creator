# CodeStream

**Create stunning vertical videos with streaming code animations, AI-generated narration, professional captions, and custom avatars**

![Screenshot 2025-06-21 at 4 34 49 PM](https://github.com/user-attachments/assets/c330bf41-0b7b-4a9e-9cf7-c6f3542f1670)
![Screenshot 2025-06-22 at 3 57 00 PM](https://github.com/user-attachments/assets/d063c409-2bc3-4819-94a9-ff8e3ba2cccb)

## 🚀 What's New in CodeStream 2.0

### 🎬 **Unified FullClip Studio** - Complete Video Production Suite
- **🎯 All-in-One Interface**: Create complete social media videos in a single, streamlined workflow
- **🤖 AI Script Generation**: Powered by XAI's Grok model to analyze your actual code and create contextual narration
- **🎵 Professional Audio**: ElevenLabs integration for high-quality voice synthesis with multiple voice options
- **📝 Smart Captions**: Automatically generated and embedded captions with customizable styling
- **🐧 Avatar Integration**: Upload custom images, generate AI avatars, or choose from preset penguin avatars
- **📱 Social Media Ready**: Perfect vertical format (9:16) optimized for TikTok, Instagram, YouTube Shorts, and X

### 🎨 **Advanced Customization**
- **🎨 Color Themes**: Multiple preset themes (Cyberpunk, Ocean, Sunset, Forest) plus full custom color control
- **⚡ Ultra-Fast Streaming**: Revolutionary speed controls from detailed tutorials to ludicrous speed (entire files in seconds)
- **🎯 Syntax Highlighting**: Beautiful, customizable syntax highlighting for 15+ programming languages
- **💎 Apple-Level Design**: Professional UI with smooth animations and micro-interactions

### 💾 **Dual Gallery System**
- **📹 Video Gallery**: Basic code streaming videos - perfect starting point for content creation
- **🎬 FullClip Gallery**: Complete social media videos with audio, captions, and avatars
- **💾 Local Storage**: Everything saved locally using IndexedDB with SQL.js for reliability and privacy
- **🔄 Seamless Workflow**: Videos → FullClip Studio → Complete Social Media Content

## Inspiration

The inspiration for CodeStream came from the growing popularity of vertical video content on platforms like TikTok, Instagram Reels, and YouTube Shorts. As developers, we often want to share our code in an engaging, visual way that captures attention in today's short-form content landscape. Traditional screen recordings of code are often boring, hard to follow, and don't translate well to mobile-first vertical formats.

We envisioned a tool that could transform any piece of code into a captivating, cinema-quality vertical video with smooth streaming animations, AI-generated narration, professional captions, and custom avatars - perfect for social media, educational content, and developer portfolios.

## What it does

CodeStream is a comprehensive web application that transforms static code files into dynamic, vertical video content with professional audio narration, captions, and custom avatars. Here's what it offers:

### 🎯 Core Features

#### **📁 File Upload & Management**
- Upload multiple code files in 15+ programming languages
- Smart language detection and syntax highlighting
- Organized file management with preview capabilities
- Drag-and-drop interface for easy file handling

#### **⚡ Real-time Code Streaming**
- Watch your code appear character by character with ultra-fast customizable speed
- Revolutionary speed controls: from detailed tutorials to ludicrous speed (entire files in seconds)
- Beautiful syntax highlighting with custom color schemes
- Smooth cursor animations and auto-scrolling
- Pause/resume functionality with proper state management

#### **🎬 Unified FullClip Studio**
- **🤖 AI-Powered Script Generation**: Analyzes your actual code content to create relevant, contextual narration
- **🎵 Professional Audio Production**: ElevenLabs integration with multiple voice options and real-time preview
- **📝 Smart Caption System**: Automatic generation with customizable styling and perfect synchronization
- **🐧 Avatar Management**: Upload custom images, generate AI avatars with XAI, or choose preset penguin avatars
- **⚙️ Collapsible Settings**: Clean, organized interface with API settings tucked away when not needed
- **🎯 Streamlined Workflow**: Logical progression from script to audio to avatar to final video

#### **🎥 High-Quality Video Recording**
- Record streaming animations as MP4 videos optimized for vertical viewing (9:16 aspect ratio)
- Professional 720p resolution at 30fps
- H.264 codec for maximum compatibility (QuickTime, social media, all players)
- Real-time recording with progress indicators

#### **📱 Social Media Integration**
- **🚀 Direct Sharing**: Built-in sharing for X (Twitter), TikTok, Instagram, and YouTube
- **📋 Smart Copy**: Automatic caption generation for each platform
- **🎯 Optimized Format**: Perfect 9:16 vertical format for all social platforms
- **💎 Professional Quality**: Broadcast-ready videos suitable for any platform

### 🎨 Advanced Customization

#### **🌈 Color Customization**
- **🎨 Preset Themes**: Cyberpunk, Ocean, Sunset, Forest themes with professional color palettes
- **🎯 Custom Colors**: Full control over syntax highlighting, background, cursor, and line numbers
- **👁️ Live Preview**: See changes in real-time with interactive preview
- **💾 Persistent Settings**: Color schemes saved across sessions

#### **🐧 Avatar System**
- **📤 Upload Support**: Use your own images (PNG, JPG, GIF, etc.)
- **🤖 AI Generation**: Create custom penguin avatars with XAI's image generation
- **🎨 Preset Collection**: Professional penguin avatars (Classic, Cool, Smart, Tech)
- **📍 Flexible Positioning**: Place avatars in any corner with customizable size
- **💾 Persistent Storage**: All avatars saved permanently in local database

#### **🌍 Multi-language Support**
Supports JavaScript, TypeScript, Python, Java, C++, HTML, CSS, React, and many more with language-specific syntax highlighting and AI analysis.

## How we built it

### Technology Stack
- **Frontend**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS for rapid, responsive design with custom color system
- **Icons**: Lucide React for consistent, beautiful iconography
- **Database**: SQL.js with IndexedDB for client-side video and avatar storage
- **Video Recording**: Canvas API with MediaRecorder for high-quality MP4 generation
- **AI Integration**: XAI Grok API for intelligent script generation and image creation
- **Audio Synthesis**: ElevenLabs API for professional voice generation
- **Build Tool**: Vite for fast development and optimized production builds
- **Development Platform**: Built with [Bolt](https://bolt.new) for rapid prototyping and deployment

### Architecture Decisions

#### **🎯 Unified Studio Approach**
- **📱 Single Interface**: All video creation features in one streamlined FullClip Studio
- **🔄 Logical Workflow**: API Settings → Voice → Script → Audio → Avatar → Captions → Create
- **⚙️ Collapsible Design**: Clean interface with advanced settings hidden by default
- **🎨 Intuitive Layout**: Left sidebar for controls, right sidebar for video preview

#### **🎨 Canvas-Based Rendering**
Used HTML5 Canvas for precise control over video output:
- Ensures consistent 720x1280 resolution for vertical videos
- Enables custom styling, animations, and avatar overlay
- Provides smooth 30fps recording with professional quality
- Real-time rendering with syntax highlighting and cursor animations

#### **🤖 AI-Powered Content Generation**
- **📄 File Analysis**: Extracts and analyzes actual code content
- **🎯 Contextual Scripts**: AI generates narration specific to the uploaded code
- **💬 Natural Language**: Creates conversational, educational commentary
- **⏱️ Duration Matching**: Scripts automatically timed to video length

#### **🎵 Professional Audio Pipeline**
- **🎤 Voice Selection**: Multiple professional voices from ElevenLabs
- **▶️ Real-time Preview**: Audio playback with progress tracking
- **🎛️ Quality Control**: High-bitrate audio generation for professional results

#### **💾 Client-Side Storage**
Implemented robust local database using SQL.js + IndexedDB:
- No server required - everything runs in the browser
- Persistent storage across sessions with automatic backup
- Efficient binary blob handling for large video files and avatar images
- Dual table structure for basic videos and complete FullClip videos

#### **⚡ Ultra-Fast Animation System**
- Character-by-character streaming with revolutionary speed controls
- Ludicrous speed mode: entire files rendered in seconds
- Smooth cursor animations with glow effects
- Auto-scrolling for long files with proper viewport management
- Pause/resume state management with visual indicators

## Challenges we ran into

### 1. Unified Workflow Design
**Challenge**: Creating a single interface that handles the entire video production pipeline without overwhelming users.
**Solution**: Implemented collapsible API settings, logical workflow progression, and clean separation between controls and preview.

### 2. AI Script Generation Quality
**Challenge**: Creating AI scripts that actually describe the specific code being shown, not generic programming concepts.
**Solution**: Implemented file content analysis that feeds actual code to the AI, enabling contextual, specific commentary about the exact functions, variables, and patterns in the user's code.

### 3. Avatar Management & Persistence
**Challenge**: Storing user-uploaded and AI-generated avatars permanently across sessions.
**Solution**: Extended the database schema to include avatar storage with proper MIME type handling and persistent URLs.

### 4. Cross-Platform Video Compatibility
**Challenge**: Ensuring videos work across all platforms, especially QuickTime Player which had compatibility issues.
**Solution**: Implemented H.264 baseline profile encoding with proper MP4 container format, ensuring maximum compatibility across all players and platforms.

### 5. Real-Time Canvas Performance
**Challenge**: Maintaining smooth 30fps recording while rendering complex syntax highlighting, avatars, and animations.
**Solution**: Optimized rendering pipeline with efficient canvas operations, requestAnimationFrame timing, and smart redraw strategies.

### 6. Social Media Integration
**Challenge**: Creating platform-specific sharing experiences with proper formatting and hashtags.
**Solution**: Built custom sharing functions for each platform with optimized text, hashtags, and user-friendly instructions.

## Accomplishments that we're proud of

### Technical Achievements
- **🏗️ Zero-Server Architecture**: Built a complete video production studio that runs entirely in the browser
- **🤖 AI-Powered Content**: Successfully integrated cutting-edge AI for contextual script generation and avatar creation
- **🎬 Professional Quality**: Achieved broadcast-quality 720p vertical videos with synchronized audio and captions
- **🌐 Universal Compatibility**: Videos work perfectly across all platforms and players
- **💾 Robust Storage**: Implemented a reliable local database system handling large multimedia files and persistent avatars

### User Experience
- **🎯 Intuitive Workflow**: Created a seamless flow from code upload to professional video output
- **⚡ Real-Time Feedback**: Provides immediate visual and audio feedback for all user actions
- **🎬 Professional Results**: Generates content suitable for social media, education, and professional portfolios
- **♿ Accessibility**: High contrast design and customizable color schemes for all users

### Innovation
- **🔄 Complete Pipeline**: Single interface handles entire video production from code to social media
- **🤖 Contextual Intelligence**: Scripts mention specific functions, variables, and patterns from user's code
- **🐧 Avatar Integration**: Seamless avatar overlay with custom positioning and AI generation
- **📱 Social Media Ready**: Perfect vertical format optimized for modern platforms with built-in sharing

## What we learned

### Technical Insights
- **🎨 Canvas API Mastery**: Deep understanding of HTML5 Canvas for professional video generation
- **🤖 AI Integration**: Successfully combining multiple AI services for content creation
- **💾 Browser Storage Evolution**: Advanced techniques for handling large multimedia files locally
- **🎥 Video Codec Optimization**: Understanding codec selection for maximum compatibility
- **⚡ Real-Time Rendering**: Techniques for maintaining performance during complex animations

### Development Process
- **🏗️ Component Architecture**: Building scalable, maintainable React applications with unified interfaces
- **🔄 State Management**: Managing complex state across multiple components and modals
- **🛡️ Error Handling**: Building robust error handling for AI services and file operations
- **👤 User Experience**: Creating intuitive workflows for complex technical processes

### Product Development
- **🤖 AI-First Design**: Building applications that leverage AI as a core feature
- **📱 Content Creation Tools**: Understanding the needs of modern content creators
- **🌐 Cross-Platform Compatibility**: Ensuring broad device and software support
- **⚡ Performance Optimization**: Balancing feature richness with smooth performance

## What's next for CodeStream

### Short-term Enhancements (Next 3 months)
- **🎨 Enhanced Themes**: More preset color themes and advanced customization options
- **🎵 Audio Effects**: Background music, sound effects, and audio editing capabilities
- **📦 Batch Processing**: Upload and process multiple files simultaneously
- **📤 Export Options**: Support for different video formats and resolutions
- **📋 Template System**: Pre-built templates for common use cases

### Medium-term Features (3-6 months)
- **☁️ Cloud Storage Integration**: Optional cloud backup with Google Drive, Dropbox
- **👥 Collaboration Tools**: Share projects and collaborate on video creation
- **🎬 Advanced Animations**: Zoom effects, highlighting, and custom transitions
- **📊 Analytics Dashboard**: Track video performance and engagement metrics
- **📱 Mobile Optimization**: Enhanced mobile experience and touch controls

### Long-term Vision (6+ months)
- **📡 Live Streaming**: Real-time code streaming for educational purposes
- **📱 Mobile App**: Native iOS and Android apps for on-the-go editing
- **🛒 Marketplace**: Community-driven template and theme marketplace
- **🏢 Enterprise Features**: Team management, branding controls, and advanced analytics
- **🔌 API Development**: Public API for third-party integrations and custom workflows

### Platform Expansion
- **📱 Social Media Integration**: Direct publishing to TikTok, Instagram, and YouTube
- **🎓 Educational Partnerships**: Integration with coding bootcamps and online learning platforms
- **🛠️ Developer Tool Integration**: Plugins for VS Code, GitHub, and other developer tools
- **🎬 Content Creator Tools**: Advanced editing features for professional content creators

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

#### Basic Video Creation
1. **📁 Upload Files**: Use the File Manager to upload your code files
2. **👁️ Select & Preview**: Choose a file to preview in the Code Streamer
3. **🎨 Customize**: Adjust streaming speed and color themes
4. **🎬 Record**: Start recording your streaming animation
5. **💾 Save**: Save to Video Gallery with custom naming

#### Complete FullClip Production
1. **🎬 Create Basic Video**: Follow steps above to create a basic video
2. **🎵 Open FullClip Studio**: Click "Create FullClip" on any video in the gallery
3. **⚙️ Configure APIs**: Set your XAI and ElevenLabs API keys (one-time setup)
4. **🎤 Choose Voice**: Select from professional voice options
5. **🤖 Generate Script**: Let AI analyze your code and create contextual narration
6. **🎵 Create Audio**: Generate professional narration with real-time preview
7. **🐧 Add Avatar**: Upload custom images, generate AI avatars, or choose presets
8. **📝 Style Captions**: Customize caption appearance and positioning
9. **🎬 Create FullClip**: Combine everything into a professional social media video
10. **📱 Share**: Download and share directly to X, TikTok, Instagram, or YouTube

### API Keys Required for AI Features
- **XAI API Key**: Get from [x.ai](https://x.ai) for AI script generation and avatar creation
- **ElevenLabs API Key**: Get from [elevenlabs.io](https://elevenlabs.io) for voice synthesis

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🎯 The CodeStream Experience

**From Code to Social Media in Minutes**

1. **📁 Upload** your code file
2. **🎬 Record** streaming animation with ultra-fast speed controls
3. **🎵 Create FullClip** with AI narration, captions, and avatars
4. **📱 Share** directly to TikTok, Instagram, YouTube Shorts, and X

**The result?** Professional, engaging videos that actually explain your code, perfect for social media, educational content, and developer portfolios.

---

**Built with ❤️ for the developer community**

*Powered by [Bolt](https://bolt.new) - The fastest way to build and deploy web applications*

*AI-Powered by XAI Grok and ElevenLabs for next-generation content creation*