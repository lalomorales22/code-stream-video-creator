import initSqlJs from 'sql.js';

export interface VideoRecord {
  id: number;
  filename: string;
  original_filename: string;
  file_language: string;
  duration: number;
  created_at: string;
  video_blob: Uint8Array;
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
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS videos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT NOT NULL,
          original_filename TEXT NOT NULL,
          file_language TEXT NOT NULL,
          duration INTEGER NOT NULL,
          created_at TEXT NOT NULL,
          video_blob BLOB NOT NULL
        );
      `;

      this.db.run(createTableSQL);
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

  async saveVideo(
    filename: string,
    originalFilename: string,
    language: string,
    duration: number,
    videoBlob: Blob
  ): Promise<number> {
    try {
      await this.initialize();
      console.log('Saving video:', { filename, originalFilename, language, duration, blobSize: videoBlob.size });

      const arrayBuffer = await videoBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const createdAt = new Date().toISOString();

      console.log('Video blob converted to Uint8Array, size:', uint8Array.length);

      const stmt = this.db.prepare(`
        INSERT INTO videos (filename, original_filename, file_language, duration, created_at, video_blob)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run([filename, originalFilename, language, duration, createdAt, uint8Array]);
      
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
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob
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
          video_blob: row[6] as Uint8Array
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
        SELECT id, filename, original_filename, file_language, duration, created_at, video_blob
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
        video_blob: row[6] as Uint8Array
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

  async clearAllVideos(): Promise<void> {
    try {
      await this.initialize();
      this.db.run('DELETE FROM videos');
      await this.saveDatabase();
      console.log('All videos cleared from database');
    } catch (error) {
      console.error('Failed to clear videos:', error);
      throw error;
    }
  }

  // Debug method to check database status
  async getStats(): Promise<{ videoCount: number; dbSize: number }> {
    try {
      await this.initialize();
      
      const countResult = this.db.exec('SELECT COUNT(*) FROM videos');
      const videoCount = countResult[0]?.values[0]?.[0] || 0;
      
      // Get database size from IndexedDB
      let dbSize = 0;
      try {
        const savedDb = await this.loadDatabaseFromIndexedDB();
        dbSize = savedDb ? savedDb.length : 0;
      } catch (error) {
        console.warn('Could not get database size:', error);
      }
      
      return { videoCount, dbSize };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return { videoCount: 0, dbSize: 0 };
    }
  }
}

export const dbManager = new DatabaseManager();