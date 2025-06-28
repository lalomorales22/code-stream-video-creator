import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Download, Save, Settings, ChevronDown, ChevronUp, Mic, Volume2, User, Captions, Loader2, CheckCircle, AlertCircle, FileAudio, Zap, Eye, EyeOff, Upload, Image, Trash2 } from 'lucide-react';
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
  dbId?: number; // For database-stored avatars
}

interface ThumbnailOption {
  id: string;
  name: string;
  url: string;
  type: 'uploaded' | 'generated';
  dbId?: number; // For database-stored thumbnails
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Thumbnail State
  const [selectedThumbnail, setSelectedThumbnail] = useState<ThumbnailOption | null>(null);
  const [uploadedThumbnails, setUploadedThumbnails] = useState<ThumbnailOption[]>([]);
  const [showThumbnail, setShowThumbnail] = useState(true);
  const [thumbnailDuration, setThumbnailDuration] = useState(1); // Duration in seconds
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

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

  // Load uploaded avatars and thumbnails from database
  useEffect(() => {
    if (isOpen) {
      loadUploadedAssets();
    }
  }, [isOpen]);

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
  };

  const loadUploadedAssets = async () => {
    try {
      // Load avatars from database
      const avatars = await dbManager.getAllAvatars();
      const avatarOptions: AvatarOption[] = avatars.map(avatar => ({
        id: `db-${avatar.id}`,
        name: avatar.name,
        url: URL.createObjectURL(new Blob([avatar.image_data], { type: avatar.image_type })),
        type: avatar.avatar_type === 'uploaded' ? 'uploaded' : 'generated',
        dbId: avatar.id
      }));
      setUploadedAvatars(avatarOptions);

      // For thumbnails, we'll use the same avatar system for now
      // You could create a separate thumbnails table if needed
      const thumbnailOptions: ThumbnailOption[] = avatars.map(avatar => ({
        id: `thumb-${avatar.id}`,
        name: `${avatar.name} (Thumbnail)`,
        url: URL.createObjectURL(new Blob([avatar.image_data], { type: avatar.image_type })),
        type: avatar.avatar_type === 'uploaded' ? 'uploaded' : 'generated',
        dbId: avatar.id
      }));
      setUploadedThumbnails(thumbnailOptions);
    } catch (error) {
      console.error('Failed to load uploaded assets:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be smaller than 5MB');
      return;
    }

    setIsUploadingAvatar(true);
    setError(null);

    try {
      // Save to database
      const avatarId = await dbManager.saveAvatar(
        file.name.replace(/\.[^/.]+$/, ''), // Remove extension for name
        `Uploaded avatar: ${file.name}`,
        file,
        'uploaded'
      );

      // Create avatar option
      const newAvatar: AvatarOption = {
        id: `db-${avatarId}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: URL.createObjectURL(file),
        type: 'uploaded',
        dbId: avatarId
      };

      setUploadedAvatars(prev => [newAvatar, ...prev]);
      setSelectedAvatar(newAvatar);

      console.log('Avatar uploaded successfully:', newAvatar);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file must be smaller than 5MB');
      return;
    }

    setIsUploadingThumbnail(true);
    setError(null);

    try {
      // Save to database (reusing avatar table for thumbnails)
      const thumbnailId = await dbManager.saveAvatar(
        `${file.name.replace(/\.[^/.]+$/, '')} (Thumbnail)`,
        `Uploaded thumbnail: ${file.name}`,
        file,
        'uploaded'
      );

      // Create thumbnail option
      const newThumbnail: ThumbnailOption = {
        id: `thumb-${thumbnailId}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url: URL.createObjectURL(file),
        type: 'uploaded',
        dbId: thumbnailId
      };

      setUploadedThumbnails(prev => [newThumbnail, ...prev]);
      setSelectedThumbnail(newThumbnail);

      console.log('Thumbnail uploaded successfully:', newThumbnail);
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
      setError('Failed to upload thumbnail. Please try again.');
    } finally {
      setIsUploadingThumbnail(false);
      // Reset file input
      if (thumbnailFileInputRef.current) {
        thumbnailFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async (avatar: AvatarOption) => {
    if (avatar.type === 'preset' || !avatar.dbId) return;

    try {
      await dbManager.deleteAvatar(avatar.dbId);
      setUploadedAvatars(prev => prev.filter(a => a.id !== avatar.id));
      
      // If this was the selected avatar, switch to a preset
      if (selectedAvatar?.id === avatar.id) {
        setSelectedAvatar(presetAvatars[0]);
      }

      // Clean up URL
      URL.revokeObjectURL(avatar.url);
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      setError('Failed to delete avatar');
    }
  };

  const handleDeleteThumbnail = async (thumbnail: ThumbnailOption) => {
    if (!thumbnail.dbId) return;

    try {
      await dbManager.deleteAvatar(thumbnail.dbId);
      setUploadedThumbnails(prev => prev.filter(t => t.id !== thumbnail.id));
      
      // If this was the selected thumbnail, clear selection
      if (selectedThumbnail?.id === thumbnail.id) {
        setSelectedThumbnail(null);
      }

      // Clean up URL
      URL.revokeObjectURL(thumbnail.url);
    } catch (error) {
      console.error('Failed to delete thumbnail:', error);
      setError('Failed to delete thumbnail');
    }
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

  const generateScript = async () => {
    if (!selectedVideo || !xaiApiKey) return;

    setIsGeneratingScript(true);
    setError(null);

    try {
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
          temperature: 0.7,
          max_tokens: targetWords * 2 // Give some buffer for generation
        })
      });

      if (response.ok) {
        const data = await response.json();
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
      } else {
        throw new Error('Failed to generate script');
      }
    } catch (error) {
      console.error('Failed to generate script:', error);
      setError('Failed to generate script. Please check your XAI API key.');
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

  // Enhanced video creation with thumbnail and avatar support
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
      
      const originalVideoBlob = new Blob([selectedVideo.video_blob], { 
        type: selectedVideo.video_mime_type || 'video/mp4' 
      });
      originalVideo.src = URL.createObjectURL(originalVideoBlob);

      // Load avatar image
      const avatarImg = new Image();
      avatarImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        avatarImg.onload = () => resolve();
        avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
        avatarImg.src = selectedAvatar.url;
      });

      // Load thumbnail image if selected
      let thumbnailImg: HTMLImageElement | null = null;
      if (selectedThumbnail && showThumbnail) {
        thumbnailImg = new Image();
        thumbnailImg.crossOrigin = 'anonymous';
        
        await new Promise<void>((resolve, reject) => {
          thumbnailImg!.onload = () => resolve();
          thumbnailImg!.onerror = () => reject(new Error('Failed to load thumbnail'));
          thumbnailImg!.src = selectedThumbnail.url;
        });
      }

      // Wait for original video to load
      await new Promise<void>((resolve, reject) => {
        originalVideo.onloadeddata = () => resolve();
        originalVideo.onerror = () => reject(new Error('Failed to load original video'));
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
      const thumbnailEndTime = selectedThumbnail && showThumbnail ? thumbnailDuration * 1000 : 0;
      const totalDuration = Math.max(selectedVideo.duration, audioDuration) * 1000 + thumbnailEndTime;

      // Optimized rendering loop with thumbnail support
      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
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

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // Show thumbnail for the first few seconds if enabled
        if (thumbnailImg && showThumbnail && elapsed < thumbnailEndTime) {
          // Draw thumbnail
          ctx.drawImage(thumbnailImg, 0, 0, width, height);
          
          // Add thumbnail overlay text
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(0, height - 100, width, 100);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('Starting in...', width / 2, height - 60);
          
          const countdown = Math.ceil((thumbnailEndTime - elapsed) / 1000);
          ctx.font = 'bold 36px Arial';
          ctx.fillText(countdown.toString(), width / 2, height - 20);
        } else {
          // Draw original video (adjust timing for thumbnail)
          const videoTime = Math.max(0, (elapsed - thumbnailEndTime) / 1000);
          originalVideo.currentTime = Math.min(videoTime, selectedVideo.duration);
          
          if (originalVideo.readyState >= 2) {
            ctx.drawImage(originalVideo, 0, 0, width, height);
          }

          // Draw avatar
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

          // Draw captions (adjust timing for thumbnail)
          const currentTime = Math.max(0, (elapsed - thumbnailEndTime) / 1000);
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

            {/* Thumbnail Selection */}
            {audioGenerated && (
              <div className="bg-black border-2 border-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Thumbnail (Optional)
                  </h3>
                  <button
                    onClick={() => setShowThumbnail(!showThumbnail)}
                    className="flex items-center gap-2 px-3 py-1 bg-black border-2 border-white text-white hover:bg-white hover:text-black rounded transition-colors"
                  >
                    {showThumbnail ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    {showThumbnail ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showThumbnail && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => thumbnailFileInputRef.current?.click()}
                        disabled={isUploadingThumbnail}
                        className="flex-1 bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white flex items-center justify-center gap-2"
                      >
                        {isUploadingThumbnail ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5" />
                            Upload Thumbnail
                          </>
                        )}
                      </button>
                      
                      <input
                        ref={thumbnailFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailUpload}
                        className="hidden"
                      />
                    </div>
                    
                    {uploadedThumbnails.length > 0 && (
                      <div>
                        <label className="block text-white font-bold mb-2">Select Thumbnail</label>
                        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {uploadedThumbnails.map(thumbnail => (
                            <div key={thumbnail.id} className="relative">
                              <button
                                onClick={() => setSelectedThumbnail(thumbnail)}
                                className={`w-full p-2 rounded border-2 transition-colors ${
                                  selectedThumbnail?.id === thumbnail.id
                                    ? 'border-white bg-white text-black'
                                    : 'border-gray-600 text-white hover:border-white'
                                }`}
                              >
                                <img src={thumbnail.url} alt={thumbnail.name} className="w-full h-12 object-cover rounded mb-1" />
                                <span className="text-xs font-bold truncate block">{thumbnail.name}</span>
                              </button>
                              
                              <button
                                onClick={() => handleDeleteThumbnail(thumbnail)}
                                className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                                title="Delete thumbnail"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-white font-bold mb-2">Duration: {thumbnailDuration}s</label>
                      <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.5"
                        value={thumbnailDuration}
                        onChange={(e) => setThumbnailDuration(Number(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-gray-400 text-xs mt-1">How long to show thumbnail before video starts</p>
                    </div>
                  </div>
                )}
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
                    {showAvatarPreview ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="flex-1 bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white flex items-center justify-center gap-2"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          Upload Avatar
                        </>
                      )}
                    </button>
                    
                    <input
                      ref={avatarFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white font-bold mb-2">Preset Avatars</label>
                    <div className="grid grid-cols-2 gap-2">
                      {presetAvatars.map(avatar => (
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
                  
                  {uploadedAvatars.length > 0 && (
                    <div>
                      <label className="block text-white font-bold mb-2">Uploaded Avatars</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                        {uploadedAvatars.map(avatar => (
                          <div key={avatar.id} className="relative">
                            <button
                              onClick={() => setSelectedAvatar(avatar)}
                              className={`w-full p-3 rounded border-2 transition-colors ${
                                selectedAvatar?.id === avatar.id
                                  ? 'border-white bg-white text-black'
                                  : 'border-gray-600 text-white hover:border-white'
                              }`}
                            >
                              <img src={avatar.url} alt={avatar.name} className="w-8 h-8 mx-auto mb-1 rounded-full" />
                              <span className="text-xs font-bold truncate block">{avatar.name}</span>
                            </button>
                            
                            <button
                              onClick={() => handleDeleteAvatar(avatar)}
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                              title="Delete avatar"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
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