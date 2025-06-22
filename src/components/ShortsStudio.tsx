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
  Zap,
  CheckCircle
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

interface CaptionSegment {
  start: number;
  end: number;
  text: string;
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
        {/* Animated Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle className="w-12 h-12 text-black" />
          </div>
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-4">🎬 Shorts Video Created!</h3>
        
        <div className="space-y-4 mb-6">
          <p className="text-lg text-gray-300">
            Your video with penguin avatar has been successfully created and saved to the Shorts Gallery.
          </p>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Saved as:</p>
            <p className="text-white font-mono text-sm break-all">{filename}</p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">Audio & Captions Included</span>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold 
                   transition-colors border-2 border-white flex items-center justify-center gap-2"
        >
          <Users className="w-5 h-5" />
          Open Shorts Gallery
        </button>
        
        <p className="text-gray-400 text-sm mt-4">
          Your video is ready to download and share!
        </p>
      </div>
    </div>
  );
};

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
  
  // NEW: Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [savedVideoFilename, setSavedVideoFilename] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Updated preset penguin avatars using placeholder images that work
  const presetAvatars: PenguinAvatar[] = [
    {
      id: 'avatar1',
      name: 'Classic Penguin',
      description: '8-bit style penguin with orange beak',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QpyBDbGFzc2ljPC90ZXh0Pjwvc3ZnPg=='
    },
    {
      id: 'avatar2',
      name: 'Cool Penguin',
      description: '8-bit penguin with sunglasses',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QpyBDb29sPC90ZXh0Pjwvc3ZnPg=='
    },
    {
      id: 'avatar3',
      name: 'Smart Penguin',
      description: '8-bit penguin with graduation cap',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QpyBTbWFydDwvdGV4dD48L3N2Zz4='
    },
    {
      id: 'avatar4',
      name: 'Tech Penguin',
      description: '8-bit penguin with headphones',
      imageUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QpyBUZWNoPC90ZXh0Pjwvc3ZnPg=='
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

  // FIXED: Simplified approach - create a placeholder avatar with the generated image URL
  // We'll handle CORS during video processing instead of during generation
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
      const enhancedPrompt = `Create a 3d 8bit block style cool penguin with glasses as an avatar for a coding video. ${customAvatarPrompt}. The penguin should be friendly, professional, and suitable for educational content. Style: clean cartoon illustration, high quality, suitable for video overlay.`;

      console.log('Sending request to xAI API with model: grok-2-image-1212');
      console.log('Prompt:', enhancedPrompt);

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
          // REMOVED: size and quality parameters (not supported by xAI API)
        })
      });

      console.log('API Response Status:', response.status);
      
      // Get response data for debugging
      const responseText = await response.text();
      console.log('Raw API Response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed API Response Data:', data);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error(`Invalid JSON response from API: ${responseText.substring(0, 200)}`);
      }

      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || `HTTP ${response.status}`;
        throw new Error(`XAI API error: ${response.status} - ${errorMessage}`);
      }

      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        console.error('No image URL in response:', data);
        throw new Error('No image generated from XAI API - check response format');
      }

      console.log('Custom penguin avatar generated successfully:', imageUrl);
      
      // FIXED: Create avatar with original URL and a fallback placeholder
      // We'll handle the CORS issue during video processing with a different approach
      const newAvatar: PenguinAvatar = {
        id: `custom-${Date.now()}`,
        name: 'Custom Penguin',
        description: customAvatarPrompt,
        imageUrl: imageUrl // Keep original URL for now
      };

      setGeneratedAvatars(prev => [...prev, newAvatar]);
      setSelectedAvatar(newAvatar);
      setCustomAvatarPrompt('');

      console.log('Avatar added to selection list');

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

  // FIXED: Improved caption drawing function to avoid double captions
  const drawCaptions = (ctx: CanvasRenderingContext2D, currentTime: number, captions: CaptionSegment[], canvasWidth: number, canvasHeight: number) => {
    // Find the active caption for the current time
    const activeCaption = captions.find(caption => 
      currentTime >= caption.start && currentTime <= caption.end
    );

    if (!activeCaption) return;

    // Caption styling - positioned higher to avoid avatar overlap
    const fontSize = Math.max(24, canvasWidth * 0.04); // Slightly smaller font
    const lineHeight = fontSize * 1.2;
    const padding = 16;
    const maxWidth = canvasWidth - (padding * 2);
    
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Split text into words and wrap lines
    const words = activeCaption.text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Calculate total text height
    const totalTextHeight = lines.length * lineHeight;
    
    // FIXED: Position captions much higher to avoid avatar overlap
    const textY = canvasHeight - totalTextHeight - padding * 8; // Moved much higher
    
    // Draw background for each line with strong contrast
    lines.forEach((line, index) => {
      const lineY = textY + (index * lineHeight);
      const metrics = ctx.measureText(line);
      const textWidth = metrics.width;
      
      // Strong background for readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)'; // Very strong background
      ctx.fillRect(
        (canvasWidth - textWidth) / 2 - padding,
        lineY - fontSize / 2 - padding / 2,
        textWidth + padding * 2,
        fontSize + padding
      );
      
      // Add white border for extra contrast
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        (canvasWidth - textWidth) / 2 - padding,
        lineY - fontSize / 2 - padding / 2,
        textWidth + padding * 2,
        fontSize + padding
      );
      
      // Draw white text with strong shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 1)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = 'white';
      ctx.fillText(line, canvasWidth /2, lineY);
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });
  };

  // FIXED: Create a fallback avatar image when CORS fails
  const createFallbackAvatar = (description: string): HTMLImageElement => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a simple penguin-like shape
    ctx.fillStyle = '#333333';
    ctx.fillRect(0, 0, 100, 100);
    
    // Draw penguin body
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(50, 70, 25, 30, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw penguin head
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(50, 35, 20, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw white belly
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(50, 70, 15, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw orange beak
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.moveTo(50, 35);
    ctx.lineTo(45, 30);
    ctx.lineTo(55, 30);
    ctx.closePath();
    ctx.fill();
    
    // Draw eyes
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(45, 30, 3, 3, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(55, 30, 3, 3, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Custom', 50, 15);
    ctx.fillText('Penguin', 50, 95);
    
    // Convert to image
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  };

  const processVideoWithAvatar = async () => {
    if (!selectedVideo || !selectedAvatar) {
      alert('Please select a video and avatar first.');
      return;
    }

    setIsProcessingVideo(true);
    setProcessingProgress('Preparing video with avatar...');
    
    try {
      console.log('Starting video processing with avatar and audio...');
      
      // FIXED: Parse captions from the selected video - the FullClip video already has captions embedded
      // We need to extract them for overlay rendering, but be careful not to double-render
      let captions: CaptionSegment[] = [];
      try {
        if (selectedVideo.captions) {
          const parsedCaptions = JSON.parse(selectedVideo.captions);
          captions = parsedCaptions.map((cap: any) => ({
            start: cap.startTime || cap.start || 0,
            end: cap.endTime || cap.end || 0,
            text: cap.text || ''
          }));
          console.log('Parsed captions for overlay:', captions.length, 'segments');
        }
      } catch (error) {
        console.warn('Failed to parse captions:', error);
      }
      
      // Create video element for the original FullClip video (which has audio AND embedded captions)
      const videoBlob = new Blob([selectedVideo.video_blob], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      
      const video = document.createElement('video');
      video.src = videoUrl;
      video.crossOrigin = 'anonymous';
      
      setProcessingProgress('Loading video with audio...');
      
      // Wait for video to load
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log('FullClip video loaded with audio and embedded captions:', video.duration, 'seconds');
          resolve(void 0);
        };
        video.onerror = reject;
        video.load();
      });

      // FIXED: Load avatar image with fallback for CORS issues
      setProcessingProgress('Loading avatar...');
      let avatarImg: HTMLImageElement;
      
      try {
        avatarImg = new Image();
        
        // Try to load the image
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Avatar loading timeout'));
          }, 10000); // 10 second timeout
          
          avatarImg.onload = () => {
            clearTimeout(timeout);
            console.log('Avatar image loaded successfully');
            resolve(void 0);
          };
          
          avatarImg.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Failed to load avatar image'));
          };
          
          // Handle both data URLs and external URLs
          if (selectedAvatar.imageUrl.startsWith('data:')) {
            avatarImg.src = selectedAvatar.imageUrl;
          } else {
            // For external URLs, try without CORS first
            avatarImg.src = selectedAvatar.imageUrl;
          }
        });
      } catch (error) {
        console.warn('Failed to load avatar image, using fallback:', error);
        // Create fallback avatar
        avatarImg = createFallbackAvatar(selectedAvatar.description);
        setProcessingProgress('Using fallback avatar...');
        
        // Wait for fallback to load
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

      // FIXED: The FullClip video already has audio embedded, so we capture it directly
      // We need to capture both video and audio from the video element
      
      // Create a MediaStream from the video element (this includes both video and audio)
      const videoStream = (video as any).captureStream ? (video as any).captureStream(30) : canvas.captureStream(30);
      
      // Get canvas stream for video
      const canvasStream = canvas.captureStream(30);
      
      // Use the video's audio track directly since FullClip videos have embedded audio
      let finalStream: MediaStream;
      
      if (videoStream && videoStream.getAudioTracks().length > 0) {
        // Video has audio tracks - combine canvas video with video audio
        console.log('Using audio from FullClip video');
        finalStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...videoStream.getAudioTracks()
        ]);
      } else {
        // Fallback: try to extract audio using Web Audio API
        console.log('Fallback: extracting audio using Web Audio API');
        const audioContext = new AudioContext();
        const audioSource = audioContext.createMediaElementSource(video);
        const audioDestination = audioContext.createMediaStreamDestination();
        
        // Connect audio source to destination
        audioSource.connect(audioDestination);
        
        finalStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...audioDestination.stream.getAudioTracks()
        ]);
      }

      let mimeType = 'video/mp4';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E';
      }

      const mediaRecorder = new MediaRecorder(finalStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('Recorded chunk with audio:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, creating final video with audio...');
        setProcessingProgress('Finalizing video with audio...');
        
        const finalBlob = new Blob(chunks, { 
          type: 'video/mp4'
        });
        
        console.log('Final Shorts video created with audio:', finalBlob.size, 'bytes');
        
        setProcessingProgress('Saving to gallery...');
        
        // FIXED: Generate display name from original video's display name
        const originalDisplayName = selectedVideo.display_name || selectedVideo.original_filename.replace(/\.[^/.]+$/, '');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const technicalFilename = `shorts-${originalDisplayName}-${timestamp}.mp4`;
        const displayName = `${originalDisplayName} (Shorts)`;
        
        try {
          const videoId = await dbManager.saveShortsVideo(
            technicalFilename,
            selectedVideo.original_filename,
            selectedVideo.file_language,
            Math.round(video.duration),
            finalBlob,
            selectedAvatar.name,
            avatarPosition,
            avatarSize,
            selectedVideo.original_file_content,
            displayName // FIXED: Pass the display name
          );

          console.log('Shorts video with audio saved successfully with ID:', videoId, 'display name:', displayName);
          
          onShortsVideoSaved();
          
          // Show custom success modal instead of alert
          setSavedVideoFilename(displayName); // Show display name in success modal
          setShowSuccessModal(true);
          
        } catch (saveError) {
          console.error('Failed to save video:', saveError);
          alert('Video was created but failed to save to gallery. Please try again.');
        }
        
        // Cleanup
        URL.revokeObjectURL(videoUrl);
      };

      // Start recording
      console.log('Starting recording with audio...');
      setProcessingProgress('Recording video with avatar and audio...');
      mediaRecorder.start(100);
      
      // Reset and start playback
      video.currentTime = 0;
      
      const startTime = Date.now();
      const maxDuration = video.duration * 1000;
      
      // Start playback - the audio will be captured by MediaRecorder
      await video.play();
      
      console.log('Playback started with audio, beginning render loop...');

      // Render loop with avatar overlay - FIXED: No additional captions since they're already embedded
      const renderFrame = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / maxDuration;
        const currentVideoTime = video.currentTime;
        
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

        // Draw video frame (this already includes embedded captions from FullClip)
        if (video.readyState >= 2) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Draw avatar OVER the video (including its embedded captions)
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

        // FIXED: DO NOT draw additional captions since the FullClip video already has them embedded
        // The embedded captions will show through the video element
        // Only the avatar is added as an overlay

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

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onClose();
    
    // Open Shorts Gallery
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('openShortsGallery'));
    }, 300);
  };

  if (!isOpen) return null;

  const allAvatars = [...presetAvatars, ...generatedAvatars];

  return (
    <>
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
                  {selectedVideo.display_name || selectedVideo.original_filename} • {selectedVideo.duration}s • With Audio & Captions
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
                  {processingProgress || 'Adding penguin avatar to your video with audio...'}
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
                      placeholder="Describe your penguin (e.g., 'wearing a red hat')"
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
                  <p className="text-gray-400 text-sm mt-2">
                    Using model: <code className="bg-gray-800 px-2 py-1 rounded">grok-2-image-1212</code>
                  </p>
                  <p className="text-yellow-400 text-sm mt-1">
                    ⚠️ Note: Generated images may use fallback if CORS restrictions apply
                  </p>
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
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QpyBQZW5ndWluPC90ZXh0Pjwvc3ZnPg==';
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
                    This will add the penguin avatar to your FullClip video
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
                    />
                    <p className="text-center text-gray-400 text-sm mt-2">
                      FullClip video with embedded audio and captions
                    </p>
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
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+QpyBQZW5ndWluPC90ZXh0Pjwvc3ZnPg==';
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
                    <div className="flex justify-between">
                      <span className="text-gray-400">Audio:</span>
                      <span className="text-green-400">✓ From FullClip</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Captions:</span>
                      <span className="text-green-400">✓ Embedded (No Overlay)</span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
                    <p className="text-gray-400">
                      ✨ Captions are already embedded in the FullClip video - no additional overlay needed!
                    </p>
                    <p className="text-yellow-400 mt-1">
                      ⚠️ Custom avatars may use fallback images if CORS restrictions apply
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden canvas for video processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      {/* Custom Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        filename={savedVideoFilename}
      />
    </>
  );
};

export default ShortsStudio;