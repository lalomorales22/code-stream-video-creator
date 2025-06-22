import React, { useState, useRef, useEffect } from 'react';
import { 
  FileAudio, 
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
  Zap,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Wand2,
  Volume2,
  Captions,
  ChevronDown,
  ChevronUp,
  Trash2,
  Users
} from 'lucide-react';
import { VideoRecord, dbManager, AvatarRecord } from '../utils/database';

interface FullClipStudioProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVideo: VideoRecord | null;
  onVideoSaved: () => void;
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

interface PenguinAvatar {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  isFromDatabase?: boolean;
  databaseId?: number;
}

// Custom Success Modal Component
const SuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filename: string;
}> = ({ isOpen, onClose, filename }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-black border-2 border-white rounded-xl p-8 max-w-md text-center relative">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center animate-pulse">
            <FileAudio className="w-12 h-12 text-black" />
          </div>
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-4">🎵 FullClip Created!</h3>
        
        <div className="space-y-4 mb-6">
          <p className="text-lg text-gray-300">
            Your complete social media video has been successfully created with AI audio, captions, and avatar.
          </p>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Saved as:</p>
            <p className="text-white font-mono text-sm break-all">{filename}</p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">Audio, Captions & Avatar Included</span>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold 
                   transition-colors border-2 border-white flex items-center justify-center gap-2"
        >
          <FileAudio className="w-5 h-5" />
          Open FullClip Gallery
        </button>
        
        <p className="text-gray-400 text-sm mt-4">
          Your video is ready to download and share on social media!
        </p>
      </div>
    </div>
  );
};

const FullClipStudio: React.FC<FullClipStudioProps> = ({
  isOpen,
  onClose,
  selectedVideo,
  onVideoSaved
}) => {
  // API Keys and Settings
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  
  // Voice and Audio
  const [availableVoices, setAvailableVoices] = useState<ElevenLabsVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Captions
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionTextColor, setCaptionTextColor] = useState('#FFFFFF');
  const [captionBackgroundColor, setCaptionBackgroundColor] = useState('#000000');
  
  // Avatar
  const [selectedAvatar, setSelectedAvatar] = useState<PenguinAvatar | null>(null);
  const [avatarPosition, setAvatarPosition] = useState<'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'>('bottom-right');
  const [avatarSize, setAvatarSize] = useState(25);
  const [customAvatarPrompt, setCustomAvatarPrompt] = useState('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [generatedAvatars, setGeneratedAvatars] = useState<PenguinAvatar[]>([]);
  const [uploadedAvatars, setUploadedAvatars] = useState<PenguinAvatar[]>([]);
  const [databaseAvatars, setDatabaseAvatars] = useState<PenguinAvatar[]>([]);
  
  // Processing
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');
  
  // Success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedVideoFilename, setSavedVideoFilename] = useState('');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preset penguin avatars
  const presetAvatars: PenguinAvatar[] = [
    {
      id: 'avatar1',
      name: 'Classic Penguin',
      description: '8-bit style penguin with orange beak',
      imageUrl: '/src/assets/images/avatar1.png'
    },
    {
      id: 'avatar2',
      name: 'Cool Penguin',
      description: '8-bit penguin with sunglasses',
      imageUrl: '/src/assets/images/avatar2.png'
    },
    {
      id: 'avatar3',
      name: 'Smart Penguin',
      description: '8-bit penguin with graduation cap',
      imageUrl: '/src/assets/images/avatar3.png'
    },
    {
      id: 'avatar4',
      name: 'Tech Penguin',
      description: '8-bit penguin with headphones',
      imageUrl: '/src/assets/images/avatar4.png'
    }
  ];

  // Load API keys and avatars
  useEffect(() => {
    const savedElevenLabsKey = localStorage.getItem('elevenlabs_api_key');
    const savedXaiKey = localStorage.getItem('xai_api_key');
    
    if (savedElevenLabsKey) {
      setElevenLabsApiKey(savedElevenLabsKey);
    }
    if (savedXaiKey) {
      setXaiApiKey(savedXaiKey);
    }
    
    // Load database avatars
    loadDatabaseAvatars();
  }, []);

  // Save API keys
  useEffect(() => {
    if (elevenLabsApiKey) {
      localStorage.setItem('elevenlabs_api_key', elevenLabsApiKey);
    }
  }, [elevenLabsApiKey]);

  useEffect(() => {
    if (xaiApiKey) {
      localStorage.setItem('xai_api_key', xaiApiKey);
    }
  }, [xaiApiKey]);

  // Load voices when API key is available
  useEffect(() => {
    if (elevenLabsApiKey) {
      loadVoices();
    }
  }, [elevenLabsApiKey]);

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

  const loadDatabaseAvatars = async () => {
    try {
      const avatars = await dbManager.getAllAvatars();
      const convertedAvatars: PenguinAvatar[] = avatars.map(avatar => ({
        id: `db-${avatar.id}`,
        name: avatar.name,
        description: avatar.description,
        imageUrl: URL.createObjectURL(new Blob([avatar.image_data], { type: avatar.image_type })),
        isFromDatabase: true,
        databaseId: avatar.id
      }));
      setDatabaseAvatars(convertedAvatars);
      console.log('Loaded', convertedAvatars.length, 'avatars from database');
    } catch (error) {
      console.error('Failed to load database avatars:', error);
    }
  };

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
      
      if (data.voices && data.voices.length > 0) {
        setSelectedVoice(data.voices[0].voice_id);
      }
    } catch (error) {
      console.error('Failed to load voices:', error);
      alert('Failed to load ElevenLabs voices. Please check your API key.');
    }
  };

  const generateAIScript = async () => {
    if (!selectedVideo || !xaiApiKey) {
      alert('Please provide XAI API key and select a video first.');
      return;
    }

    setIsGeneratingScript(true);
    setProcessingProgress('Analyzing file content...');
    
    try {
      const language = selectedVideo.file_language;
      const filename = selectedVideo.original_filename;
      const duration = selectedVideo.duration;
      const originalFileContent = selectedVideo.original_file_content;

      if (!originalFileContent) {
        throw new Error('No file content available for this video. Please re-record with a newer version.');
      }

      setProcessingProgress('Generating script with AI...');

      const targetWords = Math.round((duration * 150) / 60);
      const maxWords = Math.min(targetWords + 10, Math.max(50, targetWords));

      const systemPrompt = `You are a friendly developer creating casual, educational commentary for code videos. Write naturally as if explaining code to a friend - be conversational, not robotic or overly formal. Focus on what makes this specific code interesting.`;

      const userPrompt = `Create a natural ${duration}-second script (exactly ${targetWords} words) for this code:

**File:** ${filename} (${language})
**Target:** ${targetWords} words (${duration} seconds at normal speaking pace)

**Code:**
\`\`\`${language}
${originalFileContent.substring(0, 2000)}${originalFileContent.length > 2000 ? '...' : ''}
\`\`\`

**Style Guidelines:**
- Write like you're casually explaining to a fellow developer
- Be conversational and natural, not robotic or overly professional
- Reference actual elements from the code (function names, variables, patterns)
- Explain what this specific code does, not generic concepts
- Keep it engaging but educational
- Perfect for social media (TikTok, Instagram, YouTube Shorts)

**Critical Requirements:**
- EXACTLY ${targetWords} words (±5 words max)
- Natural speaking rhythm that takes ${duration} seconds
- Start with what makes this code interesting
- End with a key insight about this implementation
- Be specific about what viewers see in THIS code

Write ONLY the script text in a natural, conversational tone that fits exactly ${duration} seconds when spoken normally.`;

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiApiKey}`
        },
        body: JSON.stringify({
          model: 'grok-2-latest',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          max_tokens: Math.min(800, Math.max(200, targetWords * 2)),
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`XAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const generatedScript = data.choices?.[0]?.message?.content;

      if (!generatedScript) {
        throw new Error('No script generated from XAI API');
      }

      const finalScript = generatedScript.trim();
      const wordCount = finalScript.split(/\s+/).length;
      
      console.log(`Generated script: ${wordCount} words (target: ${targetWords})`);
      
      setScript(finalScript);

    } catch (error) {
      console.error('Failed to generate AI script:', error);
      
      let errorMessage = 'Failed to generate AI script. ';
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage += 'Please check your XAI API key.';
        } else if (error.message.includes('429')) {
          errorMessage += 'Rate limit exceeded. Please try again in a moment.';
        } else if (error.message.includes('network')) {
          errorMessage += 'Network error. Please check your connection.';
        } else {
          errorMessage += error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsGeneratingScript(false);
      setProcessingProgress('');
    }
  };

  const generateAudio = async () => {
    if (!elevenLabsApiKey || !selectedVoice || !script) {
      alert('Please provide API key, select a voice, and enter a script.');
      return;
    }

    setIsGeneratingAudio(true);
    setProcessingProgress('Generating audio with ElevenLabs...');
    
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
      
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      setProcessingProgress('Creating captions...');
      generateAutomaticCaptions();

      console.log('Audio generated successfully');
    } catch (error) {
      console.error('Failed to generate audio:', error);
      alert('Failed to generate audio. Please check your API key and try again.');
    } finally {
      setIsGeneratingAudio(false);
      setProcessingProgress('');
    }
  };

  const generateAutomaticCaptions = () => {
    if (!script) return;

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(async (file) => {
      if (file.type.startsWith('image/')) {
        try {
          // Save to database
          const avatarId = await dbManager.saveAvatar(
            file.name.replace(/\.[^/.]+$/, ''),
            `Uploaded image: ${file.name}`,
            file,
            'uploaded'
          );
          
          console.log('Avatar saved to database with ID:', avatarId);
          
          // Reload database avatars
          await loadDatabaseAvatars();
          
        } catch (error) {
          console.error('Failed to save avatar to database:', error);
          alert('Failed to save avatar. Please try again.');
        }
      } else {
        alert('Please select a valid image file (PNG, JPG, GIF, etc.)');
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const generateCustomAvatar = async () => {
    if (!xaiApiKey || !customAvatarPrompt.trim()) {
      alert('Please provide XAI API key and avatar description.');
      return;
    }

    setIsGeneratingAvatar(true);
    setProcessingProgress('Generating custom penguin avatar...');
    
    try {
      const enhancedPrompt = `Create a 3d 8bit block style cool penguin with glasses as an avatar for a coding video. ${customAvatarPrompt}. The penguin should be friendly, professional, and suitable for educational content. Style: clean cartoon illustration, high quality, suitable for video overlay.`;

      const response = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiApiKey}`
        },
        body: JSON.stringify({
          model: 'grok-2-image-1212',
          prompt: enhancedPrompt,
          n: 1
        })
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error(`Invalid JSON response from API: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || `HTTP ${response.status}`;
        throw new Error(`XAI API error: ${response.status} - ${errorMessage}`);
      }

      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        throw new Error('No image generated from XAI API - check response format');
      }

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
          errorMessage += 'Please check your XAI API key - it may be invalid or expired.';
        } else if (error.message.includes('429')) {
          errorMessage += 'Rate limit exceeded. Please try again in a moment.';
        } else if (error.message.includes('400')) {
          errorMessage += 'Bad request - please check your prompt and try again.';
        } else if (error.message.includes('403')) {
          errorMessage += 'Access forbidden - please check your API key permissions.';
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

  const handleDeleteAvatar = async (avatar: PenguinAvatar) => {
    if (!avatar.isFromDatabase || !avatar.databaseId) return;
    
    try {
      const success = await dbManager.deleteAvatar(avatar.databaseId);
      if (success) {
        await loadDatabaseAvatars();
        if (selectedAvatar?.id === avatar.id) {
          setSelectedAvatar(null);
        }
        console.log('Avatar deleted successfully');
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      alert('Failed to delete avatar. Please try again.');
    }
  };

  const createFallbackAvatar = (description: string): HTMLImageElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 100, 100);
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(50, 70, 25, 30, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(50, 35, 20, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(50, 70, 15, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(50, 35);
    ctx.lineTo(45, 30);
    ctx.lineTo(55, 30);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(45, 30, 3, 3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(55, 30, 3, 3, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Custom', 50, 15);
    ctx.fillText('Penguin', 50, 95);
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  };

  const processVideoWithAllFeatures = async () => {
    if (!selectedVideo || !audioBlob || !selectedAvatar) {
      alert('Please generate audio and select an avatar first.');
      return;
    }

    setIsProcessingVideo(true);
    setProcessingProgress('Preparing complete video...');
    
    try {
      // Create video element for the original video
      const videoBlob = new Blob([selectedVideo.video_blob], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      
      setProcessingProgress('Loading video...');
      
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
      let avatarImg: HTMLImageElement;
      
      try {
        avatarImg = new Image();
        
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Avatar loading timeout'));
          }, 10000);
          
          avatarImg.onload = () => {
            clearTimeout(timeout);
            resolve(void 0);
          };
          
          avatarImg.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load avatar image'));
          };
          
          avatarImg.src = selectedAvatar.imageUrl;
        });
      } catch (error) {
        console.warn('Failed to load avatar image, using fallback:', error);
        avatarImg = createFallbackAvatar(selectedAvatar.description);
        
        await new Promise((resolve) => {
          if (avatarImg.complete) {
            resolve(void 0);
          } else {
            avatarImg.onload = () => resolve(void 0);
          }
        });
      }

      // Set up canvas for rendering
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 720;
      canvas.height = 1280;

      setProcessingProgress('Setting up audio recording...');

      // Create audio element
      const audio = document.createElement('audio');
      audio.src = URL.createObjectURL(audioBlob);
      audio.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        audio.onloadedmetadata = () => {
          resolve(void 0);
        };
        audio.onerror = reject;
        audio.load();
      });

      const finalDuration = Math.max(video.duration, audio.duration);

      // Set up MediaRecorder
      const stream = canvas.captureStream(30);
      
      let mimeType = 'video/mp4';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E';
      }

      // Create audio context for mixing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioSource = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      
      audioSource.connect(destination);
      
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
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
        setProcessingProgress('Finalizing video...');
        
        const finalBlob = new Blob(chunks, { 
          type: 'video/mp4'
        });
        
        setProcessingProgress('Saving to gallery...');
        
        const originalDisplayName = selectedVideo.display_name || selectedVideo.original_filename.replace(/\.[^/.]+$/, '');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const technicalFilename = `fullclip-${originalDisplayName}-${timestamp}.mp4`;
        const displayName = `${originalDisplayName} (FullClip)`;
        
        try {
          const videoId = await dbManager.saveFullClipVideo(
            technicalFilename,
            selectedVideo.original_filename,
            selectedVideo.file_language,
            Math.round(finalDuration),
            finalBlob,
            script,
            captions,
            selectedVideo.original_file_content,
            displayName
          );

          console.log('FullClip video saved successfully with ID:', videoId);
          
          onVideoSaved();
          
          setSavedVideoFilename(displayName);
          setShowSuccessModal(true);
          
        } catch (saveError) {
          console.error('Failed to save video:', saveError);
          alert('Video was created but failed to save to gallery. Please try again.');
        }
        
        URL.revokeObjectURL(videoUrl);
        URL.revokeObjectURL(audio.src);
        audioContext.close();
      };

      mediaRecorder.start(100);
      
      video.currentTime = 0;
      audio.currentTime = 0;
      
      const startTime = Date.now();
      const maxDuration = finalDuration * 1000;
      
      const playPromises = [video.play(), audio.play()];
      await Promise.all(playPromises);

      // Render loop
      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / maxDuration;
        const currentVideoTime = video.currentTime;
        
        const progressPercent = Math.round(progress * 100);
        setProcessingProgress(`Recording video: ${progressPercent}%`);
        
        if (progress >= 1 || elapsed >= maxDuration) {
          setProcessingProgress('Finishing recording...');
          mediaRecorder.stop();
          video.pause();
          audio.pause();
          return;
        }

        // Clear canvas
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw video frame
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Draw captions OVER everything (including avatar)
        if (captionsEnabled && captions.length > 0) {
          const currentTimeSeconds = elapsed / 1000;
          const currentCaptions = captions.filter(caption => 
            currentTimeSeconds >= caption.startTime && currentTimeSeconds <= caption.endTime
          );

          currentCaptions.forEach(caption => {
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';

            const words = caption.text.split(' ');
            const lines: string[] = [];
            let currentLine = '';
            
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

            const lineHeight = 35;
            const startY = canvas.height - 80;

            lines.forEach((line, index) => {
              const y = startY - (lines.length - 1 - index) * lineHeight;
              const x = canvas.width / 2;

              const textWidth = ctx.measureText(line).width;
              const padding = 15;

              // Draw background
              ctx.fillStyle = captionBackgroundColor + 'E6';
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

        // Draw avatar UNDER captions
        const avatarWidth = (canvas.width * avatarSize) / 100;
        const avatarHeight = avatarWidth;
        
        let avatarX = 0;
        let avatarY = 0;
        
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

        // Add animation
        const animationTime = elapsed * 0.003;
        const bobOffset = Math.sin(animationTime) * 5;
        avatarY += bobOffset;

        // Draw avatar with transparency
        ctx.globalAlpha = 0.9;
        ctx.drawImage(avatarImg, avatarX, avatarY, avatarWidth, avatarHeight);
        ctx.globalAlpha = 1;

        requestAnimationFrame(renderFrame);
      };

      renderFrame();

    } catch (error) {
      console.error('Failed to process complete video:', error);
      alert(`Failed to process video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessingVideo(false);
      setProcessingProgress('');
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openFullClipGallery'));
    }, 300);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimateReadingTime = (text: string): number => {
    const words = text.trim().split(/\s+/).length;
    return Math.round((words / 150) * 60);
  };

  if (!isOpen) return null;

  const allAvatars = [...presetAvatars, ...databaseAvatars, ...uploadedAvatars, ...generatedAvatars];

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col relative">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-white">
            <div className="flex items-center gap-6">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 border-2 border-white rounded-lg">
                  <FileAudio className="w-6 h-6 text-white" />
                </div>
                FullClip Studio
              </h2>
              {selectedVideo && (
                <div className="text-lg text-gray-400 font-medium">
                  {selectedVideo.display_name || selectedVideo.original_filename} • {selectedVideo.duration}s
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
                  <h3 className="text-2xl font-bold text-white">Creating FullClip</h3>
                </div>
                <p className="text-lg text-gray-300 mb-4">
                  {processingProgress || 'Combining video, audio, captions, and avatar...'}
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
                {/* Collapsible API Settings */}
                <div className="bg-black border-2 border-white rounded-lg">
                  <button
                    onClick={() => setIsApiSettingsOpen(!isApiSettingsOpen)}
                    className="w-full flex items-center justify-between p-4 text-white hover:bg-white hover:text-black transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5" />
                      <span className="font-bold text-lg">API Settings</span>
                    </div>
                    {isApiSettingsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  
                  {isApiSettingsOpen && (
                    <div className="p-4 border-t-2 border-white space-y-4">
                      <div>
                        <label className="block text-white font-bold mb-2">XAI API Key (for AI Script Generation)</label>
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
                    </div>
                  )}
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

                {/* File Content Preview */}
                {selectedVideo?.original_file_content && (
                  <div>
                    <label className="block text-white font-bold mb-2">File Content Analysis</label>
                    <div className="bg-black border-2 border-white rounded p-3 max-h-32 overflow-y-auto">
                      <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
                        {selectedVideo.original_file_content.substring(0, 300)}
                        {selectedVideo.original_file_content.length > 300 && '...'}
                      </pre>
                    </div>
                    <p className="text-gray-400 text-sm mt-2">
                      AI will analyze this actual code to create a relevant script
                    </p>
                  </div>
                )}

                {/* Script */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-bold">Script</label>
                    <button
                      onClick={generateAIScript}
                      disabled={isGeneratingScript || !selectedVideo || !xaiApiKey || !selectedVideo?.original_file_content}
                      className="flex items-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 
                               text-black px-3 py-1 rounded font-bold transition-colors text-sm border-2 border-white"
                    >
                      {isGeneratingScript ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      {isGeneratingScript ? 'Analyzing...' : 'AI Generate'}
                    </button>
                  </div>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="Enter your script or use AI generation..."
                    className="w-full h-32 p-3 bg-black border-2 border-white text-white rounded resize-none"
                  />
                  <div className="flex justify-between text-sm mt-2">
                    <p className="text-gray-400">
                      Estimated reading time: ~{estimateReadingTime(script)} seconds
                    </p>
                    <p className="text-gray-400">
                      Target: {selectedVideo?.duration || 0} seconds
                    </p>
                  </div>
                </div>

                {/* Audio Generation */}
                <div>
                  <button
                    onClick={generateAudio}
                    disabled={isGeneratingAudio || !elevenLabsApiKey || !selectedVoice || !script}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg 
                             bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black transition-colors border-2 border-white"
                  >
                    {isGeneratingAudio ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
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

                {/* Avatar Section */}
                <div>
                  <label className="block text-white font-bold mb-4">Avatar Selection</label>
                  
                  {/* Upload & Generate Controls */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 bg-white hover:bg-gray-200 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white"
                    >
                      <Upload className="w-5 h-5" />
                      Upload
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    <button
                      onClick={generateCustomAvatar}
                      disabled={isGeneratingAvatar || !xaiApiKey}
                      className="flex items-center justify-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black px-4 py-3 rounded font-bold transition-colors border-2 border-white"
                    >
                      {isGeneratingAvatar ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                      Generate
                    </button>
                  </div>

                  {/* Custom Avatar Prompt */}
                  <input
                    type="text"
                    value={customAvatarPrompt}
                    onChange={(e) => setCustomAvatarPrompt(e.target.value)}
                    placeholder="Describe your penguin (e.g., 'wearing a red hat')"
                    className="w-full p-3 bg-black border-2 border-white text-white rounded mb-4"
                  />

                  {/* Avatar Gallery */}
                  <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {allAvatars.map(avatar => (
                      <div
                        key={avatar.id}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`cursor-pointer rounded-lg p-3 border-2 transition-all relative ${
                          selectedAvatar?.id === avatar.id 
                            ? 'border-white bg-white text-black' 
                            : 'border-gray-600 hover:border-white bg-black text-white'
                        }`}
                      >
                        {/* Delete button for database avatars */}
                        {avatar.isFromDatabase && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAvatar(avatar);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
                            title="Delete avatar"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        
                        <img
                          src={avatar.imageUrl}
                          alt={avatar.name}
                          className="w-full h-16 object-cover rounded mb-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+🐧</text></svg>';
                          }}
                        />
                        <h4 className="font-bold text-xs truncate">{avatar.name}</h4>
                        {avatar.isFromDatabase && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-green-400">Saved</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Avatar Position & Size */}
                {selectedAvatar && (
                  <div className="space-y-4">
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
                    </div>
                  </div>
                )}

                {/* Caption Controls */}
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

                {/* Final Processing */}
                <div className="pt-4">
                  <button
                    onClick={processVideoWithAllFeatures}
                    disabled={isProcessingVideo || !audioBlob || !selectedVideo || !selectedAvatar}
                    className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-bold text-lg 
                             bg-white hover:bg-gray-200 disabled:bg-gray-600 text-black transition-colors border-2 border-white"
                  >
                    {isProcessingVideo ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    {isProcessingVideo ? 'Creating...' : 'Create FullClip Video'}
                  </button>
                  <p className="text-gray-400 text-sm mt-2 text-center">
                    Complete video with audio, captions, and avatar
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel - Video Preview Only */}
            <div className="w-1/2 flex flex-col">
              <div className="p-6 border-b-2 border-white">
                <h3 className="text-2xl font-bold text-white">Video Preview</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {selectedVideo && (
                  <div className="flex items-start justify-center">
                    <video
                      className="w-full max-w-xs bg-black rounded border-2 border-white"
                      style={{ aspectRatio: '9/16' }}
                      src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
                      controls
                      muted
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hidden canvas for video processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        filename={savedVideoFilename}
      />
    </>
  );
};

export default FullClipStudio;