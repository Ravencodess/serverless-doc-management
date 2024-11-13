import { useState, useEffect } from 'react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { fetchAuthSession } from 'aws-amplify/auth';
import FileUpload from '../components/FileUpload';
import FileList from '../components/FileList';

const Dashboard = () => {
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [error, setError] = useState(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [refreshKey, setRefreshKey] = useState(0); // Add this for triggering refresh
  const [username, setUsername] = useState('');
  const [userGroups, setUserGroups] = useState([]);

  const hasRole = (role) => {
    if (typeof userGroups === 'string') {
      return userGroups === role;
    }
    return Array.isArray(userGroups) && userGroups.includes(role);
  };

  // Get user info on mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        const payload = tokens.idToken.payload;
        setUsername(payload['cognito:username']);
        // Handle groups same way as in FileList
        const groups = payload['cognito:groups'] || [];
        setUserGroups(typeof groups === 'string' ? [groups] : groups);
      } catch (err) {
        setError(err.message);
      }
    };

    getUserInfo();
  }, []);

  const handlePathChange = (newPath) => {
    // Normalize the path
    let normalizedPath = newPath;
    if (!normalizedPath.endsWith('/')) {
      normalizedPath += '/';
    }
    
    setCurrentPath(normalizedPath);

    if (hasRole('author') && !normalizedPath.startsWith(`${username}/`)) {
      setError('Note: You can only upload files in your personal folder.');
    } else {
      setError(null);
    }
  };

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1); // Trigger FileList refresh
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Welcome {user?.username || 'User'}
      </h1>
      
      <div className="mb-8">
        <FileUpload 
          currentPath={currentPath}
          userGroups={userGroups}
          username={username}
          onUploadComplete={handleUploadComplete}
        />
      </div>

      <div className="mb-8">
        <FileList
          refreshTrigger={refreshKey} 
          onPathChange={handlePathChange}
          currentPath={currentPath}
          username={username}
          userGroups={userGroups}
          hasRole={hasRole}
        />
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={signOut}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default Dashboard;