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

    // Handle streaming control - FIXED: Immediate start
    useEffect(() => {
      if (!file) return;

      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (isStreaming && !isPaused) {
        // Start streaming immediately
        const streamingSpeed = 101 - speed;
        
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
        }, streamingSpeed);
      } else {
        // Pause streaming
        setIsPaused(!isStreaming);
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [file, isStreaming, speed]); // Include speed in dependencies for immediate updates

    // Auto-scroll to bottom when content updates and track scroll position
    useEffect(() => {
      if (containerRef.current && isStreaming && !isPaused) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
        scrollPositionRef.current = containerRef.current.scrollTop;
      }
    }, [displayedContent, isStreaming, isPaused]);

    // Syntax highlighting function with bright colors
    const getSyntaxColor = (token: string, language: string): string => {
      // Keywords
      const keywords = [
        'function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export',
        'from', 'as', 'default', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'super',
        'public', 'private', 'protected', 'static', 'abstract', 'interface', 'type', 'extends', 'implements',
        'def', 'class', 'import', 'from', 'as', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or',
        'true', 'false', 'null', 'undefined', 'None', 'True', 'False'
      ];
      
      // Operators
      const operators = ['=', '==', '===', '!=', '!==', '+', '-', '*', '/', '%', '&&', '||', '!', '<', '>', '<=', '>='];
      
      // Check token type
      if (keywords.includes(token.toLowerCase())) {
        return '#FF6B9D'; // Bright pink for keywords
      } else if (operators.includes(token)) {
        return '#4ECDC4'; // Bright cyan for operators
      } else if (/^["'].*["']$/.test(token)) {
        return '#95E1D3'; // Bright green for strings
      } else if (/^\d+(\.\d+)?$/.test(token)) {
        return '#FFE66D'; // Bright yellow for numbers
      } else if (/^\/\/.*|^\/\*.*\*\/|^#.*/.test(token)) {
        return '#A8A8A8'; // Gray for comments
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(token)) {
        return '#FF8C42'; // Bright orange for classes/types
      } else if (/^\w+\(/.test(token)) {
        return '#6BCF7F'; // Bright green for functions
      }
      
      return '#FFFFFF'; // White for default text
    };

    // Enhanced canvas rendering with syntax highlighting
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
        // Clear canvas with dark background
        ctx.fillStyle = '#0A0A0A';
        ctx.fillRect(0, 0, width, height);

        if (!file || !displayedContent) {
          // Draw placeholder text
          ctx.fillStyle = '#6B7280';
          ctx.font = 'bold 24px "Fira Code", "Courier New", monospace';
          ctx.textAlign = 'center';
          if (isPaused) {
            ctx.fillText('⏸ PAUSED', width / 2, height / 2);
          } else {
            ctx.fillText('Ready to stream...', width / 2, height / 2);
          }
          return;
        }

        // Calculate visible area based on current scroll position
        const lines = displayedContent.split('\n');
        const lineHeight = 36;
        const fontSize = 20;
        const padding = 32;
        const maxVisibleLines = Math.floor((height - padding * 2) / lineHeight);
        
        // Calculate which lines should be visible based on scroll
        const totalContentHeight = lines.length * lineHeight;
        const containerHeight = height - padding * 2;
        const scrollRatio = scrollPositionRef.current / Math.max(1, totalContentHeight - containerHeight);
        const startLineIndex = Math.floor(scrollRatio * Math.max(0, lines.length - maxVisibleLines));
        const endLineIndex = Math.min(lines.length, startLineIndex + maxVisibleLines);
        
        ctx.font = `${fontSize}px "Fira Code", "Courier New", monospace`;
        ctx.textAlign = 'left';

        let y = padding + lineHeight;
        
        // Draw only visible lines with syntax highlighting
        for (let i = startLineIndex; i < endLineIndex; i++) {
          const line = lines[i] || '';
          const lineNum = i + 1;
          
          // Draw line number with glow effect
          ctx.shadowColor = '#4ECDC4';
          ctx.shadowBlur = 10;
          ctx.fillStyle = '#4ECDC4';
          const lineNumText = `${lineNum}`.padStart(3, ' ');
          ctx.fillText(lineNumText, padding, y);
          ctx.shadowBlur = 0;

          // Draw code content with syntax highlighting
          const codeX = padding + 100;
          let currentX = codeX;
          
          // Simple tokenization for syntax highlighting
          const tokens = line.split(/(\s+|[(){}[\];,.]|["'].*?["']|\w+|[^\w\s])/).filter(token => token.length > 0);
          
          for (const token of tokens) {
            if (token.trim() === '') {
              // Handle whitespace
              const spaceWidth = ctx.measureText(' ').width;
              currentX += spaceWidth * token.length;
              continue;
            }
            
            // Get color for this token
            const color = getSyntaxColor(token, file.language);
            ctx.fillStyle = color;
            
            // Add subtle glow effect for keywords and important tokens
            if (color !== '#FFFFFF') {
              ctx.shadowColor = color;
              ctx.shadowBlur = 5;
            }
            
            ctx.fillText(token, currentX, y);
            currentX += ctx.measureText(token).width;
            
            // Reset shadow
            ctx.shadowBlur = 0;
          }
          
          y += lineHeight;
          if (y > height - padding) break;
        }

        // Draw animated cursor with glow effect
        if (isStreaming && !isPaused && currentIndex < file.content.length) {
          const time = Date.now() * 0.008;
          const cursorOpacity = (Math.sin(time) * 0.3 + 0.7);
          
          ctx.shadowColor = '#FF6B9D';
          ctx.shadowBlur = 15;
          ctx.fillStyle = `rgba(255, 107, 157, ${cursorOpacity})`;
          
          // Find cursor position
          const lastVisibleLineIndex = Math.min(endLineIndex - 1, lines.length - 1);
          const lastLine = lines[lastVisibleLineIndex] || '';
          const cursorX = padding + 100 + ctx.measureText(lastLine).width + 8;
          const cursorY = padding + lineHeight + (lastVisibleLineIndex - startLineIndex) * lineHeight;
          
          if (cursorY >= padding && cursorY <= height - padding) {
            ctx.fillRect(cursorX, cursorY - fontSize, 4, fontSize + 4);
          }
          ctx.shadowBlur = 0;
        }

        // Draw pause indicator with glow
        if (isPaused) {
          ctx.shadowColor = '#FFE66D';
          ctx.shadowBlur = 20;
          ctx.fillStyle = '#FFE66D';
          ctx.font = 'bold 28px "Fira Code", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⏸ PAUSED', width / 2, 60);
          ctx.shadowBlur = 0;
        }

        // Add subtle background pattern
        ctx.globalAlpha = 0.03;
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
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
        // Enhanced syntax highlighting for display
        const tokens = line.split(/(\s+|[(){}[\];,.]|["'].*?["']|\w+|[^\w\s])/).filter(token => token.length > 0);
        
        return (
          <div key={lineIndex} className="flex min-h-[1.5rem]">
            <span className="text-cyan-400 text-right w-12 pr-4 select-none flex-shrink-0 font-mono font-bold glow-cyan">
              {lineIndex + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-words font-mono">
              {tokens.map((token, tokenIndex) => {
                if (token.trim() === '') return token;
                
                const color = getSyntaxColor(token, language);
                let className = 'text-white';
                
                // Map colors to Tailwind classes with glow effects
                if (color === '#FF6B9D') className = 'text-pink-400 glow-pink font-bold';
                else if (color === '#4ECDC4') className = 'text-cyan-400 glow-cyan font-bold';
                else if (color === '#95E1D3') className = 'text-green-400 glow-green';
                else if (color === '#FFE66D') className = 'text-yellow-400 glow-yellow font-bold';
                else if (color === '#A8A8A8') className = 'text-gray-400 italic';
                else if (color === '#FF8C42') className = 'text-orange-400 glow-orange font-bold';
                else if (color === '#6BCF7F') className = 'text-emerald-400 glow-emerald font-bold';
                
                return (
                  <span key={tokenIndex} className={className}>
                    {token}
                  </span>
                );
              })}
            </span>
          </div>
        );
      });
    };

    return (
      <div className="bg-black border-2 border-white rounded-xl overflow-hidden h-full flex flex-col">
        <style jsx>{`
          .glow-cyan { text-shadow: 0 0 10px #4ECDC4; }
          .glow-pink { text-shadow: 0 0 10px #FF6B9D; }
          .glow-green { text-shadow: 0 0 10px #95E1D3; }
          .glow-yellow { text-shadow: 0 0 10px #FFE66D; }
          .glow-orange { text-shadow: 0 0 10px #FF8C42; }
          .glow-emerald { text-shadow: 0 0 10px #6BCF7F; }
        `}</style>
        
        <div className="bg-black border-b-2 border-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-black glow-red"></div>
              <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-black glow-yellow"></div>
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-black glow-green"></div>
            </div>
            <span className="text-lg font-bold text-white">
              {file ? file.name : 'Select a file to preview'}
            </span>
            {isPaused && (
              <span className="text-sm bg-yellow-400 text-black px-3 py-1 rounded font-bold border-2 border-yellow-400 glow-yellow animate-pulse">
                PAUSED
              </span>
            )}
          </div>
          {file && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-cyan-400 bg-black px-3 py-1 rounded border-2 border-cyan-400 capitalize font-bold glow-cyan">
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
          className="flex-1 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative border-2 border-white rounded-b-xl"
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
              style={{ fontFamily: '"Fira Code", "Courier New", monospace' }}
            >
              {file ? (
                displayedContent ? (
                  <div className="text-white">
                    {syntaxHighlight(displayedContent, file.language)}
                    {isStreaming && !isPaused && currentIndex < file.content.length && (
                      <span className="inline-block w-1 h-6 bg-pink-400 animate-pulse ml-1 glow-pink"></span>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center pt-12">
                    <div className="text-xl font-bold glow-cyan">Ready to stream...</div>
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