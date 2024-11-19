import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Folder, User, LogOut } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  username: string;
  signOut: () => void;
}

export default function Layout({ children, username, signOut }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md dark:bg-gray-800">
        <div className="p-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Dashboard
          </h2>
        </div>
        <nav className="mt-4">
          <Link
            to="/"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 ${
              location.pathname === "/" ? "bg-gray-200 dark:bg-gray-700" : ""
            }`}
          >
            <Home className="mr-2 h-5 w-5" />
            Home
          </Link>
          <Link
            to="/files"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 ${
              location.pathname === "/files"
                ? "bg-gray-200 dark:bg-gray-700"
                : ""
            }`}
          >
            <Folder className="mr-2 h-5 w-5" />
            Files
          </Link>
          <Link
            to="/profile"
            className={`flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 dark:text-gray-200 dark:hover:bg-gray-700 ${
              location.pathname === "/profile"
                ? "bg-gray-200 dark:bg-gray-700"
                : ""
            }`}
          >
            <User className="mr-2 h-5 w-5" />
            Profile
          </Link>
          <div className="absolute bottom-4 px-4">
            <button
              onClick={signOut}
              className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome, {username || "User"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your files and folders
            </p>
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
