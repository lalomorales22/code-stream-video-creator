import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Calendar, Clock, Code, X, Save, AlertCircle, FileAudio, Mic, Loader2, Users, Edit3, Captions, Sparkles, CheckCircle } from 'lucide-react';
import { dbManager, VideoRecord, FullClipVideoRecord, ShortsVideoRecord } from '../utils/database';
import AudioStudio from './AudioStudio';
import ShortsStudio from './ShortsStudio';

interface UnifiedGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'videos' | 'fullclip' | 'shorts';
  pendingVideo?: {
    blob: Blob;
    filename: string;
    originalFilename: string;
    language: string;
    duration: number;
    content: string;
  } | null;
  onPendingVideoSaved?: () => void;
}

type GalleryTab = 'videos' | 'fullclip' | 'shorts';

// Custom Success Modal Component
const SuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  type: 'video' | 'fullclip' | 'shorts';
}> = ({ isOpen, onClose, filename, type }) => {
  if (!isOpen) return null;

  const getSuccessContent = () => {
    switch (type) {
      case 'video':
        return {
          title: '🎬 Video Saved!',
          description: 'Your code streaming video has been successfully saved to the gallery.',
          icon: <Play className="w-12 h-12 text-black" />,
          action: 'Video Gallery'
        };
      case 'fullclip':
        return {
          title: '🎵 FullClip Created!',
          description: 'Your video with AI-generated audio and captions has been saved.',
          icon: <FileAudio className="w-12 h-12 text-black" />,
          action: 'FullClip Gallery'
        };
      case 'shorts':
        return {
          title: '🐧 Shorts Video Created!',
          description: 'Your video with penguin avatar, audio, and captions is ready.',
          icon: <Users className="w-12 h-12 text-black" />,
          action: 'Shorts Gallery'
        };
    }
  };

  const content = getSuccessContent();

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-black border-2 border-white rounded-xl p-8 max-w-md text-center relative">
        {/* Animated Success Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center animate-pulse">
            {content.icon}
          </div>
        </div>
        
        <h3 className="text-3xl font-bold text-white mb-4">{content.title}</h3>
        
        <div className="space-y-4 mb-6">
          <p className="text-lg text-gray-300">
            {content.description}
          </p>
          
          <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-1">Saved as:</p>
            <p className="text-white font-mono text-sm break-all">{filename}</p>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-bold">Successfully Saved</span>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold 
                   transition-colors border-2 border-white flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Continue
        </button>
        
        <p className="text-gray-400 text-sm mt-4">
          Your video is ready to download and share!
        </p>
      </div>
    </div>
  );
};

const UnifiedGallery: React.FC<UnifiedGalleryProps> = ({
  isOpen,
  onClose,
  initialTab = 'videos',
  pendingVideo,
  onPendingVideoSaved
}) => {
  const [activeTab, setActiveTab] = useState<GalleryTab>(initialTab);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [fullClipVideos, setFullClipVideos] = useState<FullClipVideoRecord[]>([]);
  const [shortsVideos, setShortsVideos] = useState<ShortsVideoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | FullClipVideoRecord | ShortsVideoRecord | null>(null);
  const [savingPending, setSavingPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{ videoCount: number; fullClipCount: number; shortsCount: number; dbSize: number } | null>(null);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState(false);
  const [isShortsStudioOpen, setIsShortsStudioOpen] = useState(false);
  const [videoForAudio, setVideoForAudio] = useState<VideoRecord | null>(null);
  const [videoForShorts, setVideoForShorts] = useState<FullClipVideoRecord | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<number | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  
  // File rename state
  const [customFilename, setCustomFilename] = useState('');
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    filename: string;
    type: 'video' | 'fullclip' | 'shorts';
  }>({ filename: '', type: 'video' });

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Initialize custom filename when pending video changes
  useEffect(() => {
    if (pendingVideo) {
      const baseName = pendingVideo.originalFilename.replace(/\.[^/.]+$/, '');
      setCustomFilename(baseName);
      setIsEditingFilename(false);
    }
  }, [pendingVideo]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [videosData, fullClipData, shortsData, stats] = await Promise.all([
        dbManager.getAllVideos(),
        dbManager.getAllFullClipVideos(),
        dbManager.getAllShortsVideos(),
        dbManager.getStats()
      ]);
      
      setVideos(videosData);
      setFullClipVideos(fullClipData);
      setShortsVideos(shortsData);
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to load gallery data:', error);
      setError('Failed to load gallery data');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePendingVideo = async () => {
    if (!pendingVideo) return;

    setSavingPending(true);
    setError(null);
    
    try {
      if (!pendingVideo.blob || pendingVideo.blob.size === 0) {
        throw new Error('Invalid video blob - size is 0');
      }

      // FIXED: Use the custom filename properly with proper validation
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanFilename = customFilename.trim() || pendingVideo.originalFilename.replace(/\.[^/.]+$/, '');
      const finalFilename = `${cleanFilename}-${timestamp}.mp4`;

      console.log('Saving video with custom filename:', {
        customFilename: customFilename.trim(),
        cleanFilename,
        finalFilename
      });

      const videoId = await dbManager.saveVideo(
        finalFilename, // This is the actual filename that gets stored
        pendingVideo.originalFilename, // This is the original file reference
        pendingVideo.language,
        pendingVideo.duration,
        pendingVideo.blob,
        pendingVideo.content
      );
      
      console.log('Video saved successfully with ID:', videoId, 'and filename:', finalFilename);
      
      await loadAllData();
      onPendingVideoSaved?.();
      
      // FIXED: Show custom success modal
      setSuccessModalData({
        filename: finalFilename,
        type: 'video'
      });
      setShowSuccessModal(true);
      
      setError(null);
    } catch (error) {
      console.error('Failed to save video:', error);
      setError(`Failed to save video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingPending(false);
    }
  };

  const handleDownloadVideo = async (video: VideoRecord | FullClipVideoRecord | ShortsVideoRecord) => {
    try {
      const blob = new Blob([video.video_blob], { type: 'video/mp4' });
      
      if (blob.size === 0) {
        throw new Error('Video file is empty or corrupted');
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      let filename = video.filename;
      if (!filename.toLowerCase().endsWith('.mp4')) {
        filename = filename.replace(/\.[^/.]+$/, '') + '.mp4';
      }
      
      a.download = filename;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Failed to download video:', error);
      setError('Failed to download video');
    }
  };

  const handleDeleteVideo = async (id: number, type: GalleryTab) => {
    setDeletingVideoId(id);

    try {
      let success = false;
      
      switch (type) {
        case 'videos':
          success = await dbManager.deleteVideo(id);
          break;
        case 'fullclip':
          success = await dbManager.deleteFullClipVideo(id);
          break;
        case 'shorts':
          success = await dbManager.deleteShortsVideo(id);
          break;
      }
      
      if (success) {
        await loadAllData();
        if (selectedVideo?.id === id) {
          setSelectedVideo(null);
        }
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      setError('Failed to delete video');
    } finally {
      setDeletingVideoId(null);
    }
  };

  const handlePlayVideo = (video: VideoRecord | FullClipVideoRecord | ShortsVideoRecord) => {
    setSelectedVideo(video);
  };

  const handleAddAudio = (video: VideoRecord) => {
    setVideoForAudio(video);
    setIsAudioStudioOpen(true);
  };

  const handleSendToShorts = (video: FullClipVideoRecord) => {
    setVideoForShorts(video);
    setIsShortsStudioOpen(true);
  };

  const handleAudioStudioClose = () => {
    setIsAudioStudioOpen(false);
    setVideoForAudio(null);
  };

  const handleShortsStudioClose = () => {
    setIsShortsStudioOpen(false);
    setVideoForShorts(null);
  };

  const handleAudioVideoSaved = async () => {
    await loadAllData();
    setActiveTab('fullclip'); // Switch to FullClip tab
  };

  const handleShortsVideoSaved = async () => {
    await loadAllData();
    setActiveTab('shorts'); // Switch to Shorts tab
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderVideoList = () => {
    let currentVideos: (VideoRecord | FullClipVideoRecord | ShortsVideoRecord)[] = [];
    let emptyMessage = '';
    let emptyIcon = <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />;

    switch (activeTab) {
      case 'videos':
        currentVideos = videos;
        emptyMessage = 'No videos saved yet';
        emptyIcon = <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />;
        break;
      case 'fullclip':
        currentVideos = fullClipVideos;
        emptyMessage = 'No FullClip videos yet';
        emptyIcon = <FileAudio className="w-16 h-16 mx-auto mb-4 opacity-50" />;
        break;
      case 'shorts':
        currentVideos = shortsVideos;
        emptyMessage = 'No Shorts videos yet';
        emptyIcon = <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />;
        break;
    }

    if (loading) {
      return <div className="text-center text-gray-400 py-12 text-xl font-medium">Loading videos...</div>;
    }

    if (currentVideos.length === 0) {
      return (
        <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-600 rounded-lg">
          {emptyIcon}
          <p className="text-xl font-bold">{emptyMessage}</p>
          <p className="text-lg mt-2">
            {activeTab === 'videos' && 'Record some code streams to get started'}
            {activeTab === 'fullclip' && 'Create videos with audio in the Audio Studio'}
            {activeTab === 'shorts' && 'Create videos with penguin avatars in the Shorts Studio'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {currentVideos.map(video => (
          <div
            key={video.id}
            className={`bg-black rounded-lg p-6 border-2 transition-all cursor-pointer relative
                      ${selectedVideo?.id === video.id 
                        ? 'border-white bg-white text-black' 
                        : 'border-gray-600 hover:border-white text-white'}`}
            onClick={() => handlePlayVideo(video)}
          >
            {/* Deleting overlay */}
            {deletingVideoId === video.id && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-3 text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-bold">Deleting...</span>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <h4 className="font-bold text-lg truncate">{video.original_filename}</h4>
              <div className="flex gap-2 ml-4">
                {/* Tab-specific action buttons */}
                {activeTab === 'videos' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddAudio(video as VideoRecord);
                    }}
                    disabled={deletingVideoId === video.id}
                    className={`p-2 rounded transition-colors border-2 ${
                      selectedVideo?.id === video.id 
                        ? 'border-black text-black hover:bg-black hover:text-white' 
                        : 'border-white text-white hover:bg-white hover:text-black'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Add Audio & Captions"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
                
                {activeTab === 'fullclip' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendToShorts(video as FullClipVideoRecord);
                    }}
                    disabled={deletingVideoId === video.id}
                    className={`p-2 rounded transition-colors border-2 ${
                      selectedVideo?.id === video.id 
                        ? 'border-black text-black hover:bg-black hover:text-white' 
                        : 'border-white text-white hover:bg-white hover:text-black'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Send to Shorts Gallery"
                  >
                    <Users className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadVideo(video);
                  }}
                  disabled={deletingVideoId === video.id}
                  className={`p-2 rounded transition-colors border-2 ${
                    selectedVideo?.id === video.id 
                      ? 'border-black text-black hover:bg-black hover:text-white' 
                      : 'border-white text-white hover:bg-white hover:text-black'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Download MP4"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteVideo(video.id, activeTab);
                  }}
                  disabled={deletingVideoId === video.id}
                  className={`p-2 rounded transition-colors border-2 ${
                    selectedVideo?.id === video.id 
                      ? 'border-black text-black hover:bg-black hover:text-white' 
                      : 'border-white text-white hover:bg-white hover:text-black'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm font-medium mb-2">
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="capitalize">{video.file_language}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(video.duration)}</span>
              </div>
              
              {/* Tab-specific indicators */}
              {activeTab === 'fullclip' && (
                <>
                  <div className="flex items-center gap-2">
                    <FileAudio className="w-4 h-4" />
                    <span>Audio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Captions className="w-4 h-4" />
                    <span>{JSON.parse((video as FullClipVideoRecord).captions || '[]').length} captions</span>
                  </div>
                </>
              )}
              
              {activeTab === 'shorts' && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{(video as ShortsVideoRecord).avatar_type}</span>
                </div>
              )}
            </div>
            
            <div className="text-sm mb-2">
              {formatFileSize(video.video_blob.length)}
            </div>
            
            <div className="flex items-center gap-2 text-xs opacity-75">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(video.created_at)}</span>
            </div>

            {/* Tab-specific preview content */}
            {activeTab === 'fullclip' && (video as FullClipVideoRecord).script && (
              <div className="mt-3 p-3 bg-gray-800 rounded text-xs">
                <p className="truncate">{(video as FullClipVideoRecord).script.substring(0, 100)}...</p>
              </div>
            )}
            
            {activeTab === 'shorts' && (
              <div className="mt-3 p-3 bg-gray-800 rounded text-xs">
                <p className="text-gray-300">
                  Avatar: {(video as ShortsVideoRecord).avatar_type} • Position: {(video as ShortsVideoRecord).avatar_position}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderVideoPlayer = () => {
    if (!selectedVideo) {
      return (
        <div className="text-center text-gray-400 flex flex-col items-center justify-center min-h-full">
          {activeTab === 'videos' && <Play className="w-20 h-20 mx-auto mb-6 opacity-50" />}
          {activeTab === 'fullclip' && <FileAudio className="w-20 h-20 mx-auto mb-6 opacity-50" />}
          {activeTab === 'shorts' && <Users className="w-20 h-20 mx-auto mb-6 opacity-50" />}
          <p className="text-2xl font-bold">Select a video to preview</p>
          <p className="text-lg mt-2">Click on any video from the list to play it here</p>
        </div>
      );
    }

    return (
      <div className="w-full max-w-md">
        <div className="relative">
          <video
            key={selectedVideo.id}
            controls
            className="w-full bg-black rounded-lg border-2 border-white"
            style={{ aspectRatio: '9/16' }}
            src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
            onLoadStart={() => console.log('Video loading started')}
            onCanPlay={() => console.log('Video can play')}
            onError={(e) => {
              console.error('Video error:', e);
              setError('Failed to load video for playback');
            }}
          />
          
          {/* Caption overlay info for FullClip videos */}
          {activeTab === 'fullclip' && showCaptions && (selectedVideo as FullClipVideoRecord).captions && (
            <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
              <div className="bg-black/80 text-white p-2 rounded text-sm text-center">
                <p>Captions are embedded in the video</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-6 text-center">
          <h4 className="font-bold text-xl text-white mb-3">{selectedVideo.original_filename}</h4>
          <div className="flex justify-center gap-6 text-lg text-gray-400 font-medium mb-4">
            <span className="capitalize">{selectedVideo.file_language}</span>
            <span>{formatDuration(selectedVideo.duration)}</span>
            <span>{formatFileSize(selectedVideo.video_blob.length)}</span>
          </div>
          
          {/* Tab-specific content */}
          {activeTab === 'fullclip' && (selectedVideo as FullClipVideoRecord).script && (
            <div className="bg-black border-2 border-white rounded-lg p-4 mb-4 text-left max-h-64 overflow-y-auto">
              <h5 className="text-white font-bold mb-2 sticky top-0 bg-black">Audio Script</h5>
              <p className="text-gray-300 text-sm leading-relaxed">{(selectedVideo as FullClipVideoRecord).script}</p>
            </div>
          )}

          {activeTab === 'shorts' && (
            <div className="bg-black border-2 border-white rounded-lg p-4 mb-4 text-left">
              <h5 className="text-white font-bold mb-2">Avatar Details</h5>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="capitalize">{(selectedVideo as ShortsVideoRecord).avatar_type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Position:</span>
                  <span className="capitalize">{(selectedVideo as ShortsVideoRecord).avatar_position}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{(selectedVideo as ShortsVideoRecord).avatar_size}%</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-4 justify-center">
            {activeTab === 'videos' && (
              <button
                onClick={() => handleAddAudio(selectedVideo as VideoRecord)}
                className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold 
                         transition-colors border-2 border-white flex items-center gap-2"
              >
                <Mic className="w-5 h-5" />
                Add Audio
              </button>
            )}
            
            {activeTab === 'fullclip' && (
              <button
                onClick={() => handleSendToShorts(selectedVideo as FullClipVideoRecord)}
                className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold 
                         transition-colors border-2 border-white flex items-center gap-2"
              >
                <Users className="w-5 h-5" />
                Send to Shorts Gallery
              </button>
            )}
            
            <button
              onClick={() => handleDownloadVideo(selectedVideo)}
              className="bg-black hover:bg-white hover:text-black text-white px-6 py-3 rounded-lg font-bold 
                       transition-colors border-2 border-white flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download MP4
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col">
          {/* Header with Tabs */}
          <div className="flex items-center justify-between p-6 border-b-2 border-white">
            <div className="flex items-center gap-6">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 border-2 border-white rounded-lg">
                  {activeTab === 'videos' && <Play className="w-6 h-6 text-white" />}
                  {activeTab === 'fullclip' && <FileAudio className="w-6 h-6 text-white" />}
                  {activeTab === 'shorts' && <Users className="w-6 h-6 text-white" />}
                </div>
                Gallery
              </h2>
              
              {/* Tab Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors border-2 ${
                    activeTab === 'videos'
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-white border-gray-600 hover:border-white'
                  }`}
                >
                  <Play className="w-4 h-4" />
                  Videos ({videos.length})
                </button>
                <button
                  onClick={() => setActiveTab('fullclip')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors border-2 ${
                    activeTab === 'fullclip'
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-white border-gray-600 hover:border-white'
                  }`}
                >
                  <FileAudio className="w-4 h-4" />
                  FullClip ({fullClipVideos.length})
                </button>
                <button
                  onClick={() => setActiveTab('shorts')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors border-2 ${
                    activeTab === 'shorts'
                      ? 'bg-white text-black border-white'
                      : 'bg-black text-white border-gray-600 hover:border-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Shorts ({shortsVideos.length})
                </button>
              </div>
              
              {dbStats && (
                <div className="text-lg text-gray-400 font-medium">
                  {formatFileSize(dbStats.dbSize)} total
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {activeTab === 'fullclip' && selectedVideo && (
                <button
                  onClick={() => setShowCaptions(!showCaptions)}
                  className={`flex items-center gap-2 px-3 py-2 rounded font-bold transition-colors border-2 ${
                    showCaptions 
                      ? 'bg-white text-black border-white' 
                      : 'bg-black text-white border-white hover:bg-white hover:text-black'
                  }`}
                >
                  <Captions className="w-4 h-4" />
                  {showCaptions ? 'Hide Captions' : 'Show Captions'}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="p-3 hover:bg-white hover:text-black rounded-lg transition-colors border-2 border-white text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
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

          {/* Deleting Overlay */}
          {deletingVideoId && (
            <div className="mx-6 mt-4 bg-black border-2 border-white rounded-lg p-4 flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-white animate-spin flex-shrink-0" />
              <span className="text-white font-medium">Deleting video...</span>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden">
            {/* Video List */}
            <div className="w-1/2 border-r-2 border-white flex flex-col">
              <div className="p-6 border-b-2 border-white">
                <h3 className="text-2xl font-bold text-white mb-6">
                  {activeTab === 'videos' && 'Basic Videos'}
                  {activeTab === 'fullclip' && 'Complete Videos'}
                  {activeTab === 'shorts' && 'Avatar Videos'}
                </h3>
                
                {/* Pending Video Save - Only show on videos tab */}
                {activeTab === 'videos' && pendingVideo && (
                  <div className="bg-black border-2 border-white rounded-lg p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white font-bold text-lg">New Recording Ready</span>
                      <button
                        onClick={handleSavePendingVideo}
                        disabled={savingPending || !customFilename.trim()}
                        className="flex items-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 
                                 text-black px-4 py-2 rounded font-bold transition-colors border-2 border-white"
                      >
                        <Save className="w-5 h-5" />
                        {savingPending ? 'Saving...' : 'Save to Gallery'}
                      </button>
                    </div>
                    
                    {/* File Rename Section */}
                    <div className="mb-4">
                      <label className="block text-white font-bold mb-2">Filename</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customFilename}
                          onChange={(e) => setCustomFilename(e.target.value)}
                          placeholder="Enter filename (without extension)"
                          className="flex-1 p-3 bg-black border-2 border-white text-white rounded font-mono"
                          disabled={savingPending}
                        />
                        <button
                          onClick={() => setIsEditingFilename(!isEditingFilename)}
                          className="p-3 bg-black border-2 border-white text-white hover:bg-white hover:text-black rounded transition-colors"
                          title="Edit filename"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-gray-400 text-sm mt-1">
                        Final filename: {customFilename || 'untitled'}-[timestamp].mp4
                      </p>
                    </div>
                    
                    <p className="text-lg text-white font-medium">{pendingVideo.originalFilename}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-400 font-medium mt-2">
                      <span>{formatDuration(pendingVideo.duration)}</span>
                      <span>{formatFileSize(pendingVideo.blob.size)}</span>
                      <span className="capitalize">{pendingVideo.language}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {renderVideoList()}
              </div>
            </div>

            {/* Video Player */}
            <div className="w-1/2 flex flex-col">
              <div className="p-6 border-b-2 border-white">
                <h3 className="text-2xl font-bold text-white">Preview</h3>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-start justify-center p-6 min-h-full">
                  {renderVideoPlayer()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Studio Modal */}
      <AudioStudio
        isOpen={isAudioStudioOpen}
        onClose={handleAudioStudioClose}
        selectedVideo={videoForAudio}
        onAudioVideoSaved={handleAudioVideoSaved}
      />

      {/* Shorts Studio Modal */}
      <ShortsStudio
        isOpen={isShortsStudioOpen}
        onClose={handleShortsStudioClose}
        selectedVideo={videoForShorts}
        onShortsVideoSaved={handleShortsVideoSaved}
      />

      {/* Custom Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        filename={successModalData.filename}
        type={successModalData.type}
      />
    </>
  );
};

export default UnifiedGallery;