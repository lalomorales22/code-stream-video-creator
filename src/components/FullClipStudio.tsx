import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Download, Save, Settings, ChevronDown, ChevronUp, Mic, Volume2, User, Captions, Loader2, CheckCircle, AlertCircle, FileAudio, Zap, Eye, EyeOff, Upload, Image as ImageIcon } from 'lucide-react';
import { dbManager, VideoRecord } from '../utils/database';

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

interface AvatarOption {
  id: string;
  name: string;
  url: string;
  type: 'preset' | 'uploaded' | 'generated';
}

const FullClipStudio: React.FC<FullClipStudioProps> = ({
  isOpen,
  onClose,
  selectedVideo,
  onVideoSaved
}) => {
  // API Settings State
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [apiKeysValid, setApiKeysValid] = useState(false);

  // Voice Selection State
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Script Generation State
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [scriptGenerated, setScriptGenerated] = useState(false);

  // Audio Generation State
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioGenerated, setAudioGenerated] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState(0);

  // Avatar State
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarOption | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [avatarSize, setAvatarSize] = useState(80);
  const [showAvatarPreview, setShowAvatarPreview] = useState(true);
  const [uploadedAvatars, setUploadedAvatars] = useState<AvatarOption[]>([]);

  // Thumbnail State
  const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(null);
  const [thumbnailDuration, setThumbnailDuration] = useState(1); // seconds
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [uploadedThumbnails, setUploadedThumbnails] = useState<string[]>([]);

  // Ending Thumbnail State
  const [selectedEndingThumbnail, setSelectedEndingThumbnail] = useState<string | null>(null);
  const [showEndingThumbnail, setShowEndingThumbnail] = useState(true);
  const [uploadedEndingThumbnails, setUploadedEndingThumbnails] = useState<string[]>([]);

  // Caption State
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
  const [captionStyle, setCaptionStyle] = useState({
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    position: 'bottom'
  });

  // Video Generation State
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailFileInputRef = useRef<HTMLInputElement>(null);
  const endingThumbnailFileInputRef = useRef<HTMLInputElement>(null);

  // Preset avatars
  const presetAvatars: AvatarOption[] = [
    { id: 'penguin1', name: 'Classic Penguin', url: '/src/assets/images/avatar1.png', type: 'preset' },
    { id: 'penguin2', name: 'Cool Penguin', url: '/src/assets/images/avatar2.png', type: 'preset' },
    { id: 'penguin3', name: 'Smart Penguin', url: '/src/assets/images/avatar3.png', type: 'preset' },
    { id: 'penguin4', name: 'Tech Penguin', url: '/src/assets/images/avatar4.png', type: 'preset' }
  ];

  // Load API keys on mount
  useEffect(() => {
    const savedXaiKey = localStorage.getItem('xai_api_key') || '';
    const savedElevenLabsKey = localStorage.getItem('elevenlabs_api_key') || '';
    
    setXaiApiKey(savedXaiKey);
    setElevenLabsApiKey(savedElevenLabsKey);
    
    if (savedXaiKey && savedElevenLabsKey) {
      setApiKeysValid(true);
      loadVoices(savedElevenLabsKey);
    }
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && selectedVideo) {
      resetState();
      setSelectedAvatar(presetAvatars[0]);
    }
  }, [isOpen, selectedVideo]);

  const resetState = () => {
    setScript('');
    setScriptGenerated(false);
    setAudioBlob(null);
    setAudioGenerated(false);
    setAudioUrl(null);
    setCaptions([]);
    setError(null);
    setSuccess(false);
    setVideoProgress(0);
    setIsCreatingVideo(false);
    setSelectedThumbnail(null);
    setSelectedEndingThumbnail(null);
  };

  const handleApiKeysSave = async () => {
    localStorage.setItem('xai_api_key', xaiApiKey);
    localStorage.setItem('elevenlabs_api_key', elevenLabsApiKey);
    
    if (xaiApiKey && elevenLabsApiKey) {
      setApiKeysValid(true);
      await loadVoices(elevenLabsApiKey);
      setIsApiSettingsOpen(false);
    }
  };

  const loadVoices = async (apiKey: string) => {
    if (!apiKey) return;
    
    setLoadingVoices(true);
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableVoices(data.voices || []);
        if (data.voices && data.voices.length > 0) {
          setSelectedVoice(data.voices[0].voice_id);
        }
      } else {
        throw new Error('Failed to load voices');
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      setError('Failed to load voices. Please check your ElevenLabs API key.');
    } finally {
      setLoadingVoices(false);
    }
  };

  const generateScriptWithOpenRouter = async (prompt: string, targetWords: number, openRouterApiKey: string) => {
    console.log('Trying OpenRouter as fallback...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Code Stream Video Creator'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'x-ai/grok-beta', // OpenRouter model format
        stream: false,
        temperature: 0.7,
        max_tokens: targetWords * 2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenRouter API Response:', data);
    
    return data.choices?.[0]?.message?.content?.trim() || '';
  };

  const generateScript = async () => {
    if (!selectedVideo || !xaiApiKey) return;

    setIsGeneratingScript(true);
    setError(null);

    // Calculate target word count based on video duration
    // Aim for ~150 words per minute of video
    const targetWords = Math.max(20, Math.floor((selectedVideo.duration / 60) * 150));
    
    const prompt = `Create a script for a ${selectedVideo.duration} second code video. The script should be EXACTLY ${targetWords} words.

CRITICAL REQUIREMENTS:
- Start with "Wussup Fam!"
- Be exactly ${targetWords} words (no more, no less)
- Use NO symbols, punctuation, or special characters
- Spell out everything including "www" as "double u double u double u"
- Explain what this ${selectedVideo.file_language} code does
- Keep it casual but informative, not corny
- Focus on the actual functionality

Code content:
${selectedVideo.original_file_content}

File: ${selectedVideo.original_filename}
Language: ${selectedVideo.file_language}

Return ONLY the script text with exactly ${targetWords} words, no formatting or extra text.`;

    try {
      // Validate API key format
      if (!xaiApiKey.startsWith('xai-')) {
        throw new Error('Invalid xAI API key format. Key should start with "xai-"');
      }

      // Try different model names in order of preference
      const modelNames = [
        'grok-beta',
        'grok-3-beta', 
        'grok-3-mini',
        'grok-2-1212',
        'grok-2'
      ];

      let lastError = null;

      for (const modelName of modelNames) {
        try {
          console.log(`Trying xAI API with model: ${modelName}`);
          
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
              model: modelName,
              stream: false,
              temperature: 0.7,
              max_tokens: targetWords * 2 // Give some buffer for generation
            })
          });

          console.log(`Response status: ${response.status}`);
          console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

          if (response.ok) {
            const data = await response.json();
            console.log('API Response:', data);
            
            let generatedScript = data.choices?.[0]?.message?.content?.trim() || '';
            
            // Clean the script - remove all symbols and punctuation
            generatedScript = generatedScript
              .replace(/[^\w\s]/g, ' ') // Remove all non-word characters except spaces
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .trim();
            
            // Ensure it starts with "Wussup Fam"
            if (!generatedScript.toLowerCase().startsWith('wussup fam')) {
              generatedScript = 'Wussup Fam ' + generatedScript;
            }
            
            // Trim to target word count
            const words = generatedScript.split(' ');
            if (words.length > targetWords) {
              generatedScript = words.slice(0, targetWords).join(' ');
            }
            
            setScript(generatedScript);
            setScriptGenerated(true);
            console.log(`Successfully generated script with model: ${modelName}`);
            return; // Success - exit the function
          } else {
            // Read error response
            const errorText = await response.text();
            console.log(`Error response body:`, errorText);
            
            try {
              const errorData = JSON.parse(errorText);
              lastError = new Error(`API Error (${response.status}): ${errorData.error?.message || errorData.message || 'Unknown error'}`);
            } catch {
              lastError = new Error(`API Error (${response.status}): ${errorText || 'Unknown error'}`);
            }
          }
        } catch (err) {
          console.log(`Error with model ${modelName}:`, err);
          lastError = err;
          continue; // Try next model
        }
      }
      
      // If we get here, all models failed
      throw lastError || new Error('All model attempts failed');
      
    } catch (error: any) {
      console.error('Direct xAI API failed:', error);
      
      // Try OpenRouter as fallback
      const openRouterKey = localStorage.getItem('openrouter_api_key');
      if (openRouterKey) {
        try {
          console.log('Attempting OpenRouter fallback...');
          const generatedScript = await generateScriptWithOpenRouter(prompt, targetWords, openRouterKey);
          
          if (generatedScript) {
            // Clean the script - remove all symbols and punctuation
            let cleanScript = generatedScript
              .replace(/[^\w\s]/g, ' ') // Remove all non-word characters except spaces
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .trim();
            
            // Ensure it starts with "Wussup Fam"
            if (!cleanScript.toLowerCase().startsWith('wussup fam')) {
              cleanScript = 'Wussup Fam ' + cleanScript;
            }
            
            // Trim to target word count
            const words = cleanScript.split(' ');
            if (words.length > targetWords) {
              cleanScript = words.slice(0, targetWords).join(' ');
            }
            
            setScript(cleanScript);
            setScriptGenerated(true);
            console.log('Successfully generated script with OpenRouter fallback');
            return;
          }
        } catch (openRouterError: any) {
          console.error('OpenRouter fallback also failed:', openRouterError);
        }
      }
      
      // If both fail, show detailed error message
      let errorMessage = 'Failed to generate script. ';
      
      if (error?.message?.includes('Invalid xAI API key format')) {
        errorMessage += 'Please check your xAI API key format. It should start with "xai-".';
      } else if (error?.message?.includes('401')) {
        errorMessage += 'Invalid API key. Please check your xAI API key.';
      } else if (error?.message?.includes('404')) {
        errorMessage += 'Model not found. The xAI API might have updated. You can also try adding an OpenRouter API key in localStorage as "openrouter_api_key" for a fallback option.';
      } else if (error?.message?.includes('429')) {
        errorMessage += 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (error?.message?.includes('Network Error') || error?.message?.includes('fetch')) {
        errorMessage += 'Network error. Please check your internet connection.';
      } else {
        errorMessage += error?.message || 'Unknown error occurred.';
      }
      
      if (!openRouterKey) {
        errorMessage += ' Tip: You can add an OpenRouter API key to localStorage as "openrouter_api_key" for a backup option.';
      }
      
      setError(errorMessage);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateAudio = async () => {
    if (!script || !selectedVoice || !elevenLabsApiKey) return;

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

      if (response.ok) {
        const audioBlob = await response.blob();
        setAudioBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setAudioGenerated(true);
        
        // Get audio duration
        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration);
          generateCaptions(script, audio.duration);
        });
      } else {
        throw new Error('Failed to generate audio');
      }
    } catch (error) {
      console.error('Failed to generate audio:', error);
      setError('Failed to generate audio. Please check your ElevenLabs API key.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const generateCaptions = (text: string, duration: number) => {
    const words = text.split(' ');
    const wordsPerSecond = words.length / duration;
    const wordsPerCaption = Math.max(2, Math.min(6, Math.floor(wordsPerSecond * 2))); // 2-6 words per caption
    
    const captionSegments: CaptionSegment[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerCaption) {
      const segmentWords = words.slice(i, i + wordsPerCaption);
      const start = (i / words.length) * duration;
      const end = Math.min(((i + wordsPerCaption) / words.length) * duration, duration);
      
      captionSegments.push({
        start,
        end,
        text: segmentWords.join(' ')
      });
    }
    
    setCaptions(captionSegments);
  };

  const playAudio = () => {
    if (audioRef.current && audioUrl) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      const newAvatar: AvatarOption = {
        id: `uploaded-${Date.now()}`,
        name: file.name,
        url: url,
        type: 'uploaded'
      };
      
      setUploadedAvatars(prev => [...prev, newAvatar]);
      setSelectedAvatar(newAvatar);
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setUploadedThumbnails(prev => [...prev, url]);
      setSelectedThumbnail(url);
    }
  };

  // Handle ending thumbnail upload
  const handleEndingThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setUploadedEndingThumbnails(prev => [...prev, url]);
      setSelectedEndingThumbnail(url);
    }
  };

  // FIXED: Enhanced video creation with proper video rendering
  const createFullClipVideo = async () => {
    if (!selectedVideo || !audioBlob || !selectedAvatar) {
      setError('Missing required components for video creation');
      return;
    }

    setIsCreatingVideo(true);
    setVideoProgress(0);
    setError(null);

    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];
    let animationId: number | null = null;

    try {
      // Create canvas for video composition
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Set canvas size for vertical video
      const width = 720;
      const height = 1280;
      canvas.width = width;
      canvas.height = height;

      // Create original video element
      const originalVideo = document.createElement('video');
      originalVideo.muted = true;
      originalVideo.playsInline = true;
      originalVideo.crossOrigin = 'anonymous';
      
      // Use proper MIME type from stored video
      const originalVideoBlob = new Blob([selectedVideo.video_blob], { 
        type: selectedVideo.video_mime_type || 'video/mp4' 
      });
      originalVideo.src = URL.createObjectURL(originalVideoBlob);

      // Load avatar image
      const avatarImg = document.createElement('img');
      avatarImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        avatarImg.onload = () => resolve();
        avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
        avatarImg.src = selectedAvatar.url;
      });

      // Load thumbnail if selected
      let thumbnailImg: HTMLImageElement | null = null;
      if (selectedThumbnail && showThumbnail) {
        thumbnailImg = document.createElement('img');
        thumbnailImg.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          thumbnailImg!.onload = () => resolve();
          thumbnailImg!.onerror = () => reject(new Error('Failed to load thumbnail'));
          thumbnailImg!.src = selectedThumbnail;
        });
      }

      // Load ending thumbnail if selected
      let endingThumbnailImg: HTMLImageElement | null = null;
      if (selectedEndingThumbnail && showEndingThumbnail) {
        endingThumbnailImg = document.createElement('img');
        endingThumbnailImg.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          endingThumbnailImg!.onload = () => resolve();
          endingThumbnailImg!.onerror = () => reject(new Error('Failed to load ending thumbnail'));
          endingThumbnailImg!.src = selectedEndingThumbnail;
        });
      }

      // Wait for original video to load
      await new Promise<void>((resolve, reject) => {
        originalVideo.onloadeddata = () => {
          console.log('Original video loaded successfully');
          resolve();
        };
        originalVideo.onerror = (e) => {
          console.error('Original video load error:', e);
          reject(new Error('Failed to load original video'));
        };
      });

      // Create audio element
      const audio = new Audio();
      audio.src = URL.createObjectURL(audioBlob);
      await new Promise<void>((resolve, reject) => {
        audio.onloadeddata = () => resolve();
        audio.onerror = () => reject(new Error('Failed to load audio'));
      });

      // Get canvas stream with high quality settings
      const stream = canvas.captureStream(30); // 30 FPS
      
      // Add audio track to stream
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      audioSource.connect(destination);
      
      // Add audio track to video stream
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }

      // Enhanced codec selection with better compatibility
      const codecOptions = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 + AAC (best compatibility)
        'video/mp4;codecs=avc1.42E01E', // H.264 baseline
        'video/webm;codecs=vp9,opus',   // VP9 + Opus
        'video/webm;codecs=vp8,opus',   // VP8 + Opus (fallback)
        'video/webm'                    // Generic WebM
      ];

      let selectedMimeType = 'video/webm';
      for (const codec of codecOptions) {
        if (MediaRecorder.isTypeSupported(codec)) {
          selectedMimeType = codec;
          console.log('Using codec for FullClip:', codec);
          break;
        }
      }

      // Create MediaRecorder with optimized settings
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 6000000, // 6 Mbps for good quality
        audioBitsPerSecond: 128000   // 128 kbps audio
      });

      recordedChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          console.log('MediaRecorder stopped, processing video...');
          
          if (recordedChunks.length === 0) {
            throw new Error('No video data recorded');
          }

          // Create final blob with proper MIME type
          const finalMimeType = selectedMimeType.includes('mp4') ? 'video/mp4' : 'video/webm';
          const finalVideoBlob = new Blob(recordedChunks, { type: finalMimeType });
          
          if (finalVideoBlob.size === 0) {
            throw new Error('Generated video is empty');
          }

          console.log('Final video created:', {
            size: finalVideoBlob.size,
            type: finalVideoBlob.type,
            duration: audioDuration
          });

          // Save to database
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `fullclip-${selectedVideo.original_filename.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
          const displayName = `${selectedVideo.display_name || selectedVideo.original_filename.replace(/\.[^/.]+$/, '')} (FullClip)`;

          await dbManager.saveFullClipVideo(
            filename,
            selectedVideo.original_filename,
            selectedVideo.file_language,
            Math.round(audioDuration),
            finalVideoBlob,
            script,
            captions,
            selectedVideo.original_file_content,
            displayName,
            finalMimeType
          );

          setSuccess(true);
          setVideoProgress(100);
          
          // Clean up
          URL.revokeObjectURL(originalVideo.src);
          if (audioUrl) URL.revokeObjectURL(audioUrl);
          
          setTimeout(() => {
            onVideoSaved?.();
            onClose();
          }, 2000);

        } catch (error) {
          console.error('Error in MediaRecorder.onstop:', error);
          setError(`Failed to save video: ${error instanceof Error ? error.message : 'Unknown error'}`);
          setIsCreatingVideo(false);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed due to MediaRecorder error');
        setIsCreatingVideo(false);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Start playback
      originalVideo.currentTime = 0;
      audio.currentTime = 0;
      
      await Promise.all([
        originalVideo.play(),
        audio.play()
      ]);

      const startTime = Date.now();
      const totalDuration = Math.max(selectedVideo.duration, audioDuration) * 1000; // Convert to ms

      // FIXED: Enhanced rendering loop with proper video drawing
      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        const currentTime = elapsed / 1000; // Current time in seconds
        
        setVideoProgress(Math.round(progress * 95)); // Leave 5% for processing

        if (progress >= 1) {
          // Recording complete
          console.log('Recording duration complete, stopping...');
          if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          originalVideo.pause();
          audio.pause();
          return;
        }

        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Calculate total duration in seconds
        const totalDurationSeconds = totalDuration / 1000;
        const endingThumbnailDuration = 3; // Fixed 3 seconds for ending thumbnail
        const endingThumbnailStartTime = totalDurationSeconds - endingThumbnailDuration;

        // Show ending thumbnail for the last 3 seconds if enabled
        if (endingThumbnailImg && showEndingThumbnail && currentTime >= endingThumbnailStartTime) {
          // Draw ending thumbnail scaled to fit canvas
          const aspectRatio = endingThumbnailImg.naturalWidth / endingThumbnailImg.naturalHeight;
          let drawWidth = width;
          let drawHeight = height;
          
          if (aspectRatio > (width / height)) {
            drawHeight = width / aspectRatio;
          } else {
            drawWidth = height * aspectRatio;
          }
          
          const x = (width - drawWidth) / 2;
          const y = (height - drawHeight) / 2;
          
          ctx.drawImage(endingThumbnailImg, x, y, drawWidth, drawHeight);
        }
        // Show thumbnail for the first few seconds if enabled
        else if (thumbnailImg && showThumbnail && currentTime < thumbnailDuration) {
          // Draw thumbnail scaled to fit canvas
          const aspectRatio = thumbnailImg.naturalWidth / thumbnailImg.naturalHeight;
          let drawWidth = width;
          let drawHeight = height;
          
          if (aspectRatio > (width / height)) {
            drawHeight = width / aspectRatio;
          } else {
            drawWidth = height * aspectRatio;
          }
          
          const x = (width - drawWidth) / 2;
          const y = (height - drawHeight) / 2;
          
          ctx.drawImage(thumbnailImg, x, y, drawWidth, drawHeight);
        } else {
          // Draw original video - FIXED: Ensure video is properly drawn
          if (originalVideo.readyState >= 2 && originalVideo.videoWidth > 0 && originalVideo.videoHeight > 0) {
            // Calculate aspect ratio to fit video properly
            const videoAspectRatio = originalVideo.videoWidth / originalVideo.videoHeight;
            const canvasAspectRatio = width / height;
            
            let drawWidth = width;
            let drawHeight = height;
            let offsetX = 0;
            let offsetY = 0;
            
            if (videoAspectRatio > canvasAspectRatio) {
              // Video is wider than canvas
              drawHeight = width / videoAspectRatio;
              offsetY = (height - drawHeight) / 2;
            } else {
              // Video is taller than canvas
              drawWidth = height * videoAspectRatio;
              offsetX = (width - drawWidth) / 2;
            }
            
            ctx.drawImage(originalVideo, offsetX, offsetY, drawWidth, drawHeight);
          } else {
            // Fallback: draw a placeholder if video isn't ready
            ctx.fillStyle = '#333333';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Loading Video...', width / 2, height / 2);
          }
        }

        // Draw avatar if enabled
        if (showAvatarPreview && avatarImg.complete) {
          const avatarPixelSize = avatarSize;
          const padding = 20;
          
          let avatarX, avatarY;
          switch (avatarPosition) {
            case 'top-left':
              avatarX = padding;
              avatarY = padding;
              break;
            case 'top-right':
              avatarX = width - avatarPixelSize - padding;
              avatarY = padding;
              break;
            case 'bottom-left':
              avatarX = padding;
              avatarY = height - avatarPixelSize - padding;
              break;
            case 'bottom-right':
            default:
              avatarX = width - avatarPixelSize - padding;
              avatarY = height - avatarPixelSize - padding;
              break;
          }
          
          // Draw avatar with circular mask
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarPixelSize/2, avatarY + avatarPixelSize/2, avatarPixelSize/2, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(avatarImg, avatarX, avatarY, avatarPixelSize, avatarPixelSize);
          ctx.restore();
        }

        // Draw captions
        const currentCaption = captions.find(cap => currentTime >= cap.start && currentTime <= cap.end);
        
        if (currentCaption) {
          ctx.font = `${captionStyle.fontWeight} ${captionStyle.fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillStyle = captionStyle.backgroundColor;
          
          const textMetrics = ctx.measureText(currentCaption.text);
          const textWidth = textMetrics.width + 20;
          const textHeight = captionStyle.fontSize + 10;
          
          let captionY;
          if (captionStyle.position === 'top') {
            captionY = 100;
          } else {
            captionY = height - 150;
          }
          
          // Draw background
          ctx.fillRect((width - textWidth) / 2, captionY - textHeight/2, textWidth, textHeight);
          
          // Draw text
          ctx.fillStyle = captionStyle.color;
          ctx.fillText(currentCaption.text, width / 2, captionY + captionStyle.fontSize/3);
        }

        animationId = requestAnimationFrame(renderFrame);
      };

      renderFrame();

    } catch (error) {
      console.error('Failed to create FullClip video:', error);
      setError(`Failed to create video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreatingVideo(false);
      
      // Clean up on error
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[95vh] flex">
        {/* Left Sidebar - Controls */}
        <div className="w-1/2 border-r-2 border-white flex flex-col">
          {/* Header */}
          <div className="p-6 border-b-2 border-white">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 border-2 border-white rounded-lg">
                  <FileAudio className="w-6 h-6 text-white" />
                </div>
                FullClip Studio
              </h2>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white hover:text-black rounded-lg transition-colors border-2 border-white text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {selectedVideo && (
              <p className="text-gray-400 mt-2 text-lg">
                Creating FullClip for: <span className="text-white font-bold">{selectedVideo.display_name || selectedVideo.original_filename}</span>
              </p>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* API Settings */}
            <div className="bg-black border-2 border-white rounded-lg">
              <button
                onClick={() => setIsApiSettingsOpen(!isApiSettingsOpen)}
                className="w-full p-4 flex items-center justify-between text-white hover:bg-white hover:text-black transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5" />
                  <span className="font-bold text-lg">API Settings</span>
                  {apiKeysValid && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                {isApiSettingsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              
              {isApiSettingsOpen && (
                <div className="p-4 border-t-2 border-white space-y-4">
                  <div>
                    <label className="block text-white font-bold mb-2">XAI API Key</label>
                    <input
                      type="password"
                      value={xaiApiKey}
                      onChange={(e) => setXaiApiKey(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleApiKeysSave()}
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
                      onKeyDown={(e) => e.key === 'Enter' && handleApiKeysSave()}
                      placeholder="Enter your ElevenLabs API key"
                      className="w-full p-3 bg-black border-2 border-white text-white rounded"
                    />
                  </div>
                  
                  <button
                    onClick={handleApiKeysSave}
                    className="w-full bg-white hover:bg-gray-200 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white"
                  >
                    Save API Keys
                  </button>
                </div>
              )}
            </div>

            {/* Voice Selection */}
            {apiKeysValid && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Volume2 className="w-5 h-5" />
                  Voice Selection
                </h3>
                
                {loadingVoices ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading voices...
                  </div>
                ) : (
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full p-3 bg-black border-2 border-white text-white rounded"
                  >
                    {availableVoices.map(voice => (
                      <option key={voice.voice_id} value={voice.voice_id}>
                        {voice.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Script Generation */}
            {apiKeysValid && selectedVoice && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <FileAudio className="w-5 h-5" />
                    AI Script Generation
                  </h3>
                  {scriptGenerated && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                
                <button
                  onClick={generateScript}
                  disabled={isGeneratingScript}
                  className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white mb-4 flex items-center justify-center gap-2"
                >
                  {isGeneratingScript ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Generate Script
                    </>
                  )}
                </button>
                
                {script && (
                  <div>
                    <label className="block text-white font-bold mb-2">Generated Script</label>
                    <textarea
                      value={script}
                      onChange={(e) => setScript(e.target.value)}
                      className="w-full p-3 bg-black border-2 border-white text-white rounded h-32 resize-none"
                      placeholder="AI-generated script will appear here..."
                    />
                    <p className="text-gray-400 text-sm mt-2">
                      Word count: {script.split(' ').length} words
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Audio Generation */}
            {script && selectedVoice && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Audio Generation
                  </h3>
                  {audioGenerated && <CheckCircle className="w-5 h-5 text-green-400" />}
                </div>
                
                <button
                  onClick={generateAudio}
                  disabled={isGeneratingAudio}
                  className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white mb-4 flex items-center justify-center gap-2"
                >
                  {isGeneratingAudio ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating Audio...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5" />
                      Generate Audio
                    </>
                  )}
                </button>
                
                {audioUrl && (
                  <div className="space-y-3">
                    <button
                      onClick={playAudio}
                      className="w-full bg-black border-2 border-white text-white hover:bg-white hover:text-black px-4 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      {isPlayingAudio ? 'Pause' : 'Play'} Audio Preview
                    </button>
                    
                    <audio
                      ref={audioRef}
                      src={audioUrl}
                      onEnded={() => setIsPlayingAudio(false)}
                      onPause={() => setIsPlayingAudio(false)}
                      onPlay={() => setIsPlayingAudio(true)}
                    />
                    
                    <p className="text-gray-400 text-sm text-center">
                      Duration: {audioDuration.toFixed(1)}s
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Thumbnail Upload */}
            {audioGenerated && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Thumbnail (Optional)
                  </h3>
                  <button
                    onClick={() => setShowThumbnail(!showThumbnail)}
                    className="flex items-center gap-2 px-3 py-1 bg-black border-2 border-white text-white hover:bg-white hover:text-black rounded transition-colors"
                  >
                    {showThumbnail ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showThumbnail ? 'Show' : 'Hide'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => thumbnailFileInputRef.current?.click()}
                    className="w-full bg-white hover:bg-gray-200 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Thumbnail
                  </button>
                  
                  <input
                    ref={thumbnailFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                  />
                  
                  {uploadedThumbnails.length > 0 && (
                    <div>
                      <label className="block text-white font-bold mb-2">Select Thumbnail</label>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedThumbnails.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedThumbnail(url)}
                            className={`aspect-video rounded border-2 overflow-hidden transition-colors ${
                              selectedThumbnail === url
                                ? 'border-white'
                                : 'border-gray-600 hover:border-white'
                            }`}
                          >
                            <img src={url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedThumbnail && (
                    <div>
                      <label className="block text-white font-bold mb-2">Duration: {thumbnailDuration}s</label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.5"
                        value={thumbnailDuration}
                        onChange={(e) => setThumbnailDuration(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Ending Thumbnail Upload */}
            {audioGenerated && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Ending Thumbnail (Optional)
                  </h3>
                  <button
                    onClick={() => setShowEndingThumbnail(!showEndingThumbnail)}
                    className="flex items-center gap-2 px-3 py-1 bg-black border-2 border-white text-white hover:bg-white hover:text-black rounded transition-colors"
                  >
                    {showEndingThumbnail ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showEndingThumbnail ? 'Show' : 'Hide'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => endingThumbnailFileInputRef.current?.click()}
                    className="w-full bg-white hover:bg-gray-200 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Ending Thumbnail
                  </button>
                  
                  <input
                    ref={endingThumbnailFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEndingThumbnailUpload}
                    className="hidden"
                  />
                  
                  {uploadedEndingThumbnails.length > 0 && (
                    <div>
                      <label className="block text-white font-bold mb-2">Select Ending Thumbnail</label>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedEndingThumbnails.map((url, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedEndingThumbnail(url)}
                            className={`aspect-video rounded border-2 overflow-hidden transition-colors ${
                              selectedEndingThumbnail === url
                                ? 'border-white'
                                : 'border-gray-600 hover:border-white'
                            }`}
                          >
                            <img src={url} alt={`Ending Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedEndingThumbnail && (
                    <div>
                      <p className="text-white font-bold mb-2">Duration: 3 seconds (fixed)</p>
                      <p className="text-gray-400 text-sm">
                        The ending thumbnail will appear for the last 3 seconds of the video.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Avatar Selection */}
            {audioGenerated && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Avatar & Positioning
                  </h3>
                  <button
                    onClick={() => setShowAvatarPreview(!showAvatarPreview)}
                    className="flex items-center gap-2 px-3 py-1 bg-black border-2 border-white text-white hover:bg-white hover:text-black rounded transition-colors"
                  >
                    {showAvatarPreview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showAvatarPreview ? 'Show' : 'Hide'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <button
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="w-full bg-white hover:bg-gray-200 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Avatar
                  </button>
                  
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  
                  <div>
                    <label className="block text-white font-bold mb-2">Select Avatar</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[...presetAvatars, ...uploadedAvatars].map(avatar => (
                        <button
                          key={avatar.id}
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`p-3 rounded border-2 transition-colors ${
                            selectedAvatar?.id === avatar.id
                              ? 'border-white bg-white text-black'
                              : 'border-gray-600 text-white hover:border-white'
                          }`}
                        >
                          <img src={avatar.url} alt={avatar.name} className="w-8 h-8 mx-auto mb-1 rounded-full" />
                          <span className="text-xs font-bold">{avatar.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
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
                      min="60"
                      max="120"
                      value={avatarSize}
                      onChange={(e) => setAvatarSize(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Caption Styling */}
            {captions.length > 0 && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Captions className="w-5 h-5" />
                  Caption Styling
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-white font-bold mb-2">Font Size: {captionStyle.fontSize}px</label>
                    <input
                      type="range"
                      min="16"
                      max="32"
                      value={captionStyle.fontSize}
                      onChange={(e) => setCaptionStyle(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-bold mb-2">Position</label>
                    <select
                      value={captionStyle.position}
                      onChange={(e) => setCaptionStyle(prev => ({ ...prev, position: e.target.value }))}
                      className="w-full p-3 bg-black border-2 border-white text-white rounded"
                    >
                      <option value="bottom">Bottom</option>
                      <option value="top">Top</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white font-bold mb-2">Text Color</label>
                      <input
                        type="color"
                        value={captionStyle.color}
                        onChange={(e) => setCaptionStyle(prev => ({ ...prev, color: e.target.value }))}
                        className="w-full h-10 rounded border-2 border-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-white font-bold mb-2">Background</label>
                      <input
                        type="color"
                        value={captionStyle.backgroundColor}
                        onChange={(e) => setCaptionStyle(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-full h-10 rounded border-2 border-white"
                      />
                    </div>
                  </div>
                  
                  <p className="text-gray-400 text-sm">
                    {captions.length} caption segments generated
                  </p>
                </div>
              </div>
            )}

            {/* Create Video */}
            {audioGenerated && selectedAvatar && captions.length > 0 && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <FileAudio className="w-5 h-5" />
                  Create FullClip Video
                </h3>
                
                {!isCreatingVideo ? (
                  <button
                    onClick={createFullClipVideo}
                    className="w-full bg-white hover:bg-gray-200 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white flex items-center justify-center gap-2"
                  >
                    <FileAudio className="w-5 h-5" />
                    Create FullClip
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                      <span className="text-white font-bold">Creating FullClip Video...</span>
                    </div>
                    
                    <div className="w-full bg-gray-800 rounded-full h-4 border-2 border-white">
                      <div 
                        className="bg-white h-full rounded-full transition-all duration-300"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                    
                    <p className="text-center text-white font-bold">{videoProgress}%</p>
                  </div>
                )}
                
                {success && (
                  <div className="mt-4 p-4 bg-green-900 border-2 border-green-400 rounded-lg">
                    <div className="flex items-center gap-2 text-green-400 font-bold">
                      <CheckCircle className="w-5 h-5" />
                      FullClip video created successfully!
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="p-6 border-b-2 border-white">
            <h3 className="text-2xl font-bold text-white">Preview</h3>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-6">
            {selectedVideo ? (
              <div className="w-full max-w-md">
                <video
                  ref={videoRef}
                  controls
                  className="w-full bg-black rounded-lg border-2 border-white"
                  style={{ aspectRatio: '9/16' }}
                  src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: selectedVideo.video_mime_type || 'video/mp4' }))}
                />
                
                <div className="mt-4 text-center">
                  <h4 className="font-bold text-xl text-white mb-2">
                    {selectedVideo.display_name || selectedVideo.original_filename}
                  </h4>
                  <div className="flex justify-center gap-4 text-gray-400 font-medium">
                    <span className="capitalize">{selectedVideo.file_language}</span>
                    <span>{selectedVideo.duration}s</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <FileAudio className="w-20 h-20 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-bold">No video selected</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for video composition */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={720}
        height={1280}
      />

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-6 right-6 bg-black border-2 border-red-500 rounded-lg p-4 max-w-md">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <span className="text-white font-medium">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-white hover:bg-white hover:text-black p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FullClipStudio;