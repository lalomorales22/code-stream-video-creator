import React, { useState, useEffect, forwardRef, useRef } from 'react';
import { FileData } from '../App';
import { ColorScheme } from './ColorCustomizer';

interface CodeStreamerProps {
  file: FileData | null;
  isStreaming: boolean;
  speed: number;
  isRecording?: boolean;
  onRecordingData?: (blob: Blob, duration: number) => void;
  colorScheme: ColorScheme;
}

const CodeStreamer = forwardRef<HTMLDivElement, CodeStreamerProps>(
  ({ file, isStreaming, speed, isRecording, onRecordingData, colorScheme }, ref) => {
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

    // Syntax highlighting function with custom colors
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
        return colorScheme.keywords;
      } else if (operators.includes(token)) {
        return colorScheme.operators;
      } else if (/^["'].*["']$/.test(token)) {
        return colorScheme.strings;
      } else if (/^\d+(\.\d+)?$/.test(token)) {
        return colorScheme.numbers;
      } else if (/^\/\/.*|^\/\*.*\*\/|^#.*/.test(token)) {
        return colorScheme.comments;
      } else if (/^[A-Z][a-zA-Z0-9]*$/.test(token)) {
        return colorScheme.classes;
      } else if (/^\w+\(/.test(token)) {
        return colorScheme.functions;
      }
      
      return colorScheme.text;
    };

    // Enhanced canvas rendering with custom colors and proper MP4 encoding
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
        // Clear canvas with custom background
        ctx.fillStyle = colorScheme.background;
        ctx.fillRect(0, 0, width, height);

        if (!file || !displayedContent) {
          // Draw placeholder text
          ctx.fillStyle = colorScheme.text;
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
          ctx.shadowColor = colorScheme.lineNumbers;
          ctx.shadowBlur = 10;
          ctx.fillStyle = colorScheme.lineNumbers;
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
            
            // Add subtle glow effect for non-default colors
            if (color !== colorScheme.text) {
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
          
          ctx.shadowColor = colorScheme.cursor;
          ctx.shadowBlur = 15;
          ctx.fillStyle = `${colorScheme.cursor}${Math.round(cursorOpacity * 255).toString(16).padStart(2, '0')}`;
          
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
          ctx.shadowColor = colorScheme.cursor;
          ctx.shadowBlur = 20;
          ctx.fillStyle = colorScheme.cursor;
          ctx.font = 'bold 28px "Fira Code", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⏸ PAUSED', width / 2, 60);
          ctx.shadowBlur = 0;
        }

        // Add subtle background pattern
        ctx.globalAlpha = 0.03;
        ctx.strokeStyle = colorScheme.lineNumbers;
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
    }, [file, displayedContent, isStreaming, currentIndex, isPaused, colorScheme]);

    // FIXED: Recording control with proper MP4 output using FFmpeg-like approach
    useEffect(() => {
      if (!canvasRef.current) return;

      if (isRecording && !mediaRecorderRef.current) {
        // Start recording
        recordingStartTimeRef.current = Date.now();
        const canvas = canvasRef.current;
        const stream = canvas.captureStream(30); // 30 FPS for smooth recording
        
        // Try different codecs for maximum compatibility
        const codecOptions = [
          'video/mp4;codecs=avc1.42E01E', // H.264 baseline profile
          'video/mp4;codecs=avc1.4D401E', // H.264 main profile
          'video/mp4;codecs=avc1.64001E', // H.264 high profile
          'video/webm;codecs=vp9',        // VP9 fallback
          'video/webm;codecs=vp8',        // VP8 fallback
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
          videoBitsPerSecond: 5000000, // 5 Mbps for high quality
          audioBitsPerSecond: 128000   // Audio bitrate (even though we don't have audio)
        });

        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const duration = Math.round((Date.now() - recordingStartTimeRef.current) / 1000);
          
          // Create blob with proper MIME type for MP4 compatibility
          const blob = new Blob(recordedChunksRef.current, {
            type: selectedMimeType.includes('mp4') ? 'video/mp4' : 'video/webm'
          });
          
          console.log('Recording complete:', {
            duration,
            size: blob.size,
            type: blob.type,
            codec: selectedMimeType
          });
          
          onRecordingData?.(blob, duration);
          recordedChunksRef.current = [];
        };

        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
        };

        // Start recording with smaller time slices for better compatibility
        mediaRecorder.start(250); // Collect data every 250ms
        mediaRecorderRef.current = mediaRecorder;
        
        console.log('Recording started with codec:', selectedMimeType);
      } else if (!isRecording && mediaRecorderRef.current) {
        // Stop recording
        console.log('Stopping recording...');
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
            <span 
              className="text-right w-12 pr-4 select-none flex-shrink-0 font-mono font-bold"
              style={{ color: colorScheme.lineNumbers, textShadow: `0 0 10px ${colorScheme.lineNumbers}` }}
            >
              {lineIndex + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-words font-mono">
              {tokens.map((token, tokenIndex) => {
                if (token.trim() === '') return token;
                
                const color = getSyntaxColor(token, language);
                const isKeyword = color === colorScheme.keywords;
                const isOperator = color === colorScheme.operators;
                const isString = color === colorScheme.strings;
                const isNumber = color === colorScheme.numbers;
                const isClass = color === colorScheme.classes;
                const isFunction = color === colorScheme.functions;
                const isComment = color === colorScheme.comments;
                
                return (
                  <span 
                    key={tokenIndex} 
                    style={{ 
                      color,
                      textShadow: color !== colorScheme.text ? `0 0 10px ${color}` : 'none',
                      fontWeight: (isKeyword || isOperator || isNumber || isClass || isFunction) ? 'bold' : 'normal',
                      fontStyle: isComment ? 'italic' : 'normal'
                    }}
                  >
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
        <div className="bg-black border-b-2 border-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-black" style={{ boxShadow: '0 0 10px #ef4444' }}></div>
              <div className="w-4 h-4 bg-yellow-500 rounded-full border-2 border-black" style={{ boxShadow: '0 0 10px #eab308' }}></div>
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-black" style={{ boxShadow: '0 0 10px #22c55e' }}></div>
            </div>
            <span className="text-lg font-bold text-white">
              {file ? file.name : 'Select a file to preview'}
            </span>
            {isPaused && (
              <span 
                className="text-sm px-3 py-1 rounded font-bold border-2 animate-pulse"
                style={{ 
                  backgroundColor: colorScheme.cursor, 
                  color: colorScheme.background,
                  borderColor: colorScheme.cursor,
                  boxShadow: `0 0 10px ${colorScheme.cursor}`
                }}
              >
                PAUSED
              </span>
            )}
          </div>
          {file && (
            <div className="flex items-center gap-4">
              <span 
                className="text-sm px-3 py-1 rounded border-2 capitalize font-bold"
                style={{ 
                  color: colorScheme.lineNumbers,
                  backgroundColor: colorScheme.background,
                  borderColor: colorScheme.lineNumbers,
                  textShadow: `0 0 10px ${colorScheme.lineNumbers}`
                }}
              >
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
          className="flex-1 relative border-2 border-white rounded-b-xl"
          style={{ 
            aspectRatio: '9/16',
            background: `linear-gradient(135deg, ${colorScheme.background}00, ${colorScheme.background})`
          }}
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
              msOverflowStyle: 'none',
              backgroundColor: colorScheme.background
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
                  <div>
                    {syntaxHighlight(displayedContent, file.language)}
                    {isStreaming && !isPaused && currentIndex < file.content.length && (
                      <span 
                        className="inline-block w-1 h-6 animate-pulse ml-1"
                        style={{ 
                          backgroundColor: colorScheme.cursor,
                          boxShadow: `0 0 10px ${colorScheme.cursor}`
                        }}
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center pt-12" style={{ color: colorScheme.text }}>
                    <div 
                      className="text-xl font-bold"
                      style={{ textShadow: `0 0 10px ${colorScheme.lineNumbers}` }}
                    >
                      Ready to stream...
                    </div>
                    <div className="text-sm mt-3 font-medium">Press play to start streaming</div>
                  </div>
                )
              ) : (
                <div className="text-center pt-12" style={{ color: colorScheme.text }}>
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