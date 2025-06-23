import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Calendar, Clock, Code, X, Save, AlertCircle, FileAudio, Mic, Loader2, Edit3, Captions, CheckCircle, Share2, ExternalLink, Copy } from 'lucide-react';
import { dbManager, VideoRecord, FullClipVideoRecord } from '../utils/database';
import FullClipStudio from './FullClipStudio';

interface UnifiedGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'videos' | 'fullclip';
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

type GalleryTab = 'videos' | 'fullclip';

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

// Success Modal Component
const SuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  type: 'video' | 'fullclip';
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
          description: 'Your complete social media video has been saved with all features.',
          icon: <FileAudio className="w-12 h-12 text-black" />,
          action: 'FullClip Gallery'
        };
    }
  };

  const content = getSuccessContent();

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <div className="bg-black border-2 border-white rounded-xl p-8 max-w-md text-center relative">
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
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | FullClipVideoRecord | null>(null);
  const [savingPending, setSavingPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{ videoCount: number; fullClipCount: number; shortsCount: number; dbSize: number } | null>(null);
  const [isFullClipStudioOpen, setIsFullClipStudioOpen] = useState(false);
  const [videoForFullClip, setVideoForFullClip] = useState<VideoRecord | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<number | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);
  
  // File rename state
  const [customFilename, setCustomFilename] = useState('');
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState<{
    filename: string;
    type: 'video' | 'fullclip';
  }>({ filename: '', type: 'video' });

  // NEW: Social media content state
  const [socialMediaContent, setSocialMediaContent] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isGeneratingSocialContent, setIsGeneratingSocialContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (pendingVideo) {
      const baseName = pendingVideo.originalFilename.replace(/\.[^/.]+$/, '');
      setCustomFilename(baseName);
      setIsEditingFilename(false);
    }
  }, [pendingVideo]);

  // NEW: Generate social media content when a FullClip video is selected
  useEffect(() => {
    if (selectedVideo && activeTab === 'fullclip') {
      generateSocialMediaContent(selectedVideo as FullClipVideoRecord);
    } else {
      setSocialMediaContent(null);
    }
  }, [selectedVideo, activeTab]);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [videosData, fullClipData, stats] = await Promise.all([
        dbManager.getAllVideos(),
        dbManager.getAllFullClipVideos(),
        dbManager.getStats()
      ]);
      
      setVideos(videosData);
      setFullClipVideos(fullClipData);
      setDbStats(stats);
    } catch (error) {
      console.error('Failed to load gallery data:', error);
      setError('Failed to load gallery data');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Generate social media content for FullClip videos
  const generateSocialMediaContent = async (video: FullClipVideoRecord) => {
    const xaiApiKey = localStorage.getItem('xai_api_key');
    if (!xaiApiKey) {
      console.log('No XAI API key found, skipping social media content generation');
      return;
    }

    setIsGeneratingSocialContent(true);

    try {
      const prompt = `Create social media content for a code video. Generate a catchy title and description for this ${video.file_language} code video.

Video details:
- Language: ${video.file_language}
- Original filename: ${video.original_filename}
- Script: ${video.script}

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
            // Try to parse as JSON
            const parsed = JSON.parse(content);
            setSocialMediaContent({
              title: parsed.title || 'Code Tutorial',
              description: parsed.description || 'Check out this code tutorial!'
            });
          } catch (parseError) {
            // Fallback if not valid JSON
            console.warn('Failed to parse social media content as JSON, using fallback');
            setSocialMediaContent({
              title: `${video.file_language} Code Tutorial`,
              description: `Learn ${video.file_language} programming with this quick tutorial. Perfect for developers looking to improve their coding skills.`
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to generate social media content:', error);
      // Set fallback content
      setSocialMediaContent({
        title: `${video.file_language} Code Tutorial`,
        description: `Learn ${video.file_language} programming with this quick tutorial. Perfect for developers looking to improve their coding skills.`
      });
    } finally {
      setIsGeneratingSocialContent(false);
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

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const cleanCustomName = customFilename.trim();
      const displayName = cleanCustomName || pendingVideo.originalFilename.replace(/\.[^/.]+$/, '');
      const technicalFilename = `${displayName}-${timestamp}.mp4`;

      const videoId = await dbManager.saveVideo(
        technicalFilename,
        pendingVideo.originalFilename,
        pendingVideo.language,
        pendingVideo.duration,
        pendingVideo.blob,
        pendingVideo.content,
        displayName
      );
      
      await loadAllData();
      onPendingVideoSaved?.();
      
      setSuccessModalData({
        filename: displayName,
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

  const handleDownloadVideo = async (video: VideoRecord | FullClipVideoRecord) => {
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

  // NEW: Copy social media content to clipboard
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
  const handleShareToX = async (video: VideoRecord | FullClipVideoRecord) => {
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

  const handleShareToTikTok = async (video: VideoRecord | FullClipVideoRecord) => {
    try {
      const displayName = getDisplayName(video);
      const text = `🎬 New code video: ${displayName}\n\nMade with CodeStream - AI-powered code videos with narration!\n\n#CodeTok #Programming #${video.file_language} #CodeStream #TechTok`;
      
      await navigator.clipboard.writeText(text);
      alert('📱 TikTok sharing text copied to clipboard!\n\nPaste this when uploading your video to TikTok. Don\'t forget to download the MP4 file first!');
    } catch (error) {
      console.error('Failed to copy TikTok text:', error);
      alert('💡 For TikTok: Download the MP4 file and upload it manually to TikTok with a description about your code!');
    }
  };

  const handleShareToInstagram = async (video: VideoRecord | FullClipVideoRecord) => {
    try {
      const displayName = getDisplayName(video);
      const text = `🎥 ${displayName}\n\nCreated with CodeStream - AI narration meets code streaming!\n\n#CodeStream #Programming #${video.file_language} #TechReels #CodingLife`;
      
      await navigator.clipboard.writeText(text);
      alert('📸 Instagram caption copied to clipboard!\n\nTo share on Instagram:\n1. Download the MP4 video\n2. Upload to Instagram Reels\n3. Paste the copied caption\n4. Add relevant hashtags!');
    } catch (error) {
      console.error('Failed to copy Instagram text:', error);
      alert('💡 For Instagram: Download the MP4 file and upload it to Instagram Reels with a description about your code!');
    }
  };

  const handleShareToYouTube = async (video: VideoRecord | FullClipVideoRecord) => {
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

  const handlePlayVideo = (video: VideoRecord | FullClipVideoRecord) => {
    setSelectedVideo(video);
  };

  const handleCreateFullClip = (video: VideoRecord) => {
    setVideoForFullClip(video);
    setIsFullClipStudioOpen(true);
  };

  const handleFullClipStudioClose = () => {
    setIsFullClipStudioOpen(false);
    setVideoForFullClip(null);
  };

  const handleFullClipVideoSaved = async () => {
    await loadAllData();
    setActiveTab('fullclip');
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

  const getDisplayName = (video: VideoRecord | FullClipVideoRecord): string => {
    return video.display_name || video.original_filename;
  };

  const renderVideoList = () => {
    let currentVideos: (VideoRecord | FullClipVideoRecord)[] = [];
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
            {activeTab === 'fullclip' && 'Create complete videos in the FullClip Studio'}
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
            {deletingVideoId === video.id && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="flex items-center gap-3 text-white">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="font-bold">Deleting...</span>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between mb-3">
              <h4 className="font-bold text-lg truncate">{getDisplayName(video)}</h4>
              <div className="flex gap-2 ml-4">
                {/* Tab-specific action buttons */}
                {activeTab === 'videos' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateFullClip(video as VideoRecord);
                    }}
                    disabled={deletingVideoId === video.id}
                    className={`p-2 rounded transition-colors border-2 ${
                      selectedVideo?.id === video.id 
                        ? 'border-black text-black hover:bg-black hover:text-white' 
                        : 'border-white text-white hover:bg-white hover:text-black'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Create FullClip"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
                
                {/* Social Media Sharing Buttons for FullClip */}
                {activeTab === 'fullclip' && (
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

            {activeTab === 'fullclip' && (video as FullClipVideoRecord).script && (
              <div className="mt-3 p-3 bg-gray-800 rounded text-xs">
                <p className="truncate">{(video as FullClipVideoRecord).script.substring(0, 100)}...</p>
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
        </div>
        
        <div className="mt-6 text-center">
          <h4 className="font-bold text-xl text-white mb-3">{getDisplayName(selectedVideo)}</h4>
          <div className="flex justify-center gap-6 text-lg text-gray-400 font-medium mb-4">
            <span className="capitalize">{selectedVideo.file_language}</span>
            <span>{formatDuration(selectedVideo.duration)}</span>
            <span>{formatFileSize(selectedVideo.video_blob.length)}</span>
          </div>
          
          {activeTab === 'fullclip' && (selectedVideo as FullClipVideoRecord).script && (
            <div className="bg-black border-2 border-white rounded-lg p-4 mb-4 text-left max-h-64 overflow-y-auto">
              <h5 className="text-white font-bold mb-2 sticky top-0 bg-black">Audio Script</h5>
              <p className="text-gray-300 text-sm leading-relaxed">{(selectedVideo as FullClipVideoRecord).script}</p>
            </div>
          )}

          {/* NEW: Social Media Content Section - Only for FullClip videos */}
          {activeTab === 'fullclip' && (
            <div className="bg-black border-2 border-white rounded-lg p-4 mb-4">
              <h5 className="text-white font-bold mb-3 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Social Media Content
                {isGeneratingSocialContent && <Loader2 className="w-4 h-4 animate-spin" />}
              </h5>
              
              {socialMediaContent ? (
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
              ) : (
                <div className="text-gray-400 text-sm text-center py-4">
                  {isGeneratingSocialContent ? 'Generating social media content...' : 'Social media content will appear here'}
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-4 justify-center mb-4">
            {activeTab === 'videos' && (
              <button
                onClick={() => handleCreateFullClip(selectedVideo as VideoRecord)}
                className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold 
                         transition-colors border-2 border-white flex items-center gap-2"
              >
                <Mic className="w-5 h-5" />
                Create FullClip
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

          {/* Social Media Sharing Section for FullClip */}
          {activeTab === 'fullclip' && (
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

          <div className="flex-1 flex overflow-hidden">
            {/* Video List */}
            <div className="w-1/2 border-r-2 border-white flex flex-col">
              <div className="p-6 border-b-2 border-white">
                <h3 className="text-2xl font-bold text-white mb-6">
                  {activeTab === 'videos' && 'Basic Videos'}
                  {activeTab === 'fullclip' && 'Complete Videos'}
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

      {/* FullClip Studio Modal */}
      <FullClipStudio
        isOpen={isFullClipStudioOpen}
        onClose={handleFullClipStudioClose}
        selectedVideo={videoForFullClip}
        onVideoSaved={handleFullClipVideoSaved}
      />

      {/* Success Modal */}
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