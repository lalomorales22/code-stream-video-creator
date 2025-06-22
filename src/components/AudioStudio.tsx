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
  style: {
    fontSize: number;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    position: 'bottom' | 'top' | 'center';
    alignment: 'left' | 'center' | 'right';
  };
}

const defaultCaptionStyle = {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  position: 'bottom' as const,
  alignment: 'center' as const
};

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
  const [showCaptionEditor, setShowCaptionEditor] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<CaptionSegment | null>(null);
  
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
      endTime: (index + 1) * timePerSentence,
      style: { ...defaultCaptionStyle }
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

  const addCaption = () => {
    const newCaption: CaptionSegment = {
      id: `caption-${Date.now()}`,
      text: 'New caption',
      startTime: currentTime,
      endTime: currentTime + 3,
      style: { ...defaultCaptionStyle }
    };

    setCaptions(prev => [...prev, newCaption].sort((a, b) => a.startTime - b.startTime));
    setSelectedCaption(newCaption);
    setShowCaptionEditor(true);
  };

  const updateCaption = (captionId: string, updates: Partial<CaptionSegment>) => {
    setCaptions(prev => prev.map(caption => 
      caption.id === captionId ? { ...caption, ...updates } : caption
    ));
  };

  const deleteCaption = (captionId: string) => {
    setCaptions(prev => prev.filter(caption => caption.id !== captionId));
    if (selectedCaption?.id === captionId) {
      setSelectedCaption(null);
      setShowCaptionEditor(false);
    }
  };

  const combineVideoWithAudio = async () => {
    if (!selectedVideo || !audioBlob) {
      alert('Please select a video and generate audio first.');
      return;
    }

    setIsProcessingVideo(true);
    try {
      // Create video element for the original video
      const videoBlob = new Blob([selectedVideo.video_blob], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      // Set up canvas for rendering
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 720;
      canvas.height = 1280;

      // Create audio element
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(audioBlob);
      
      await new Promise((resolve) => {
        audio.onloadedmetadata = resolve;
      });

      // Set up MediaRecorder for final video
      const stream = canvas.captureStream(30);
      
      // Add audio track to the stream
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      audioSource.connect(destination);
      
      // Combine video and audio streams
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 8000000,
        audioBitsPerSecorder: 128000
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const finalBlob = new Blob(chunks, { type: 'video/mp4' });
        
        // Save to FullClip gallery
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `fullclip-${selectedVideo.original_filename.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
        
        await dbManager.saveFullClipVideo(
          filename,
          selectedVideo.original_filename,
          selectedVideo.file_language,
          Math.max(selectedVideo.duration, duration),
          finalBlob,
          script,
          captions
        );

        onAudioVideoSaved();
        onClose();
        
        // Cleanup
        URL.revokeObjectURL(videoUrl);
        URL.revokeObjectURL(audio.src);
        audioContext.close();
      };

      // Start recording
      mediaRecorder.start(100);
      
      // Play both video and audio
      video.currentTime = 0;
      audio.currentTime = 0;
      
      const startTime = Date.now();
      const maxDuration = Math.max(video.duration, audio.duration) * 1000;
      
      video.play();
      audio.play();

      // Render loop
      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / maxDuration;
        
        if (progress >= 1) {
          mediaRecorder.stop();
          video.pause();
          audio.pause();
          return;
        }

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw captions
        const currentCaptions = captions.filter(caption => 
          elapsed / 1000 >= caption.startTime && elapsed / 1000 <= caption.endTime
        );

        currentCaptions.forEach(caption => {
          const style = caption.style;
          ctx.font = `${style.fontWeight} ${style.fontSize}px Arial`;
          ctx.fillStyle = style.backgroundColor;
          ctx.textAlign = style.alignment as CanvasTextAlign;

          const lines = caption.text.split('\n');
          const lineHeight = style.fontSize * 1.2;
          const totalHeight = lines.length * lineHeight;
          
          let y: number;
          switch (style.position) {
            case 'top':
              y = 50;
              break;
            case 'center':
              y = (canvas.height - totalHeight) / 2;
              break;
            case 'bottom':
            default:
              y = canvas.height - totalHeight - 50;
              break;
          }

          lines.forEach((line, index) => {
            const lineY = y + (index * lineHeight);
            const x = style.alignment === 'center' ? canvas.width / 2 : 
                     style.alignment === 'right' ? canvas.width - 50 : 50;

            // Draw background
            const textWidth = ctx.measureText(line).width;
            const bgX = style.alignment === 'center' ? x - textWidth / 2 - 10 :
                       style.alignment === 'right' ? x - textWidth - 10 : x - 10;
            
            ctx.fillRect(bgX, lineY - style.fontSize, textWidth + 20, lineHeight);

            // Draw text
            ctx.fillStyle = style.color;
            ctx.fillText(line, x, lineY);
          });
        });

        requestAnimationFrame(renderFrame);
      };

      renderFrame();

    } catch (error) {
      console.error('Failed to combine video with audio:', error);
      alert('Failed to combine video with audio. Please try again.');
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
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Captions & Preview</h3>
                <button
                  onClick={addCaption}
                  className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-3 py-2 rounded font-bold transition-colors border-2 border-white"
                >
                  <Captions className="w-4 h-4" />
                  Add Caption
                </button>
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

              {/* Captions List */}
              <div className="space-y-3">
                <h4 className="text-white font-bold">Caption Timeline</h4>
                {captions.length === 0 ? (
                  <p className="text-gray-400">No captions added yet. Generate audio to create automatic captions.</p>
                ) : (
                  captions.map(caption => (
                    <div
                      key={caption.id}
                      className="bg-black border-2 border-white rounded p-4 cursor-pointer hover:bg-gray-900 transition-colors"
                      onClick={() => {
                        setSelectedCaption(caption);
                        setShowCaptionEditor(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-sm">
                          {formatTime(caption.startTime)} - {formatTime(caption.endTime)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCaption(caption.id);
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm">{caption.text}</p>
                    </div>
                  ))
                )}
              </div>

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

      {/* Caption Editor Modal */}
      {showCaptionEditor && selectedCaption && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60 flex items-center justify-center p-6">
          <div className="bg-black border-2 border-white rounded-xl p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Edit Caption</h3>
              <button
                onClick={() => setShowCaptionEditor(false)}
                className="p-2 hover:bg-white hover:text-black rounded transition-colors border-2 border-white text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Caption Text */}
              <div>
                <label className="block text-white font-bold mb-2">Caption Text</label>
                <textarea
                  value={selectedCaption.text}
                  onChange={(e) => updateCaption(selectedCaption.id, { text: e.target.value })}
                  className="w-full h-20 p-3 bg-black border-2 border-white text-white rounded resize-none"
                />
              </div>

              {/* Timing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Start Time (seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedCaption.startTime}
                    onChange={(e) => updateCaption(selectedCaption.id, { startTime: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-black border-2 border-white text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">End Time (seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedCaption.endTime}
                    onChange={(e) => updateCaption(selectedCaption.id, { endTime: parseFloat(e.target.value) })}
                    className="w-full p-3 bg-black border-2 border-white text-white rounded"
                  />
                </div>
              </div>

              {/* Style Options */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Font Size</label>
                  <input
                    type="number"
                    min="12"
                    max="72"
                    value={selectedCaption.style.fontSize}
                    onChange={(e) => updateCaption(selectedCaption.id, { 
                      style: { ...selectedCaption.style, fontSize: parseInt(e.target.value) }
                    })}
                    className="w-full p-3 bg-black border-2 border-white text-white rounded"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">Font Weight</label>
                  <select
                    value={selectedCaption.style.fontWeight}
                    onChange={(e) => updateCaption(selectedCaption.id, { 
                      style: { ...selectedCaption.style, fontWeight: e.target.value }
                    })}
                    className="w-full p-3 bg-black border-2 border-white text-white rounded"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Text Color</label>
                  <input
                    type="color"
                    value={selectedCaption.style.color}
                    onChange={(e) => updateCaption(selectedCaption.id, { 
                      style: { ...selectedCaption.style, color: e.target.value }
                    })}
                    className="w-full h-12 bg-black border-2 border-white rounded cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-2">Position</label>
                  <select
                    value={selectedCaption.style.position}
                    onChange={(e) => updateCaption(selectedCaption.id, { 
                      style: { ...selectedCaption.style, position: e.target.value as 'top' | 'center' | 'bottom' }
                    })}
                    className="w-full p-3 bg-black border-2 border-white text-white rounded"
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowCaptionEditor(false)}
                  className="px-6 py-3 bg-black border-2 border-white text-white hover:bg-white hover:text-black rounded font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioStudio;