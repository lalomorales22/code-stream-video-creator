import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Play, Pause, Volume2, VolumeX, Settings, ChevronDown, ChevronUp, Loader2, Download, Save, AlertCircle, CheckCircle, User, Upload, Sparkles, FileAudio, Captions, Share2, Copy } from 'lucide-react';
import { VideoRecord, dbManager } from '../utils/database';

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

interface Avatar {
  id: string;
  name: string;
  url: string;
  type: 'preset' | 'uploaded' | 'generated';
}

// Preset penguin avatars
const presetAvatars: Avatar[] = [
  {
    id: 'penguin-classic',
    name: 'Classic Penguin',
    url: '/src/assets/images/avatar1.png',
    type: 'preset'
  },
  {
    id: 'penguin-cool',
    name: 'Cool Penguin',
    url: '/src/assets/images/avatar2.png',
    type: 'preset'
  },
  {
    id: 'penguin-smart',
    name: 'Smart Penguin',
    url: '/src/assets/images/avatar3.png',
    type: 'preset'
  },
  {
    id: 'penguin-tech',
    name: 'Tech Penguin',
    url: '/src/assets/images/avatar4.png',
    type: 'preset'
  }
];

// Social Media Icons
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const TikTokIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FullClipStudio: React.FC<FullClipStudioProps> = ({
  isOpen,
  onClose,
  selectedVideo,
  onVideoSaved
}) => {
  // API Settings
  const [xaiApiKey, setXaiApiKey] = useState('');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState('');
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  const [apiKeysConnected, setApiKeysConnected] = useState(false);

  // Voice Selection
  const [voices, setVoices] = useState<any[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [loadingVoices, setLoadingVoices] = useState(false);

  // Script Generation
  const [script, setScript] = useState('');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Audio Generation
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Avatar Management
  const [avatars, setAvatars] = useState<Avatar[]>(presetAvatars);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(presetAvatars[0]);
  const [avatarPosition, setAvatarPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('bottom-right');
  const [avatarSize, setAvatarSize] = useState(80);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  // Caption Settings
  const [captions, setCaptions] = useState<CaptionSegment[]>([]);
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
  const [creationStep, setCreationStep] = useState('');

  // Social Media Content
  const [socialMediaContent, setSocialMediaContent] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isGeneratingSocialContent, setIsGeneratingSocialContent] = useState(false);

  // Error handling
  const [error, setError] = useState<string | null>(null);

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load API keys on mount
  useEffect(() => {
    const savedXaiKey = localStorage.getItem('xai_api_key');
    const savedElevenLabsKey = localStorage.getItem('elevenlabs_api_key');
    
    if (savedXaiKey) {
      setXaiApiKey(savedXaiKey);
    }
    if (savedElevenLabsKey) {
      setElevenLabsApiKey(savedElevenLabsKey);
    }
    
    // Check if both keys are present
    if (savedXaiKey && savedElevenLabsKey) {
      setApiKeysConnected(true);
      loadVoices(savedElevenLabsKey);
    }
  }, []);

  // Handle API key changes and auto-connect
  const handleApiKeyChange = (type: 'xai' | 'elevenlabs', value: string) => {
    if (type === 'xai') {
      setXaiApiKey(value);
      localStorage.setItem('xai_api_key', value);
    } else {
      setElevenLabsApiKey(value);
      localStorage.setItem('elevenlabs_api_key', value);
    }

    // Auto-connect when both keys are present
    const currentXaiKey = type === 'xai' ? value : xaiApiKey;
    const currentElevenLabsKey = type === 'elevenlabs' ? value : elevenLabsApiKey;
    
    if (currentXaiKey && currentElevenLabsKey) {
      setApiKeysConnected(true);
      if (type === 'elevenlabs' || (type === 'xai' && elevenLabsApiKey)) {
        loadVoices(currentElevenLabsKey);
      }
    } else {
      setApiKeysConnected(false);
    }
  };

  // Handle Enter key press for API keys
  const handleApiKeyKeyPress = (e: React.KeyboardEvent, type: 'xai' | 'elevenlabs') => {
    if (e.key === 'Enter') {
      const currentXaiKey = type === 'xai' ? (e.target as HTMLInputElement).value : xaiApiKey;
      const currentElevenLabsKey = type === 'elevenlabs' ? (e.target as HTMLInputElement).value : elevenLabsApiKey;
      
      if (currentXaiKey && currentElevenLabsKey) {
        setApiKeysConnected(true);
        loadVoices(currentElevenLabsKey);
      }
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
        setVoices(data.voices || []);
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

  // FIXED: Enhanced script generation with proper length calculation and content
  const generateScript = async () => {
    if (!selectedVideo || !xaiApiKey) return;

    setIsGeneratingScript(true);
    setError(null);

    try {
      // Calculate target word count based on video duration
      // Average speaking rate: 150-160 words per minute
      const wordsPerMinute = 155;
      const targetWordCount = Math.round((selectedVideo.duration / 60) * wordsPerMinute);
      
      console.log(`Generating script for ${selectedVideo.duration}s video, target: ${targetWordCount} words`);

      const prompt = `Create a script for a ${selectedVideo.duration}-second code tutorial video. The script must be EXACTLY ${targetWordCount} words.

CRITICAL REQUIREMENTS:
- Start with "wussup Fam!"
- Use ONLY letters, spaces, and basic punctuation (periods, commas, exclamation marks)
- NO symbols like @, #, &, %, $, etc.
- Spell out URLs completely (say "double u double u double u dot" instead of "www.")
- Spell out any technical symbols (say "at sign" instead of "@")
- Keep it natural and conversational, not corny
- Explain what the code does and how to use/open the application
- Match the exact word count of ${targetWordCount} words

Code details:
- Language: ${selectedVideo.file_language}
- Filename: ${selectedVideo.original_filename}
- Code content: ${selectedVideo.original_file_content.substring(0, 500)}...

The script should explain the code functionality and guide viewers on how to open and use this type of application. Keep it engaging but professional.

Return ONLY the script text, nothing else.`;

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
        let generatedScript = data.choices?.[0]?.message?.content?.trim() || '';
        
        // Clean the script to remove any symbols
        generatedScript = generatedScript
          .replace(/[^\w\s.,!?'-]/g, ' ') // Remove symbols except basic punctuation
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        // Ensure it starts with "wussup Fam!"
        if (!generatedScript.toLowerCase().startsWith('wussup fam')) {
          generatedScript = 'wussup Fam! ' + generatedScript;
        }
        
        // Trim to target word count if needed
        const words = generatedScript.split(' ');
        if (words.length > targetWordCount) {
          generatedScript = words.slice(0, targetWordCount).join(' ');
          // Ensure it ends with proper punctuation
          if (!/[.!?]$/.test(generatedScript)) {
            generatedScript += '.';
          }
        }
        
        console.log(`Generated script: ${words.length} words (target: ${targetWordCount})`);
        setScript(generatedScript);
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
        
        // Create URL for audio playback
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);
        
        // Generate captions based on script
        generateCaptions();
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

  const generateCaptions = () => {
    if (!script) return;

    // Simple caption generation - split script into segments
    const words = script.split(' ');
    const wordsPerSegment = 4; // Show 4 words at a time
    const segments: CaptionSegment[] = [];
    
    // Estimate timing based on average speaking rate
    const totalWords = words.length;
    const estimatedDuration = audioDuration || selectedVideo?.duration || 30;
    const timePerWord = estimatedDuration / totalWords;
    
    for (let i = 0; i < words.length; i += wordsPerSegment) {
      const segmentWords = words.slice(i, i + wordsPerSegment);
      const start = i * timePerWord;
      const end = Math.min((i + wordsPerSegment) * timePerWord, estimatedDuration);
      
      segments.push({
        start,
        end,
        text: segmentWords.join(' ')
      });
    }
    
    setCaptions(segments);
  };

  const handleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      // FIXED: Create proper File object for avatar upload
      const avatarFile = new File([file], file.name, { type: file.type });
      
      // Save to database
      const avatarId = await dbManager.saveAvatar(
        file.name,
        'Uploaded avatar',
        avatarFile,
        'uploaded'
      );

      // Create URL for immediate use
      const url = URL.createObjectURL(file);
      const newAvatar: Avatar = {
        id: `uploaded-${avatarId}`,
        name: file.name,
        url,
        type: 'uploaded'
      };

      setAvatars(prev => [...prev, newAvatar]);
      setSelectedAvatar(newAvatar);
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      setError('Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const generateAIAvatar = async () => {
    if (!xaiApiKey) return;

    setIsGeneratingAvatar(true);
    setError(null);

    try {
      const response = await fetch('https://api.x.ai/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${xaiApiKey}`
        },
        body: JSON.stringify({
          prompt: 'A cute cartoon penguin avatar for a programming tutorial, friendly and professional, simple design, transparent background',
          n: 1,
          size: '512x512'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.data?.[0]?.url;
        
        if (imageUrl) {
          // Download the image and convert to blob
          const imageResponse = await fetch(imageUrl);
          const imageBlob = await imageResponse.blob();
          
          // FIXED: Create proper File object for generated avatar
          const avatarFile = new File([imageBlob], 'generated-avatar.png', { type: 'image/png' });
          
          // Save to database
          const avatarId = await dbManager.saveAvatar(
            'AI Generated Penguin',
            'AI generated avatar',
            avatarFile,
            'generated'
          );

          // Create URL for immediate use
          const url = URL.createObjectURL(imageBlob);
          const newAvatar: Avatar = {
            id: `generated-${avatarId}`,
            name: 'AI Generated Penguin',
            url,
            type: 'generated'
          };

          setAvatars(prev => [...prev, newAvatar]);
          setSelectedAvatar(newAvatar);
        }
      } else {
        throw new Error('Failed to generate avatar');
      }
    } catch (error) {
      console.error('Failed to generate AI avatar:', error);
      setError('Failed to generate AI avatar. Please check your XAI API key.');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  // Generate social media content
  const generateSocialMediaContent = async () => {
    if (!selectedVideo || !xaiApiKey) return;

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
            const parsed = JSON.parse(content);
            setSocialMediaContent({
              title: parsed.title || 'Code Tutorial',
              description: parsed.description || 'Check out this code tutorial!'
            });
          } catch (parseError) {
            setSocialMediaContent({
              title: `${selectedVideo.file_language} Code Tutorial`,
              description: `Learn ${selectedVideo.file_language} programming with this quick tutorial. Perfect for developers looking to improve their coding skills.`
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate social media content:', error);
      setSocialMediaContent({
        title: `${selectedVideo.file_language} Code Tutorial`,
        description: `Learn ${selectedVideo.file_language} programming with this quick tutorial. Perfect for developers looking to improve their coding skills.`
      });
    } finally {
      setIsGeneratingSocialContent(false);
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

  // Social media sharing functions
  const handleShareToX = async () => {
    if (!selectedVideo) return;
    
    try {
      const displayName = selectedVideo.display_name || selectedVideo.original_filename;
      const text = `Check out my code streaming video: ${displayName} 🎬\n\nCreated with CodeStream - turning code into engaging vertical videos!\n\n#CodeStream #Programming #${selectedVideo.file_language}`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'width=600,height=400');
    } catch (error) {
      console.error('Failed to share to X:', error);
      alert('Failed to open X sharing dialog');
    }
  };

  const handleShareToTikTok = async () => {
    if (!selectedVideo) return;
    
    try {
      const displayName = selectedVideo.display_name || selectedVideo.original_filename;
      const text = `🎬 New code video: ${displayName}\n\nMade with CodeStream - AI-powered code videos with narration!\n\n#CodeTok #Programming #${selectedVideo.file_language} #CodeStream #TechTok`;
      
      await navigator.clipboard.writeText(text);
      alert('📱 TikTok sharing text copied to clipboard!\n\nPaste this when uploading your video to TikTok. Don\'t forget to download the MP4 file first!');
    } catch (error) {
      console.error('Failed to copy TikTok text:', error);
      alert('💡 For TikTok: Download the MP4 file and upload it manually to TikTok with a description about your code!');
    }
  };

  const handleShareToInstagram = async () => {
    if (!selectedVideo) return;
    
    try {
      const displayName = selectedVideo.display_name || selectedVideo.original_filename;
      const text = `🎥 ${displayName}\n\nCreated with CodeStream - AI narration meets code streaming!\n\n#CodeStream #Programming #${selectedVideo.file_language} #TechReels #CodingLife`;
      
      await navigator.clipboard.writeText(text);
      alert('📸 Instagram caption copied to clipboard!\n\nTo share on Instagram:\n1. Download the MP4 video\n2. Upload to Instagram Reels\n3. Paste the copied caption\n4. Add relevant hashtags!');
    } catch (error) {
      console.error('Failed to copy Instagram text:', error);
      alert('💡 For Instagram: Download the MP4 file and upload it to Instagram Reels with a description about your code!');
    }
  };

  const handleShareToYouTube = async () => {
    if (!selectedVideo) return;
    
    try {
      const displayName = selectedVideo.display_name || selectedVideo.original_filename;
      const description = `${displayName}

Created with CodeStream - the ultimate tool for creating engaging vertical code videos with AI-generated narration and professional captions!

🎯 Features:
• AI-powered script generation
• Professional voice narration  
• Synchronized captions
• Beautiful syntax highlighting
• Perfect for social media

#CodeStream #Programming #${selectedVideo.file_language} #YouTubeShorts #CodingTutorial #TechContent

---
Made with CodeStream: https://codestream.app`;

      await navigator.clipboard.writeText(description);
      
      window.open('https://studio.youtube.com/channel/UC/videos/upload?d=ud', '_blank');
      
      alert('🎬 YouTube description copied to clipboard!\n\nYouTube Studio is now opening. Upload your MP4 file and paste the description!');
    } catch (error) {
      console.error('Failed to open YouTube:', error);
      alert('💡 For YouTube: Download the MP4 file and upload it to YouTube Shorts with a description about your code!');
    }
  };

  // FIXED: Enhanced video creation with better synchronization and error handling
  const createFullClipVideo = async () => {
    if (!selectedVideo || !audioBlob || !selectedAvatar) {
      setError('Missing required components for video creation');
      return;
    }

    setIsCreatingVideo(true);
    setCreationProgress(0);
    setError(null);

    try {
      setCreationStep('Preparing video components...');
      setCreationProgress(10);

      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not available');

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Set canvas size for vertical video (9:16)
      const width = 720;
      const height = 1280;
      canvas.width = width;
      canvas.height = height;

      setCreationStep('Loading original video...');
      setCreationProgress(20);

      // FIXED: Create video element with proper error handling
      const originalVideo = document.createElement('video');
      originalVideo.crossOrigin = 'anonymous';
      originalVideo.muted = true;
      
      // Create blob URL from video data
      const videoBlob = new Blob([selectedVideo.video_blob], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      await new Promise<void>((resolve, reject) => {
        originalVideo.onloadeddata = () => {
          console.log('Original video loaded successfully');
          resolve();
        };
        originalVideo.onerror = (e) => {
          console.error('Failed to load original video:', e);
          reject(new Error('Failed to load original video'));
        };
        originalVideo.src = videoUrl;
      });

      setCreationStep('Loading avatar...');
      setCreationProgress(30);

      // Load avatar image
      const avatarImg = new Image();
      avatarImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        avatarImg.onload = () => resolve();
        avatarImg.onerror = () => reject(new Error('Failed to load avatar'));
        avatarImg.src = selectedAvatar.url;
      });

      setCreationStep('Setting up audio...');
      setCreationProgress(40);

      // Create audio context and source
      const audioContext = new AudioContext();
      const audioArrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(audioArrayBuffer);
      const audioDurationSeconds = audioBuffer.duration;

      setCreationStep('Preparing recording...');
      setCreationProgress(50);

      // Set up MediaRecorder with better codec selection
      const stream = canvas.captureStream(30); // 30 FPS
      
      // Add audio track to stream
      const audioSource = audioContext.createBufferSource();
      audioSource.buffer = audioBuffer;
      const destination = audioContext.createMediaStreamDestination();
      audioSource.connect(destination);
      
      // Add audio track to video stream
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) {
        stream.addTrack(audioTrack);
      }

      // Enhanced codec selection for better compatibility
      const codecOptions = [
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 + AAC
        'video/mp4;codecs=avc1.42E01E', // H.264 baseline
        'video/webm;codecs=vp9,opus',   // VP9 + Opus
        'video/webm;codecs=vp8,opus',   // VP8 + Opus
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
        videoBitsPerSecond: 8000000, // 8 Mbps
        audioBitsPerSecond: 128000   // 128 kbps
      });

      const recordedChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      setCreationStep('Recording video...');
      setCreationProgress(60);

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      audioSource.start(0);

      // FIXED: Enhanced rendering loop with better synchronization
      const startTime = Date.now();
      let animationId: number;

      const renderFrame = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(elapsed / audioDurationSeconds, 1);
        
        // Update progress
        setCreationProgress(60 + (progress * 30));

        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        // FIXED: Better video synchronization and rendering
        if (elapsed <= audioDurationSeconds) {
          // Update video time with better synchronization
          originalVideo.currentTime = Math.min(elapsed, originalVideo.duration);
          
          // Wait for video to seek properly before drawing
          if (Math.abs(originalVideo.currentTime - elapsed) < 0.1) {
            // Calculate video dimensions to fit canvas while maintaining aspect ratio
            const videoAspect = originalVideo.videoWidth / originalVideo.videoHeight;
            const canvasAspect = width / height;
            
            let drawWidth, drawHeight, drawX, drawY;
            
            if (videoAspect > canvasAspect) {
              // Video is wider - fit to canvas width
              drawWidth = width;
              drawHeight = width / videoAspect;
              drawX = 0;
              drawY = (height - drawHeight) / 2;
            } else {
              // Video is taller - fit to canvas height
              drawHeight = height;
              drawWidth = height * videoAspect;
              drawX = (width - drawWidth) / 2;
              drawY = 0;
            }

            // Draw the original video
            ctx.drawImage(originalVideo, drawX, drawY, drawWidth, drawHeight);
          }

          // Draw avatar
          const avatarSizePixels = avatarSize;
          let avatarX, avatarY;

          switch (avatarPosition) {
            case 'top-left':
              avatarX = 20;
              avatarY = 20;
              break;
            case 'top-right':
              avatarX = width - avatarSizePixels - 20;
              avatarY = 20;
              break;
            case 'bottom-left':
              avatarX = 20;
              avatarY = height - avatarSizePixels - 20;
              break;
            case 'bottom-right':
            default:
              avatarX = width - avatarSizePixels - 20;
              avatarY = height - avatarSizePixels - 20;
              break;
          }

          // Draw avatar with circular mask
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSizePixels/2, avatarY + avatarSizePixels/2, avatarSizePixels/2, 0, 2 * Math.PI);
          ctx.clip();
          ctx.drawImage(avatarImg, avatarX, avatarY, avatarSizePixels, avatarSizePixels);
          ctx.restore();

          // Draw captions
          const currentCaption = captions.find(caption => 
            elapsed >= caption.start && elapsed <= caption.end
          );

          if (currentCaption) {
            ctx.font = `${captionStyle.fontWeight} ${captionStyle.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillStyle = captionStyle.backgroundColor;
            
            const textWidth = ctx.measureText(currentCaption.text).width;
            const padding = 20;
            const textHeight = captionStyle.fontSize;
            
            let captionY;
            if (captionStyle.position === 'top') {
              captionY = 100;
            } else {
              captionY = height - 150;
            }

            // Draw background
            ctx.fillRect(
              width/2 - textWidth/2 - padding,
              captionY - textHeight/2 - padding/2,
              textWidth + padding * 2,
              textHeight + padding
            );

            // Draw text
            ctx.fillStyle = captionStyle.color;
            ctx.fillText(currentCaption.text, width/2, captionY);
          }

          animationId = requestAnimationFrame(renderFrame);
        } else {
          // Recording complete
          cancelAnimationFrame(animationId);
          mediaRecorder.stop();
          audioSource.stop();
          
          // Clean up
          URL.revokeObjectURL(videoUrl);
        }
      };

      renderFrame();

      // Handle recording completion
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = async () => {
          setCreationStep('Finalizing video...');
          setCreationProgress(90);

          try {
            // Create final video blob
            const finalVideoBlob = new Blob(recordedChunks, {
              type: selectedMimeType.includes('mp4') ? 'video/mp4' : 'video/webm'
            });

            // Generate social media content
            await generateSocialMediaContent();

            setCreationStep('Saving to database...');
            setCreationProgress(95);

            // Save to database
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const displayName = selectedVideo.display_name || selectedVideo.original_filename.replace(/\.[^/.]+$/, '');
            const filename = `fullclip-${displayName}-${timestamp}.mp4`;

            await dbManager.saveFullClipVideo(
              filename,
              selectedVideo.original_filename,
              selectedVideo.file_language,
              Math.round(audioDurationSeconds),
              finalVideoBlob,
              script,
              captions,
              selectedVideo.original_file_content,
              displayName
            );

            setCreationProgress(100);
            setCreationStep('Complete!');

            // Navigate to gallery after short delay
            setTimeout(() => {
              setIsCreatingVideo(false);
              onVideoSaved?.();
              onClose();
              
              // Trigger gallery to open FullClip tab
              window.dispatchEvent(new CustomEvent('openFullClipGallery'));
            }, 1000);

            resolve();
          } catch (error) {
            console.error('Failed to save FullClip video:', error);
            setError('Failed to save FullClip video');
            setIsCreatingVideo(false);
            resolve();
          }
        };
      });

    } catch (error) {
      console.error('Failed to create FullClip video:', error);
      setError(`Failed to create FullClip video: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsCreatingVideo(false);
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
                Creating FullClip for: {selectedVideo.display_name || selectedVideo.original_filename}
              </p>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-4 bg-black border-2 border-white rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-white flex-shrink-0" />
              <span className="text-white font-medium">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-white hover:bg-white hover:text-black p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* API Settings */}
              <div className="bg-black border-2 border-white rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3">
                    <Settings className="w-5 h-5" />
                    API Settings
                  </h3>
                  <button
                    onClick={() => setIsApiSettingsOpen(!isApiSettingsOpen)}
                    className="text-white hover:bg-white hover:text-black p-2 rounded border-2 border-white transition-colors"
                  >
                    {isApiSettingsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {isApiSettingsOpen && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-bold mb-2">XAI API Key</label>
                      <input
                        type="password"
                        value={xaiApiKey}
                        onChange={(e) => handleApiKeyChange('xai', e.target.value)}
                        onKeyPress={(e) => handleApiKeyKeyPress(e, 'xai')}
                        placeholder="Enter your XAI API key"
                        className="w-full p-3 bg-black border-2 border-white text-white rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-bold mb-2">ElevenLabs API Key</label>
                      <input
                        type="password"
                        value={elevenLabsApiKey}
                        onChange={(e) => handleApiKeyChange('elevenlabs', e.target.value)}
                        onKeyPress={(e) => handleApiKeyKeyPress(e, 'elevenlabs')}
                        placeholder="Enter your ElevenLabs API key"
                        className="w-full p-3 bg-black border-2 border-white text-white rounded"
                      />
                    </div>
                    {apiKeysConnected && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">API Keys Connected</span>
                      </div>
                    )}
                    <p className="text-gray-400 text-sm">
                      💡 Press Enter after entering keys to connect automatically
                    </p>
                  </div>
                )}
              </div>

              {/* Voice Selection */}
              {apiKeysConnected && (
                <div className="bg-black border-2 border-white rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <Mic className="w-5 h-5" />
                    Voice Selection
                  </h3>
                  
                  {loadingVoices ? (
                    <div className="flex items-center gap-3 text-white">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Loading voices...</span>
                    </div>
                  ) : voices.length > 0 ? (
                    <div className="space-y-4">
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="w-full p-3 bg-black border-2 border-white text-white rounded"
                      >
                        {voices.map(voice => (
                          <option key={voice.voice_id} value={voice.voice_id}>
                            {voice.name} ({voice.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-gray-400">No voices available. Check your API key.</p>
                  )}
                </div>
              )}

              {/* Script Generation */}
              {apiKeysConnected && selectedVoice && (
                <div className="bg-black border-2 border-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <Sparkles className="w-5 h-5" />
                      AI Script Generation
                    </h3>
                    <button
                      onClick={generateScript}
                      disabled={isGeneratingScript || !selectedVideo}
                      className="flex items-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 
                               text-black px-4 py-2 rounded font-bold transition-colors border-2 border-white"
                    >
                      {isGeneratingScript ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Script
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder="AI-generated script will appear here..."
                    className="w-full h-32 p-3 bg-black border-2 border-white text-white rounded resize-none"
                  />
                  
                  {selectedVideo && (
                    <p className="text-gray-400 text-sm mt-2">
                      Target: ~{Math.round((selectedVideo.duration / 60) * 155)} words for {selectedVideo.duration}s video
                    </p>
                  )}
                </div>
              )}

              {/* Audio Generation */}
              {script && selectedVoice && (
                <div className="bg-black border-2 border-white rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <Volume2 className="w-5 h-5" />
                      Audio Generation
                    </h3>
                    <button
                      onClick={generateAudio}
                      disabled={isGeneratingAudio}
                      className="flex items-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 
                               text-black px-4 py-2 rounded font-bold transition-colors border-2 border-white"
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-5 h-5" />
                          Generate Audio
                        </>
                      )}
                    </button>
                  </div>

                  {audioUrl && (
                    <div className="space-y-4">
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onTimeUpdate={handleAudioTimeUpdate}
                        onLoadedMetadata={handleAudioLoadedMetadata}
                        onEnded={() => setIsPlayingAudio(false)}
                        className="hidden"
                      />
                      
                      <div className="flex items-center gap-4">
                        <button
                          onClick={handleAudioPlay}
                          className="flex items-center gap-2 bg-black border-2 border-white text-white 
                                   hover:bg-white hover:text-black px-4 py-2 rounded font-bold transition-colors"
                        >
                          {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                          {isPlayingAudio ? 'Pause' : 'Play'}
                        </button>
                        
                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-200"
                            style={{ width: `${audioProgress}%` }}
                          />
                        </div>
                        
                        <span className="text-white text-sm">
                          {Math.round(audioDuration)}s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Avatar Selection */}
              {audioBlob && (
                <div className="bg-black border-2 border-white rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <User className="w-5 h-5" />
                    Avatar & Positioning
                  </h3>

                  <div className="space-y-6">
                    {/* Avatar Selection */}
                    <div>
                      <label className="block text-white font-bold mb-3">Choose Avatar</label>
                      <div className="grid grid-cols-4 gap-3 mb-4">
                        {avatars.map(avatar => (
                          <button
                            key={avatar.id}
                            onClick={() => setSelectedAvatar(avatar)}
                            className={`relative aspect-square rounded-lg border-2 overflow-hidden transition-all ${
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
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="flex items-center gap-2 bg-black border-2 border-white text-white 
                                   hover:bg-white hover:text-black px-4 py-2 rounded font-bold transition-colors"
                        >
                          {isUploadingAvatar ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Upload className="w-5 h-5" />
                          )}
                          Upload
                        </button>

                        <button
                          onClick={generateAIAvatar}
                          disabled={isGeneratingAvatar}
                          className="flex items-center gap-2 bg-black border-2 border-white text-white 
                                   hover:bg-white hover:text-black px-4 py-2 rounded font-bold transition-colors"
                        >
                          {isGeneratingAvatar ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                          AI Generate
                        </button>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Position & Size */}
                    <div className="grid grid-cols-2 gap-4">
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
                </div>
              )}

              {/* Caption Styling */}
              {captions.length > 0 && (
                <div className="bg-black border-2 border-white rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <Captions className="w-5 h-5" />
                    Caption Styling
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
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
                      <label className="block text-white font-bold mb-2">Position</label>
                      <select
                        value={captionStyle.position}
                        onChange={(e) => setCaptionStyle(prev => ({ ...prev, position: e.target.value as any }))}
                        className="w-full p-2 bg-black border-2 border-white text-white rounded"
                      >
                        <option value="bottom">Bottom</option>
                        <option value="top">Top</option>
                      </select>
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
                </div>
              )}

              {/* Create Video Button */}
              {audioBlob && selectedAvatar && captions.length > 0 && (
                <div className="bg-black border-2 border-white rounded-lg p-6">
                  <button
                    onClick={createFullClipVideo}
                    disabled={isCreatingVideo}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-200 
                             disabled:bg-gray-600 text-black px-6 py-4 rounded-lg font-bold text-xl 
                             transition-colors border-2 border-white"
                  >
                    {isCreatingVideo ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Creating FullClip... {Math.round(creationProgress)}%
                      </>
                    ) : (
                      <>
                        <FileAudio className="w-6 h-6" />
                        Create FullClip Video
                      </>
                    )}
                  </button>

                  {isCreatingVideo && (
                    <div className="mt-4">
                      <div className="bg-gray-800 rounded-full h-3 mb-2">
                        <div 
                          className="bg-white h-3 rounded-full transition-all duration-200"
                          style={{ width: `${creationProgress}%` }}
                        />
                      </div>
                      <p className="text-gray-400 text-center">{creationStep}</p>
                    </div>
                  )}
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
          
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-start justify-center p-6 min-h-full">
              {selectedVideo ? (
                <div className="w-full max-w-md">
                  <div className="relative">
                    <video
                      controls
                      className="w-full bg-black rounded-lg border-2 border-white"
                      style={{ aspectRatio: '9/16' }}
                      src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
                    />
                  </div>
                  
                  <div className="mt-6 text-center">
                    <h4 className="font-bold text-xl text-white mb-3">
                      {selectedVideo.display_name || selectedVideo.original_filename}
                    </h4>
                    <div className="flex justify-center gap-6 text-lg text-gray-400 font-medium mb-4">
                      <span className="capitalize">{selectedVideo.file_language}</span>
                      <span>{Math.round(selectedVideo.duration)}s</span>
                    </div>

                    {/* Audio Script Display */}
                    {script && (
                      <div className="bg-black border-2 border-white rounded-lg p-4 mb-4 text-left max-h-64 overflow-y-auto">
                        <h5 className="text-white font-bold mb-2 sticky top-0 bg-black">Audio Script</h5>
                        <p className="text-gray-300 text-sm leading-relaxed">{script}</p>
                      </div>
                    )}

                    {/* Social Media Content Section */}
                    {socialMediaContent && (
                      <div className="bg-black border-2 border-white rounded-lg p-4 mb-4">
                        <h5 className="text-white font-bold mb-3 flex items-center gap-2">
                          <Share2 className="w-5 h-5" />
                          Social Media Content
                          {isGeneratingSocialContent && <Loader2 className="w-4 h-4 animate-spin" />}
                        </h5>
                        
                        <div className="space-y-4 text-left">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-white font-bold text-sm">Title</label>
                              <button
                                onClick={() => handleCopySocialContent('title')}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Copy title"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="bg-gray-800 border border-gray-600 rounded p-3">
                              <p className="text-white text-sm">{socialMediaContent.title}</p>
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-white font-bold text-sm">Description</label>
                              <button
                                onClick={() => handleCopySocialContent('description')}
                                className="text-gray-400 hover:text-white transition-colors"
                                title="Copy description"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="bg-gray-800 border border-gray-600 rounded p-3">
                              <p className="text-white text-sm leading-relaxed">{socialMediaContent.description}</p>
                            </div>
                          </div>
                          
                          <p className="text-gray-400 text-xs text-center">
                            💡 AI-generated content optimized for social media platforms
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Download Button */}
                    <button
                      onClick={() => {
                        const blob = new Blob([selectedVideo.video_blob], { type: 'video/mp4' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = selectedVideo.filename;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-black hover:bg-white hover:text-black text-white px-6 py-3 rounded-lg font-bold 
                               transition-colors border-2 border-white flex items-center gap-2 mx-auto mb-4"
                    >
                      <Download className="w-5 h-5" />
                      Download Original MP4
                    </button>

                    {/* Social Media Sharing */}
                    <div className="bg-black border-2 border-white rounded-lg p-4">
                      <h5 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        Share to Social Media
                      </h5>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={handleShareToX}
                          className="flex items-center justify-center gap-2 bg-black hover:bg-white hover:text-black 
                                   text-white px-4 py-3 rounded-lg font-bold transition-colors border-2 border-white"
                        >
                          <XIcon className="w-5 h-5" />
                          X (Twitter)
                        </button>
                        <button
                          onClick={handleShareToTikTok}
                          className="flex items-center justify-center gap-2 bg-black hover:bg-white hover:text-black 
                                   text-white px-4 py-3 rounded-lg font-bold transition-colors border-2 border-white"
                        >
                          <TikTokIcon className="w-5 h-5" />
                          TikTok
                        </button>
                        <button
                          onClick={handleShareToInstagram}
                          className="flex items-center justify-center gap-2 bg-black hover:bg-white hover:text-black 
                                   text-white px-4 py-3 rounded-lg font-bold transition-colors border-2 border-white"
                        >
                          <InstagramIcon className="w-5 h-5" />
                          Instagram
                        </button>
                        <button
                          onClick={handleShareToYouTube}
                          className="flex items-center justify-center gap-2 bg-black hover:bg-white hover:text-black 
                                   text-white px-4 py-3 rounded-lg font-bold transition-colors border-2 border-white"
                        >
                          <YouTubeIcon className="w-5 h-5" />
                          YouTube
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm mt-3 text-center">
                        🚀 Perfect vertical format for all social platforms
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 flex flex-col items-center justify-center min-h-full">
                  <FileAudio className="w-20 h-20 mx-auto mb-6 opacity-50" />
                  <p className="text-2xl font-bold">Select a video to create FullClip</p>
                  <p className="text-lg mt-2">Choose a video from your gallery to get started</p>
                </div>
              )}
            </div>
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