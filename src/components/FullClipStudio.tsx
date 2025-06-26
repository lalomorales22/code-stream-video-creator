import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Mic, Play, Pause, Download, Upload, Trash2, Loader2, Volume2, VolumeX, Captions, CheckCircle, Share2, Copy, ExternalLink } from 'lucide-react';
import { dbManager, VideoRecord } from '../utils/database';

interface FullClipStudioProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: VideoRecord | null;
  onVideoSaved: () => void;
}

interface Voice {
  voice_id: string;
  name: string;
  category: string;
}

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
}

interface Avatar {
  id: number;
  name: string;
  description: string;
  url: string;
  type: 'uploaded' | 'generated' | 'preset';
}

// Preset penguin avatars
const presetAvatars: Avatar[] = [
  {
    id: -1,
    name: 'Classic Penguin',
    description: 'Professional penguin avatar',
    url: '/src/assets/images/avatar1.png',
    type: 'preset'
  },
  {
    id: -2,
    name: 'Cool Penguin',
    description: 'Penguin with sunglasses',
    url: '/src/assets/images/avatar2.png',
    type: 'preset'
  },
  {
    id: -3,
    name: 'Smart Penguin',
    description: 'Penguin with glasses',
    url: '/src/assets/images/avatar3.png',
    type: 'preset'
  },
  {
    id: -4,
    name: 'Tech Penguin',
    description: 'Penguin with headphones',
    url: '/src/assets/images/avatar4.png',
    type: 'preset'
  }
];

const FullClipStudio: React.FC<FullClipStudioProps> = ({
  isOpen,
  onClose,
  selectedVideo,
  onVideoSaved
}) => {
  // API Keys and Settings
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(true);
  const [xaiKeyStatus, setXaiKeyStatus] = useState<'untested' | 'testing' | 'valid' | 'invalid'>('untested');
  const [elevenLabsKeyStatus, setElevenLabsKeyStatus] = useState<'untested' | 'testing' | 'valid' | 'invalid'>('untested');

  // Voice and Audio
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);

  // Script Generation
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Audio Generation
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Avatar Management
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [avatarSize, setAvatarSize] = useState(120);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [avatarPrompt, setAvatarPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Caption Settings
  const [captionSettings, setCaptionSettings] = useState({
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.7,
    position: 'bottom',
    maxWordsPerLine: 6
  });

  // Video Creation
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStage, setCreationStage] = useState('');

  // Social Media Content
  const [socialMediaContent, setSocialMediaContent] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isGeneratingSocialContent, setIsGeneratingSocialContent] = useState(false);

  // Canvas and Recording
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Load API keys and avatars on mount
  useEffect(() => {
    if (isOpen) {
      const savedXaiKey = localStorage.getItem('xai_api_key') || '';
      const savedElevenLabsKey = localStorage.getItem('elevenlabs_api_key') || '';
      
      setXaiApiKey(savedXaiKey);
      setElevenLabsApiKey(savedElevenLabsKey);
      
      // Test keys if they exist
      if (savedXaiKey) {
        testXaiApiKey(savedXaiKey);
      }
      if (savedElevenLabsKey) {
        testElevenLabsApiKey(savedElevenLabsKey);
      }
      
      loadAvatars();
    }
  }, [isOpen]);

  // Test XAI API Key
  const testXaiApiKey = async (key: string) => {
    if (!key.trim()) {
      setXaiKeyStatus('untested');
      return;
    }

    setXaiKeyStatus('testing');
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Test' }],
          model: 'grok-beta',
          max_tokens: 1
        })
      });

      if (response.ok || response.status === 400) { // 400 is also valid (means API key works but request format issue)
        setXaiKeyStatus('valid');
        localStorage.setItem('xai_api_key', key);
      } else {
        setXaiKeyStatus('invalid');
      }
    } catch (error) {
      console.error('XAI API key test failed:', error);
      setXaiKeyStatus('invalid');
    }
  };

  // Test ElevenLabs API Key and load voices
  const testElevenLabsApiKey = async (key: string) => {
    if (!key.trim()) {
      setElevenLabsKeyStatus('untested');
      setVoices([]);
      return;
    }

    setElevenLabsKeyStatus('testing');
    setIsLoadingVoices(true);
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': key
        }
      });

      if (response.ok) {
        const data = await response.json();
        const voiceList = data.voices || [];
        setVoices(voiceList);
        setElevenLabsKeyStatus('valid');
        localStorage.setItem('elevenlabs_api_key', key);
        
        // Auto-select first voice
        if (voiceList.length > 0 && !selectedVoice) {
          setSelectedVoice(voiceList[0].voice_id);
        }
      } else {
        setElevenLabsKeyStatus('invalid');
        setVoices([]);
      }
    } catch (error) {
      console.error('ElevenLabs API key test failed:', error);
      setElevenLabsKeyStatus('invalid');
      setVoices([]);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Handle API key input with Enter key
  const handleApiKeyKeyPress = (e: React.KeyboardEvent, type: 'xai' | 'elevenlabs') => {
    if (e.key === 'Enter') {
      if (type === 'xai') {
        testXaiApiKey(xaiApiKey);
      } else {
        testElevenLabsApiKey(elevenLabsApiKey);
      }
    }
  };

  // Load avatars from database and combine with presets
  const loadAvatars = async () => {
    try {
      const dbAvatars = await dbManager.getAllAvatars();
      const dbAvatarsWithUrls = dbAvatars.map(avatar => ({
        id: avatar.id,
        name: avatar.name,
        description: avatar.description,
        url: URL.createObjectURL(new Blob([avatar.image_data], { type: avatar.image_type })),
        type: avatar.avatar_type
      }));
      
      setAvatars([...presetAvatars, ...dbAvatarsWithUrls]);
    } catch (error) {
      console.error('Failed to load avatars:', error);
      setAvatars(presetAvatars);
    }
  };

  // Generate script using XAI
  const generateScript = async () => {
    if (!selectedVideo || !xaiApiKey || xaiKeyStatus !== 'valid') {
      alert('Please ensure you have a valid XAI API key and a selected video.');
      return;
    }

    setIsGeneratingScript(true);
    try {
      const prompt = `Analyze this ${selectedVideo.file_language} code and create a natural, conversational script for a vertical video (TikTok/YouTube Shorts style). The script should be engaging and educational, explaining what the code does in simple terms.

Code content:
${selectedVideo.original_file_content}

Requirements:
- Write in a conversational, friendly tone
- Explain the code's purpose and key functionality
- Keep it concise but informative (aim for 30-60 seconds when spoken)
- Use simple language that beginners can understand
- Don't just read the code line by line - explain the concepts
- Make it engaging for social media audiences
- Focus on what the code accomplishes, not just syntax

Write the script as if you're talking directly to the viewer, explaining this code in an interesting way.`;

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

      if (response.ok) {
        const data = await response.json();
        const generatedScript = data.choices?.[0]?.message?.content?.trim() || '';
        setScript(generatedScript);
      } else {
        throw new Error('Failed to generate script');
      }
    } catch (error) {
      console.error('Script generation failed:', error);
      alert('Failed to generate script. Please check your API key and try again.');
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // Generate audio using ElevenLabs
  const generateAudio = async () => {
    if (!script.trim() || !selectedVoice || !elevenLabsApiKey || elevenLabsKeyStatus !== 'valid') {
      alert('Please ensure you have a script, selected voice, and valid ElevenLabs API key.');
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

      if (response.ok) {
        const audioBlob = await response.blob();
        setAudioBlob(audioBlob);
        
        // Load audio to get duration
        const audio = new Audio(URL.createObjectURL(audioBlob));
        audio.addEventListener('loadedmetadata', () => {
          setAudioDuration(audio.duration);
        });
      } else {
        throw new Error('Failed to generate audio');
      }
    } catch (error) {
      console.error('Audio generation failed:', error);
      alert('Failed to generate audio. Please check your API key and try again.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Play/pause audio
  const toggleAudioPlayback = () => {
    if (!audioRef.current || !audioBlob) return;

    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  // Handle audio time updates
  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
  };

  // Upload avatar
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const avatarId = await dbManager.saveAvatar(
        file.name,
        'Uploaded avatar',
        file,
        'uploaded'
      );
      
      await loadAvatars();
      
      // Select the newly uploaded avatar
      const newAvatar = {
        id: avatarId,
        name: file.name,
        description: 'Uploaded avatar',
        url: URL.createObjectURL(file),
        type: 'uploaded' as const
      };
      setSelectedAvatar(newAvatar);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      alert('Failed to upload avatar.');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Generate AI avatar
  const generateAIAvatar = async () => {
    if (!avatarPrompt.trim() || !xaiApiKey || xaiKeyStatus !== 'valid') {
      alert('Please enter a prompt and ensure you have a valid XAI API key.');
      return;
    }

    setIsGeneratingAvatar(true);
    try {
      const response = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiApiKey}`
        },
        body: JSON.stringify({
          prompt: `${avatarPrompt}, penguin character, cute, professional, avatar style, transparent background, high quality`,
          n: 1,
          size: '512x512'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;
        
        if (imageUrl) {
          // Download the image and save it
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();
          const imageFile = new File([imageBlob], `ai-avatar-${Date.now()}.png`, { type: 'image/png' });
          
          const avatarId = await dbManager.saveAvatar(
            `AI Avatar: ${avatarPrompt}`,
            `Generated from prompt: ${avatarPrompt}`,
            imageFile,
            'generated'
          );
          
          await loadAvatars();
          
          // Select the newly generated avatar
          const newAvatar = {
            id: avatarId,
            name: `AI Avatar: ${avatarPrompt}`,
            description: `Generated from prompt: ${avatarPrompt}`,
            url: URL.createObjectURL(imageBlob),
            type: 'generated' as const
          };
          setSelectedAvatar(newAvatar);
          setAvatarPrompt('');
        }
      } else {
        throw new Error('Failed to generate avatar');
      }
    } catch (error) {
      console.error('Avatar generation failed:', error);
      alert('Failed to generate avatar. Please check your API key and try again.');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // Generate captions from script
  const generateCaptions = (script: string, audioDuration: number): CaptionSegment[] => {
    const words = script.split(' ');
    const segments: CaptionSegment[] = [];
    const wordsPerSegment = captionSettings.maxWordsPerLine;
    const segmentDuration = audioDuration / Math.ceil(words.length / wordsPerSegment);

    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const segmentWords = words.slice(i, i + wordsPerSegment);
      const start = (i / wordsPerSegment) * segmentDuration;
      const end = Math.min(start + segmentDuration, audioDuration);
      
      segments.push({
        start,
        end,
        text: segmentWords.join(' ')
      });
    }

    return segments;
  };

  // Generate social media content
  const generateSocialMediaContent = async () => {
    if (!selectedVideo || !xaiApiKey || xaiKeyStatus !== 'valid') {
      return;
    }

    setIsGeneratingSocialContent(true);

    try {
      const prompt = `Create social media content for a code video. Generate a catchy title and description for this ${selectedVideo.file_language} code video.

Video details:
- Language: ${selectedVideo.file_language}
- Original filename: ${selectedVideo.original_filename}
- Script: ${script}

Requirements:
- Title: Short, catchy, under 60 characters
- Description: 2-3 sentences, engaging but not overly promotional
- Focus on what the code does, not just that it's a code video
- Make it suitable for TikTok, YouTube Shorts, and Instagram
- Don't use excessive emojis or hashtags in the description

Return in this exact JSON format:
{
  "title": "Your catchy title here",
  "description": "Your 2-3 sentence description here"
}`;

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

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content?.trim();
        
        if (content) {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(content);
            setSocialMediaContent({
              title: parsed.title || 'Code Tutorial',
              description: parsed.description || 'Check out this code tutorial!'
            });
          } catch (parseError) {
            // Fallback if not valid JSON
            console.warn('Failed to parse social media content as JSON, using fallback');
            setSocialMediaContent({
              title: `${selectedVideo.file_language} Code Tutorial`,
              description: `Learn ${selectedVideo.file_language} programming with this quick tutorial. Perfect for developers looking to improve their coding skills.`
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate social media content:', error);
      // Set fallback content
      setSocialMediaContent({
        title: `${selectedVideo.file_language} Code Tutorial`,
        description: `Learn ${selectedVideo.file_language} programming with this quick tutorial. Perfect for developers looking to improve their coding skills.`
      });
    } finally {
      setIsGeneratingSocialContent(false);
    }
  };

  // FIXED: Enhanced video creation with better synchronization
  const createFullClipVideo = async () => {
    if (!selectedVideo || !audioBlob || !script) {
      alert('Please ensure you have a video, audio, and script ready.');
      return;
    }

    setIsCreatingVideo(true);
    setCreationProgress(0);
    setCreationStage('Initializing...');

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // FIXED: Set canvas dimensions for vertical video with consistent aspect ratio
      const width = 720;
      const height = 1280;
      canvas.width = width;
      canvas.height = height;

      setCreationStage('Loading original video...');
      setCreationProgress(10);

      // Load the original video
      const originalVideoBlob = new Blob([selectedVideo.video_blob], { type: 'video/mp4' });
      const originalVideoUrl = URL.createObjectURL(originalVideoBlob);
      
      const originalVideo = document.createElement('video');
      originalVideo.src = originalVideoUrl;
      originalVideo.muted = true;
      originalVideo.playsInline = true;

      await new Promise((resolve, reject) => {
        originalVideo.onloadedmetadata = resolve;
        originalVideo.onerror = reject;
        originalVideo.load();
      });

      setCreationStage('Loading audio...');
      setCreationProgress(20);

      // Load audio
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = resolve;
        audio.onerror = reject;
        audio.load();
      });

      const audioDuration = audio.duration;
      
      setCreationStage('Generating captions...');
      setCreationProgress(30);

      // Generate captions
      const captions = generateCaptions(script, audioDuration);

      setCreationStage('Loading avatar...');
      setCreationProgress(40);

      // Load avatar if selected
      let avatarImage: HTMLImageElement | null = null;
      if (selectedAvatar) {
        avatarImage = new Image();
        avatarImage.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          avatarImage!.onload = resolve;
          avatarImage!.onerror = reject;
          avatarImage!.src = selectedAvatar.url;
        });
      }

      setCreationStage('Setting up recording...');
      setCreationProgress(50);

      // FIXED: Enhanced MediaRecorder setup with better codec selection and timing
      const stream = canvas.captureStream(30); // Consistent 30 FPS
      
      // Add audio track to the stream
      const audioContext = new AudioContext();
      const audioSource = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      audioSource.connect(destination);
      audioSource.connect(audioContext.destination);
      
      // Add audio track to video stream
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }

      // FIXED: Better codec selection for compatibility
      const codecOptions = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 + AAC (best compatibility)
        'video/mp4;codecs=avc1.42E01E', // H.264 baseline
        'video/webm;codecs=vp9,opus',   // VP9 + Opus
        'video/webm;codecs=vp8,opus',   // VP8 + Opus fallback
        'video/webm'                    // Generic WebM
      ];

      let selectedMimeType = 'video/webm';
      for (const codec of codecOptions) {
        if (MediaRecorder.isTypeSupported(codec)) {
          selectedMimeType = codec;
          console.log('Using codec:', codec);
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps for high quality
        audioBitsPerSecond: 128000   // 128 kbps for audio
      });

      const recordedChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      setCreationStage('Recording video...');
      setCreationProgress(60);

      // FIXED: Improved rendering loop with better timing and synchronization
      let startTime = 0;
      let animationId: number;
      let isRecording = false;

      const render = (currentTime: number) => {
        if (!isRecording) {
          startTime = currentTime;
          isRecording = true;
        }

        const elapsed = (currentTime - startTime) / 1000; // Convert to seconds
        
        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // FIXED: Better video synchronization - ensure video time matches audio time
        if (elapsed <= audioDuration) {
          // Update video time to match audio
          originalVideo.currentTime = Math.min(elapsed, originalVideo.duration);
          
          // FIXED: Wait for video to seek to correct time before drawing
          if (Math.abs(originalVideo.currentTime - elapsed) < 0.1) { // Allow small tolerance
            // Draw the original video (scaled to fit canvas)
            const videoAspectRatio = originalVideo.videoWidth / originalVideo.videoHeight;
            const canvasAspectRatio = width / height;
            
            let drawWidth = width;
            let drawHeight = height;
            let drawX = 0;
            let drawY = 0;
            
            if (videoAspectRatio > canvasAspectRatio) {
              // Video is wider than canvas
              drawHeight = width / videoAspectRatio;
              drawY = (height - drawHeight) / 2;
            } else {
              // Video is taller than canvas
              drawWidth = height * videoAspectRatio;
              drawX = (width - drawWidth) / 2;
            }
            
            ctx.drawImage(originalVideo, drawX, drawY, drawWidth, drawHeight);
          }

          // Draw avatar if selected
          if (avatarImage && selectedAvatar) {
            const avatarX = avatarPosition.includes('right') ? width - avatarSize - 20 : 20;
            const avatarY = avatarPosition.includes('bottom') ? height - avatarSize - 20 : 20;
            
            // Draw avatar with rounded corners
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 10);
            ctx.clip();
            ctx.drawImage(avatarImage, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();
          }

          // Draw captions
          const currentCaption = captions.find(caption => 
            elapsed >= caption.start && elapsed <= caption.end
          );
          
          if (currentCaption) {
            const fontSize = captionSettings.fontSize;
            const fontWeight = captionSettings.fontWeight;
            const textColor = captionSettings.color;
            const bgColor = captionSettings.backgroundColor;
            const bgOpacity = captionSettings.backgroundOpacity;
            
            ctx.font = `${fontWeight} ${fontSize}px Arial, sans-serif`;
            ctx.textAlign = 'center';
            
            // Calculate text position
            const textY = captionSettings.position === 'top' ? 100 : height - 100;
            
            // Measure text for background
            const textMetrics = ctx.measureText(currentCaption.text);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;
            
            // Draw background
            ctx.fillStyle = `${bgColor}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`;
            const padding = 20;
            ctx.fillRect(
              (width - textWidth) / 2 - padding,
              textY - textHeight - padding / 2,
              textWidth + padding * 2,
              textHeight + padding
            );
            
            // Draw text
            ctx.fillStyle = textColor;
            ctx.fillText(currentCaption.text, width / 2, textY);
          }

          // Update progress
          const progress = 60 + (elapsed / audioDuration) * 30;
          setCreationProgress(Math.min(progress, 90));
          
          // Continue animation
          animationId = requestAnimationFrame(render);
        } else {
          // Recording complete
          cancelAnimationFrame(animationId);
          mediaRecorder.stop();
        }
      };

      // Start recording and rendering
      mediaRecorder.start(100); // Collect data every 100ms for smoother recording
      audio.play();
      originalVideo.play();
      
      animationId = requestAnimationFrame(render);

      // Wait for recording to complete
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => {
          setCreationStage('Finalizing video...');
          setCreationProgress(95);
          resolve();
        };
      });

      // Create final video blob
      const finalVideoBlob = new Blob(recordedChunks, {
        type: selectedMimeType.includes('mp4') ? 'video/mp4' : 'video/webm'
      });

      setCreationStage('Saving to database...');
      setCreationProgress(98);

      // Generate social media content
      await generateSocialMediaContent();

      // Save to database
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `fullclip-${selectedVideo.original_filename.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
      const displayName = selectedVideo.display_name || selectedVideo.original_filename.replace(/\.[^/.]+$/, '');

      await dbManager.saveFullClipVideo(
        filename,
        selectedVideo.original_filename,
        selectedVideo.file_language,
        Math.round(audioDuration),
        finalVideoBlob,
        script,
        captions,
        selectedVideo.original_file_content,
        displayName
      );

      setCreationProgress(100);
      setCreationStage('Complete!');

      // Clean up
      URL.revokeObjectURL(originalVideoUrl);
      URL.revokeObjectURL(audioUrl);
      audioContext.close();

      // Notify parent and close
      setTimeout(() => {
        onVideoSaved();
        onClose();
      }, 1000);

    } catch (error) {
      console.error('Failed to create FullClip video:', error);
      alert(`Failed to create FullClip video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingVideo(false);
      setCreationProgress(0);
      setCreationStage('');
    }
  };

  // Copy social media content to clipboard
  const handleCopySocialContent = async (type: 'title' | 'description') => {
    if (!socialMediaContent) return;

    try {
      const textToCopy = type === 'title' ? socialMediaContent.title : socialMediaContent.description;
      await navigator.clipboard.writeText(textToCopy);
      
      // Show temporary success feedback
      const originalText = type === 'title' ? socialMediaContent.title : socialMediaContent.description;
      if (type === 'title') {
        setSocialMediaContent(prev => prev ? { ...prev, title: '✓ Copied!' } : null);
        setTimeout(() => {
          setSocialMediaContent(prev => prev ? { ...prev, title: originalText } : null);
        }, 1000);
      } else {
        setSocialMediaContent(prev => prev ? { ...prev, description: '✓ Copied to clipboard!' } : null);
        setTimeout(() => {
          setSocialMediaContent(prev => prev ? { ...prev, description: originalText } : null);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[90vh] flex">
        {/* Left Sidebar - Controls */}
        <div className="w-1/2 border-r-2 border-white flex flex-col">
          {/* Header */}
          <div className="p-6 border-b-2 border-white">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 border-2 border-white rounded-lg">
                  <Mic className="w-6 h-6 text-white" />
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
              <div className="mt-4 p-4 bg-black border-2 border-white rounded-lg">
                <h3 className="text-white font-bold text-lg mb-2">
                  {selectedVideo.display_name || selectedVideo.original_filename}
                </h3>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span className="capitalize">{selectedVideo.file_language}</span>
                  <span>{Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</span>
                </div>
              </div>
            )}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* API Settings - Collapsible */}
            <div className="bg-black border-2 border-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Settings className="w-5 h-5" />
                  API Settings
                </h3>
                <button
                  onClick={() => setIsSettingsCollapsed(!isSettingsCollapsed)}
                  className="text-white hover:bg-white hover:text-black p-2 rounded border-2 border-white transition-colors"
                >
                  {isSettingsCollapsed ? '+' : '−'}
                </button>
              </div>

              {!isSettingsCollapsed && (
                <div className="space-y-6">
                  {/* XAI API Key */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white font-bold">XAI API Key</label>
                      <div className="flex items-center gap-2">
                        {xaiKeyStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                        {xaiKeyStatus === 'valid' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {xaiKeyStatus === 'invalid' && <X className="w-4 h-4 text-red-400" />}
                        <button
                          onClick={() => testXaiApiKey(xaiApiKey)}
                          disabled={xaiKeyStatus === 'testing'}
                          className="text-xs bg-black border border-white text-white hover:bg-white hover:text-black 
                                   px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                    <input
                      type="password"
                      value={xaiApiKey}
                      onChange={(e) => setXaiApiKey(e.target.value)}
                      onKeyPress={(e) => handleApiKeyKeyPress(e, 'xai')}
                      placeholder="Enter XAI API key (press Enter to test)"
                      className="w-full p-3 bg-black border-2 border-white text-white rounded"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {xaiKeyStatus === 'untested' && 'Not tested'}
                      {xaiKeyStatus === 'testing' && 'Testing connection...'}
                      {xaiKeyStatus === 'valid' && '✅ Valid - Ready for script generation'}
                      {xaiKeyStatus === 'invalid' && '❌ Invalid - Please check your key'}
                    </p>
                  </div>

                  {/* ElevenLabs API Key */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-white font-bold">ElevenLabs API Key</label>
                      <div className="flex items-center gap-2">
                        {elevenLabsKeyStatus === 'testing' && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                        {elevenLabsKeyStatus === 'valid' && <CheckCircle className="w-4 h-4 text-green-400" />}
                        {elevenLabsKeyStatus === 'invalid' && <X className="w-4 h-4 text-red-400" />}
                        <button
                          onClick={() => testElevenLabsApiKey(elevenLabsApiKey)}
                          disabled={elevenLabsKeyStatus === 'testing'}
                          className="text-xs bg-black border border-white text-white hover:bg-white hover:text-black 
                                   px-2 py-1 rounded transition-colors disabled:opacity-50"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                    <input
                      type="password"
                      value={elevenLabsApiKey}
                      onChange={(e) => setElevenLabsApiKey(e.target.value)}
                      onKeyPress={(e) => handleApiKeyKeyPress(e, 'elevenlabs')}
                      placeholder="Enter ElevenLabs API key (press Enter to test)"
                      className="w-full p-3 bg-black border-2 border-white text-white rounded"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {elevenLabsKeyStatus === 'untested' && 'Not tested'}
                      {elevenLabsKeyStatus === 'testing' && 'Testing connection and loading voices...'}
                      {elevenLabsKeyStatus === 'valid' && `✅ Valid - ${voices.length} voices available`}
                      {elevenLabsKeyStatus === 'invalid' && '❌ Invalid - Please check your key'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Voice Selection */}
            <div className="bg-black border-2 border-white rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <Volume2 className="w-5 h-5" />
                Voice Selection
              </h3>
              
              {isLoadingVoices ? (
                <div className="flex items-center gap-3 text-white">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading voices...</span>
                </div>
              ) : voices.length > 0 ? (
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full p-3 bg-black border-2 border-white text-white rounded"
                >
                  <option value="">Select a voice</option>
                  {voices.map(voice => (
                    <option key={voice.voice_id} value={voice.voice_id}>
                      {voice.name} ({voice.category})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-400">No voices available. Please check your ElevenLabs API key.</p>
              )}
            </div>

            {/* Script Generation */}
            <div className="bg-black border-2 border-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Mic className="w-5 h-5" />
                  Script Generation
                </h3>
                <button
                  onClick={generateScript}
                  disabled={isGeneratingScript || xaiKeyStatus !== 'valid' || !selectedVideo}
                  className="bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-2 rounded font-bold 
                           transition-colors border-2 border-white flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {isGeneratingScript ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Generate Script
                    </>
                  )}
                </button>
              </div>
              
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="AI-generated script will appear here, or write your own..."
                className="w-full h-32 p-3 bg-black border-2 border-white text-white rounded resize-none"
              />
              
              {script && (
                <p className="text-sm text-gray-400 mt-2">
                  Script length: {script.length} characters (~{Math.ceil(script.split(' ').length / 3)} seconds)
                </p>
              )}
            </div>

            {/* Audio Generation */}
            <div className="bg-black border-2 border-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Volume2 className="w-5 h-5" />
                  Audio Generation
                </h3>
                <button
                  onClick={generateAudio}
                  disabled={isGeneratingAudio || !script.trim() || !selectedVoice || elevenLabsKeyStatus !== 'valid'}
                  className="bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-2 rounded font-bold 
                           transition-colors border-2 border-white flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {isGeneratingAudio ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      Generate Audio
                    </>
                  )}
                </button>
              </div>
              
              {audioBlob && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleAudioPlayback}
                      className="bg-black border-2 border-white text-white hover:bg-white hover:text-black 
                               p-3 rounded transition-colors flex items-center gap-2"
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                      {isPlayingAudio ? 'Pause' : 'Play'}
                    </button>
                    
                    <div className="flex-1">
                      <div className="bg-black border-2 border-white rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-white h-full transition-all duration-100"
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                    </div>
                    
                    <span className="text-white text-sm font-mono">
                      {Math.floor(audioDuration / 60)}:{(Math.floor(audioDuration % 60)).toString().padStart(2, '0')}
                    </span>
                  </div>
                  
                  <audio
                    ref={audioRef}
                    src={audioBlob ? URL.createObjectURL(audioBlob) : ''}
                    onTimeUpdate={handleAudioTimeUpdate}
                    onEnded={handleAudioEnded}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Avatar Selection */}
            <div className="bg-black border-2 border-white rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <Upload className="w-5 h-5" />
                Avatar Selection
              </h3>
              
              {/* Avatar Upload */}
              <div className="mb-6">
                <div className="flex gap-3 mb-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-2 rounded font-bold 
                             transition-colors border-2 border-white flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Image
                      </>
                    )}
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                
                {/* AI Avatar Generation */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={avatarPrompt}
                    onChange={(e) => setAvatarPrompt(e.target.value)}
                    placeholder="Describe your avatar (e.g., 'cool penguin with sunglasses')"
                    className="flex-1 p-3 bg-black border-2 border-white text-white rounded"
                  />
                  <button
                    onClick={generateAIAvatar}
                    disabled={isGeneratingAvatar || !avatarPrompt.trim() || xaiKeyStatus !== 'valid'}
                    className="bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-2 rounded font-bold 
                             transition-colors border-2 border-white flex items-center gap-2 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAvatar ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>
              </div>
              
              {/* Avatar Grid */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {avatars.map(avatar => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedAvatar?.id === avatar.id 
                        ? 'border-white bg-white' 
                        : 'border-gray-600 hover:border-white'
                    }`}
                  >
                    <img
                      src={avatar.url}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                    {avatar.type === 'generated' && (
                      <div className="absolute top-1 right-1 bg-black text-white text-xs px-1 rounded">
                        AI
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* Avatar Settings */}
              {selectedAvatar && (
                <div className="space-y-4">
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

            {/* Caption Settings */}
            <div className="bg-black border-2 border-white rounded-xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <Captions className="w-5 h-5" />
                Caption Settings
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white font-bold mb-2">Font Size</label>
                  <input
                    type="range"
                    min="16"
                    max="32"
                    value={captionSettings.fontSize}
                    onChange={(e) => setCaptionSettings(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-gray-400 text-sm">{captionSettings.fontSize}px</span>
                </div>
                
                <div>
                  <label className="block text-white font-bold mb-2">Position</label>
                  <select
                    value={captionSettings.position}
                    onChange={(e) => setCaptionSettings(prev => ({ ...prev, position: e.target.value as 'top' | 'bottom' }))}
                    className="w-full p-2 bg-black border-2 border-white text-white rounded"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-white font-bold mb-2">Text Color</label>
                  <input
                    type="color"
                    value={captionSettings.color}
                    onChange={(e) => setCaptionSettings(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-10 rounded border-2 border-white"
                  />
                </div>
                
                <div>
                  <label className="block text-white font-bold mb-2">Background</label>
                  <input
                    type="color"
                    value={captionSettings.backgroundColor}
                    onChange={(e) => setCaptionSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-full h-10 rounded border-2 border-white"
                  />
                </div>
              </div>
            </div>

            {/* Create Video Button */}
            <div className="bg-black border-2 border-white rounded-xl p-6">
              <button
                onClick={createFullClipVideo}
                disabled={isCreatingVideo || !selectedVideo || !audioBlob || !script}
                className="w-full bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black py-4 px-6 rounded-lg font-bold text-xl
                         transition-colors border-2 border-white flex items-center justify-center gap-3 disabled:cursor-not-allowed"
              >
                {isCreatingVideo ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Creating FullClip... {Math.round(creationProgress)}%
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6" />
                    Create FullClip Video
                  </>
                )}
              </button>
              
              {isCreatingVideo && (
                <div className="mt-4">
                  <div className="bg-black border-2 border-white rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-white h-full transition-all duration-300"
                      style={{ width: `${creationProgress}%` }}
                    />
                  </div>
                  <p className="text-center text-white mt-2 font-medium">{creationStage}</p>
                </div>
              )}
            </div>
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
                  src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
                />
                
                <div className="mt-6 text-center">
                  <h4 className="font-bold text-xl text-white mb-2">
                    {selectedVideo.display_name || selectedVideo.original_filename}
                  </h4>
                  <div className="flex justify-center gap-4 text-gray-400 mb-4">
                    <span className="capitalize">{selectedVideo.file_language}</span>
                    <span>{Math.floor(selectedVideo.duration / 60)}:{(selectedVideo.duration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  
                  <p className="text-gray-400 text-sm">
                    This is your original video. The FullClip will include audio narration, captions, and avatar overlay.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <Mic className="w-20 h-20 mx-auto mb-6 opacity-50" />
                <p className="text-2xl font-bold">No video selected</p>
                <p className="text-lg mt-2">Select a video from the gallery to create a FullClip</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for video recording */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={720}
        height={1280}
      />
    </div>
  );
};

export default FullClipStudio;