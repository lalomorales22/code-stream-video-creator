import React, { useState, useEffect } from 'react';
import { Play, Download, Trash2, Calendar, Clock, Code, X, Save, AlertCircle } from 'lucide-react';
import { dbManager, VideoRecord } from '../utils/database';

interface VideoGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  pendingVideo?: {
    blob: Blob;
    filename: string;
    originalFilename: string;
    language: string;
    duration: number;
  } | null;
  onPendingVideoSaved?: () => void;
}

const VideoGallery: React.FC<VideoGalleryProps> = ({
  isOpen,
  onClose,
  pendingVideo,
  onPendingVideoSaved
}) => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoRecord | null>(null);
  const [savingPending, setSavingPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{ videoCount: number; dbSize: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadVideos();
      loadDbStats();
    }
  }, [isOpen]);

  const loadDbStats = async () => {
    try {
      const stats = await dbManager.getStats();
      setDbStats(stats);
      console.log('Database stats:', stats);
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };

  const loadVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading videos from database...');
      const allVideos = await dbManager.getAllVideos();
      console.log('Videos loaded:', allVideos.length);
      setVideos(allVideos);
    } catch (error) {
      console.error('Failed to load videos:', error);
      setError('Failed to load videos from database');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePendingVideo = async () => {
    if (!pendingVideo) return;

    setSavingPending(true);
    setError(null);
    
    try {
      console.log('Saving pending video:', pendingVideo);
      
      // Validate the blob
      if (!pendingVideo.blob || pendingVideo.blob.size === 0) {
        throw new Error('Invalid video blob - size is 0');
      }

      console.log('Video blob size:', pendingVideo.blob.size, 'bytes');
      console.log('Video blob type:', pendingVideo.blob.type);

      const videoId = await dbManager.saveVideo(
        pendingVideo.filename,
        pendingVideo.originalFilename,
        pendingVideo.language,
        pendingVideo.duration,
        pendingVideo.blob
      );
      
      console.log('Video saved with ID:', videoId);
      
      await loadVideos();
      await loadDbStats();
      onPendingVideoSaved?.();
      
      // Show success message
      setError(null);
    } catch (error) {
      console.error('Failed to save video:', error);
      setError(`Failed to save video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSavingPending(false);
    }
  };

  const handleDownloadVideo = async (video: VideoRecord) => {
    try {
      console.log('Downloading video:', video.filename);
      const blob = new Blob([video.video_blob], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = video.filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      console.log('Video download initiated');
    } catch (error) {
      console.error('Failed to download video:', error);
      setError('Failed to download video');
    }
  };

  const handleDeleteVideo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      console.log('Deleting video with ID:', id);
      const success = await dbManager.deleteVideo(id);
      
      if (success) {
        await loadVideos();
        await loadDbStats();
        if (selectedVideo?.id === id) {
          setSelectedVideo(null);
        }
        console.log('Video deleted successfully');
      } else {
        throw new Error('Delete operation failed');
      }
    } catch (error) {
      console.error('Failed to delete video:', error);
      setError('Failed to delete video');
    }
  };

  const handlePlayVideo = (video: VideoRecord) => {
    console.log('Playing video:', video.filename);
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
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-black border-2 border-white rounded-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-white">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 border-2 border-white rounded-lg">
                <Play className="w-6 h-6 text-white" />
              </div>
              Video Gallery
            </h2>
            {dbStats && (
              <div className="text-lg text-gray-400 font-medium">
                {dbStats.videoCount} videos • {formatFileSize(dbStats.dbSize)} total
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
              <h3 className="text-2xl font-bold text-white mb-6">Saved Videos</h3>
              
              {/* Pending Video Save */}
              {pendingVideo && (
                <div className="bg-black border-2 border-white rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-white font-bold text-lg">New Recording Ready</span>
                    <button
                      onClick={handleSavePendingVideo}
                      disabled={savingPending}
                      className="flex items-center gap-2 bg-white hover:bg-gray-200 disabled:bg-gray-600 
                               text-black px-4 py-2 rounded font-bold transition-colors border-2 border-white"
                    >
                      <Save className="w-5 h-5" />
                      {savingPending ? 'Saving...' : 'Save to Gallery'}
                    </button>
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
              {loading ? (
                <div className="text-center text-gray-400 py-12 text-xl font-medium">Loading videos...</div>
              ) : videos.length === 0 ? (
                <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-600 rounded-lg">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-xl font-bold">No videos saved yet</p>
                  <p className="text-lg mt-2">Record some code streams to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map(video => (
                    <div
                      key={video.id}
                      className={`bg-black rounded-lg p-6 border-2 transition-all cursor-pointer
                                ${selectedVideo?.id === video.id 
                                  ? 'border-white bg-white text-black' 
                                  : 'border-gray-600 hover:border-white text-white'}`}
                      onClick={() => handlePlayVideo(video)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-lg truncate">{video.original_filename}</h4>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadVideo(video);
                            }}
                            className={`p-2 rounded transition-colors border-2 ${
                              selectedVideo?.id === video.id 
                                ? 'border-black text-black hover:bg-black hover:text-white' 
                                : 'border-white text-white hover:bg-white hover:text-black'
                            }`}
                          >
                            <Download className="w-5 h-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVideo(video.id);
                            }}
                            className={`p-2 rounded transition-colors border-2 ${
                              selectedVideo?.id === video.id 
                                ? 'border-black text-black hover:bg-black hover:text-white' 
                                : 'border-white text-white hover:bg-white hover:text-black'
                            }`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          <span className="capitalize">{video.file_language}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(video.duration)}</span>
                        </div>
                        <div className="text-sm">
                          {formatFileSize(video.video_blob.length)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs mt-2 opacity-75">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(video.created_at)}</span>
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
            
            <div className="flex-1 flex items-center justify-center p-6">
              {selectedVideo ? (
                <div className="w-full max-w-md">
                  <video
                    key={selectedVideo.id}
                    controls
                    className="w-full bg-black rounded-lg border-2 border-white"
                    style={{ aspectRatio: '9/16' }}
                    src={URL.createObjectURL(new Blob([selectedVideo.video_blob], { type: 'video/mp4' }))}
                  />
                  <div className="mt-6 text-center">
                    <h4 className="font-bold text-xl text-white mb-3">{selectedVideo.original_filename}</h4>
                    <div className="flex justify-center gap-6 text-lg text-gray-400 font-medium">
                      <span className="capitalize">{selectedVideo.file_language}</span>
                      <span>{formatDuration(selectedVideo.duration)}</span>
                      <span>{formatFileSize(selectedVideo.video_blob.length)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <Play className="w-20 h-20 mx-auto mb-6 opacity-50" />
                  <p className="text-2xl font-bold">Select a video to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoGallery;