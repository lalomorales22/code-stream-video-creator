import React, { useState, useEffect, forwardRef, useRef } from 'react';
import { FileData } from '../App';

interface CodeStreamerProps {
  file: FileData | null;
  isStreaming: boolean;
  speed: number;
  isRecording?: boolean;
  onRecordingData?: (blob: Blob, duration: number) => void;
}

const CodeStreamer = forwardRef<HTMLDivElement, CodeStreamerProps>(
  ({ file, isStreaming, speed, isRecording, onRecordingData }, ref) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);
    const scrollPositionRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Reset when file changes
    useEffect(() => {
      if (!file) {
        setDisplayedContent('');
        setCurrentIndex(0);
        setIsPaused(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      // If file changes, reset everything
      setDisplayedContent('');
      setCurrentIndex(0);
      setIsPaused(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, [file]);

    // Handle streaming control
    useEffect(() => {
      if (!file) return;

      if (isStreaming && !isPaused) {
        // Start or resume streaming
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
          setCurrentIndex(prevIndex => {
            if (prevIndex < file.content.length) {
              setDisplayedContent(prev => prev + file.content[prevIndex]);
              return prevIndex + 1;
            } else {
              // Streaming complete
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              return prevIndex;
            }
          });
        }, 101 - speed);
      } else {
        // Pause streaming
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsPaused(!isStreaming);
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [file, isStreaming, speed]);

    // Auto-scroll to bottom when content updates and track scroll position
    useEffect(() => {
      if (containerRef.current && isStreaming && !isPaused) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        scrollPositionRef.current = containerRef.current.scrollTop;
      }
    }, [displayedContent, isStreaming, isPaused]);

    // Enhanced canvas recording with proper scroll tracking
    useEffect(() => {
      if (!canvasRef.current || !contentRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size for vertical video (9:16) with high quality
      const width = 720;
      const height = 1280;
      canvas.width = width;
      canvas.height = height;

      const drawFrame = () => {
        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);

        if (!file || !displayedContent) {
          // Draw placeholder text
          ctx.fillStyle = '#6B7280';
          ctx.font = '24px monospace';
          ctx.textAlign = 'center';
          if (isPaused) {
            ctx.fillText('Paused...', width / 2, height / 2);
          } else {
            ctx.fillText('Ready to stream...', width / 2, height / 2);
          }
          return;
        }

        // Calculate visible area based on current scroll position
        const lines = displayedContent.split('\n');
        const lineHeight = 32;
        const fontSize = 18;
        const padding = 24;
        const maxVisibleLines = Math.floor((height - padding * 2) / lineHeight);
        
        // Calculate which lines should be visible based on scroll
        const totalContentHeight = lines.length * lineHeight;
        const containerHeight = height - padding * 2;
        const scrollRatio = scrollPositionRef.current / Math.max(1, totalContentHeight - containerHeight);
        const startLineIndex = Math.floor(scrollRatio * Math.max(0, lines.length - maxVisibleLines));
        const endLineIndex = Math.min(lines.length, startLineIndex + maxVisibleLines);
        
        ctx.font = `${fontSize}px 'Courier New', monospace`;
        ctx.textAlign = 'left';

        let y = padding + lineHeight;
        
        // Draw only visible lines
        for (let i = startLineIndex; i < endLineIndex; i++) {
          const line = lines[i] || '';
          const lineNum = i + 1;
          
          // Draw line number
          ctx.fillStyle = '#6B7280';
          const lineNumText = `${lineNum}`.padStart(3, ' ');
          ctx.fillText(lineNumText, padding, y);

          // Draw code content
          const codeX = padding + 80;
          ctx.fillStyle = '#FFFFFF'; // Simple white text for now
          
          // Handle long lines by wrapping
          const maxWidth = width - codeX - padding;
          const words = line.split(' ');
          let currentLine = '';
          
          for (let j = 0; j < words.length; j++) {
            const testLine = currentLine + words[j] + ' ';
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && j > 0) {
              ctx.fillText(currentLine.trim(), codeX, y);
              currentLine = words[j] + ' ';
              y += lineHeight;
              if (y > height - padding) break;
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine.trim() && y <= height - padding) {
            ctx.fillText(currentLine.trim(), codeX, y);
          }
          
          y += lineHeight;
          if (y > height - padding) break;
        }

        // Draw blinking cursor at the end of displayed content
        if (isStreaming && !isPaused && currentIndex < file.content.length) {
          const cursorOpacity = Math.sin(Date.now() * 0.005) * 0.5 + 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${cursorOpacity})`;
          
          // Find cursor position
          const lastVisibleLineIndex = Math.min(endLineIndex - 1, lines.length - 1);
          const lastLine = lines[lastVisibleLineIndex] || '';
          const cursorX = padding + 80 + ctx.measureText(lastLine).width + 5;
          const cursorY = padding + lineHeight + (lastVisibleLineIndex - startLineIndex) * lineHeight;
          
          if (cursorY >= padding && cursorY <= height - padding) {
            ctx.fillRect(cursorX, cursorY - fontSize, 3, fontSize);
          }
        }

        // Draw pause indicator
        if (isPaused) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.font = '20px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⏸ PAUSED', width / 2, 50);
        }
      };

      // Animation loop for canvas updates
      let animationId: number;
      const animate = () => {
        drawFrame();
        animationId = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }, [file, displayedContent, isStreaming, currentIndex, isPaused]);

    // Recording control with MP4 output
    useEffect(() => {
      if (!canvasRef.current) return;

      if (isRecording && !mediaRecorderRef.current) {
        // Start recording
        recordingStartTimeRef.current = Date.now();
        const canvas = canvasRef.current;
        const stream = canvas.captureStream(30); // 30 FPS for smooth recording
        
        // Use H.264 codec for MP4 compatibility
        let mimeType = 'video/webm;codecs=h264';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp9';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: mimeType,
          videoBitsPerSecond: 3000000 // 3 Mbps for high quality
        });

        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
          const blob = new Blob(recordedChunksRef.current, {
            type: 'video/mp4' // Output as MP4
          });
          onRecordingData?.(blob, duration);
          recordedChunksRef.current = [];
        };

        mediaRecorder.start(100); // Collect data every 100ms
        mediaRecorderRef.current = mediaRecorder;
      } else if (!isRecording && mediaRecorderRef.current) {
        // Stop recording
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
    }, [isRecording, onRecordingData]);

    const syntaxHighlight = (code: string, language: string) => {
      const lines = code.split('\n');
      
      return lines.map((line, lineIndex) => {
        // NO PROCESSING - just display the raw line exactly as it is
        return (
          <div key={lineIndex} className="flex min-h-[1.5rem]">
            <span className="text-gray-400 text-right w-12 pr-4 select-none flex-shrink-0 font-mono">
              {lineIndex + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-words text-white font-mono">
              {line || '\u00A0'}
            </span>
          </div>
        );
      });
    };

    return (
      <div className="bg-black border-2 border-white rounded-xl overflow-hidden h-full flex flex-col">
        <div className="bg-black border-b-2 border-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-4 h-4 bg-white rounded-full border-2 border-black"></div>
              <div className="w-4 h-4 bg-white rounded-full border-2 border-black"></div>
              <div className="w-4 h-4 bg-white rounded-full border-2 border-black"></div>
            </div>
            <span className="text-lg font-bold text-white">
              {file ? file.name : 'Select a file to preview'}
            </span>
            {isPaused && (
              <span className="text-sm bg-white text-black px-3 py-1 rounded font-bold border-2 border-white">
                PAUSED
              </span>
            )}
          </div>
          {file && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-white bg-black px-3 py-1 rounded border-2 border-white capitalize font-bold">
                {file.language}
              </span>
              {displayedContent && (
                <span className="text-sm text-gray-400 font-mono">
                  {currentIndex}/{file.content.length} chars
                </span>
              )}
            </div>
          )}
        </div>
        
        <div 
          ref={ref}
          className="flex-1 bg-black relative border-2 border-white rounded-b-xl"
          style={{ aspectRatio: '9/16' }}
        >
          {/* Hidden canvas for recording */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 opacity-0 pointer-events-none"
            style={{ zIndex: -1 }}
          />
          
          <div 
            ref={containerRef}
            className="absolute inset-0 overflow-auto"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div 
              ref={contentRef}
              className="p-6 font-mono text-sm leading-relaxed min-h-full"
            >
              {file ? (
                displayedContent ? (
                  <div className="text-white">
                    {syntaxHighlight(displayedContent, file.language)}
                    {isStreaming && !isPaused && currentIndex < file.content.length && (
                      <span className="inline-block w-3 h-6 bg-white animate-pulse ml-1"></span>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center pt-12">
                    <div className="text-xl font-bold">Ready to stream...</div>
                    <div className="text-sm mt-3 font-medium">Press play to start streaming</div>
                  </div>
                )
              ) : (
                <div className="text-gray-400 text-center pt-12">
                  <div className="text-xl font-bold">No file selected</div>
                  <div className="text-sm mt-3 font-medium">Choose a file from the manager</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CodeStreamer.displayName = 'CodeStreamer';

export default CodeStreamer;