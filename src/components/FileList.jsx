import React from 'react';
import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';
import Modal from './Modal';

const FileList = ({ refreshTrigger = 0, onPathChange }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [deleteLoading, setDeleteLoading] = useState({});
  const [userGroups, setUserGroups] = useState([]);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState(['']); // Track navigation history
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [folders, setFolders] = useState([]);
  const [userSub, setUserSub] = useState(null);

  // Function to navigate to a folder
  const navigateToFolder = (folderPath) => {
    setCurrentPath(folderPath);
    onPathChange?.(folderPath); // Use optional chaining
    setPathHistory(prev => [...prev.slice(0, currentPathIndex + 1), folderPath]);
    setCurrentPathIndex(prev => prev + 1);
  };
  
  // Function to go back
  const goBack = () => {
    if (currentPathIndex > 0) {
      const newIndex = currentPathIndex - 1;
      const previousPath = pathHistory[newIndex];
      setCurrentPath(previousPath);
      setCurrentPathIndex(newIndex);
      onPathChange?.(previousPath); // Use optional chaining
    }
  };
  
  // Function for root navigation
  const goToRoot = () => {
    const rootPath = '';
    setCurrentPath(rootPath);
    onPathChange?.(rootPath); // Use optional chaining
    setPathHistory([rootPath]);
    setCurrentPathIndex(0);
  };

//   const handlePathChange = (newPath) => {
//     // Normalize the path
//     let normalizedPath = newPath;
//     if (!normalizedPath.startsWith('uploads/')) {
//         normalizedPath = 'uploads/' + normalizedPath;
//     }
//     if (!normalizedPath.endsWith('/')) {
//         normalizedPath += '/';
//     }
    
//     setCurrentPath(normalizedPath);

//     if (hasRole('author') && !normalizedPath.startsWith(`uploads/${username}/`)) {
//         setError('Note: You can only upload files in your personal folder.');
//     } else {
//         setError(null);
//     }
//   };

  // Check if user has specific role
  const hasRole = (role) => {

    // Handle both string and array cases
    if (typeof userGroups === 'string') {
        return userGroups === role;
    }

    return Array.isArray(userGroups) && userGroups.includes(role);
  };
  
  // Check if user can delete a file
  const canDelete = (file) => {

    // Super admins and content managers can delete any file
    if (hasRole('superadmin') || hasRole('contentmanager')) {
        return true;
    }
    // Authors can only delete their own files
    if (hasRole('author')) {
        const canDeleteFile = file.key.includes(`/${userSub}/`);
        return canDeleteFile;
    }
    return false;
  };
  const fetchFiles = async () => {
    try {
        setLoading(true);
        const { tokens } = await fetchAuthSession();

        // Get userSub from token
        const payload = tokens.idToken.payload;
        setUserSub(payload.sub);

        const response = await fetch(`https://kc0jhbt5j0.execute-api.us-east-1.amazonaws.com/dev/list-files?path=${currentPath}`, {
            headers: {
                'Authorization': tokens.idToken.toString()
            }
        });

        if (!response.ok) throw new Error('Failed to fetch files');

        const data = await response.json();
        setFiles(data.files);
        setFolders(data.folders);
        // Convert string to array if necessary
        setUserGroups(typeof data.userGroups === 'string' ? [data.userGroups] : data.userGroups);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentPath, refreshTrigger]); // Add refreshTrigger to dependencies

  const handleDownload = async (fileKey, fileName) => {
    try {
      setDownloadLoading(prev => ({ ...prev, [fileKey]: true }));
      
      const { tokens } = await fetchAuthSession();
      const response = await fetch('https://kc0jhbt5j0.execute-api.us-east-1.amazonaws.com/dev/generate-download-url', {
        method: 'POST',
        headers: {
          'Authorization': tokens.idToken.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: fileKey })
      });

      if (!response.ok) throw new Error('Failed to generate download URL');

      const { downloadUrl } = await response.json();

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      setError(`Failed to download ${fileName}: ${err.message}`);
    } finally {
      setDownloadLoading(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const handleDelete = async (fileKey, fileName) => {
    try {
      setDeleteLoading(prev => ({ ...prev, [fileKey]: true }));
      
      const { tokens } = await fetchAuthSession();
      const response = await fetch('https://kc0jhbt5j0.execute-api.us-east-1.amazonaws.com/dev/delete-file', {
        method: 'POST',
        headers: {
          'Authorization': tokens.idToken.toString(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: fileKey })
      });

      if (!response.ok) throw new Error('Failed to delete file');

      setFiles(prev => prev.filter(file => file.key !== fileKey));
      setFileToDelete(null);

    } catch (err) {
      setError(`Failed to delete ${fileName}: ${err.message}`);
    } finally {
      setDeleteLoading(prev => ({ ...prev, [fileKey]: false }));
    }
  };

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    await handleDelete(fileToDelete.key, fileToDelete.fileName);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const modalActions = (
    <>
      <button
        type="button"
        className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors"
        onClick={() => setFileToDelete(null)}
      >
        Cancel
      </button>
      <button
        type="button"
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        onClick={handleDeleteConfirm}
      >
        Delete
      </button>
    </>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Files and Folders</h2>
          {Array.isArray(userGroups) && userGroups.length > 0 && (
            <span className="text-sm text-gray-600">
              Role: {userGroups.join(', ')}
            </span>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Breadcrumb navigation */}
        <div className="flex items-center space-x-2 mb-4 bg-gray-50 p-3 rounded">
          <button 
            onClick={goToRoot}
            className="text-blue-600 hover:text-blue-800"
          >
            Root
          </button>
          {currentPath && currentPath.split('/').filter(Boolean).map((segment, index, array) => (
            <React.Fragment key={index}>
              <span>/</span>
              <button
                onClick={() => {
                  const newPath = array.slice(0, index + 1).join('/') + '/';
                  navigateToFolder(newPath);
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                {segment}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Folders list */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Folders</h3>
          <div className="grid grid-cols-4 gap-4">
            {currentPath && (
              <button
                onClick={goBack}
                className="flex items-center p-4 border rounded hover:bg-gray-50"
              >
                <span className="mr-2">⬆️</span>
                Back
              </button>
            )}
            {folders.map(folder => {
              const folderName = folder.split('/').filter(Boolean).pop();
              return (
                <button
                  key={folder}
                  onClick={() => navigateToFolder(folder)}
                  className="flex items-center p-4 border rounded hover:bg-gray-50"
                >
                  <span className="mr-2">📁</span>
                  {folderName}
                </button>
              );
            })}
          </div>
        </div>

        {files.length === 0 ? (
          <p className="text-gray-500">No files available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {file.fileName}
                      {file.userOwned && (
                        <span className="ml-2 text-xs text-blue-600">(My File)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.lastModified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleDownload(file.key, file.fileName)}
                        disabled={downloadLoading[file.key]}
                        className={`text-blue-600 hover:text-blue-900 font-medium mr-4 ${
                          downloadLoading[file.key] ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {downloadLoading[file.key] ? 'Downloading...' : 'Download'}
                      </button>
                      
                      {canDelete(file) && (
                        <button
                          onClick={() => setFileToDelete(file)}
                          disabled={deleteLoading[file.key]}
                          className={`text-red-600 hover:text-red-900 font-medium ${
                            deleteLoading[file.key] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {deleteLoading[file.key] ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
    <Modal
    isOpen={!!fileToDelete}
    onClose={() => setFileToDelete(null)}
    title="Confirm Delete"
    actions={
        <>
        <button
            onClick={() => setFileToDelete(null)}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
        >
            Cancel
        </button>
        <button
            onClick={handleDeleteConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
            Delete
        </button>
        </>
    }
    >
    <p>
        Are you sure you want to delete <span className="font-semibold">{fileToDelete?.fileName}</span>?
        This action cannot be undone.
    </p>
    </Modal>
    </div>
  );
};

export default FileList;