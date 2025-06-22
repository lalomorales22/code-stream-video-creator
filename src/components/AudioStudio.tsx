import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Save, 
  Type, 
  Volume2, 
  Wand2, 
  Settings,
  X,
  Clock,
  FileAudio,
  Captions
} from 'lucide-react';
import { VideoRecord } from '../utils/database';
import { dbManager } from '../utils/database';

interface AudioStudioProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: VideoRecord | null;
  onAudioVideoSaved: () => void;
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
}

interface CaptionSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

const AudioStudio: React.FC<AudioStudioProps> = ({
  isOpen,
  onClose,
  selectedVideo,
  onAudioVideoSaved
}) => {
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [availableVoices, setAvailableVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  
  // Simplified caption controls
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionTextColor, setCaptionTextColor] = useState('#FFFFFF');
  const [captionBackgroundColor, setCaptionBackgroundColor] = useState('#000000');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load API key from localStorage
  useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenlabs_api_key');
    if (savedApiKey) {
      setElevenLabsApiKey(savedApiKey);
    }
  }, []);

  // Save API key to localStorage
  useEffect(() => {
    if (elevenLabsApiKey) {
      localStorage.setItem('elevenlabs_api_key', elevenLabsApiKey);
    }
  }, [elevenLabsApiKey]);

  // Load voices when API key is available
  useEffect(() => {
    if (elevenLabsApiKey) {
      loadVoices();
    }
  }, [elevenLabsApiKey]);

  // Generate initial script when video is selected
  useEffect(() => {
    if (selectedVideo && !script) {
      generateInitialScript();
    }
  }, [selectedVideo]);

  // Audio time tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      setIsPlayingAudio(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const loadVoices = async () => {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': elevenLabsApiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load voices');
      }

      const data = await response.json();
      setAvailableVoices(data.voices || []);
      
      // Select first voice by default
      if (data.voices && data.voices.length > 0) {
        setSelectedVoice(data.voices[0].voice_id);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      alert('Failed to load ElevenLabs voices. Please check your API key.');
    }
  };

  const generateInitialScript = () => {
    if (!selectedVideo) return;

    // Generate a basic script based on the video
    const language = selectedVideo.file_language;
    const filename = selectedVideo.original_filename;
    const duration = selectedVideo.duration;

    const script = `Welcome to this ${language} code demonstration. 
Today we'll be exploring the ${filename} file, which contains some interesting ${language} code. 
This ${duration}-second video will walk you through the key concepts and implementation details. 
Let's dive into the code and see what we can learn together.`;

    setScript(script);
  };

  const generateAIScript = async () => {
    if (!selectedVideo) return;

    setIsGeneratingScript(true);
    try {
      // This would typically call an AI service like OpenAI
      // For now, we'll generate a more detailed script
      const language = selectedVideo.file_language;
      const filename = selectedVideo.original_filename;
      const duration = selectedVideo.duration;

      const aiScript = `Hello and welcome to this comprehensive ${language} code walkthrough! 

In this ${duration}-second video, we're going to explore the ${filename} file, which showcases some excellent ${language} programming techniques.

As we stream through this code, you'll notice several key concepts being demonstrated. The structure and organization of this code follows modern ${language} best practices.

Pay attention to the syntax highlighting and the way the code flows - each line builds upon the previous one to create a cohesive and functional program.

Whether you're a beginner learning ${language} or an experienced developer looking to refine your skills, this code demonstration will provide valuable insights.

Let's begin our journey through this fascinating piece of ${language} code!`;

      setScript(aiScript);
    } catch (error) {
      console.error('Failed to generate AI script:', error);
      alert('Failed to generate AI script. Please try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateAudio = async () => {
    if (!elevenLabsApiKey || !selectedVoice || !script) {
      alert('Please provide API key, select a voice, and enter a script.');
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey
        },
        body: JSON.stringify({
          text: script,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      setAudioBlob(audioBlob);
      
      // Create URL for audio playback
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Generate automatic captions
      generateAutomaticCaptions();

      console.log('Audio generated successfully');
    } catch (error) {
      console.error('Failed to generate audio:', error);
      alert('Failed to generate audio. Please check your API key and try again.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const generateAutomaticCaptions = () => {
    if (!script) return;

    // Split script into sentences and create caption segments
    const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const estimatedDuration = selectedVideo?.duration || 30;
    const timePerSentence = estimatedDuration / sentences.length;

    const captionSegments: CaptionSegment[] = sentences.map((sentence, index) => ({
      id: `caption-${index}`,
      text: sentence.trim(),
      startTime: index * timePerSentence,
      endTime: (index + 1) * timePerSentence
    }));

    setCaptions(captionSegments);
  };

  const toggleAudioPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.play();
      setIsPlayingAudio(true);
    }
  };

  const combineVideoWithAudio = async () => {
    if (!selectedVideo || !audioBlob) {
      alert('Please select a video and generate audio first.');
      return;
    }

    setIsProcessingVideo(true);
    try {
      console.log('Starting video-audio combination process...');
      
      // Create video element for the original video
      const videoBlob = new Blob([selectedVideo.video_blob], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      // Wait for video to load
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('Video loaded:', video.duration, 'seconds');
          resolve(void 0);
        };
        video.onerror = reject;
      });

      // Set up canvas for rendering
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 720;
      canvas.height = 1280;

      // Create audio element
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(audioBlob);
      audio.crossOrigin = 'anonymous';
      
      // Wait for audio to load
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => {
          console.log('Audio loaded:', audio.duration, 'seconds');
          resolve(void 0);
        };
        audio.onerror = reject;
      });

      // Determine the final duration (use the longer of video or audio)
      const finalDuration = Math.max(video.duration, audio.duration);
      console.log('Final video duration will be:', finalDuration, 'seconds');

      // Set up MediaRecorder with better codec support
      const stream = canvas.captureStream(30);
      
      // Try different codec options for better compatibility
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
        mimeType = 'video/mp4;codecs=h264,aac';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      
      console.log('Using codec:', mimeType);

      // Create audio context for mixing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create audio source and destination
      const audioSource = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      
      // Connect audio
      audioSource.connect(destination);
      
      // Add audio track to video stream
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
        console.log('Audio track added to stream');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
        videoBitsPerSecond: 4000000, // 4 Mbps
        audioBitsPerSecond: 128000   // 128 kbps
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('Recorded chunk:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, creating final video...');
        
        // Create final blob with proper MIME type
        const finalBlob = new Blob(chunks, { 
          type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm'
        });
        
        console.log('Final video size:', finalBlob.size, 'bytes');
        
        // Save to FullClip gallery
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `fullclip-${selectedVideo.original_filename.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
        
        try {
          await dbManager.saveFullClipVideo(
            filename,
            selectedVideo.original_filename,
            selectedVideo.file_language,
            Math.round(finalDuration),
            finalBlob,
            script,
            captions
          );

          console.log('FullClip video saved successfully');
          onAudioVideoSaved();
          
          // Close the studio and show success
          onClose();
          alert('FullClip video saved successfully! Check the FullClip Gallery to view it.');
          
        } catch (saveError) {
          console.error('Failed to save video:', saveError);
          alert('Video was created but failed to save to gallery. Please try again.');
        }
        
        // Cleanup
        URL.revokeObjectURL(videoUrl);
        URL.revokeObjectURL(audio.src);
        audioContext.close();
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording failed. Please try again.');
      };

      // Start recording
      console.log('Starting recording...');
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Reset and start playback
      video.currentTime = 0;
      audio.currentTime = 0;
      
      const startTime = Date.now();
      const maxDuration = finalDuration * 1000; // Convert to milliseconds
      
      // Start playback
      const playPromises = [video.play(), audio.play()];
      await Promise.all(playPromises);
      
      console.log('Playback started, beginning render loop...');

      // Render loop
      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / maxDuration;
        
        // Check if we've reached the end
        if (progress >= 1 || elapsed >= maxDuration) {
          console.log('Rendering complete, stopping recording...');
          mediaRecorder.stop();
          video.pause();
          audio.pause();
          return;
        }

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw video frame
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Draw captions if enabled
        if (captionsEnabled && captions.length > 0) {
          const currentTimeSeconds = elapsed / 1000;
          const currentCaptions = captions.filter(caption => 
            currentTimeSeconds >= caption.startTime && currentTimeSeconds <= caption.endTime
          );

          currentCaptions.forEach(caption => {
            // Set up caption styling
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            // Split text into words for better wrapping
            const words = caption.text.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            
            // Simple word wrapping
            for (const word of words) {
              const testLine = currentLine + (currentLine ? ' ' : '') + word;
              const metrics = ctx.measureText(testLine);
              
              if (metrics.width > canvas.width - 80 && currentLine) {
                lines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              lines.push(currentLine);
            }

            // Draw each line
            const lineHeight = 35;
            const totalHeight = lines.length * lineHeight;
            const startY = canvas.height - 80; // Position at bottom

            lines.forEach((line, index) => {
              const y = startY - (lines.length - 1 - index) * lineHeight;
              const x = canvas.width / 2;

              // Measure text for background
              const textWidth = ctx.measureText(line).width;
              const padding = 15;

              // Draw background with transparency
              ctx.fillStyle = captionBackgroundColor + 'E6'; // 90% opacity
              ctx.fillRect(
                x - textWidth / 2 - padding,
                y - 30,
                textWidth + padding * 2,
                lineHeight + 5
              );

              // Draw text
              ctx.fillStyle = captionTextColor;
              ctx.fillText(line, x, y);
            });
          });
        }

        requestAnimationFrame(renderFrame);
      };

      // Start the render loop
      renderFrame();

    } catch (error) {
      console.error('Failed to combine video with audio:', error);
      alert(`Failed to combine video with audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingVideo(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-white">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 border-2 border-white rounded-lg">
                <FileAudio className="w-6 h-6 text-white" />
              </div>
              Audio Studio
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

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Configuration */}
          <div className="w-1/2 border-r-2 border-white flex flex-col">
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* API Key */}
              <div>
                <label className="block text-white font-bold mb-2">ElevenLabs API Key</label>
                <input
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="Enter your ElevenLabs API key"
                  className="w-full p-3 bg-black border-2 border-white text-white rounded font-mono"
                />
                <p className="text-gray-400 text-sm mt-2">
                  Get your API key from <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">elevenlabs.io</a>
                </p>
              </div>

              {/* Voice Selection */}
              <div>
                <label className="block text-white font-bold mb-2">Voice Selection</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-3 bg-black border-2 border-white text-white rounded"
                  disabled={!elevenLabsApiKey || availableVoices.length === 0}
                >
                  <option value="">Select a voice...</option>
                  {availableVoices.map(voice => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} ({voice.category})
                    </option>
                  ))}
                </select>
                {availableVoices.length === 0 && elevenLabsApiKey && (
                  <p className="text-gray-400 text-sm mt-2">Loading voices...</p>
                )}
              </div>

              {/* Script */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white font-bold">Script</label>
                  <button
                    onClick={generateAIScript}
                    disabled={isGeneratingScript || !selectedVideo}
                    className="flex items-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 
                             text-black px-3 py-1 rounded font-bold transition-colors text-sm border-2 border-white"
                  >
                    <Wand2 className="w-4 h-4" />
                    {isGeneratingScript ? 'Generating...' : 'AI Generate'}
                  </button>
                </div>
                <textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  placeholder="Enter your script or use AI generation..."
                  className="w-full h-32 p-3 bg-black border-2 border-white text-white rounded resize-none"
                />
                <p className="text-gray-400 text-sm mt-2">
                  Estimated duration: ~{Math.ceil(script.length / 150)} seconds
                </p>
              </div>

              {/* Audio Generation */}
              <div>
                <button
                  onClick={generateAudio}
                  disabled={isGeneratingAudio || !elevenLabsApiKey || !selectedVoice || !script}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg 
                           bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black transition-colors border-2 border-white"
                >
                  <Volume2 className="w-5 h-5" />
                  {isGeneratingAudio ? 'Generating Audio...' : 'Generate Audio'}
                </button>
              </div>

              {/* Audio Player */}
              {audioUrl && (
                <div className="bg-black border-2 border-white rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold">Generated Audio</h4>
                    <span className="text-gray-400 text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={toggleAudioPlayback}
                      className="p-3 bg-white hover:bg-gray-200 text-black rounded border-2 border-white transition-colors"
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    
                    <div className="flex-1 bg-gray-600 h-2 rounded">
                      <div 
                        className="bg-white h-2 rounded transition-all duration-100"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                    </div>
                  </div>

                  <audio ref={audioRef} src={audioUrl} />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Captions & Preview */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b-2 border-white">
              <h3 className="text-2xl font-bold text-white mb-4">Captions & Preview</h3>
              
              {/* Simplified Caption Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-white font-bold">
                    <input
                      type="checkbox"
                      checked={captionsEnabled}
                      onChange={(e) => setCaptionsEnabled(e.target.checked)}
                      className="w-5 h-5"
                    />
                    Enable Captions
                  </label>
                </div>
                
                {captionsEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-bold mb-2">Text Color</label>
                      <input
                        type="color"
                        value={captionTextColor}
                        onChange={(e) => setCaptionTextColor(e.target.value)}
                        className="w-full h-10 bg-black border-2 border-white rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-bold mb-2">Background Color</label>
                      <input
                        type="color"
                        value={captionBackgroundColor}
                        onChange={(e) => setCaptionBackgroundColor(e.target.value)}
                        className="w-full h-10 bg-black border-2 border-white rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Video Preview */}
              {selectedVideo && (
                <div className="mb-6">
                  <video
                    ref={videoRef}
                    className="w-full max-w-xs mx-auto bg-black rounded border-2 border-white"
                    style={{ aspectRatio: '9/16' }}
                    src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
                    controls
                    muted
                  />
                </div>
              )}

              {/* Caption Preview */}
              {captionsEnabled && captions.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-white font-bold mb-3">Caption Preview</h4>
                  <div 
                    className="p-4 rounded border-2 border-white relative"
                    style={{ backgroundColor: '#1a1a1a', minHeight: '100px' }}
                  >
                    <div className="absolute bottom-4 left-4 right-4">
                      <div 
                        className="p-2 rounded text-center"
                        style={{ 
                          backgroundColor: captionBackgroundColor + 'E6',
                          color: captionTextColor 
                        }}
                      >
                        Sample caption text will appear here
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Processing */}
              <div className="mt-8">
                <button
                  onClick={combineVideoWithAudio}
                  disabled={isProcessingVideo || !audioBlob || !selectedVideo}
                  className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg 
                           bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black transition-colors border-2 border-white"
                >
                  <Save className="w-5 h-5" />
                  {isProcessingVideo ? 'Processing Video...' : 'Save to FullClip Gallery'}
                </button>
                <p className="text-gray-400 text-sm mt-2 text-center">
                  This will combine your video with audio and captions
                </p>
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

export default AudioStudio;