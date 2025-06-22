import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Download, Mic, Upload, Settings, ChevronDown, ChevronUp, User, Image, FileAudio, Captions, Film, Loader2, CheckCircle, AlertCircle, Save, Trash2 } from 'lucide-react';
import { dbManager, VideoRecord, AvatarRecord } from '../utils/database';

interface FullClipStudioProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: VideoRecord | null;
  onVideoSaved?: () => void;
}

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

const FullClipStudio: React.FC<FullClipStudioProps> = ({
  isOpen,
  onClose,
  selectedVideo,
  onVideoSaved
}) => {
  // API Settings State
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  
  // Step 1: Voice and Audio
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [script, setScript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Step 2: Avatar
  const [avatars, setAvatars] = useState<AvatarRecord[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarRecord | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [avatarSize, setAvatarSize] = useState(120);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  
  // Step 3: Thumbnail (NEW)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  
  // Step 4: Captions
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionStyle, setCaptionStyle] = useState({
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    position: 'bottom'
  });
  
  // Video Creation
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);

  // Load saved API keys and data on mount
  useEffect(() => {
    const savedXaiKey = localStorage.getItem('xai_api_key');
    const savedElevenLabsKey = localStorage.getItem('elevenlabs_api_key');
    
    if (savedXaiKey) setXaiApiKey(savedXaiKey);
    if (savedElevenLabsKey) setElevenLabsApiKey(savedElevenLabsKey);
    
    if (isOpen) {
      loadVoices();
      loadAvatars();
    }
  }, [isOpen]);

  // Save API keys to localStorage
  useEffect(() => {
    if (xaiApiKey) localStorage.setItem('xai_api_key', xaiApiKey);
  }, [xaiApiKey]);

  useEffect(() => {
    if (elevenLabsApiKey) localStorage.setItem('elevenlabs_api_key', elevenLabsApiKey);
  }, [elevenLabsApiKey]);

  const loadVoices = async () => {
    if (!elevenLabsApiKey) return;
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': elevenLabsApiKey
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
        if (data.voices?.length > 0 && !selectedVoice) {
          setSelectedVoice(data.voices[0].voice_id);
        }
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
    }
  };

  const loadAvatars = async () => {
    try {
      const avatarRecords = await dbManager.getAllAvatars();
      setAvatars(avatarRecords);
    } catch (error) {
      console.error('Failed to load avatars:', error);
    }
  };

  const generateScript = async () => {
    if (!xaiApiKey || !selectedVideo) {
      setError('XAI API key and video are required for script generation');
      return;
    }

    setIsGeneratingScript(true);
    setError(null);

    try {
      const prompt = `Analyze this ${selectedVideo.file_language} code and create a 30-45 second engaging narration script for a social media video. Focus on what the code actually does, mention specific functions, variables, and logic patterns you see. Make it conversational and educational.

Code to analyze:
${selectedVideo.original_file_content}

Create a script that:
1. Briefly explains what this specific code does
2. Mentions actual function names, variables, or key concepts from the code
3. Is engaging for social media (TikTok, Instagram, YouTube Shorts)
4. Is exactly 30-45 seconds when spoken at normal pace
5. Sounds natural and conversational

Return only the script text, no additional formatting.`;

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiApiKey}`
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          model: 'grok-beta',
          stream: false,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`XAI API error: ${response.status}`);
      }

      const data = await response.json();
      const generatedScript = data.choices?.[0]?.message?.content?.trim();
      
      if (generatedScript) {
        setScript(generatedScript);
        setSuccess('Script generated successfully! Review and edit if needed.');
      } else {
        throw new Error('No script generated');
      }
    } catch (error) {
      console.error('Script generation failed:', error);
      setError(`Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateAudio = async () => {
    if (!elevenLabsApiKey || !selectedVoice || !script.trim()) {
      setError('ElevenLabs API key, voice selection, and script are required');
      return;
    }

    setIsGeneratingAudio(true);
    setError(null);

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
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioData = await response.blob();
      setAudioBlob(audioData);
      
      // Create URL for audio playback
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      const newAudioUrl = URL.createObjectURL(audioData);
      setAudioUrl(newAudioUrl);
      
      setSuccess('Audio generated successfully! Click play to preview.');
    } catch (error) {
      console.error('Audio generation failed:', error);
      setError(`Failed to generate audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setError(null);

    try {
      const avatarId = await dbManager.saveAvatar(
        file.name,
        'Uploaded avatar',
        file,
        'uploaded'
      );
      
      await loadAvatars();
      
      // Select the newly uploaded avatar
      const newAvatar = await dbManager.getAvatar(avatarId);
      if (newAvatar) {
        setSelectedAvatar(newAvatar);
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setError('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  const generateAIAvatar = async () => {
    if (!xaiApiKey) {
      setError('XAI API key is required for avatar generation');
      return;
    }

    setIsGeneratingAvatar(true);
    setError(null);

    try {
      // This would integrate with XAI's image generation API
      // For now, we'll show a placeholder
      setError('AI avatar generation coming soon! Please upload an avatar for now.');
    } catch (error) {
      console.error('Avatar generation failed:', error);
      setError('Failed to generate avatar');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // NEW: Handle thumbnail upload
  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setThumbnailFile(file);
    
    // Create preview URL
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);
  };

  const removeThumbnail = () => {
    setThumbnailFile(null);
    if (thumbnailPreview) {
      URL.revokeObjectURL(thumbnailPreview);
      setThumbnailPreview('');
    }
    if (thumbnailFileInputRef.current) {
      thumbnailFileInputRef.current.value = '';
    }
  };

  const createFullClipVideo = async () => {
    if (!selectedVideo || !audioBlob) {
      setError('Video and audio are required');
      return;
    }

    setIsCreatingVideo(true);
    setCreationProgress(0);
    setError(null);

    try {
      // Implementation would create the final video with all components
      // This is a placeholder for the actual video creation logic
      
      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        setCreationProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // For now, we'll save the original video as a FullClip
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fullclip-${selectedVideo.original_filename.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
      
      const captions: CaptionSegment[] = captionsEnabled ? [
        { start: 0, end: 5, text: "Generated captions would appear here" }
      ] : [];

      await dbManager.saveFullClipVideo(
        filename,
        selectedVideo.original_filename,
        selectedVideo.file_language,
        selectedVideo.duration,
        new Blob([selectedVideo.video_blob], { type: 'video/mp4' }),
        script,
        captions,
        selectedVideo.original_file_content,
        selectedVideo.display_name || selectedVideo.original_filename
      );

      setSuccess('FullClip video created successfully!');
      onVideoSaved?.();
      
      // Reset form
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to create FullClip video:', error);
      setError('Failed to create FullClip video');
    } finally {
      setIsCreatingVideo(false);
      setCreationProgress(0);
    }
  };

  const getAvatarImageUrl = (avatar: AvatarRecord): string => {
    const blob = new Blob([avatar.image_data], { type: avatar.image_type });
    return URL.createObjectURL(blob);
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1: return !!audioBlob && !!script.trim();
      case 2: return !!selectedAvatar;
      case 3: return !!thumbnailFile;
      case 4: return true; // Captions are optional
      default: return false;
    }
  };

  const canCreateVideo = (): boolean => {
    return isStepComplete(1) && isStepComplete(2); // Steps 1 and 2 are required
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-white">
          <div className="flex items-center gap-4">
            <div className="p-2 border-2 border-white rounded-lg">
              <FileAudio className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">FullClip Studio</h2>
              <p className="text-gray-400 text-lg">Create complete social media videos</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-3 hover:bg-white hover:text-black rounded-lg transition-colors border-2 border-white text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-black border-2 border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <span className="text-red-500 font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:bg-red-500 hover:text-black p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 bg-black border-2 border-green-500 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <span className="text-green-500 font-medium">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-500 hover:bg-green-500 hover:text-black p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Steps */}
          <div className="w-1/2 border-r-2 border-white flex flex-col">
            <div className="p-6 border-b-2 border-white">
              <h3 className="text-2xl font-bold text-white mb-2">Production Steps</h3>
              <p className="text-gray-400">Follow these steps to create your FullClip video</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* API Settings - Collapsible */}
              <div className="bg-black border-2 border-white rounded-xl p-4">
                <button
                  onClick={() => setIsApiSettingsOpen(!isApiSettingsOpen)}
                  className="w-full flex items-center justify-between text-white font-bold text-lg"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    API Settings
                  </div>
                  {isApiSettingsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {isApiSettingsOpen && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-white font-bold mb-2">XAI API Key</label>
                      <input
                        type="password"
                        value={xaiApiKey}
                        onChange={(e) => setXaiApiKey(e.target.value)}
                        placeholder="Enter your XAI API key"
                        className="w-full p-3 bg-black border-2 border-white text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-bold mb-2">ElevenLabs API Key</label>
                      <input
                        type="password"
                        value={elevenLabsApiKey}
                        onChange={(e) => setElevenLabsApiKey(e.target.value)}
                        placeholder="Enter your ElevenLabs API key"
                        className="w-full p-3 bg-black border-2 border-white text-white rounded"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 1: Voice and Audio */}
              <div className={`bg-black border-2 rounded-xl p-6 ${isStepComplete(1) ? 'border-green-500' : 'border-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isStepComplete(1) ? 'bg-green-500 text-black' : 'bg-white text-black'
                  }`}>
                    {isStepComplete(1) ? '✓' : '1'}
                  </div>
                  <h4 className="text-xl font-bold text-white">Voice & Audio Generation</h4>
                </div>

                {/* Voice Selection */}
                <div className="mb-4">
                  <label className="block text-white font-bold mb-2">Select Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full p-3 bg-black border-2 border-white text-white rounded"
                    disabled={!elevenLabsApiKey}
                  >
                    <option value="">Choose a voice...</option>
                    {voices.map(voice => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.name} ({voice.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Script Generation */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-bold">AI Script</label>
                    <button
                      onClick={generateScript}
                      disabled={!xaiApiKey || isGeneratingScript}
                      className="bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-2 rounded font-bold transition-colors"
                    >
                      {isGeneratingScript ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
                    </button>
                  </div>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="AI will generate a script based on your code..."
                    className="w-full p-3 bg-black border-2 border-white text-white rounded h-32 resize-none"
                  />
                </div>

                {/* Audio Generation */}
                <div className="flex gap-3">
                  <button
                    onClick={generateAudio}
                    disabled={!elevenLabsApiKey || !selectedVoice || !script.trim() || isGeneratingAudio}
                    className="flex-1 bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                  >
                    {isGeneratingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                    {isGeneratingAudio ? 'Generating...' : 'Generate Audio'}
                  </button>
                  
                  {audioUrl && (
                    <button
                      onClick={handleAudioPlayback}
                      className="bg-black border-2 border-white text-white hover:bg-white hover:text-black px-4 py-3 rounded font-bold transition-colors flex items-center gap-2"
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onEnded={() => setIsPlayingAudio(false)}
                    className="hidden"
                  />
                )}
              </div>

              {/* Step 2: Avatar Selection */}
              <div className={`bg-black border-2 rounded-xl p-6 ${isStepComplete(2) ? 'border-green-500' : 'border-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isStepComplete(2) ? 'bg-green-500 text-black' : 'bg-white text-black'
                  }`}>
                    {isStepComplete(2) ? '✓' : '2'}
                  </div>
                  <h4 className="text-xl font-bold text-white">Avatar Selection</h4>
                </div>

                {/* Avatar Upload */}
                <div className="mb-4">
                  <div className="flex gap-3 mb-4">
                    <button
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="flex-1 bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {isUploadingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      Upload Avatar
                    </button>
                    
                    <button
                      onClick={generateAIAvatar}
                      disabled={!xaiApiKey || isGeneratingAvatar}
                      className="flex-1 bg-black border-2 border-white text-white hover:bg-white hover:text-black px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {isGeneratingAvatar ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
                      AI Generate
                    </button>
                  </div>

                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>

                {/* Avatar Gallery */}
                {avatars.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-white font-bold mb-2">Available Avatars</label>
                    <div className="grid grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                      {avatars.map(avatar => (
                        <button
                          key={avatar.id}
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedAvatar?.id === avatar.id ? 'border-green-500' : 'border-white hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={getAvatarImageUrl(avatar)}
                            alt={avatar.name}
                            className="w-full h-full object-cover"
                          />
                          {selectedAvatar?.id === avatar.id && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avatar Settings */}
                {selectedAvatar && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-white font-bold mb-2">Position</label>
                      <select
                        value={avatarPosition}
                        onChange={(e) => setAvatarPosition(e.target.value as any)}
                        className="w-full p-3 bg-black border-2 border-white text-white rounded"
                      >
                        <option value="top-left">Top Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white font-bold mb-2">Size: {avatarSize}px</label>
                      <input
                        type="range"
                        min="80"
                        max="200"
                        value={avatarSize}
                        onChange={(e) => setAvatarSize(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3: Thumbnail Upload (NEW) */}
              <div className={`bg-black border-2 rounded-xl p-6 ${isStepComplete(3) ? 'border-green-500' : 'border-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isStepComplete(3) ? 'bg-green-500 text-black' : 'bg-white text-black'
                  }`}>
                    {isStepComplete(3) ? '✓' : '3'}
                  </div>
                  <h4 className="text-xl font-bold text-white">Thumbnail Upload</h4>
                  <span className="text-gray-400 text-sm">(Optional)</span>
                </div>

                {!thumbnailFile ? (
                  <button
                    onClick={() => thumbnailFileInputRef.current?.click()}
                    className="w-full bg-white hover:bg-gray-200 text-black px-4 py-8 rounded font-bold transition-colors flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-400"
                  >
                    <Image className="w-8 h-8" />
                    <span>Upload Thumbnail Image</span>
                    <span className="text-sm opacity-75">Recommended: 720x1280 (9:16)</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full max-h-48 object-cover rounded border-2 border-white"
                      />
                      <button
                        onClick={removeThumbnail}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm">{thumbnailFile.name}</p>
                  </div>
                )}

                <input
                  ref={thumbnailFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
              </div>

              {/* Step 4: Captions */}
              <div className={`bg-black border-2 rounded-xl p-6 ${isStepComplete(4) ? 'border-green-500' : 'border-white'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    isStepComplete(4) ? 'bg-green-500 text-black' : 'bg-white text-black'
                  }`}>
                    {isStepComplete(4) ? '✓' : '4'}
                  </div>
                  <h4 className="text-xl font-bold text-white">Captions</h4>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="captions-enabled"
                      checked={captionsEnabled}
                      onChange={(e) => setCaptionsEnabled(e.target.checked)}
                      className="w-5 h-5"
                    />
                    <label htmlFor="captions-enabled" className="text-white font-bold">
                      Enable Captions
                    </label>
                  </div>

                  {captionsEnabled && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-white font-bold mb-2">Font Size</label>
                        <input
                          type="range"
                          min="16"
                          max="32"
                          value={captionStyle.fontSize}
                          onChange={(e) => setCaptionStyle(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                          className="w-full"
                        />
                        <span className="text-gray-400 text-sm">{captionStyle.fontSize}px</span>
                      </div>
                      <div>
                        <label className="block text-white font-bold mb-2">Text Color</label>
                        <input
                          type="color"
                          value={captionStyle.color}
                          onChange={(e) => setCaptionStyle(prev => ({ ...prev, color: e.target.value }))}
                          className="w-full h-10 rounded border-2 border-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Create Video Button */}
              <button
                onClick={createFullClipVideo}
                disabled={!canCreateVideo() || isCreatingVideo}
                className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-6 py-4 rounded-lg font-bold text-xl transition-colors flex items-center justify-center gap-3"
              >
                {isCreatingVideo ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Creating FullClip... {creationProgress}%
                  </>
                ) : (
                  <>
                    <Film className="w-6 h-6" />
                    Create FullClip Video
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Sidebar - Video Preview (LARGER) */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b-2 border-white">
              <h3 className="text-2xl font-bold text-white">Video Preview</h3>
              <p className="text-gray-400">Preview your original video</p>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="flex items-center justify-center p-8 min-h-full">
                {selectedVideo ? (
                  <div className="w-full max-w-lg"> {/* LARGER: Increased from max-w-md */}
                    <div className="relative">
                      <video
                        controls
                        className="w-full bg-black rounded-lg border-2 border-white"
                        style={{ aspectRatio: '9/16' }}
                        src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
                      />
                      
                      {/* Avatar Preview Overlay */}
                      {selectedAvatar && (
                        <div 
                          className={`absolute w-16 h-16 rounded-full overflow-hidden border-2 border-white ${
                            avatarPosition === 'top-left' ? 'top-4 left-4' :
                            avatarPosition === 'top-right' ? 'top-4 right-4' :
                            avatarPosition === 'bottom-left' ? 'bottom-4 left-4' :
                            'bottom-4 right-4'
                          }`}
                          style={{ width: `${avatarSize * 0.3}px`, height: `${avatarSize * 0.3}px` }}
                        >
                          <img
                            src={getAvatarImageUrl(selectedAvatar)}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 text-center">
                      <h4 className="font-bold text-xl text-white mb-2">
                        {selectedVideo.display_name || selectedVideo.original_filename}
                      </h4>
                      <div className="flex justify-center gap-6 text-gray-400 font-medium">
                        <span className="capitalize">{selectedVideo.file_language}</span>
                        <span>{Math.round(selectedVideo.duration)}s</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Film className="w-20 h-20 mx-auto mb-6 opacity-50" />
                    <p className="text-2xl font-bold">No video selected</p>
                    <p className="text-lg mt-2">Select a video from the gallery to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullClipStudio;