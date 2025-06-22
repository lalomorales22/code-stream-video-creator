import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Calendar, Clock, Code, X, Users, Sparkles, Loader2, FileAudio } from 'lucide-react';
import { dbManager, ShortsVideoRecord } from '../utils/database';
import VideoGallery from './VideoGallery';
import FullClipGallery from './FullClipGallery';

interface ShortsGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortsGallery: React.FC<ShortsGalleryProps> = ({
  isOpen,
  onClose
}) => {
  const [videos, setVideos] = useState<ShortsVideoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<ShortsVideoRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingVideoId, setDeletingVideoId] = useState<number | null>(null);
  const [isVideoGalleryOpen, setIsVideoGalleryOpen] = useState(false);
  const [isFullClipGalleryOpen, setIsFullClipGalleryOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVideos();
    }
  }, [isOpen]);

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading Shorts videos from database...');
      const allVideos = await dbManager.getAllShortsVideos();
      console.log('Shorts videos loaded:', allVideos.length);
      setVideos(allVideos);
    } catch (error) {
      console.error('Failed to load Shorts videos:', error);
      setError('Failed to load videos from database');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadVideo = async (video: ShortsVideoRecord) => {
    try {
      console.log('Downloading Shorts video:', video.filename);
      
      const blob = new Blob([video.video_blob], { 
        type: 'video/mp4'
      });
      
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
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      console.log('Shorts video download initiated:', filename);
    } catch (error) {
      console.error('Failed to download video:', error);
      setError(`Failed to download video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    setDeletingVideoId(id);

    try {
      console.log('Deleting Shorts video with ID:', id);
      const success = await dbManager.deleteShortsVideo(id);
      
      if (success) {
        await loadVideos();
        if (selectedVideo?.id === id) {
          setSelectedVideo(null);
        }
        console.log('Shorts video deleted successfully');
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

  const handlePlayVideo = (video: ShortsVideoRecord) => {
    console.log('Playing Shorts video:', video.filename);
    setSelectedVideo(video);
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
        <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b-2 border-white">
            <div className="flex items-center gap-6">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <div className="p-2 border-2 border-white rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                Shorts Gallery
              </h2>
              <div className="text-lg text-gray-400 font-medium">
                {videos.length} videos with penguin avatars
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Gallery Navigation Buttons */}
              <button
                onClick={() => setIsVideoGalleryOpen(true)}
                className="flex items-center gap-2 bg-black hover:bg-white hover:text-black text-white px-4 py-2 rounded-lg font-bold transition-colors border-2 border-white"
              >
                <Play className="w-5 h-5" />
                Video Gallery
              </button>
              <button
                onClick={() => setIsFullClipGalleryOpen(true)}
                className="flex items-center gap-2 bg-black hover:bg-white hover:text-black text-white px-4 py-2 rounded-lg font-bold transition-colors border-2 border-white"
              >
                <FileAudio className="w-5 h-5" />
                FullClip Gallery
              </button>
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
                <h3 className="text-2xl font-bold text-white">Avatar Videos</h3>
                <p className="text-gray-400 mt-2">Videos with animated penguin avatars</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="text-center text-gray-400 py-12 text-xl font-medium">Loading videos...</div>
                ) : videos.length === 0 ? (
                  <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-600 rounded-lg">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-xl font-bold">No Shorts videos yet</p>
                    <p className="text-lg mt-2">Create videos with penguin avatars in the Shorts Studio</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videos.map(video => (
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
                              title="Download MP4 with Avatar"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteVideo(video.id);
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
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{video.avatar_type}</span>
                          </div>
                        </div>
                        
                        <div className="text-sm mb-2">
                          {formatFileSize(video.video_blob.length)}
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs opacity-75">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(video.created_at)}</span>
                        </div>

                        {/* Avatar Info */}
                        <div className="mt-3 p-3 bg-gray-800 rounded text-xs">
                          <p className="text-gray-300">
                            Avatar: {video.avatar_type} • Position: {video.avatar_position}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Video Player */}
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
                          key={selectedVideo.id}
                          controls
                          className="w-full bg-black rounded-lg border-2 border-white"
                          style={{ aspectRatio: '9/16' }}
                          src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
                          onLoadStart={() => console.log('Shorts video loading started')}
                          onCanPlay={() => console.log('Shorts video can play')}
                          onError={(e) => {
                            console.error('Shorts video error:', e);
                            setError('Failed to load video for playback');
                          }}
                        />
                      </div>
                      
                      <div className="mt-6 text-center">
                        <h4 className="font-bold text-xl text-white mb-3">{selectedVideo.original_filename}</h4>
                        <div className="flex justify-center gap-6 text-lg text-gray-400 font-medium mb-4">
                          <span className="capitalize">{selectedVideo.file_language}</span>
                          <span>{formatDuration(selectedVideo.duration)}</span>
                          <span>{formatFileSize(selectedVideo.video_blob.length)}</span>
                        </div>
                        
                        {/* Avatar Details */}
                        <div className="bg-black border-2 border-white rounded-lg p-4 mb-4 text-left">
                          <h5 className="text-white font-bold mb-2">Avatar Details</h5>
                          <div className="space-y-2 text-sm text-gray-300">
                            <div className="flex justify-between">
                              <span>Type:</span>
                              <span className="capitalize">{selectedVideo.avatar_type}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Position:</span>
                              <span className="capitalize">{selectedVideo.avatar_position}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Size:</span>
                              <span>{selectedVideo.avatar_size}%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 justify-center">
                          <button
                            onClick={() => handleDownloadVideo(selectedVideo)}
                            className="bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-lg font-bold 
                                     transition-colors border-2 border-white flex items-center gap-2"
                          >
                            <Download className="w-5 h-5" />
                            Download MP4
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 flex flex-col items-center justify-center min-h-full">
                      <Users className="w-20 h-20 mx-auto mb-6 opacity-50" />
                      <p className="text-2xl font-bold">Select a video to preview</p>
                      <p className="text-lg mt-2">Click on any Shorts video to play it with avatar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Gallery Modal */}
      <VideoGallery
        isOpen={isVideoGalleryOpen}
        onClose={() => setIsVideoGalleryOpen(false)}
      />

      {/* FullClip Gallery Modal */}
      <FullClipGallery
        isOpen={isFullClipGalleryOpen}
        onClose={() => setIsFullClipGalleryOpen(false)}
      />
    </>
  );
};

export default ShortsGallery;