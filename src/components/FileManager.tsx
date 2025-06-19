import React, { useRef } from 'react';
import { Upload, File, Folder, Code } from 'lucide-react';
import { FileData } from '../App';

interface FileManagerProps {
  files: FileData[];
  onFilesUploaded: (files: FileData[]) => void;
  onFileSelect: (file: FileData) => void;
  selectedFile: FileData | null;
}

const FileManager: React.FC<FileManagerProps> = ({
  files,
  onFilesUploaded,
  onFileSelect,
  selectedFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'bash',
      'yml': 'yaml',
      'yaml': 'yaml',
      'md': 'markdown'
    };
    return languageMap[extension || ''] || 'text';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = Array.from(event.target.files || []);
    
    const processedFiles: FileData[] = [];
    let filesProcessed = 0;
    
    uploadedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Get the raw file content as string - no processing at all
        const rawContent = e.target?.result as string;
        
        // Only basic validation - no cleaning or modification
        if (typeof rawContent === 'string') {
          const newFile: FileData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            content: rawContent, // Use exactly what was read from the file
            language: getLanguageFromFileName(file.name)
          };
          
          processedFiles.push(newFile);
        }
        
        filesProcessed++;
        
        // When all files are processed, upload them
        if (filesProcessed === uploadedFiles.length) {
          onFilesUploaded(processedFiles);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        filesProcessed++;
        if (filesProcessed === uploadedFiles.length) {
          onFilesUploaded(processedFiles);
        }
      };
      
      // Read as text with explicit UTF-8 encoding
      reader.readAsText(file, 'UTF-8');
    });
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (language: string) => {
    return <Code className="w-5 h-5 text-white" />;
  };

  return (
    <div className="bg-black border-2 border-white rounded-xl p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 border-2 border-white rounded-lg">
          <Folder className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">File Manager</h2>
      </div>

      <button
        onClick={handleUploadClick}
        className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 px-6 rounded-lg transition-colors 
                   border-2 border-white flex items-center justify-center gap-3 mb-8 text-lg"
      >
        <Upload className="w-5 h-5" />
        Upload Code Files
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.html,.css,.scss,.json,.xml,.sql,.sh,.yml,.yaml,.md,.txt"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {files.length === 0 ? (
          <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-600 rounded-lg">
            <File className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No files uploaded yet</p>
            <p className="text-sm mt-2">Upload code files to get started</p>
          </div>
        ) : (
          files.map(file => (
            <button
              key={file.id}
              onClick={() => onFileSelect(file)}
              className={`w-full text-left p-4 rounded-lg transition-all duration-200 flex items-center gap-4 border-2
                         ${selectedFile?.id === file.id 
                           ? 'bg-white text-black border-white' 
                           : 'bg-black text-white border-gray-600 hover:border-white'
                         }`}
            >
              <div className={`p-2 border-2 rounded-lg ${selectedFile?.id === file.id ? 'border-black' : 'border-white'}`}>
                {getFileIcon(file.language)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-lg truncate">{file.name}</p>
                <p className={`text-sm capitalize font-medium ${selectedFile?.id === file.id ? 'text-gray-600' : 'text-gray-400'}`}>
                  {file.language}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default FileManager;