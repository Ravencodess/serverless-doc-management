import React, { useState, useEffect } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession } from "aws-amplify/auth";
import Layout from "../pages/dashlayout";
import {
  X,
  Download,
  Trash2,
  Move,
  Folder,
  Search,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import eventDispatcher from "./eventDispatcher";

interface File {
  name: string;
  key: string;
  fileName: string;
  size: number;
  lastModified: string;
  userOwned: boolean;
  type: string;
}

function FileUpload({
  userGroups,
  username,
  onUploadComplete,
}: {
  userGroups: string[];
  username: string;
  onUploadComplete: () => void;
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [customPath, setCustomPath] = useState("");
  const [currentPath, setCurrentPath] = useState("");

  useEffect(() => {
    const path = localStorage.getItem("currentPath");
    if (path) {
      setCurrentPath(path);
    }

    const handlePathChange = (event: Event) => {
      const newPath = (event as CustomEvent).detail;
      setCurrentPath(newPath);
    };

    eventDispatcher.addEventListener("currentPathChange", handlePathChange);

    return () => {
      eventDispatcher.removeEventListener(
        "currentPathChange",
        handlePathChange
      );
    };
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file as unknown as File);
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
    setCustomPath("");
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const hasRole = (role: string) => {
    if (typeof userGroups === "string") {
      return userGroups === role;
    }
    return Array.isArray(userGroups) && userGroups.includes(role);
  };

  const canUploadToPath = (path: string) => {
    if (hasRole("superadmin") || hasRole("contentmanager")) {
      return true;
    }
    if (hasRole("author")) {
      return path.startsWith(`${username}/`);
    }
    return false;
  };

  const uploadFile = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    const uploadPath = customPath.trim() || currentPath;

    if (!uploadPath) {
      setError("Please select or specify a folder to upload to");
      toast("Please select or enter a folder to upload to");
      return;
    }

    if (!canUploadToPath(uploadPath)) {
      setError("You do not have permission to upload to this location");
      return;
    }

    toast.promise(
      (async () => {
        try {
          setUploading(true);
          setError(null);

          const { tokens } = await fetchAuthSession();
          const response = await fetch(
            "https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/generate-upload-url",
            {
              method: "POST",
              headers: {
                Authorization: tokens?.idToken?.toString() as string,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                targetPath: uploadPath,
              }),
            }
          );

          if (!response.ok) throw new Error("Failed to get upload URL");

          const { uploadUrl } = await response.json();

          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              setUploadProgress(percentComplete);
            }
          };

          await new Promise<void>((resolve, reject) => {
            xhr.onload = () => {
              if (xhr.status === 200) {
                resolve();
              } else {
                reject(new Error("Upload failed"));
              }
            };

            xhr.onerror = () => reject(new Error("Upload failed"));

            xhr.open("PUT", uploadUrl);
            xhr.setRequestHeader("Content-Type", selectedFile.type);
            xhr.send(selectedFile as unknown as Document);
          });

          setUploadSuccess(true);
          setCustomPath("");
          if (onUploadComplete) {
            onUploadComplete();
          }

          setTimeout(() => {
            resetUpload();
          }, 3000);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred"
          );
          console.error("Upload error:", err);
          throw err;
        } finally {
          setUploading(false);
        }
      })(),
      {
        loading: "Uploading file...",
        success: "File uploaded successfully!",
        error: "Failed to upload file",
      }
    );
  };

  if (!canUploadToPath(currentPath!)) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Document</h2>
      <div className="mb-4 bg-gray-50 rounded p-3">
        <p className="text-lg text-gray-600">
          Current upload location:{" "}
          <span className="font-bold">{currentPath || "Root"}</span>
        </p>
        {selectedFile && (
          <p className="mt-1 text-sm text-gray-600">
            File will be uploaded to:{" "}
            <span className="font-bold">
              {customPath || currentPath}
              {selectedFile.name}
            </span>
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="file-input"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select File
          <span className="block text-xs font-normal text-gray-500 mt-1">
            Supported files: PDF, TXT, Word, Excel (Max 10MB)
          </span>
        </label>
        <input
          id="file-input"
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          accept=".pdf,.doc,.docx,.xlsx,.xls,.txt"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="custom-path"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Custom Upload Path (optional)
        </label>
        <input
          id="custom-path"
          type="text"
          value={customPath}
          onChange={(e) => setCustomPath(e.target.value)}
          placeholder="Enter custom path or leave blank for current path"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      {selectedFile && !uploadSuccess && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Selected file: {selectedFile.name} (
            {Math.round(selectedFile.size / 1024)} KB)
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">{error}</div>
      )}

      {uploadProgress > 0 && !uploadSuccess && (
        <div className="mb-4">
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-2 bg-blue-600 rounded transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {Math.round(uploadProgress)}% uploaded
          </p>
        </div>
      )}

      {selectedFile && !uploadSuccess && (
        <button
          onClick={uploadFile}
          disabled={uploading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      )}

      {uploadSuccess && (
        <div className="mb-4 bg-green-100 text-green-700 p-3 rounded">
          File uploaded successfully to {customPath || currentPath}! Ready for
          next upload in a moment...
        </div>
      )}
    </div>
  );
}

function FileList({
  refreshTrigger,
  hasRole,
}: {
  refreshTrigger: number;
  hasRole: (role: string) => boolean;
}) {
  const [currentPath, setCurrentPath] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadLoading, setDownloadLoading] = useState<
    Record<string, boolean>
  >({});
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [moveLoading, setMoveLoading] = useState<Record<string, boolean>>({});
  const [fileToDelete, setFileToDelete] = useState<File | null>(null);
  const [fileToMove, setFileToMove] = useState<File | null>(null);
  const [moveDestination, setMoveDestination] = useState("");
  const [folders, setFolders] = useState<string[]>([]);
  const [allFiles, setAllFiles] = useState<File[]>([]);
  console.log({ allFiles, folders });
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const { tokens } = await fetchAuthSession();
      const response = await fetch(
        "https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/list-files",
        {
          headers: {
            Authorization: tokens?.idToken?.toString() as string,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      console.log(data);
      setAllFiles(data.files);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async (path: string = "") => {
    try {
      setLoading(true);
      const { tokens } = await fetchAuthSession();
      const response = await fetch(
        `https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/list-folders?path=${encodeURIComponent(
          path
        )}`,
        {
          headers: {
            Authorization: tokens?.idToken?.toString() as string,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch folders");
      const data = await response.json();
      setFolders(data.folders);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchFolders();
  }, [refreshTrigger]);

  const handleDownload = async (fileKey: string, fileName: string) => {
    toast.promise(
      (async () => {
        try {
          setDownloadLoading((prev) => ({ ...prev, [fileKey]: true }));

          const { tokens } = await fetchAuthSession();
          const response = await fetch(
            "https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/generate-download-url",
            {
              method: "POST",
              headers: {
                Authorization: tokens?.idToken?.toString() as string,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ key: fileKey }),
            }
          );

          if (!response.ok) throw new Error("Failed to generate download URL");

          const { downloadUrl } = await response.json();

          const newTab = window.open(downloadUrl, "_blank");

          if (newTab) {
            newTab.focus();
          } else {
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } catch (err) {
          throw new Error(
            `Failed to download ${fileName}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        } finally {
          setDownloadLoading((prev) => ({ ...prev, [fileKey]: false }));
        }
      })(),
      {
        loading: "Generating download link...",
        success: "File download started!",
        error: (err) => err.message,
      }
    );
  };

  const handleDelete = async (fileKey: string, fileName: string) => {
    toast.promise(
      (async () => {
        try {
          setDeleteLoading((prev) => ({ ...prev, [fileKey]: true }));

          const { tokens } = await fetchAuthSession();
          const response = await fetch(
            "https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/delete-file",
            {
              method: "POST",
              headers: {
                Authorization: tokens?.idToken?.toString() as string,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ key: fileKey }),
            }
          );

          if (!response.ok) throw new Error("Failed to delete file");

          setAllFiles((prev) => prev.filter((file) => file.key !== fileKey));
          setFileToDelete(null);
          setShowDeleteModal(false);
        } catch (err) {
          throw new Error(
            `Failed to delete ${fileName}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        } finally {
          setDeleteLoading((prev) => ({ ...prev, [fileKey]: false }));
        }
      })(),
      {
        loading: "Deleting file...",
        success: "File deleted successfully!",
        error: (err) => err.message,
      }
    );
  };

  const handleMove = async (fileKey: string, destination: string) => {
    toast.promise(
      (async () => {
        try {
          setMoveLoading((prev) => ({ ...prev, [fileKey]: true }));

          const { tokens } = await fetchAuthSession();
          const response = await fetch(
            "https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/move-file",
            {
              method: "POST",
              headers: {
                Authorization: tokens?.idToken?.toString() as string,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sourceKey: fileKey,
                destinationPath: destination,
              }),
            }
          );

          if (!response.ok) throw new Error("Failed to move file");

          setAllFiles((prev) => prev.filter((file) => file.key !== fileKey));
          fetchFiles();
          setFileToMove(null);
          setMoveDestination("");
          setShowMoveModal(false);
        } catch (err) {
          throw new Error(
            `Failed to move file: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
        } finally {
          setMoveLoading((prev) => ({ ...prev, [fileKey]: false }));
        }
      })(),
      {
        loading: "Moving file...",
        success: "File moved successfully!",
        error: (err) => err.message,
      }
    );
  };
  const handleDeleteClick = (file: File) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleMoveClick = (file: File) => {
    setFileToMove(file);
    setShowMoveModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    await handleDelete(fileToDelete.key, fileToDelete.fileName);
  };

  const handleMoveConfirm = async () => {
    if (!fileToMove) return;
    await handleMove(fileToMove.key, moveDestination);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  const filteredFiles = allFiles
    .filter((file) => {
      const matchesSearchQuery = searchQuery
        ? file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
        : true;

      if (currentPath === "") {
        return matchesSearchQuery;
      }

      const matchesPath = file.key.startsWith(currentPath);
      return matchesSearchQuery && matchesPath;
    })
    .sort(
      (a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    )
    .slice(0, currentPath === "" ? 5 : allFiles.length);

  const currentFolders = folders.filter(
    (folder) => folder.startsWith(currentPath) && folder !== currentPath
  );

  const onPathChange = (newPath: string) => {
    setCurrentPath(newPath);
    fetchFolders(newPath);
    localStorage.setItem("currentPath", newPath);

    const pathChangeEvent = new CustomEvent("currentPathChange", {
      detail: newPath,
    });
    eventDispatcher.dispatchEvent(pathChangeEvent);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading files...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Files and Folders</h2>
      {error && (
        <div className="mb-4 bg-red-100 text-red-700 p-3 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="float-right text-red-700 hover:text-red-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-4 flex items-center space-x-2 bg-gray-50 rounded p-3">
        <button
          onClick={() => onPathChange("")}
          className="text-blue-600 hover:text-blue-800"
        >
          Root
        </button>
        {currentPath &&
          currentPath
            .split("/")
            .filter(Boolean)
            .map((segment, index, array) => (
              <React.Fragment key={index}>
                <span>/</span>
                <button
                  onClick={() => {
                    const newPath = array.slice(0, index + 1).join("/") + "/";
                    onPathChange(newPath);
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {segment}
                </button>
              </React.Fragment>
            ))}
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-4">Folders</h3>
        <div className="grid grid-cols-4 gap-4">
          {currentPath && (
            <button
              onClick={() =>
                onPathChange(currentPath.split("/").slice(0, -2).join("/"))
              }
              className="flex items-center justify-start cursor-pointer"
            >
              <ArrowLeft className="mr-2" size={16} />
              Back
            </button>
          )}
          {currentFolders.map((folder) => (
            <button
              key={folder}
              onClick={() => onPathChange(folder)}
              className="flex items-center justify-start"
            >
              <Folder className="mr-2" size={16} />
              {folder.split("/").filter(Boolean).pop()}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="search" className="sr-only">
          Search files
        </label>
        <div className="relative">
          <input
            id="search"
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <p className="text-gray-500">No files available.</p>
      ) : (
        <div className="overflow-x-auto">
          <p className="text-left my-4">
            {currentPath === "" && "Recent Files"}
          </p>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Path
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
              {filteredFiles.map((file) => {
                const highlightText = (text: string, query: string) => {
                  if (!query) return text;
                  const regex = new RegExp(`(${query})`, "gi");
                  return text.split(regex).map((part, index) =>
                    regex.test(part) ? (
                      <span key={index} className="bg-yellow-300">
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  );
                };

                const filePath = file.key.includes("/")
                  ? file.key.split("/").slice(0, -1).join("/")
                  : "root";

                return (
                  <tr key={file.key} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {highlightText(file.fileName, searchQuery)}
                      {file.userOwned && (
                        <span className="ml-2 text-xs text-blue-600">
                          (My File)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {filePath}
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
                        className="mr-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        <Download className="inline-block mr-1" size={16} />
                        {downloadLoading[file.key]
                          ? "Downloading..."
                          : "Download"}
                      </button>

                      {(hasRole("superadmin") ||
                        hasRole("contentmanager") ||
                        (hasRole("author") && file.userOwned)) && (
                        <>
                          <button
                            onClick={() => handleDeleteClick(file)}
                            disabled={deleteLoading[file.key]}
                            className="mr-2 px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                          >
                            <Trash2 className="inline-block mr-1" size={16} />
                            {deleteLoading[file.key] ? "Deleting..." : "Delete"}
                          </button>
                          <button
                            onClick={() => handleMoveClick(file)}
                            disabled={moveLoading[file.key]}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                          >
                            <Move className="inline-block mr-1" size={16} />
                            {moveLoading[file.key] ? "Moving..." : "Move"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            {fileToDelete && (
              <div>
                <p className="mb-4">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold">
                    {fileToDelete?.fileName}
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showMoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Move File</h3>
            {fileToMove && (
              <div>
                <p className="mb-4">
                  Move{" "}
                  <span className="font-semibold">{fileToMove?.fileName}</span>{" "}
                  to:
                </p>
                <input
                  type="text"
                  value={moveDestination}
                  onChange={(e) => setMoveDestination(e.target.value)}
                  placeholder="Enter destination path"
                  className="w-full px-3 py-2 border rounded-md mb-4"
                />
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowMoveModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMoveConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Move
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { signOut } = useAuthenticator((context) => [context.user]);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [username, setUsername] = useState("");
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

  const hasRole = (role: string) => {
    if (typeof userGroups === "string") {
      return userGroups === role;
    }
    return Array.isArray(userGroups) && userGroups.includes(role);
  };

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        const payload = tokens?.idToken?.payload;
        if (payload) {
          setUsername(payload["cognito:username"] as unknown as string);
          const groups = payload["cognito:groups"] || [];
          const userGroups =
            typeof groups === "string" ? [groups] : (groups as string[]);
          setUserGroups(userGroups);
          setShowProfile(userGroups.includes("superadmin"));
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    getUserInfo();
  }, []);

  const handleUploadComplete = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout username={username} signOut={signOut} showProfile={showProfile}>
      <>
        <div className="mb-8">
          <FileUpload
            userGroups={userGroups}
            username={username}
            onUploadComplete={handleUploadComplete}
          />
        </div>

        <div>
          <FileList refreshTrigger={refreshKey} hasRole={hasRole} />
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-100 p-4 text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
      </>
    </Layout>
  );
}
