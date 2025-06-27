import React, { useState, useEffect, forwardRef, useRef } from 'react';
import { FileData } from '../App';
import { ColorScheme } from './ColorCustomizer';

interface CodeStreamerProps {
  file: FileData | null;
  isStreaming: boolean;
  speed: number;
  isRecording?: boolean;
  onRecordingData?: (blob: Blob, duration: number, mimeType: string) => void; // UPDATED: Added mimeType parameter
  colorScheme: ColorScheme;
}

const CodeStreamer = forwardRef<HTMLDivElement, CodeStreamerProps>(
  ({ file, isStreaming, speed, isRecording, onRecordingData, colorScheme }, ref) => {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const contentRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number>(0);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const scrollPositionRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const selectedMimeTypeRef = useRef<string>('video/mp4'); // NEW: Store the selected MIME type

    // Recording timer effect
    useEffect(() => {
      if (isRecording) {
        recordingStartTimeRef.current = Date.now();
        setRecordingTime(0);
        
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(Math.floor((Date.now() - recordingStartTimeRef.current) / 1000));
        }, 1000);
      } else {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);
      }

      return () => {
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };
    }, [isRecording]);

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

    // Handle streaming control - ULTRA FAST: Slightly reduced ludicrous speed
    useEffect(() => {
      if (!file) return;

      // Clear any existing interval first
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (isStreaming && !isPaused) {
        // ULTRA FAST: Slightly reduced extreme speed calculation
        // Speed 1-100 now maps to very fast intervals with slightly reduced ludicrous mode
        let streamingSpeed: number;
        let charactersPerInterval: number;
        
        if (speed >= 95) {
          // LUDICROUS SPEED: Slightly reduced - large chunks but not entire lines
          streamingSpeed = 2; // Slightly slower than before
          charactersPerInterval = Math.max(30, Math.floor(file.content.length / 150)); // Reduced from /100
        } else if (speed >= 90) {
          // EXTREME SPEED: Multiple lines
          streamingSpeed = 3; // Slightly slower
          charactersPerInterval = Math.max(25, Math.floor(file.content.length / 200));
        } else if (speed >= 80) {
          // VERY FAST: Multiple words
          streamingSpeed = 4; // Slightly slower
          charactersPerInterval = Math.max(15, Math.floor(speed / 5));
        } else if (speed >= 60) {
          // FAST: Multiple characters
          streamingSpeed = Math.max(2, 12 - Math.floor(speed / 10));
          charactersPerInterval = Math.max(5, Math.floor(speed / 10));
        } else if (speed >= 40) {
          // MEDIUM FAST: Few characters
          streamingSpeed = Math.max(5, 50 - speed);
          charactersPerInterval = Math.max(2, Math.floor(speed / 20));
        } else {
          // NORMAL: Single characters
          streamingSpeed = Math.max(10, 150 - (speed * 3));
          charactersPerInterval = 1;
        }
        
        console.log(`ULTRA FAST Streaming at speed ${speed}: ${streamingSpeed}ms interval, ${charactersPerInterval} chars per interval`);
        
        intervalRef.current = setInterval(() => {
          setCurrentIndex(prevIndex => {
            const nextIndex = prevIndex + charactersPerInterval;
            if (nextIndex < file.content.length) {
              const newContent = file.content.substring(0, nextIndex);
              setDisplayedContent(newContent);
              return nextIndex;
            } else {
              // Streaming complete - show full content
              setDisplayedContent(file.content);
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              return file.content.length;
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

    // Helper function to wrap text properly for canvas
    const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
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
      
      return lines;
    };

    // Format recording time
    const formatRecordingTime = (seconds: number): string => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Enhanced canvas rendering with proper text wrapping and vertical layout
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

        // Optimized settings for vertical video
        const fontSize = 16; // Smaller font for better fit
        const lineHeight = 24; // Tighter line spacing
        const padding = 20; // Reduced padding
        const lineNumberWidth = 60; // Space for line numbers
        const codeStartX = padding + lineNumberWidth;
        const maxCodeWidth = width - codeStartX - padding; // Available width for code
        
        ctx.font = `${fontSize}px "Fira Code", "Courier New", monospace`;
        ctx.textAlign = 'left';

        // Split content into lines and handle wrapping
        const originalLines = displayedContent.split('\n');
        const wrappedLines: { content: string; originalLineNum: number; isWrapped: boolean }[] = [];
        
        originalLines.forEach((line, originalIndex) => {
          if (line.length === 0) {
            wrappedLines.push({ content: '', originalLineNum: originalIndex + 1, isWrapped: false });
            return;
          }
          
          // Check if line needs wrapping
          const lineWidth = ctx.measureText(line).width;
          if (lineWidth <= maxCodeWidth) {
            wrappedLines.push({ content: line, originalLineNum: originalIndex + 1, isWrapped: false });
          } else {
            // Wrap the line
            const wrapped = wrapText(ctx, line, maxCodeWidth);
            wrapped.forEach((wrappedLine, wrapIndex) => {
              wrappedLines.push({ 
                content: wrappedLine, 
                originalLineNum: originalIndex + 1, 
                isWrapped: wrapIndex > 0 
              });
            });
          }
        });

        // Calculate visible area
        const maxVisibleLines = Math.floor((height - padding * 2) / lineHeight);
        const totalLines = wrappedLines.length;
        
        // Auto-scroll to show the latest content
        const startLineIndex = Math.max(0, totalLines - maxVisibleLines);
        const endLineIndex = Math.min(totalLines, startLineIndex + maxVisibleLines);
        
        let y = padding + lineHeight;
        
        // Draw visible lines
        for (let i = startLineIndex; i < endLineIndex; i++) {
          const lineData = wrappedLines[i];
          
          // Draw line number (only for non-wrapped lines)
          if (!lineData.isWrapped) {
            ctx.shadowColor = colorScheme.lineNumbers;
            ctx.shadowBlur = 8;
            ctx.fillStyle = colorScheme.lineNumbers;
            const lineNumText = `${lineData.originalLineNum}`.padStart(3, ' ');
            ctx.fillText(lineNumText, padding, y);
            ctx.shadowBlur = 0;
          }

          // Draw code content with syntax highlighting
          let currentX = codeStartX;
          
          // Simple tokenization for syntax highlighting
          const tokens = lineData.content.split(/(\s+|[(){}[\];,.]|["'].*?["']|\w+|[^\w\s])/).filter(token => token.length > 0);
          
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
              ctx.shadowBlur = 3;
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
          
          // Find cursor position at the end of the last visible line
          const lastVisibleLine = wrappedLines[endLineIndex - 1];
          if (lastVisibleLine) {
            const cursorX = codeStartX + ctx.measureText(lastVisibleLine.content).width + 4;
            const cursorY = padding + lineHeight + (endLineIndex - 1 - startLineIndex) * lineHeight;
            
            if (cursorY >= padding && cursorY <= height - padding) {
              ctx.fillRect(cursorX, cursorY - fontSize, 3, fontSize + 2);
            }
          }
          ctx.shadowBlur = 0;
        }

        // Draw pause indicator with glow
        if (isPaused) {
          ctx.shadowColor = colorScheme.cursor;
          ctx.shadowBlur = 20;
          ctx.fillStyle = colorScheme.cursor;
          ctx.font = 'bold 24px "Fira Code", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('⏸ PAUSED', width / 2, 50);
          ctx.shadowBlur = 0;
        }

        // Draw recording indicator and timer
        if (isRecording) {
          // Recording dot
          ctx.shadowColor = '#FF0000';
          ctx.shadowBlur = 15;
          ctx.fillStyle = '#FF0000';
          ctx.beginPath();
          ctx.arc(width - 60, 40, 8, 0, 2 * Math.PI);
          ctx.fill();
          ctx.shadowBlur = 0;
          
          // Recording timer
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 18px "Fira Code", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`REC ${formatRecordingTime(recordingTime)}`, width - 80, 45);
        }

        // Add subtle grid pattern for professional look
        ctx.globalAlpha = 0.02;
        ctx.strokeStyle = colorScheme.lineNumbers;
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, height);
          ctx.stroke();
        }
        for (let i = 0; i < height; i += 40) {
          ctx.beginPath();
          ctx.moveTo(0, i);
          ctx.lineTo(width, i);
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
    }, [file, displayedContent, isStreaming, currentIndex, isPaused, colorScheme, isRecording, recordingTime]);

    // UPDATED: Recording control with proper MIME type handling
    useEffect(() => {
      if (!canvasRef.current) return;

      if (isRecording && !mediaRecorderRef.current) {
        // Start recording
        recordingStartTimeRef.current = Date.now();
        const canvas = canvasRef.current;
        const stream = canvas.captureStream(30); // 30 FPS for smooth recording
        
        // Try different codecs for maximum compatibility
        const codecOptions = [
          'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 + AAC
          'video/mp4;codecs=avc1.42E01E', // H.264 baseline profile
          'video/mp4;codecs=avc1.4D401E', // H.264 main profile
          'video/mp4;codecs=avc1.64001E', // H.264 high profile
          'video/webm;codecs=vp9,opus',   // VP9 + Opus
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

        // Store the selected MIME type for later use
        selectedMimeTypeRef.current = selectedMimeType;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 8000000, // 8 Mbps for very high quality
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
            type: selectedMimeTypeRef.current.includes('mp4') ? 'video/mp4' : 'video/webm'
          });
          
          console.log('Recording complete:', {
            duration,
            size: blob.size,
            type: blob.type,
            codec: selectedMimeTypeRef.current
          });
          
          // UPDATED: Pass the MIME type to the callback
          onRecordingData?.(blob, duration, selectedMimeTypeRef.current);
          recordedChunksRef.current = [];
        };

        mediaRecorder.onerror = (event) => {
          console.error('MediaRecorder error:', event);
        };

        // Start recording with smaller time slices for better compatibility
        mediaRecorder.start(100); // Collect data every 100ms
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
            {isRecording && (
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 bg-red-500 rounded-full animate-pulse"
                  style={{ boxShadow: '0 0 10px #ef4444' }}
                />
                <span className="text-sm font-bold text-white">
                  REC {formatRecordingTime(recordingTime)}
                </span>
              </div>
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