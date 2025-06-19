import React, { useState, useRef } from 'react';
import { Upload, Play, Pause, Square, Settings, Film } from 'lucide-react';
import FileManager from './components/FileManager';
import CodeStreamer from './components/CodeStreamer';
import ControlPanel from './components/ControlPanel';
import VideoGallery from './components/VideoGallery';

export interface FileData {
  id: string;
  name: string;
  content: string;
  language: string;
}

function App() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState(50);
  const [isRecording, setIsRecording] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [pendingVideo, setPendingVideo] = useState<{
    blob: Blob;
    filename: string;
    originalFilename: string;
    language: string;
    duration: number;
  } | null>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const codeStreamerRef = useRef<any>(null);

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
    // Force a re-render by briefly changing the selected file
    const currentFile = selectedFile;
    setSelectedFile(null);
    setTimeout(() => {
      setSelectedFile(currentFile);
    }, 10);
  };

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording);
  };

  const handleRecordingData = async (blob: Blob, duration: number) => {
    if (!selectedFile) return;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `code-stream-${selectedFile.name.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
    
    // Set pending video for user to save to gallery
    setPendingVideo({
      blob,
      filename: fileName,
      originalFilename: selectedFile.name,
      language: selectedFile.language,
      duration
    });

    // Auto-open gallery to show the new recording
    setIsGalleryOpen(true);
    
    console.log(`Video recorded: ${fileName} (${duration}s)`);
  };

  const handlePendingVideoSaved = () => {
    setPendingVideo(null);
  };

  const handleOpenGallery = () => {
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
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
          <p className="text-gray-400 text-xl font-medium">
            Create stunning vertical videos with streaming code animations
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Manager */}
          <div className="lg:col-span-1">
            <FileManager
              files={files}
              onFilesUploaded={handleFilesUploaded}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
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
              onOpenGallery={handleOpenGallery}
              onResetStream={handleResetStream}
              selectedFile={selectedFile}
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
                onClick={handleOpenGallery}
                className="bg-white hover:bg-gray-200 text-black px-8 py-3 rounded-lg font-bold text-lg transition-colors border-2 border-white"
              >
                Open Gallery to Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Video Gallery Modal */}
      <VideoGallery
        isOpen={isGalleryOpen}
        onClose={handleCloseGallery}
        pendingVideo={pendingVideo}
        onPendingVideoSaved={handlePendingVideoSaved}
      />
    </div>
  );
}

export default App;