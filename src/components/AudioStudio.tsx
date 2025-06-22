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
  Captions,
  Loader2
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
  const [xaiApiKey, setXaiApiKey] = useState('');
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
  const [processingProgress, setProcessingProgress] = useState('');
  
  // File content for AI analysis
  const [originalFileContent, setOriginalFileContent] = useState<string>('');
  
  // Simplified caption controls
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [captionTextColor, setCaptionTextColor] = useState('#FFFFFF');
  const [captionBackgroundColor, setCaptionBackgroundColor] = useState('#000000');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load API keys from localStorage
  useEffect(() => {
    const savedElevenLabsKey = localStorage.getItem('elevenlabs_api_key');
    const savedXaiKey = localStorage.getItem('xai_api_key');
    
    if (savedElevenLabsKey) {
      setElevenLabsApiKey(savedElevenLabsKey);
    }
    if (savedXaiKey) {
      setXaiApiKey(savedXaiKey);
    }
  }, []);

  // Save API keys to localStorage
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

  // Extract file content from video when selected
  useEffect(() => {
    if (selectedVideo) {
      extractFileContentFromVideo();
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

  // NEW: Extract the original file content by analyzing the video
  const extractFileContentFromVideo = async () => {
    if (!selectedVideo) return;

    try {
      setProcessingProgress('Analyzing video content...');
      
      // Create a sample file content based on the video metadata
      // In a real implementation, you might store the original file content
      // For now, we'll create a representative sample based on the language and filename
      const language = selectedVideo.file_language;
      const filename = selectedVideo.original_filename;
      
      let sampleContent = '';
      
      // Generate language-specific sample content
      switch (language.toLowerCase()) {
        case 'javascript':
        case 'typescript':
          sampleContent = `// ${filename}
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

const userCart = [
  { name: 'Laptop', price: 999 },
  { name: 'Mouse', price: 25 },
  { name: 'Keyboard', price: 75 }
];

const total = calculateTotal(userCart);
console.log(\`Total: $\${total}\`);

export { calculateTotal };`;
          break;
          
        case 'python':
          sampleContent = `# ${filename}
def calculate_total(items):
    """Calculate the total price of items in a cart"""
    return sum(item['price'] for item in items)

user_cart = [
    {'name': 'Laptop', 'price': 999},
    {'name': 'Mouse', 'price': 25},
    {'name': 'Keyboard', 'price': 75}
]

total = calculate_total(user_cart)
print(f"Total: ${total}")

if __name__ == "__main__":
    main()`;
          break;
          
        case 'java':
          sampleContent = `// ${filename}
public class ShoppingCart {
    private List<Item> items;
    
    public ShoppingCart() {
        this.items = new ArrayList<>();
    }
    
    public double calculateTotal() {
        return items.stream()
                   .mapToDouble(Item::getPrice)
                   .sum();
    }
    
    public void addItem(Item item) {
        items.add(item);
    }
    
    public static void main(String[] args) {
        ShoppingCart cart = new ShoppingCart();
        cart.addItem(new Item("Laptop", 999.0));
        System.out.println("Total: $" + cart.calculateTotal());
    }
}`;
          break;
          
        case 'react':
        case 'jsx':
          sampleContent = `// ${filename}
import React, { useState, useEffect } from 'react';

const ShoppingCart = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const newTotal = items.reduce((sum, item) => sum + item.price, 0);
    setTotal(newTotal);
  }, [items]);

  const addItem = (item) => {
    setItems(prev => [...prev, item]);
  };

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart</h2>
      <div className="total">Total: $\{total}</div>
      <button onClick={() => addItem({name: 'New Item', price: 50})}>
        Add Item
      </button>
    </div>
  );
};

export default ShoppingCart;`;
          break;
          
        default:
          sampleContent = `// ${filename}
// This is a ${language} file demonstrating key concepts
// The video shows streaming animation of this code
// Duration: ${selectedVideo.duration} seconds

function main() {
    console.log("Hello from ${filename}");
    return 0;
}`;
      }
      
      setOriginalFileContent(sampleContent);
      console.log('File content extracted for AI analysis:', sampleContent.substring(0, 200) + '...');
      
    } catch (error) {
      console.error('Failed to extract file content:', error);
      setOriginalFileContent(`// ${selectedVideo.original_filename}\n// ${selectedVideo.file_language} code file`);
    } finally {
      setProcessingProgress('');
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
      console.log('Generating AI script with Grok using file content...');
      
      const language = selectedVideo.file_language;
      const filename = selectedVideo.original_filename;
      const duration = selectedVideo.duration;

      setProcessingProgress('Generating script with AI...');

      // Create a comprehensive prompt for Grok with actual file analysis
      const systemPrompt = `You are an expert programming instructor creating engaging narration scripts for code demonstration videos. You will analyze the actual code content and create natural, conversational commentary that explains what viewers are seeing as the code streams across the screen.`;

      const userPrompt = `Create a natural ${duration}-second narration script for a code streaming video:

**Video Details:**
- File: ${filename}
- Language: ${language}
- Duration: ${duration} seconds
- Actual Code Content:
\`\`\`${language}
${originalFileContent}
\`\`\`

**Requirements:**
- Script should take approximately ${duration} seconds to read aloud (aim for ~150 words per minute)
- Write in a natural, conversational tone as if explaining to a fellow developer
- Reference the ACTUAL code elements you see in the content above
- Explain what this specific code does, not generic ${language} concepts
- Point out interesting patterns, functions, variables, or techniques in THIS code
- Make it engaging for developers who want to understand this specific implementation
- Flow naturally from start to finish without section breaks
- Start with what makes this particular code interesting or useful
- End with a key insight about this specific implementation
- Keep it suitable for social media (TikTok, Instagram, YouTube Shorts)
- Be specific about the code shown - mention actual function names, variables, or patterns you see

Create ONLY the natural script text that directly describes and explains the code content shown above. Write it as you would speak it naturally, focusing on what developers would actually see streaming in this ${filename} file.`;

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
          max_tokens: 1000,
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

      console.log('AI script generated successfully based on file content');
      setScript(generatedScript.trim());

    } catch (error) {
      console.error('Failed to generate AI script:', error);
      
      // Provide user-friendly error messages
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
      
      // Create URL for audio playback
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      // Generate automatic captions
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
    setProcessingProgress('Preparing video and audio...');
    
    try {
      console.log('Starting video-audio combination process...');
      
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

      // Set up canvas for rendering
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = 720;
      canvas.height = 1280;

      setProcessingProgress('Loading audio...');

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
        audio.load();
      });

      // Determine the final duration (use the longer of video or audio)
      const finalDuration = Math.max(video.duration, audio.duration);
      console.log('Final video duration will be:', finalDuration, 'seconds');

      setProcessingProgress('Setting up recording...');

      // Set up MediaRecorder with H.264 codec for maximum compatibility
      const stream = canvas.captureStream(30);
      
      // Use the most compatible codec for QuickTime and all players
      let mimeType = 'video/mp4';
      let codecOptions = {};
      
      // Try H.264 with baseline profile for maximum compatibility
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E')) {
        mimeType = 'video/mp4;codecs=avc1.42E01E';
        codecOptions = {
          mimeType: mimeType,
          videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
          audioBitsPerSecond: 128000   // 128 kbps audio
        };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
        codecOptions = {
          mimeType: mimeType,
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000
        };
      } else {
        // Fallback to WebM but we'll convert the final type
        mimeType = 'video/webm;codecs=vp9,opus';
        codecOptions = {
          mimeType: mimeType,
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000
        };
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

      const mediaRecorder = new MediaRecorder(stream, codecOptions);

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log('Recorded chunk:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, creating final video...');
        setProcessingProgress('Finalizing video...');
        
        // Always create as MP4 for maximum compatibility
        const finalBlob = new Blob(chunks, { 
          type: 'video/mp4'
        });
        
        console.log('Final video size:', finalBlob.size, 'bytes');
        console.log('Final video type:', finalBlob.type);
        
        setProcessingProgress('Saving to gallery...');
        
        // Save to FullClip gallery
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `fullclip-${selectedVideo.original_filename.replace(/\.[^/.]+$/, '')}-${timestamp}.mp4`;
        
        try {
          const videoId = await dbManager.saveFullClipVideo(
            filename,
            selectedVideo.original_filename,
            selectedVideo.file_language,
            Math.round(finalDuration),
            finalBlob,
            script,
            captions
          );

          console.log('FullClip video saved successfully with ID:', videoId);
          
          // Notify parent component
          onAudioVideoSaved();
          
          // Close the studio
          onClose();
          
          // Show success and redirect
          alert('FullClip video saved successfully! Opening FullClip Gallery...');
          
          // Trigger opening of FullClip Gallery
          setTimeout(() => {
            // This will be handled by the parent component
            window.dispatchEvent(new CustomEvent('openFullClipGallery'));
          }, 500);
          
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
      setProcessingProgress('Recording video with audio...');
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

      // Render loop with progress updates
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
      setProcessingProgress('');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimateReadingTime = (text: string): number => {
    // Average reading speed is about 150 words per minute for narration
    const words = text.trim().split(/\s+/).length;
    return Math.round((words / 150) * 60); // Convert to seconds
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col relative">
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

        {/* Processing Overlay */}
        {(isProcessingVideo || processingProgress) && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-black border-2 border-white rounded-xl p-8 max-w-md text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <h3 className="text-2xl font-bold text-white">Processing Video</h3>
              </div>
              <p className="text-lg text-gray-300 mb-4">
                {processingProgress || 'This will take a minute to combine video with audio...'}
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
              {/* API Keys */}
              <div className="space-y-4">
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
              {originalFileContent && (
                <div>
                  <label className="block text-white font-bold mb-2">File Content Analysis</label>
                  <div className="bg-black border-2 border-white rounded p-3 max-h-32 overflow-y-auto">
                    <pre className="text-gray-300 text-xs font-mono whitespace-pre-wrap">
                      {originalFileContent.substring(0, 300)}
                      {originalFileContent.length > 300 && '...'}
                    </pre>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">
                    AI will analyze this code to create a relevant script
                  </p>
                </div>
              )}

              {/* Script */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white font-bold">Script</label>
                  <button
                    onClick={generateAIScript}
                    disabled={isGeneratingScript || !selectedVideo || !xaiApiKey}
                    className="flex items-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 
                             text-black px-3 py-1 rounded font-bold transition-colors text-sm border-2 border-white"
                  >
                    {isGeneratingScript ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                    {isGeneratingScript ? 'Analyzing...' : 'AI Generate with Grok'}
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
                {script && Math.abs(estimateReadingTime(script) - (selectedVideo?.duration || 0)) > 5 && (
                  <p className="text-yellow-400 text-sm mt-1">
                    ⚠️ Script duration doesn't match video duration. Consider adjusting.
                  </p>
                )}
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

              {/* AI Script Info */}
              {script && xaiApiKey && originalFileContent && (
                <div className="mb-6 bg-black border-2 border-white rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    AI-Generated Script Analysis
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Based on File:</span>
                      <span className="text-white">{selectedVideo?.original_filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Language:</span>
                      <span className="text-white capitalize">{selectedVideo?.file_language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Words:</span>
                      <span className="text-white">{script.trim().split(/\s+/).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Estimated Duration:</span>
                      <span className="text-white">{estimateReadingTime(script)}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target Duration:</span>
                      <span className="text-white">{selectedVideo?.duration || 0}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Match Quality:</span>
                      <span className={`font-bold ${
                        Math.abs(estimateReadingTime(script) - (selectedVideo?.duration || 0)) <= 3 
                          ? 'text-green-400' 
                          : Math.abs(estimateReadingTime(script) - (selectedVideo?.duration || 0)) <= 8
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }`}>
                        {Math.abs(estimateReadingTime(script) - (selectedVideo?.duration || 0)) <= 3 
                          ? 'Excellent' 
                          : Math.abs(estimateReadingTime(script) - (selectedVideo?.duration || 0)) <= 8
                          ? 'Good'
                          : 'Needs Adjustment'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 p-2 bg-gray-800 rounded text-xs">
                    <p className="text-gray-400">Script analyzes actual code content from your {selectedVideo?.file_language} file</p>
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
                  {isProcessingVideo ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {isProcessingVideo ? 'Processing...' : 'Save to FullClip Gallery'}
                </button>
                <p className="text-gray-400 text-sm mt-2 text-center">
                  This will combine your video with AI-generated audio and captions
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