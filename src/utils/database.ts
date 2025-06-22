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
      // Check if original_file_content column exists in videos table
      const videosTableInfo = this.db.exec("PRAGMA table_info(videos)");
      const hasFileContentColumn = videosTableInfo.length > 0 && 
        videosTableInfo[0].values.some((row: any[]) => row[1] === 'original_file_content');

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
          original_file_content TEXT
        );
      `;

      // Add column if it doesn't exist
      if (!hasFileContentColumn) {
        try {
          this.db.run('ALTER TABLE videos ADD COLUMN original_file_content TEXT');
          console.log('Added original_file_content column to videos table');
        } catch (error) {
          // Column might already exist or table doesn't exist yet
          console.log('Creating videos table with original_file_content column');
        }
      }

      // Check if original_file_content column exists in fullclip_videos table
      const fullclipTableInfo = this.db.exec("PRAGMA table_info(fullclip_videos)");
      const hasFullclipFileContentColumn = fullclipTableInfo.length > 0 && 
        fullclipTableInfo[0].values.some((row: any[]) => row[1] === 'original_file_content');

      // New FullClip videos table for videos with audio and captions
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
          original_file_content TEXT
        );
      `;

      // Add column if it doesn't exist
      if (!hasFullclipFileContentColumn) {
        try {
          this.db.run('ALTER TABLE fullclip_videos ADD COLUMN original_file_content TEXT');
          console.log('Added original_file_content column to fullclip_videos table');
        } catch (error) {
          // Column might already exist or table doesn't exist yet
          console.log('Creating fullclip_videos table with original_file_content column');
        }
      }

      // New Shorts videos table for videos with avatars
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
          original_file_content TEXT
        );
      `;

      this.db.run(createVideosTableSQL);
      this.db.run(createFullClipVideosTableSQL);
      this.db.run(createShortsVideosTableSQL);
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

  // Original video methods
  async saveVideo(
    filename: string,
    originalFilename: string,
    language: string,
    duration: number,
    videoBlob: Blob,
    originalFileContent: string = ''
  ): Promise<number> {
    try {
      await this.initialize();
      console.log('Saving video:', { filename, originalFilename, language, duration, blobSize: videoBlob.size });

      const arrayBuffer = await videoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const createdAt = new Date().toISOString();

      console.log('Video blob converted to Uint8Array, size:', uint8Array.length);

      const stmt = this.db.prepare(`
        INSERT INTO videos (filename, original_filename, file_language, duration, created_at, video_blob, original_file_content)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([filename, originalFilename, language, duration, createdAt, uint8Array, originalFileContent]);
      
      // Get the inserted ID
      const result = this.db.exec("SELECT last_insert_rowid()");
      const videoId = result[0].values[0][0];

      stmt.free();
      await this.saveDatabase();

      console.log('Video saved successfully with ID:', videoId);
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
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, original_file_content
        FROM videos
        ORDER BY created_at DESC
      `);

      if (!result || result.length === 0) {
        console.log('No videos found in database');
        return [];
      }

      const videos: VideoRecord[] = [];
      const columns = result[0].columns;
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
          original_file_content: (row[7] as string) || ''
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
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, original_file_content
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
        original_file_content: (row[7] as string) || ''
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

  // FullClip video methods (videos with audio and captions)
  async saveFullClipVideo(
    filename: string,
    originalFilename: string,
    language: string,
    duration: number,
    videoBlob: Blob,
    script: string,
    captions: any[],
    originalFileContent: string = ''
  ): Promise<number> {
    try {
      await this.initialize();
      console.log('Saving FullClip video:', { filename, originalFilename, language, duration, blobSize: videoBlob.size });

      const arrayBuffer = await videoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const createdAt = new Date().toISOString();
      const captionsJson = JSON.stringify(captions);

      console.log('FullClip video blob converted to Uint8Array, size:', uint8Array.length);

      const stmt = this.db.prepare(`
        INSERT INTO fullclip_videos (filename, original_filename, file_language, duration, created_at, video_blob, script, captions, original_file_content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([filename, originalFilename, language, duration, createdAt, uint8Array, script, captionsJson, originalFileContent]);
      
      // Get the inserted ID
      const result = this.db.exec("SELECT last_insert_rowid()");
      const videoId = result[0].values[0][0];

      stmt.free();
      await this.saveDatabase();

      console.log('FullClip video saved successfully with ID:', videoId);
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
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, script, captions, original_file_content
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
          original_file_content: (row[9] as string) || ''
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
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, script, captions, original_file_content
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
        original_file_content: (row[9] as string) || ''
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

  // Shorts video methods (videos with avatars)
  async saveShortsVideo(
    filename: string,
    originalFilename: string,
    language: string,
    duration: number,
    videoBlob: Blob,
    avatarType: string,
    avatarPosition: string,
    avatarSize: number,
    originalFileContent: string = ''
  ): Promise<number> {
    try {
      await this.initialize();
      console.log('Saving Shorts video:', { filename, originalFilename, language, duration, blobSize: videoBlob.size });

      const arrayBuffer = await videoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const createdAt = new Date().toISOString();

      console.log('Shorts video blob converted to Uint8Array, size:', uint8Array.length);

      const stmt = this.db.prepare(`
        INSERT INTO shorts_videos (filename, original_filename, file_language, duration, created_at, video_blob, avatar_type, avatar_position, avatar_size, original_file_content)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([filename, originalFilename, language, duration, createdAt, uint8Array, avatarType, avatarPosition, avatarSize, originalFileContent]);
      
      // Get the inserted ID
      const result = this.db.exec("SELECT last_insert_rowid()");
      const videoId = result[0].values[0][0];

      stmt.free();
      await this.saveDatabase();

      console.log('Shorts video saved successfully with ID:', videoId);
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
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, avatar_type, avatar_position, avatar_size, original_file_content
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
          original_file_content: (row[10] as string) || ''
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
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob, avatar_type, avatar_position, avatar_size, original_file_content
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
        original_file_content: (row[10] as string) || ''
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

  // Debug method to check database status
  async getStats(): Promise<{ videoCount: number; fullClipCount: number; shortsCount: number; dbSize: number }> {
    try {
      await this.initialize();
      
      const videoCountResult = this.db.exec('SELECT COUNT(*) FROM videos');
      const videoCount = videoCountResult[0]?.values[0]?.[0] || 0;
      
      const fullClipCountResult = this.db.exec('SELECT COUNT(*) FROM fullclip_videos');
      const fullClipCount = fullClipCountResult[0]?.values[0]?.[0] || 0;
      
      const shortsCountResult = this.db.exec('SELECT COUNT(*) FROM shorts_videos');
      const shortsCount = shortsCountResult[0]?.values[0]?.[0] || 0;
      
      // Get database size from IndexedDB
      let dbSize = 0;
      try {
        const savedDb = await this.loadDatabaseFromIndexedDB();
        dbSize = savedDb ? savedDb.length : 0;
      } catch (error) {
        console.warn('Could not get database size:', error);
      }
      
      return { videoCount, fullClipCount, shortsCount, dbSize };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return { videoCount: 0, fullClipCount: 0, shortsCount: 0, dbSize: 0 };
    }
  }
}

export const dbManager = new DatabaseManager();