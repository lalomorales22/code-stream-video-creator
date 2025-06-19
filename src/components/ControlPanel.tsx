import React from 'react';
import { Play, Pause, Square, Film, Settings, Zap, Clock, GalleryVertical as Gallery, RotateCcw } from 'lucide-react';
import { FileData } from '../App';

interface ControlPanelProps {
  isStreaming: boolean;
  isRecording: boolean;
  speed: number;
  onToggleStreaming: () => void;
  onToggleRecording: () => void;
  onSpeedChange: (speed: number) => void;
  onOpenGallery: () => void;
  onResetStream: () => void;
  selectedFile: FileData | null;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  isStreaming,
  isRecording,
  speed,
  onToggleStreaming,
  onToggleRecording,
  onSpeedChange,
  onOpenGallery,
  onResetStream,
  selectedFile
}) => {
  return (
    <div className="bg-black border-2 border-white rounded-xl p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 border-2 border-white rounded-lg">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">Control Panel</h2>
      </div>

      {/* Playback Controls */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-1 border-2 border-white rounded">
            <Play className="w-4 h-4" />
          </div>
          Playback Controls
        </h3>
        
        <div className="flex gap-4">
          <button
            onClick={onToggleStreaming}
            disabled={!selectedFile}
            className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 border-2
                       ${!selectedFile 
                         ? 'bg-black border-gray-600 text-gray-600 cursor-not-allowed' 
                         : isStreaming
                           ? 'bg-black border-white text-white hover:bg-white hover:text-black'
                           : 'bg-white border-white text-black hover:bg-black hover:text-white'
                       }`}
          >
            {isStreaming ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isStreaming ? 'Pause' : 'Play'}
          </button>

          <button
            onClick={onResetStream}
            disabled={!selectedFile}
            className={`px-6 py-4 rounded-lg transition-all duration-200 flex items-center justify-center border-2
                       ${!selectedFile 
                         ? 'bg-black border-gray-600 text-gray-600 cursor-not-allowed'
                         : 'bg-black border-white text-white hover:bg-white hover:text-black'
                       }`}
            title="Stop and Reset"
          >
            <Square className="w-5 h-5" />
          </button>

          <button
            onClick={onResetStream}
            disabled={!selectedFile}
            className={`px-6 py-4 rounded-lg transition-all duration-200 flex items-center justify-center border-2
                       ${!selectedFile 
                         ? 'bg-black border-gray-600 text-gray-600 cursor-not-allowed'
                         : 'bg-black border-white text-white hover:bg-white hover:text-black'
                       }`}
            title="Reset to Beginning"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Speed Control */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-1 border-2 border-white rounded">
            <Zap className="w-4 h-4" />
          </div>
          Streaming Speed
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span className="text-gray-400">Slow</span>
            <span className="text-white bg-black border-2 border-white px-4 py-2 rounded">{speed}%</span>
            <span className="text-gray-400">Fast</span>
          </div>
          
          <input
            type="range"
            min="10"
            max="100"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-full h-3 bg-black border-2 border-white rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 
                       [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-black 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
          
          <div className="flex justify-between text-sm text-gray-400 font-medium">
            <span>Slow & Detailed</span>
            <span>Quick Preview</span>
          </div>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="mb-10">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-1 border-2 border-white rounded">
            <Film className="w-4 h-4" />
          </div>
          Video Recording
        </h3>
        
        <div className="space-y-4">
          <button
            onClick={onToggleRecording}
            disabled={!selectedFile}
            className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 border-2
                       ${!selectedFile 
                         ? 'bg-black border-gray-600 text-gray-600 cursor-not-allowed' 
                         : isRecording
                           ? 'bg-white border-white text-black animate-pulse'
                           : 'bg-black border-white text-white hover:bg-white hover:text-black'
                       }`}
          >
            <Film className="w-5 h-5" />
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>

          <button
            onClick={onOpenGallery}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-lg font-bold text-lg
                     bg-black border-2 border-white text-white hover:bg-white hover:text-black transition-all duration-200"
          >
            <Gallery className="w-5 h-5" />
            Open Gallery
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mt-4 text-center font-medium">
          {isRecording ? 'Recording MP4 video...' : 'High-quality MP4 recording'}
        </p>
      </div>

      {/* File Info */}
      <div className="bg-black border-2 border-white rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
          <div className="p-1 border-2 border-white rounded">
            <Clock className="w-4 h-4" />
          </div>
          Current File
        </h3>
        
        {selectedFile ? (
          <div className="space-y-3 text-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Name:</span>
              <span className="text-white font-bold">{selectedFile.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Language:</span>
              <span className="text-white font-bold capitalize">{selectedFile.language}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Size:</span>
              <span className="text-white font-bold">{selectedFile.content.length.toLocaleString()} chars</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Est. Duration:</span>
              <span className="text-white font-bold">
                {Math.round(selectedFile.content.length / (speed / 10))}s
              </span>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-lg font-medium">No file selected</p>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;