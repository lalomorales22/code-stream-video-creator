import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Calendar, Clock, Code, X, Save, AlertCircle, FileAudio, Mic, Loader2, Users, Edit3, Captions, Sparkles, CheckCircle, Share2, ExternalLink } from 'lucide-react';
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

// Social Media Icons (using Lucide icons styled to match platforms)
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

      // FIXED: Properly handle custom filename for display
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanCustomName = customFilename.trim();
      const displayName = cleanCustomName || pendingVideo.originalFilename.replace(/\.[^/.]+$/, '');
      const technicalFilename = `${displayName}-${timestamp}.mp4`;

      console.log('Saving video with proper naming:', {
        customFilename: cleanCustomName,
        displayName,
        technicalFilename,
        originalFilename: pendingVideo.originalFilename
      });

      const videoId = await dbManager.saveVideo(
        technicalFilename, // Technical filename for download
        pendingVideo.originalFilename, // Original file reference
        pendingVideo.language,
        pendingVideo.duration,
        pendingVideo.blob,
        pendingVideo.content,
        displayName // FIXED: This is what shows in the gallery
      );
      
      console.log('Video saved successfully with ID:', videoId, 'display name:', displayName);
      
      await loadAllData();
      onPendingVideoSaved?.();
      
      // Show custom success modal with the display name
      setSuccessModalData({
        filename: displayName, // Show the user-friendly name in success modal
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
      
      // Use the technical filename for download (which includes timestamp)
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

  // NEW: Social media sharing functions
  const handleShareToX = async (video: VideoRecord | FullClipVideoRecord | ShortsVideoRecord) => {
    try {
      const displayName = getDisplayName(video);
      const text = `Check out my code streaming video: ${displayName} 🎬\n\nCreated with CodeStream - turning code into engaging vertical videos!\n\n#CodeStream #Programming #${video.file_language}`;
      const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'width=600,height=400');
    } catch (error) {
      console.error('Failed to share to X:', error);
      alert('Failed to open X sharing dialog');
    }
  };

  const handleShareToTikTok = async (video: VideoRecord | FullClipVideoRecord | ShortsVideoRecord) => {
    try {
      // TikTok doesn't have a direct web sharing API, so we'll copy sharing text to clipboard
      const displayName = getDisplayName(video);
      const text = `🎬 New code video: ${displayName}\n\nMade with CodeStream - AI-powered code videos with narration!\n\n#CodeTok #Programming #${video.file_language} #CodeStream #TechTok`;
      
      await navigator.clipboard.writeText(text);
      alert('📱 TikTok sharing text copied to clipboard!\n\nPaste this when uploading your video to TikTok. Don\'t forget to download the MP4 file first!');
    } catch (error) {
      console.error('Failed to copy TikTok text:', error);
      alert('💡 For TikTok: Download the MP4 file and upload it manually to TikTok with a description about your code!');
    }
  };

  const handleShareToInstagram = async (video: VideoRecord | FullClipVideoRecord | ShortsVideoRecord) => {
    try {
      // Instagram doesn't have direct web sharing, so we'll provide instructions
      const displayName = getDisplayName(video);
      const text = `🎥 ${displayName}\n\nCreated with CodeStream - AI narration meets code streaming!\n\n#CodeStream #Programming #${video.file_language} #TechReels #CodingLife`;
      
      await navigator.clipboard.writeText(text);
      alert('📸 Instagram caption copied to clipboard!\n\nTo share on Instagram:\n1. Download the MP4 video\n2. Upload to Instagram Reels\n3. Paste the copied caption\n4. Add relevant hashtags!');
    } catch (error) {
      console.error('Failed to copy Instagram text:', error);
      alert('💡 For Instagram: Download the MP4 file and upload it to Instagram Reels with a description about your code!');
    }
  };

  const handleShareToYouTube = async (video: VideoRecord | FullClipVideoRecord | ShortsVideoRecord) => {
    try {
      const displayName = getDisplayName(video);
      const description = `${displayName}

Created with CodeStream - the ultimate tool for creating engaging vertical code videos with AI-generated narration and professional captions!

🎯 Features:
• AI-powered script generation
• Professional voice narration  
• Synchronized captions
• Beautiful syntax highlighting
• Perfect for social media

#CodeStream #Programming #${video.file_language} #YouTubeShorts #CodingTutorial #TechContent

---
Made with CodeStream: https://codestream.app`;

      await navigator.clipboard.writeText(description);
      
      // Open YouTube upload page
      window.open('https://studio.youtube.com/channel/UC/videos/upload?d=ud', '_blank');
      
      alert('🎬 YouTube description copied to clipboard!\n\nYouTube Studio is now opening. Upload your MP4 file and paste the description!');
    } catch (error) {
      console.error('Failed to open YouTube:', error);
      alert('💡 For YouTube: Download the MP4 file and upload it to YouTube Shorts with a description about your code!');
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

  // FIXED: Helper function to get display name for videos
  const getDisplayName = (video: VideoRecord | FullClipVideoRecord | ShortsVideoRecord): string => {
    // Use display_name if available, otherwise fall back to original_filename
    return video.display_name || video.original_filename;
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
              {/* FIXED: Show display name instead of original filename */}
              <h4 className="font-bold text-lg truncate">{getDisplayName(video)}</h4>
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

                {/* NEW: Social Media Sharing Buttons for Shorts */}
                {activeTab === 'shorts' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareToX(video);
                      }}
                      disabled={deletingVideoId === video.id}
                      className={`p-2 rounded transition-colors border-2 ${
                        selectedVideo?.id === video.id 
                          ? 'border-black text-black hover:bg-black hover:text-white' 
                          : 'border-white text-white hover:bg-white hover:text-black'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Share to X (Twitter)"
                    >
                      <XIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareToTikTok(video);
                      }}
                      disabled={deletingVideoId === video.id}
                      className={`p-2 rounded transition-colors border-2 ${
                        selectedVideo?.id === video.id 
                          ? 'border-black text-black hover:bg-black hover:text-white' 
                          : 'border-white text-white hover:bg-white hover:text-black'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Share to TikTok"
                    >
                      <TikTokIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareToInstagram(video);
                      }}
                      disabled={deletingVideoId === video.id}
                      className={`p-2 rounded transition-colors border-2 ${
                        selectedVideo?.id === video.id 
                          ? 'border-black text-black hover:bg-black hover:text-white' 
                          : 'border-white text-white hover:bg-white hover:text-black'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Share to Instagram"
                    >
                      <InstagramIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareToYouTube(video);
                      }}
                      disabled={deletingVideoId === video.id}
                      className={`p-2 rounded transition-colors border-2 ${
                        selectedVideo?.id === video.id 
                          ? 'border-black text-black hover:bg-black hover:text-white' 
                          : 'border-white text-white hover:bg-white hover:text-black'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Share to YouTube"
                    >
                      <YouTubeIcon className="w-5 h-5" />
                    </button>
                  </>
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
                <>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{(video as ShortsVideoRecord).avatar_type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    <span>Social Ready</span>
                  </div>
                </>
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
                <p className="text-green-400 mt-1">
                  ✨ Ready for X, TikTok, Instagram & YouTube
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
          {/* FIXED: Show display name in video player too */}
          <h4 className="font-bold text-xl text-white mb-3">{getDisplayName(selectedVideo)}</h4>
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
          
          <div className="flex gap-4 justify-center mb-4">
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

          {/* NEW: Social Media Sharing Section for Shorts */}
          {activeTab === 'shorts' && (
            <div className="bg-black border-2 border-white rounded-lg p-4">
              <h5 className="text-white font-bold mb-3 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Share to Social Media
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleShareToX(selectedVideo)}
                  className="flex items-center justify-center gap-2 bg-black hover:bg-white hover:text-black 
                           text-white px-4 py-3 rounded-lg font-bold transition-colors border-2 border-white"
                >
                  <XIcon className="w-5 h-5" />
                  X (Twitter)
                </button>
                <button
                  onClick={() => handleShareToTikTok(selectedVideo)}
                  className="flex items-center justify-center gap-2 bg-black hover:bg-white hover:text-black 
                           text-white px-4 py-3 rounded-lg font-bold transition-colors border-2 border-white"
                >
                  <TikTokIcon className="w-5 h-5" />
                  TikTok
                </button>
                <button
                  onClick={() => handleShareToInstagram(selectedVideo)}
                  className="flex items-center justify-center gap-2 bg-black hover:bg-white hover:text-black 
                           text-white px-4 py-3 rounded-lg font-bold transition-colors border-2 border-white"
                >
                  <InstagramIcon className="w-5 h-5" />
                  Instagram
                </button>
                <button
                  onClick={() => handleShareToYouTube(selectedVideo)}
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
          )}
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
                  {activeTab === 'shorts' && 'Social Media Ready'}
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
                      <label className="block text-white font-bold mb-2">Video Name</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customFilename}
                          onChange={(e) => setCustomFilename(e.target.value)}
                          placeholder="Enter a name for your video"
                          className="flex-1 p-3 bg-black border-2 border-white text-white rounded"
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
                        This name will appear in your gallery
                      </p>
                    </div>
                    
                    <p className="text-lg text-white font-medium">Original: {pendingVideo.originalFilename}</p>
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