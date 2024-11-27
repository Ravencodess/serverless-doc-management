import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, User, LogOut } from "lucide-react";
import { Toaster } from "react-hot-toast";
// import

interface LayoutProps {
  children: React.ReactNode;
  username: string;
  signOut: () => void;
  showProfile?: boolean;
}

export default function Layout({
  children,
  username,
  signOut,
  showProfile,
}: LayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
      {/* Sidebar */}
      <aside
        className={`z-30 w-64 bg-white shadow-md dark:bg-gray-800 h-full overflow-hidden transform transition-transform duration-300 md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } max-md:fixed max-md:top-0 max-md:left-0`}
      >
        <div className="p-4">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
            Phenomenal Energy Document Management System
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

          {showProfile && (
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
          )}
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

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50"
          onClick={toggleSidebar}
        />
      )}

      <main className="flex-1 overflow-y-auto p-8 max-h-screen max-md:p-2">
        <div className="max-md:block md:hidden mb-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>

        <div className="mx-auto max-w-4xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">
              Welcome, {username || "User"}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your files and folders
            </p>
          </header>
          <div className="flex-1 overflow-hidden overflow-y-auto">
            {children}
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
