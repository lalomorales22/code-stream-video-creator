import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Save, 
  Settings,
  X,
  Clock,
  Sparkles,
  Loader2,
  RotateCcw,
  Zap
} from 'lucide-react';
import { FullClipVideoRecord } from '../utils/database';
import { dbManager } from '../utils/database';

interface ShortsStudioProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: FullClipVideoRecord | null;
  onShortsVideoSaved: () => void;
}

interface PenguinAvatar {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

const ShortsStudio: React.FC<ShortsStudioProps> = ({
  isOpen,
  onClose,
  selectedVideo,
  onShortsVideoSaved
}) => {
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<PenguinAvatar | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-right');
  const [avatarSize, setAvatarSize] = useState(25); // Percentage
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  const [customAvatarPrompt, setCustomAvatarPrompt] = useState('');
  const [generatedAvatars, setGeneratedAvatars] = useState<PenguinAvatar[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Preset penguin avatars
  const presetAvatars: PenguinAvatar[] = [
    {
      id: 'classic',
      name: 'Classic Penguin',
      description: 'Traditional black and white penguin',
      imageUrl: 'https://images.pexels.com/photos/86405/penguin-funny-blue-water-86405.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
    },
    {
      id: 'cool',
      name: 'Cool Penguin',
      description: 'Penguin with sunglasses',
      imageUrl: 'https://images.pexels.com/photos/792416/pexels-photo-792416.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
    },
    {
      id: 'baby',
      name: 'Baby Penguin',
      description: 'Cute baby penguin',
      imageUrl: 'https://images.pexels.com/photos/1125979/pexels-photo-1125979.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
    },
    {
      id: 'emperor',
      name: 'Emperor Penguin',
      description: 'Majestic emperor penguin',
      imageUrl: 'https://images.pexels.com/photos/792416/pexels-photo-792416.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop'
    }
  ];

  // Load API key from localStorage
  useEffect(() => {
    const savedXaiKey = localStorage.getItem('xai_api_key');
    if (savedXaiKey) {
      setXaiApiKey(savedXaiKey);
    }
  }, []);

  // Save API key to localStorage
  useEffect(() => {
    if (xaiApiKey) {
      localStorage.setItem('xai_api_key', xaiApiKey);
    }
  }, [xaiApiKey]);

  const generateCustomAvatar = async () => {
    if (!xaiApiKey || !customAvatarPrompt.trim()) {
      alert('Please provide XAI API key and avatar description.');
      return;
    }

    setIsGeneratingAvatar(true);
    setProcessingProgress('Generating custom penguin avatar...');
    
    try {
      console.log('Generating custom penguin avatar with Grok Vision...');
      
      // Enhanced prompt for better penguin generation
      const enhancedPrompt = `Create a cute, cartoon-style penguin avatar for a coding video. ${customAvatarPrompt}. The penguin should be friendly, professional, and suitable for educational content. Style: clean cartoon illustration, transparent background, high quality, suitable for video overlay.`;

      const response = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiApiKey}`
        },
        body: JSON.stringify({
          model: 'grok-2-vision',
          prompt: enhancedPrompt,
          n: 1,
          size: '512x512',
          quality: 'standard'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`XAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image generated from XAI API');
      }

      console.log('Custom penguin avatar generated successfully');
      
      // Create new avatar object
      const newAvatar: PenguinAvatar = {
        id: `custom-${Date.now()}`,
        name: 'Custom Penguin',
        description: customAvatarPrompt,
        imageUrl: imageUrl
      };

      setGeneratedAvatars(prev => [...prev, newAvatar]);
      setSelectedAvatar(newAvatar);
      setCustomAvatarPrompt('');

    } catch (error) {
      console.error('Failed to generate custom avatar:', error);
      
      let errorMessage = 'Failed to generate custom avatar. ';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage += 'Please check your XAI API key.';
        } else if (error.message.includes('429')) {
          errorMessage += 'Rate limit exceeded. Please try again in a moment.';
        } else {
          errorMessage += error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsGeneratingAvatar(false);
      setProcessingProgress('');
    }
  };

  const processVideoWithAvatar = async () => {
    if (!selectedVideo || !selectedAvatar) {
      alert('Please select a video and avatar first.');
      return;
    }

    setIsProcessingVideo(true);
    setProcessingProgress('Preparing video with avatar...');
    
    try {
      console.log('Starting video processing with avatar...');
      
      // Create video element for the original video
      const videoBlob = new Blob([selectedVideo.video_blob], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      setProcessingProgress('Loading video...');
      
      // Wait for video to load
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('Video loaded:', video.duration, 'seconds');
          resolve(void 0);
        };
        video.onerror = reject;
        video.load();
      });

      // Load avatar image
      setProcessingProgress('Loading avatar...');
      const avatarImg = new Image();
      avatarImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        avatarImg.onload = resolve;
        avatarImg.onerror = reject;
        avatarImg.src = selectedAvatar.imageUrl;
      });

      // Set up canvas for rendering
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 720;
      canvas.height = 1280;

      setProcessingProgress('Setting up recording...');

      // Set up MediaRecorder
      const stream = canvas.captureStream(30);
      
      let mimeType = 'video/mp4';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E';
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, creating final video...');
        setProcessingProgress('Finalizing video...');
        
        const finalBlob = new Blob(chunks, { 
          type: 'video/mp4'
        });
        
        setProcessingProgress('Saving to gallery...');
        
        // Save to Shorts gallery
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `shorts-${selectedVideo.original_filename.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
        
        try {
          const videoId = await dbManager.saveShortsVideo(
            filename,
            selectedVideo.original_filename,
            selectedVideo.file_language,
            Math.round(video.duration),
            finalBlob,
            selectedAvatar.name,
            avatarPosition,
            avatarSize,
            selectedVideo.original_file_content
          );

          console.log('Shorts video saved successfully with ID:', videoId);
          
          onShortsVideoSaved();
          onClose();
          
          alert('Shorts video saved successfully! Opening Shorts Gallery...');
          
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openShortsGallery'));
          }, 500);
          
        } catch (saveError) {
          console.error('Failed to save video:', saveError);
          alert('Video was created but failed to save to gallery. Please try again.');
        }
        
        // Cleanup
        URL.revokeObjectURL(videoUrl);
      };

      // Start recording
      console.log('Starting recording...');
      setProcessingProgress('Recording video with avatar...');
      mediaRecorder.start(100);
      
      // Reset and start playback
      video.currentTime = 0;
      
      const startTime = Date.now();
      const maxDuration = video.duration * 1000;
      
      // Start playback
      await video.play();
      
      console.log('Playback started, beginning render loop...');

      // Render loop with avatar overlay
      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / maxDuration;
        
        // Update progress
        const progressPercent = Math.round(progress * 100);
        setProcessingProgress(`Recording video: ${progressPercent}%`);
        
        // Check if we've reached the end
        if (progress >= 1 || elapsed >= maxDuration) {
          console.log('Rendering complete, stopping recording...');
          setProcessingProgress('Finishing recording...');
          mediaRecorder.stop();
          video.pause();
          return;
        }

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw video frame
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Draw avatar overlay
        const avatarWidth = (canvas.width * avatarSize) / 100;
        const avatarHeight = avatarWidth; // Keep square aspect ratio
        
        let avatarX = 0;
        let avatarY = 0;
        
        // Position avatar based on selection
        switch (avatarPosition) {
          case 'bottom-left':
            avatarX = 20;
            avatarY = canvas.height - avatarHeight - 20;
            break;
          case 'bottom-right':
            avatarX = canvas.width - avatarWidth - 20;
            avatarY = canvas.height - avatarHeight - 20;
            break;
          case 'top-left':
            avatarX = 20;
            avatarY = 20;
            break;
          case 'top-right':
            avatarX = canvas.width - avatarWidth - 20;
            avatarY = 20;
            break;
        }

        // Add simple animation (bobbing effect)
        const animationTime = elapsed * 0.003;
        const bobOffset = Math.sin(animationTime) * 5;
        avatarY += bobOffset;

        // Draw avatar with slight transparency
        ctx.globalAlpha = 0.9;
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarWidth, avatarHeight);
        ctx.globalAlpha = 1;

        requestAnimationFrame(renderFrame);
      };

      // Start the render loop
      renderFrame();

    } catch (error) {
      console.error('Failed to process video with avatar:', error);
      alert(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingVideo(false);
      setProcessingProgress('');
    }
  };

  if (!isOpen) return null;

  const allAvatars = [...presetAvatars, ...generatedAvatars];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-white">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 border-2 border-white rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              Shorts Studio
            </h2>
            {selectedVideo && (
              <div className="text-lg text-gray-400 font-medium">
                {selectedVideo.original_filename} • {selectedVideo.duration}s
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white hover:text-black rounded-lg transition-colors border-2 border-white text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Processing Overlay */}
        {(isProcessingVideo || processingProgress) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-black border-2 border-white rounded-xl p-8 max-w-md text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <h3 className="text-2xl font-bold text-white">Processing Video</h3>
              </div>
              <p className="text-lg text-gray-300 mb-4">
                {processingProgress || 'Adding penguin avatar to your video...'}
              </p>
              <div className="w-full bg-gray-600 h-2 rounded mb-4">
                <div className="bg-white h-2 rounded animate-pulse" style={{ width: '100%' }} />
              </div>
              <p className="text-sm text-gray-400">
                Please don't close this window while processing
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Configuration */}
          <div className="w-1/2 border-r-2 border-white flex flex-col">
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* XAI API Key for Custom Avatars */}
              <div>
                <label className="block text-white font-bold mb-2">XAI API Key (for Custom Avatars)</label>
                <input
                  type="password"
                  value={xaiApiKey}
                  onChange={(e) => setXaiApiKey(e.target.value)}
                  placeholder="Enter your XAI API key"
                  className="w-full p-3 bg-black border-2 border-white text-white rounded font-mono"
                />
                <p className="text-gray-400 text-sm mt-2">
                  Get your API key from <a href="https://x.ai" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">x.ai</a>
                </p>
              </div>

              {/* Custom Avatar Generation */}
              <div>
                <label className="block text-white font-bold mb-2">Generate Custom Avatar</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAvatarPrompt}
                    onChange={(e) => setCustomAvatarPrompt(e.target.value)}
                    placeholder="Describe your penguin (e.g., 'wearing a graduation cap')"
                    className="flex-1 p-3 bg-black border-2 border-white text-white rounded"
                  />
                  <button
                    onClick={generateCustomAvatar}
                    disabled={isGeneratingAvatar || !xaiApiKey || !customAvatarPrompt.trim()}
                    className="flex items-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 
                             text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white"
                  >
                    {isGeneratingAvatar ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    {isGeneratingAvatar ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-white font-bold mb-4">Choose Avatar</label>
                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                  {allAvatars.map(avatar => (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`cursor-pointer rounded-lg p-4 border-2 transition-all ${
                        selectedAvatar?.id === avatar.id 
                          ? 'border-white bg-white text-black' 
                          : 'border-gray-600 hover:border-white bg-black text-white'
                      }`}
                    >
                      <img
                        src={avatar.imageUrl}
                        alt={avatar.name}
                        className="w-full h-24 object-cover rounded mb-2"
                        onError={(e) => {
                          // Fallback to a placeholder if image fails to load
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QZW5ndWluPC90ZXh0Pjwvc3ZnPg==';
                        }}
                      />
                      <h4 className="font-bold text-sm">{avatar.name}</h4>
                      <p className="text-xs opacity-75">{avatar.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avatar Position */}
              <div>
                <label className="block text-white font-bold mb-2">Avatar Position</label>
                <select
                  value={avatarPosition}
                  onChange={(e) => setAvatarPosition(e.target.value as any)}
                  className="w-full p-3 bg-black border-2 border-white text-white rounded"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </select>
              </div>

              {/* Avatar Size */}
              <div>
                <label className="block text-white font-bold mb-2">Avatar Size: {avatarSize}%</label>
                <input
                  type="range"
                  min="15"
                  max="40"
                  value={avatarSize}
                  onChange={(e) => setAvatarSize(Number(e.target.value))}
                  className="w-full h-3 bg-black border-2 border-white rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>

              {/* Process Button */}
              <div className="pt-4">
                <button
                  onClick={processVideoWithAvatar}
                  disabled={isProcessingVideo || !selectedVideo || !selectedAvatar}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg 
                           bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black transition-colors border-2 border-white"
                >
                  {isProcessingVideo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isProcessingVideo ? 'Processing...' : 'Create Shorts Video'}
                </button>
                <p className="text-gray-400 text-sm mt-2 text-center">
                  This will add the penguin avatar to your video with captions
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b-2 border-white">
              <h3 className="text-2xl font-bold text-white">Preview</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Video Preview */}
              {selectedVideo && (
                <div className="mb-6">
                  <video
                    className="w-full max-w-xs mx-auto bg-black rounded border-2 border-white"
                    style={{ aspectRatio: '9/16' }}
                    src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
                    controls
                    muted
                  />
                </div>
              )}

              {/* Avatar Preview */}
              {selectedAvatar && (
                <div className="mb-6">
                  <h4 className="text-white font-bold mb-3">Selected Avatar</h4>
                  <div className="bg-black border-2 border-white rounded-lg p-4 text-center">
                    <img
                      src={selectedAvatar.imageUrl}
                      alt={selectedAvatar.name}
                      className="w-24 h-24 object-cover rounded mx-auto mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5QZW5ndWluPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                    <h5 className="text-white font-bold">{selectedAvatar.name}</h5>
                    <p className="text-gray-400 text-sm">{selectedAvatar.description}</p>
                  </div>
                </div>
              )}

              {/* Settings Summary */}
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <h4 className="text-white font-bold mb-3">Settings Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white capitalize">{avatarPosition.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Size:</span>
                    <span className="text-white">{avatarSize}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Avatar:</span>
                    <span className="text-white">{selectedAvatar?.name || 'None selected'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden canvas for video processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default ShortsStudio;