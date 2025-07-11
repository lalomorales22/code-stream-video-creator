import initSqlJs from 'sql.js';

export interface VideoRecord {
  id: number;
  filename: string;
  original_filename: string;
  file_language: string;
  duration: number;
  created_at: string;
  video_blob: Uint8Array;
  original_file_content: string;
  display_name?: string;
  video_mime_type: string; // NEW: Store the actual MIME type
}

export interface FullClipVideoRecord {
  id: number;
  filename: string;
  original_filename: string;
  file_language: string;
  duration: number;
  created_at: string;
  video_blob: Uint8Array;
  script: string;
  captions: string; // JSON string of caption segments
  original_file_content: string;
  display_name?: string;
  video_mime_type: string; // NEW: Store the actual MIME type
}

export interface ShortsVideoRecord {
  id: number;
  filename: string;
  original_filename: string;
  file_language: string;
  duration: number;
  created_at: string;
  video_blob: Uint8Array;
  avatar_type: string;
  avatar_position: string;
  avatar_size: number;
  original_file_content: string;
  display_name?: string;
  video_mime_type: string; // NEW: Store the actual MIME type
}

// NEW: Avatar storage interface
export interface AvatarRecord {
  id: number;
  name: string;
  description: string;
  image_data: Uint8Array; // Store the actual image data
  image_type: string; // MIME type (image/png, image/jpeg, etc.)
  created_at: string;
  avatar_type: 'uploaded' | 'generated'; // Track source
}

class DatabaseManager {
  private db: any = null;
  private SQL: any = null;
  private initialized = false;
  private dbName = 'codestream_db';
  private storeName = 'database';

  async initialize() {
    if (this.initialized && this.db) return;

    try {
      console.log('Initializing database...');
      
      // Initialize SQL.js
      this.SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`
      });

      console.log('SQL.js loaded successfully');

      // Try to load existing database from IndexedDB
      const savedDb = await this.loadDatabaseFromIndexedDB();
      if (savedDb) {
        try {
          this.db = new this.SQL.Database(savedDb);
          console.log('Loaded existing database from IndexedDB');
        } catch (error) {
          console.warn('Failed to load existing database, creating new one:', error);
          this.db = new this.SQL.Database();
        }
      } else {
        // Create new database
        this.db = new this.SQL.Database();
        console.log('Created new database');
      }

      // Create tables if they don't exist
      this.createTables();
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private createTables() {
    try {
      // Check if columns exist in videos table
      const videosTableInfo = this.db.exec("PRAGMA table_info(videos)");
      const hasDisplayNameColumn = videosTableInfo.length > 0 && 
        videosTableInfo[0].values.some((row: any[]) => row[1] === 'display_name');
      const hasFileContentColumn = videosTableInfo.length > 0 && 
        videosTableInfo[0].values.some((row: any[]) => row[1] === 'original_file_content');
      const hasMimeTypeColumn = videosTableInfo.length > 0 && 
        videosTableInfo[0].values.some((row: any[]) => row[1] === 'video_mime_type');

      // Original videos table
      const createVideosTableSQL = `
        CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_language TEXT NOT NULL,
          duration INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          video_blob BLOB NOT NULL,
          original_file_content TEXT,
          display_name TEXT,
          video_mime_type TEXT DEFAULT 'video/mp4'
        );
      `;

      // Add columns if they don't exist
      if (!hasFileContentColumn) {
        try {
          this.db.run('ALTER TABLE videos ADD COLUMN original_file_content TEXT');
          console.log('Added original_file_content column to videos table');
        } catch (error) {
          console.log('Creating videos table with original_file_content column');
        }
      }

      if (!hasDisplayNameColumn) {
        try {
          this.db.run('ALTER TABLE videos ADD COLUMN display_name TEXT');
          console.log('Added display_name column to videos table');
        } catch (error) {
          console.log('Creating videos table with display_name column');
        }
      }

      if (!hasMimeTypeColumn) {
        try {
          this.db.run('ALTER TABLE videos ADD COLUMN video_mime_type TEXT DEFAULT \'video/mp4\'');
          console.log('Added video_mime_type column to videos table');
        } catch (error) {
          console.log('Creating videos table with video_mime_type column');
        }
      }

      // Check columns for fullclip_videos table
      const fullclipTableInfo = this.db.exec("PRAGMA table_info(fullclip_videos)");
      const hasFullclipFileContentColumn = fullclipTableInfo.length > 0 && 
        fullclipTableInfo[0].values.some((row: any[]) => row[1] === 'original_file_content');
      const hasFullclipDisplayNameColumn = fullclipTableInfo.length > 0 && 
        fullclipTableInfo[0].values.some((row: any[]) => row[1] === 'display_name');
      const hasFullclipMimeTypeColumn = fullclipTableInfo.length > 0 && 
        fullclipTableInfo[0].values.some((row: any[]) => row[1] === 'video_mime_type');

      // FullClip videos table
      const createFullClipVideosTableSQL = `
        CREATE TABLE IF NOT EXISTS fullclip_videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_language TEXT NOT NULL,
          duration INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          video_blob BLOB NOT NULL,
          script TEXT,
          captions TEXT,
          original_file_content TEXT,
          display_name TEXT,
          video_mime_type TEXT DEFAULT 'video/mp4'
        );
      `;

      if (!hasFullclipFileContentColumn) {
        try {
          this.db.run('ALTER TABLE fullclip_videos ADD COLUMN original_file_content TEXT');
          console.log('Added original_file_content column to fullclip_videos table');
        } catch (error) {
          console.log('Creating fullclip_videos table with original_file_content column');
        }
      }

      if (!hasFullclipDisplayNameColumn) {
        try {
          this.db.run('ALTER TABLE fullclip_videos ADD COLUMN display_name TEXT');
          console.log('Added display_name column to fullclip_videos table');
        } catch (error) {
          console.log('Creating fullclip_videos table with display_name column');
        }
      }

      if (!hasFullclipMimeTypeColumn) {
        try {
          this.db.run('ALTER TABLE fullclip_videos ADD COLUMN video_mime_type TEXT DEFAULT \'video/mp4\'');
          console.log('Added video_mime_type column to fullclip_videos table');
        } catch (error) {
          console.log('Creating fullclip_videos table with video_mime_type column');
        }
      }

      // Check columns for shorts_videos table
      const shortsTableInfo = this.db.exec("PRAGMA table_info(shorts_videos)");
      const hasShortsDisplayNameColumn = shortsTableInfo.length > 0 && 
        shortsTableInfo[0].values.some((row: any[]) => row[1] === 'display_name');
      const hasShortsMimeTypeColumn = shortsTableInfo.length > 0 && 
        shortsTableInfo[0].values.some((row: any[]) => row[1] === 'video_mime_type');

      // Shorts videos table
      const createShortsVideosTableSQL = `
        CREATE TABLE IF NOT EXISTS shorts_videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_language TEXT NOT NULL,
          duration INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          video_blob BLOB NOT NULL,
          avatar_type TEXT NOT NULL,
          avatar_position TEXT NOT NULL,
          avatar_size INTEGER NOT NULL,
          original_file_content TEXT,
          display_name TEXT,
          video_mime_type TEXT DEFAULT 'video/mp4'
        );
      `;

      if (!hasShortsDisplayNameColumn) {
        try {
          this.db.run('ALTER TABLE shorts_videos ADD COLUMN display_name TEXT');
          console.log('Added display_name column to shorts_videos table');
        } catch (error) {
          console.log('Creating shorts_videos table with display_name column');
        }
      }

      if (!hasShortsMimeTypeColumn) {
        try {
          this.db.run('ALTER TABLE shorts_videos ADD COLUMN video_mime_type TEXT DEFAULT \'video/mp4\'');
          console.log('Added video_mime_type column to shorts_videos table');
        } catch (error) {
          console.log('Creating shorts_videos table with video_mime_type column');
        }
      }

      // NEW: Avatars table for persistent avatar storage
      const createAvatarsTableSQL = `
        CREATE TABLE IF NOT EXISTS avatars (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          image_data BLOB NOT NULL,
          image_type TEXT NOT NULL,
          created_at TEXT NOT NULL,
          avatar_type TEXT NOT NULL DEFAULT 'uploaded'
        );
      `;

      this.db.run(createVideosTableSQL);
      this.db.run(createFullClipVideosTableSQL);
      this.db.run(createShortsVideosTableSQL);
      this.db.run(createAvatarsTableSQL);
      console.log('Tables created/verified successfully');
      this.saveDatabase();
    } catch (error) {
      console.error('Failed to create tables:', error);
      throw error;
    }
  }

  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  private async loadDatabaseFromIndexedDB(): Promise<Uint8Array | null> {
    try {
      const db = await this.openIndexedDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get('database');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? new Uint8Array(result) : null);
        };
      });
    } catch (error) {
      console.error('Failed to load database from IndexedDB:', error);
      return null;
    }
  }

  private async saveDatabase() {
    try {
      const data = this.db.export();
      const db = await this.openIndexedDB();
      
      return new Promise<void>((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.put(data, 'database');
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('Database saved to IndexedDB, size:', data.length, 'bytes');
          resolve();
        };
      });
    } catch (error) {
      console.error('Failed to save database to IndexedDB:', error);
      throw error;
    }
  }

  // UPDATED: saveVideo method to include video_mime_type
  async saveVideo(
    filename: string,
    originalFilename: string,
    language: string,
    duration: number,
    videoBlob: Blob,
    originalFileContent: string = '',
    displayName: string = '',
    videoMimeType: string = 'video/mp4' // NEW: MIME type parameter
  ): Promise<number> {
    try {
      await this.initialize();
      console.log('Saving video:', { filename, originalFilename, language, duration, blobSize: videoBlob.size, displayName, videoMimeType });

      const arrayBuffer = await videoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const createdAt = new Date().toISOString();

      console.log('Video blob converted to Uint8Array, size:', uint8Array.length);

      const stmt = this.db.prepare(`
        INSERT INTO videos (filename, original_filename, file_language, duration, created_at, video_blob, original_file_content, display_name, video_mime_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([filename, originalFilename, language, duration, createdAt, uint8Array, originalFileContent, displayName, videoMimeType]);
      
      // Get the inserted ID
      const result = this.db.exec("SELECT last_insert_rowid()");
      const videoId = result[0].values[0][0];

      stmt.free();
      await this.saveDatabase();

      console.log('Video saved successfully with ID:', videoId, 'display name:', displayName, 'MIME type:', videoMimeType);
      return videoId;
    } catch (error) {
      console.error('Failed to save video:', error);
      throw error;
    }
  }

  async getAllVideos(): Promise<VideoRecord[]> {
    try {
      await this.initialize();
      console.log('Loading all videos...');

      const result = this.db.exec(`
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, original_file_content, display_name, video_mime_type
        FROM videos
        ORDER BY created_at DESC
      `);

      if (!result || result.length === 0) {
        console.log('No videos found in database');
        return [];
      }

      const videos: VideoRecord[] = [];
      const values = result[0].values;

      for (const row of values) {
        const video: VideoRecord = {
          id: row[0] as number,
          filename: row[1] as string,
          original_filename: row[2] as string,
          file_language: row[3] as string,
          duration: row[4] as number,
          created_at: row[5] as string,
          video_blob: row[6] as Uint8Array,
          original_file_content: (row[7] as string) || '',
          display_name: (row[8] as string) || '',
          video_mime_type: (row[9] as string) || 'video/mp4' // NEW: Include MIME type
        };
        videos.push(video);
      }

      console.log('Loaded', videos.length, 'videos from database');
      return videos;
    } catch (error) {
      console.error('Failed to load videos:', error);
      return [];
    }
  }

  async getVideo(id: number): Promise<VideoRecord | null> {
    try {
      await this.initialize();

      const result = this.db.exec(`
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, original_file_content, display_name, video_mime_type
        FROM videos
        WHERE id = ?
      `, [id]);

      if (!result || result.length === 0 || result[0].values.length === 0) {
        return null;
      }

      const row = result[0].values[0];
      const video: VideoRecord = {
        id: row[0] as number,
        filename: row[1] as string,
        original_filename: row[2] as string,
        file_language: row[3] as string,
        duration: row[4] as number,
        created_at: row[5] as string,
        video_blob: row[6] as Uint8Array,
        original_file_content: (row[7] as string) || '',
        display_name: (row[8] as string) || '',
        video_mime_type: (row[9] as string) || 'video/mp4' // NEW: Include MIME type
      };

      return video;
    } catch (error) {
      console.error('Failed to get video:', error);
      return null;
    }
  }

  async deleteVideo(id: number): Promise<boolean> {
    try {
      await this.initialize();
      console.log('Deleting video with ID:', id);

      this.db.run('DELETE FROM videos WHERE id = ?', [id]);
      const changes = this.db.getRowsModified();
      
      await this.saveDatabase();
      console.log('Video deleted, rows affected:', changes);

      return changes > 0;
    } catch (error) {
      console.error('Failed to delete video:', error);
      return false;
    }
  }

  // UPDATED: saveFullClipVideo method to include video_mime_type
  async saveFullClipVideo(
    filename: string,
    originalFilename: string,
    language: string,
    duration: number,
    videoBlob: Blob,
    script: string,
    captions: any[],
    originalFileContent: string = '',
    displayName: string = '',
    videoMimeType: string = 'video/mp4' // NEW: MIME type parameter
  ): Promise<number> {
    try {
      await this.initialize();
      console.log('Saving FullClip video:', { filename, originalFilename, language, duration, blobSize: videoBlob.size, displayName, videoMimeType });

      const arrayBuffer = await videoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const createdAt = new Date().toISOString();
      const captionsJson = JSON.stringify(captions);

      console.log('FullClip video blob converted to Uint8Array, size:', uint8Array.length);

      const stmt = this.db.prepare(`
        INSERT INTO fullclip_videos (filename, original_filename, file_language, duration, created_at, video_blob, script, captions, original_file_content, display_name, video_mime_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([filename, originalFilename, language, duration, createdAt, uint8Array, script, captionsJson, originalFileContent, displayName, videoMimeType]);
      
      // Get the inserted ID
      const result = this.db.exec("SELECT last_insert_rowid()");
      const videoId = result[0].values[0][0];

      stmt.free();
      await this.saveDatabase();

      console.log('FullClip video saved successfully with ID:', videoId, 'display name:', displayName, 'MIME type:', videoMimeType);
      return videoId;
    } catch (error) {
      console.error('Failed to save FullClip video:', error);
      throw error;
    }
  }

  async getAllFullClipVideos(): Promise<FullClipVideoRecord[]> {
    try {
      await this.initialize();
      console.log('Loading all FullClip videos...');

      const result = this.db.exec(`
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, script, captions, original_file_content, display_name, video_mime_type
        FROM fullclip_videos
        ORDER BY created_at DESC
      `);

      if (!result || result.length === 0) {
        console.log('No FullClip videos found in database');
        return [];
      }

      const videos: FullClipVideoRecord[] = [];
      const values = result[0].values;

      for (const row of values) {
        const video: FullClipVideoRecord = {
          id: row[0] as number,
          filename: row[1] as string,
          original_filename: row[2] as string,
          file_language: row[3] as string,
          duration: row[4] as number,
          created_at: row[5] as string,
          video_blob: row[6] as Uint8Array,
          script: row[7] as string,
          captions: row[8] as string,
          original_file_content: (row[9] as string) || '',
          display_name: (row[10] as string) || '',
          video_mime_type: (row[11] as string) || 'video/mp4' // NEW: Include MIME type
        };
        videos.push(video);
      }

      console.log('Loaded', videos.length, 'FullClip videos from database');
      return videos;
    } catch (error) {
      console.error('Failed to load FullClip videos:', error);
      return [];
    }
  }

  async getFullClipVideo(id: number): Promise<FullClipVideoRecord | null> {
    try {
      await this.initialize();

      const result = this.db.exec(`
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, script, captions, original_file_content, display_name, video_mime_type
        FROM fullclip_videos
        WHERE id = ?
      `, [id]);

      if (!result || result.length === 0 || result[0].values.length === 0) {
        return null;
      }

      const row = result[0].values[0];
      const video: FullClipVideoRecord = {
        id: row[0] as number,
        filename: row[1] as string,
        original_filename: row[2] as string,
        file_language: row[3] as string,
        duration: row[4] as number,
        created_at: row[5] as string,
        video_blob: row[6] as Uint8Array,
        script: row[7] as string,
        captions: row[8] as string,
        original_file_content: (row[9] as string) || '',
        display_name: (row[10] as string) || '',
        video_mime_type: (row[11] as string) || 'video/mp4' // NEW: Include MIME type
      };

      return video;
    } catch (error) {
      console.error('Failed to get FullClip video:', error);
      return null;
    }
  }

  async deleteFullClipVideo(id: number): Promise<boolean> {
    try {
      await this.initialize();
      console.log('Deleting FullClip video with ID:', id);

      this.db.run('DELETE FROM fullclip_videos WHERE id = ?', [id]);
      const changes = this.db.getRowsModified();
      
      await this.saveDatabase();
      console.log('FullClip video deleted, rows affected:', changes);

      return changes > 0;
    } catch (error) {
      console.error('Failed to delete FullClip video:', error);
      return false;
    }
  }

  // UPDATED: saveShortsVideo method to include video_mime_type
  async saveShortsVideo(
    filename: string,
    originalFilename: string,
    language: string,
    duration: number,
    videoBlob: Blob,
    avatarType: string,
    avatarPosition: string,
    avatarSize: number,
    originalFileContent: string = '',
    displayName: string = '',
    videoMimeType: string = 'video/mp4' // NEW: MIME type parameter
  ): Promise<number> {
    try {
      await this.initialize();
      console.log('Saving Shorts video:', { filename, originalFilename, language, duration, blobSize: videoBlob.size, displayName, videoMimeType });

      const arrayBuffer = await videoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const createdAt = new Date().toISOString();

      console.log('Shorts video blob converted to Uint8Array, size:', uint8Array.length);

      const stmt = this.db.prepare(`
        INSERT INTO shorts_videos (filename, original_filename, file_language, duration, created_at, video_blob, avatar_type, avatar_position, avatar_size, original_file_content, display_name, video_mime_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([filename, originalFilename, language, duration, createdAt, uint8Array, avatarType, avatarPosition, avatarSize, originalFileContent, displayName, videoMimeType]);
      
      // Get the inserted ID
      const result = this.db.exec("SELECT last_insert_rowid()");
      const videoId = result[0].values[0][0];

      stmt.free();
      await this.saveDatabase();

      console.log('Shorts video saved successfully with ID:', videoId, 'display name:', displayName, 'MIME type:', videoMimeType);
      return videoId;
    } catch (error) {
      console.error('Failed to save Shorts video:', error);
      throw error;
    }
  }

  async getAllShortsVideos(): Promise<ShortsVideoRecord[]> {
    try {
      await this.initialize();
      console.log('Loading all Shorts videos...');

      const result = this.db.exec(`
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, avatar_type, avatar_position, avatar_size, original_file_content, display_name, video_mime_type
        FROM shorts_videos
        ORDER BY created_at DESC
      `);

      if (!result || result.length === 0) {
        console.log('No Shorts videos found in database');
        return [];
      }

      const videos: ShortsVideoRecord[] = [];
      const values = result[0].values;

      for (const row of values) {
        const video: ShortsVideoRecord = {
          id: row[0] as number,
          filename: row[1] as string,
          original_filename: row[2] as string,
          file_language: row[3] as string,
          duration: row[4] as number,
          created_at: row[5] as string,
          video_blob: row[6] as Uint8Array,
          avatar_type: row[7] as string,
          avatar_position: row[8] as string,
          avatar_size: row[9] as number,
          original_file_content: (row[10] as string) || '',
          display_name: (row[11] as string) || '',
          video_mime_type: (row[12] as string) || 'video/mp4' // NEW: Include MIME type
        };
        videos.push(video);
      }

      console.log('Loaded', videos.length, 'Shorts videos from database');
      return videos;
    } catch (error) {
      console.error('Failed to load Shorts videos:', error);
      return [];
    }
  }

  async getShortsVideo(id: number): Promise<ShortsVideoRecord | null> {
    try {
      await this.initialize();

      const result = this.db.exec(`
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, avatar_type, avatar_position, avatar_size, original_file_content, display_name, video_mime_type
        FROM shorts_videos
        WHERE id = ?
      `, [id]);

      if (!result || result.length === 0 || result[0].values.length === 0) {
        return null;
      }

      const row = result[0].values[0];
      const video: ShortsVideoRecord = {
        id: row[0] as number,
        filename: row[1] as string,
        original_filename: row[2] as string,
        file_language: row[3] as string,
        duration: row[4] as number,
        created_at: row[5] as string,
        video_blob: row[6] as Uint8Array,
        avatar_type: row[7] as string,
        avatar_position: row[8] as string,
        avatar_size: row[9] as number,
        original_file_content: (row[10] as string) || '',
        display_name: (row[11] as string) || '',
        video_mime_type: (row[12] as string) || 'video/mp4' // NEW: Include MIME type
      };

      return video;
    } catch (error) {
      console.error('Failed to get Shorts video:', error);
      return null;
    }
  }

  async deleteShortsVideo(id: number): Promise<boolean> {
    try {
      await this.initialize();
      console.log('Deleting Shorts video with ID:', id);

      this.db.run('DELETE FROM shorts_videos WHERE id = ?', [id]);
      const changes = this.db.getRowsModified();
      
      await this.saveDatabase();
      console.log('Shorts video deleted, rows affected:', changes);

      return changes > 0;
    } catch (error) {
      console.error('Failed to delete Shorts video:', error);
      return false;
    }
  }

  // NEW: Avatar management methods
  async saveAvatar(
    name: string,
    description: string,
    imageFile: File,
    avatarType: 'uploaded' | 'generated' = 'uploaded'
  ): Promise<number> {
    try {
      await this.initialize();
      console.log('Saving avatar:', { name, description, imageType: imageFile.type, size: imageFile.size, avatarType });

      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const createdAt = new Date().toISOString();

      console.log('Avatar image converted to Uint8Array, size:', uint8Array.length);

      const stmt = this.db.prepare(`
        INSERT INTO avatars (name, description, image_data, image_type, created_at, avatar_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run([name, description, uint8Array, imageFile.type, createdAt, avatarType]);
      
      // Get the inserted ID
      const result = this.db.exec("SELECT last_insert_rowid()");
      const avatarId = result[0].values[0][0];

      stmt.free();
      await this.saveDatabase();

      console.log('Avatar saved successfully with ID:', avatarId);
      return avatarId;
    } catch (error) {
      console.error('Failed to save avatar:', error);
      throw error;
    }
  }

  async getAllAvatars(): Promise<AvatarRecord[]> {
    try {
      await this.initialize();
      console.log('Loading all avatars...');

      const result = this.db.exec(`
        SELECT id, name, description, image_data, image_type, created_at, avatar_type
        FROM avatars
        ORDER BY created_at DESC
      `);

      if (!result || result.length === 0) {
        console.log('No avatars found in database');
        return [];
      }

      const avatars: AvatarRecord[] = [];
      const values = result[0].values;

      for (const row of values) {
        const avatar: AvatarRecord = {
          id: row[0] as number,
          name: row[1] as string,
          description: row[2] as string,
          image_data: row[3] as Uint8Array,
          image_type: row[4] as string,
          created_at: row[5] as string,
          avatar_type: (row[6] as string) || 'uploaded'
        };
        avatars.push(avatar);
      }

      console.log('Loaded', avatars.length, 'avatars from database');
      return avatars;
    } catch (error) {
      console.error('Failed to load avatars:', error);
      return [];
    }
  }

  async getAvatar(id: number): Promise<AvatarRecord | null> {
    try {
      await this.initialize();

      const result = this.db.exec(`
        SELECT id, name, description, image_data, image_type, created_at, avatar_type
        FROM avatars
        WHERE id = ?
      `, [id]);

      if (!result || result.length === 0 || result[0].values.length === 0) {
        return null;
      }

      const row = result[0].values[0];
      const avatar: AvatarRecord = {
        id: row[0] as number,
        name: row[1] as string,
        description: row[2] as string,
        image_data: row[3] as Uint8Array,
        image_type: row[4] as string,
        created_at: row[5] as string,
        avatar_type: (row[6] as string) || 'uploaded'
      };

      return avatar;
    } catch (error) {
      console.error('Failed to get avatar:', error);
      return null;
    }
  }

  async deleteAvatar(id: number): Promise<boolean> {
    try {
      await this.initialize();
      console.log('Deleting avatar with ID:', id);

      this.db.run('DELETE FROM avatars WHERE id = ?', [id]);
      const changes = this.db.getRowsModified();
      
      await this.saveDatabase();
      console.log('Avatar deleted, rows affected:', changes);

      return changes > 0;
    } catch (error) {
      console.error('Failed to delete avatar:', error);
      return false;
    }
  }

  async clearAllVideos(): Promise<void> {
    try {
      await this.initialize();
      this.db.run('DELETE FROM videos');
      this.db.run('DELETE FROM fullclip_videos');
      this.db.run('DELETE FROM shorts_videos');
      await this.saveDatabase();
      console.log('All videos cleared from database');
    } catch (error) {
      console.error('Failed to clear videos:', error);
      throw error;
    }
  }

  async clearAllAvatars(): Promise<void> {
    try {
      await this.initialize();
      this.db.run('DELETE FROM avatars');
      await this.saveDatabase();
      console.log('All avatars cleared from database');
    } catch (error) {
      console.error('Failed to clear avatars:', error);
      throw error;
    }
  }

  // Debug method to check database status
  async getStats(): Promise<{ videoCount: number; fullClipCount: number; shortsCount: number; avatarCount: number; dbSize: number }> {
    try {
      await this.initialize();
      
      const videoCountResult = this.db.exec('SELECT COUNT(*) FROM videos');
      const videoCount = videoCountResult[0]?.values[0]?.[0] || 0;
      
      const fullClipCountResult = this.db.exec('SELECT COUNT(*) FROM fullclip_videos');
      const fullClipCount = fullClipCountResult[0]?.values[0]?.[0] || 0;
      
      const shortsCountResult = this.db.exec('SELECT COUNT(*) FROM shorts_videos');
      const shortsCount = shortsCountResult[0]?.values[0]?.[0] || 0;
      
      const avatarCountResult = this.db.exec('SELECT COUNT(*) FROM avatars');
      const avatarCount = avatarCountResult[0]?.values[0]?.[0] || 0;
      
      // Get database size from IndexedDB
      let dbSize = 0;
      try {
        const savedDb = await this.loadDatabaseFromIndexedDB();
        dbSize = savedDb ? savedDb.length : 0;
      } catch (error) {
        console.warn('Could not get database size:', error);
      }
      
      return { videoCount, fullClipCount, shortsCount, avatarCount, dbSize };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return { videoCount: 0, fullClipCount: 0, shortsCount: 0, avatarCount: 0, dbSize: 0 };
    }
  }
}

export const dbManager = new DatabaseManager();