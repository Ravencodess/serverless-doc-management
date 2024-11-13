import { useState } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

const FileUpload = ({ currentPath, userGroups, username, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setUploadProgress(0);
      setUploadSuccess(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
    setUploading(false);
    setUploadSuccess(false);
    // Reset file input
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
  };

  // Check if user can upload to current path
  const hasRole = (role) => {
    if (typeof userGroups === 'string') {
      return userGroups === role;
    }
    return Array.isArray(userGroups) && userGroups.includes(role);
  };

  const canUploadToPath = (path) => {
    if (hasRole('superadmin') || hasRole('contentmanager')) {
      return true;
    }
    if (hasRole('author')) {
      return path.startsWith(`${username}/`);
    }
    return false;
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    if (!canUploadToPath(currentPath)) {
        setError('You do not have permission to upload to this location');
        return;
    }

    try {
      setUploading(true);
      setError(null);

      const { tokens } = await fetchAuthSession();
      const response = await fetch('https://kc0jhbt5j0.execute-api.us-east-1.amazonaws.com/dev/generate-upload-url', {
        method: 'POST',
        headers: {
          'Authorization': tokens.idToken.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fileName: selectedFile.name,
            fileType: selectedFile.type,
            targetPath: currentPath
          })
      });

      if (!response.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl, key } = await response.json();

      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => reject(new Error('Upload failed'));

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', selectedFile.type);
        xhr.send(selectedFile);
      });

      setUploadSuccess(true);
      if (onUploadComplete) {
        onUploadComplete(); // Call parent's callback if provided
      }
      
      // Reset after 3 seconds
      setTimeout(() => {
        resetUpload();
      }, 3000);

    } catch (err) {
      setError(err.message);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }

  };

  // Only show upload if user has permission
  if (!canUploadToPath(currentPath)) {
    return null;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Show current upload location */}
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p className="text-sm text-gray-600">
          Current upload location: <span className="font-medium">{currentPath || 'Root'}</span>
        </p>
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-1">
            File will be uploaded to: <span className="font-medium">{currentPath}{selectedFile.name}</span>
          </p>
        )}
        {!canUploadToPath(currentPath) && (
          <p className="text-sm text-red-600 mt-1">
            ⚠️ You don't have permission to upload files here. 
            {hasRole('author') && (
              <span> Please navigate to your personal folder at /{username}/</span>
            )}
          </p>
        )}
      </div>

      {canUploadToPath(currentPath) ? (
        <>
          {/* Existing upload form */}
          {uploadSuccess ? (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
              File uploaded successfully to {currentPath}! Ready for next upload in a moment...
            </div>
          ) : (
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Upload Document
                <span className="block text-gray-500 font-normal text-xs mt-1">
                  Supported files: PDF, TXT, Word, Excel, JPEG, PNG (Max 10MB)
                </span>
              </label>
              <input
            id="file-input"
            type="file"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            disabled={uploading}
            accept=".pdf,.doc,.docx,.xlsx,.xls,.jpg,.jpeg,.png,.txt"
          />
        </div>
      )}
          {selectedFile && !uploadSuccess && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
          </p>
        </div>
      )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {uploadProgress > 0 && !uploadSuccess && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded h-2">
            <div 
              className="bg-blue-600 h-2 rounded transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {Math.round(uploadProgress)}% uploaded
          </p>
        </div>
      )}

      {selectedFile && !uploadSuccess && (
        <button
          onClick={uploadFile}
          disabled={uploading}
          className={`w-full py-2 px-4 rounded transition duration-200 ${
            uploading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-700 text-white'
          }`}
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      )}

        </>
      ) : (
        <div className="p-4 bg-gray-100 rounded text-center">
          {hasRole('viewer') ? (
            <p>Viewers are not allowed to upload files.</p>
          ) : hasRole('author') ? (
            <p>Please navigate to your personal folder to upload files.</p>
          ) : (
            <p>You don't have permission to upload files.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;