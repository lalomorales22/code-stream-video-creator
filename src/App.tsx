import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Square, Settings, Film, ExternalLink } from 'lucide-react';
import FileManager from './components/FileManager';
import CodeStreamer from './components/CodeStreamer';
import ControlPanel from './components/ControlPanel';
import UnifiedGallery from './components/UnifiedGallery';
import FullClipStudio from './components/FullClipStudio';
import ColorCustomizer, { ColorScheme } from './components/ColorCustomizer';
import LandingPage from './pages/LandingPage';

export interface FileData {
  id: string;
  name: string;
  content: string;
  language: string;
}

const defaultColorScheme: ColorScheme = {
  keywords: '#FF6B9D',
  operators: '#4ECDC4',
  strings: '#95E1D3',
  numbers: '#FFE66D',
  comments: '#A8A8A8',
  classes: '#FF8C42',
  functions: '#6BCF7F',
  background: '#0A0A0A',
  text: '#FFFFFF',
  lineNumbers: '#4ECDC4',
  cursor: '#FF6B9D'
};

function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState(50);
  const [isRecording, setIsRecording] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'videos' | 'fullclip'>('videos');
  const [isColorCustomizerOpen, setIsColorCustomizerOpen] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>(defaultColorScheme);
  const [isFullClipStudioOpen, setIsFullClipStudioOpen] = useState(false);
  const [videoForFullClip, setVideoForFullClip] = useState<any>(null);
  const [pendingVideo, setPendingVideo] = useState<{
    blob: Blob;
    filename: string;
    originalFilename: string;
    language: string;
    duration: number;
    content: string;
    mimeType: string;
  } | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const codeStreamerRef = useRef<any>(null);

  const handleEnterApp = () => {
    setShowLanding(false);
  };

  const handleFilesUploaded = (uploadedFiles: FileData[]) => {
    setFiles(prev => [...prev, ...uploadedFiles]);
  };

  const handleFileSelect = (file: FileData) => {
    setSelectedFile(file);
    setIsStreaming(false);
  };

  const handleStreamingToggle = () => {
    setIsStreaming(!isStreaming);
  };

  const handleResetStream = () => {
    setIsStreaming(false);
    const currentFile = selectedFile;
    setSelectedFile(null);
    setTimeout(() => {
      setSelectedFile(currentFile);
    }, 10);
  };

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
  };

  const handleRecordingData = async (blob: Blob, duration: number, mimeType: string) => {
    if (!selectedFile) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `code-stream-${selectedFile.name.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
    
    setPendingVideo({
      blob,
      filename: fileName,
      originalFilename: selectedFile.name,
      language: selectedFile.language,
      duration,
      content: selectedFile.content,
      mimeType
    });

    setGalleryTab('videos');
    setIsGalleryOpen(true);
    
    console.log(`Video recorded: ${fileName} (${duration}s) with MIME type: ${mimeType}`);
  };

  const handlePendingVideoSaved = () => {
    setPendingVideo(null);
  };

  const handleOpenGallery = (tab: 'videos' | 'fullclip' = 'videos') => {
    setGalleryTab(tab);
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
  };

  const handleOpenFullClipStudio = () => {
    setGalleryTab('fullclip');
    setIsGalleryOpen(true);
  };

  const handleColorSchemeChange = (newColorScheme: ColorScheme) => {
    setColorScheme(newColorScheme);
  };

  const handleToggleColorCustomizer = () => {
    setIsColorCustomizerOpen(!isColorCustomizerOpen);
  };

  // Listen for custom events from gallery
  React.useEffect(() => {
    const handleOpenFullClipGallery = () => {
      setGalleryTab('fullclip');
      setIsGalleryOpen(true);
    };

    window.addEventListener('openFullClipGallery', handleOpenFullClipGallery);
    
    return () => {
      window.removeEventListener('openFullClipGallery', handleOpenFullClipGallery);
    };
  }, []);

  // Show landing page first
  if (showLanding) {
    return <LandingPage onEnterApp={handleEnterApp} />;
  }

  return (
    <div className="min-h-screen bg-black text-white relative">
      <div className="container mx-auto px-6 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 border-2 border-white rounded-lg">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight">
              CodeStream
            </h1>
          </div>
          <p className="text-gray-400 text-xl font-medium mb-6">
            Create stunning vertical videos with streaming code animations
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Manager */}
          <div className="lg:col-span-1 space-y-6">
            <FileManager
              files={files}
              onFilesUploaded={handleFilesUploaded}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
            
            {/* Color Customizer */}
            <ColorCustomizer
              colorScheme={colorScheme}
              onColorChange={handleColorSchemeChange}
              isOpen={isColorCustomizerOpen}
              onToggle={handleToggleColorCustomizer}
            />
          </div>

          {/* Code Streamer */}
          <div className="lg:col-span-1">
            <CodeStreamer
              ref={codeStreamerRef}
              file={selectedFile}
              isStreaming={isStreaming}
              speed={streamSpeed}
              isRecording={isRecording}
              onRecordingData={handleRecordingData}
              colorScheme={colorScheme}
            />
          </div>

          {/* Control Panel */}
          <div className="lg:col-span-1">
            <ControlPanel
              isStreaming={isStreaming}
              isRecording={isRecording}
              speed={streamSpeed}
              onToggleStreaming={handleStreamingToggle}
              onToggleRecording={handleRecordingToggle}
              onSpeedChange={setStreamSpeed}
              onOpenGallery={() => handleOpenGallery('videos')}
              onResetStream={handleResetStream}
              selectedFile={selectedFile}
              onOpenFullClipStudio={handleOpenFullClipStudio}
            />
          </div>
        </div>

        {/* Success Message for New Recording */}
        {pendingVideo && !isGalleryOpen && (
          <div className="mt-12 text-center">
            <div className="bg-black border-2 border-white rounded-xl p-8 max-w-md mx-auto">
              <h3 className="text-2xl font-bold mb-4 text-white">🎬 Recording Complete!</h3>
              <p className="text-gray-400 mb-6 text-lg">
                Your MP4 video is ready to save to the gallery
              </p>
              <button
                onClick={() => handleOpenGallery('videos')}
                className="bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-lg font-bold text-lg transition-colors border-2 border-white"
              >
                Open Gallery to Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Built with Bolt Tag - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40">
        <a
          href="https://bolt.new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-black border-2 border-white text-white px-4 py-2 rounded-lg 
                   font-bold text-sm transition-all duration-200 hover:bg-white hover:text-black hover:scale-105
                   shadow-lg backdrop-blur-sm"
          style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.3)' }}
        >
          <span className="text-lg">⚡</span>
          Built with Bolt
        </a>
      </div>

      {/* Unified Gallery Modal */}
      <UnifiedGallery
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        initialTab={galleryTab}
        pendingVideo={pendingVideo}
        onPendingVideoSaved={handlePendingVideoSaved}
      />

      {/* FullClip Studio Modal */}
      <FullClipStudio
        isOpen={isFullClipStudioOpen}
        onClose={() => setIsFullClipStudioOpen(false)}
        selectedVideo={videoForFullClip}
        onVideoSaved={() => {
          setIsFullClipStudioOpen(false);
          setGalleryTab('fullclip');
          setIsGalleryOpen(true);
        }}
      />
    </div>
  );
}

export default App;