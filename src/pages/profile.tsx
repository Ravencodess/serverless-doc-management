"use client";

import { useState, useEffect, useRef } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  Mail,
  Check,
  X,
  AlertCircle,
  Loader2,
  UserPlus,
  UserMinus,
  Lock,
  Unlock,
  ChevronDown,
} from "lucide-react";
import Layout from "./dashlayout";

interface User {
  username: string;
  attributes: {
    email: string;
    email_verified: string;
    sub: string;
  };
  enabled: boolean;
  status: string;
  groups?: string[];
}

export default function Profile() {
  const roles = ["author", "contentmanager", "viewer", "superadmin"];
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUsers, setOtherUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState(roles[0]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchUserProfile() {
    try {
      const { tokens } = await fetchAuthSession();
      const response = await fetch(
        "https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/list-users",
        {
          method: "GET",
          headers: {
            Authorization: tokens?.idToken?.toString() as string,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const users = await response.json();
      const current = users.find(
        (u: User) => u.username === tokens?.idToken?.payload["cognito:username"]
      );
      setCurrentUser(current);
      setOtherUsers(users.filter((u: User) => u.username !== current.username));
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function switchUserRole(
    username: string,
    role: string,
    action: "add" | "remove"
  ) {
    try {
      const { tokens } = await fetchAuthSession();
      const response = await fetch(
        "https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/switch-roles",
        {
          method: "POST",
          headers: {
            Authorization: tokens?.idToken?.toString() as string,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, role, action }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Switch Role Response:", result);
      setActionMessage(
        `Role ${action === "add" ? "added" : "removed"} successfully`
      );
      fetchUserProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while switching roles"
      );
    }
  }

  async function manageUserStatus(
    username: string,
    action: "disable" | "enable"
  ) {
    try {
      const { tokens } = await fetchAuthSession();
      const response = await fetch(
        "https://nd1hhxi96h.execute-api.us-east-1.amazonaws.com/api/manage-user",
        {
          method: "POST",
          headers: {
            Authorization: tokens?.idToken?.toString() as string,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, action }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Manage User Response:", result);
      setActionMessage(
        `User ${action === "enable" ? "enabled" : "disabled"} successfully`
      );
      fetchUserProfile();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while managing user status"
      );
    }
  }

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const { tokens } = await fetchAuthSession();
        const payload = tokens?.idToken?.payload;
        if (payload) {
          const groups = payload["cognito:groups"] || [];
          setUserGroups(
            typeof groups === "string" ? [groups] : (groups as string[])
          );
        }
      } catch (error) {
        console.error("Error fetching user info: ", error);
      }
    };
    getUserInfo();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setSelectedUser(null);
      }
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const hasRole = (role: string) => {
    if (typeof userGroups === "string") {
      return userGroups === role;
    }
    return Array.isArray(userGroups) && userGroups.includes(role);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        <p className="ml-2 text-lg font-semibold text-indigo-800">
          Loading profile...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
        <AlertCircle className="inline-block mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
        <AlertCircle className="inline-block mr-2" />
        <span>User not found.</span>
      </div>
    );
  }

  return (
    <Layout username={currentUser.username} signOut={() => {}}>
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          {actionMessage && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
              {actionMessage}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherUsers.map((user) => (
              <div
                key={user.attributes.sub}
                className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105 cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">
                      {user.username}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        user.enabled
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.enabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600 mb-2">
                    <Mail className="w-5 h-5 mr-2" />
                    <span className="text-sm">{user.attributes.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="text-sm">{user.status}</span>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 mr-2">
                      Email Verified:
                    </span>
                    {user.attributes.email_verified === "true" ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div
              ref={modalRef}
              className="bg-white rounded-lg p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold mb-4">
                {selectedUser.username}
              </h2>
              <p>
                <strong>Email:</strong> {selectedUser.attributes.email}
              </p>
              <p>
                <strong>Status:</strong> {selectedUser.status}
              </p>
              <p>
                <strong>Enabled:</strong> {selectedUser.enabled ? "Yes" : "No"}
              </p>
              <p>
                <strong>Email Verified:</strong>{" "}
                {selectedUser.attributes.email_verified}
              </p>
              <p>
                <strong>Sub:</strong> {selectedUser.attributes.sub}
              </p>
              <p>
                <strong>Groups:</strong>{" "}
                {selectedUser.groups?.join(", ") || "None"}
              </p>
              {hasRole("superadmin") && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Manage User</h3>
                  <div className="flex flex-wrap gap-2 items-center">
                    <div ref={dropdownRef} className="relative">
                      <button
                        onClick={() =>
                          setIsRoleDropdownOpen(!isRoleDropdownOpen)
                        }
                        className="bg-white border border-gray-300 rounded-md px-4 py-2 inline-flex items-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {selectedRole}
                        <ChevronDown
                          className="ml-2 h-5 w-5"
                          aria-hidden="true"
                        />
                      </button>
                      {isRoleDropdownOpen && (
                        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                          <div
                            className="py-1"
                            role="menu"
                            aria-orientation="vertical"
                            aria-labelledby="options-menu"
                          >
                            {roles.map((role) => (
                              <button
                                key={role}
                                onClick={() => {
                                  setSelectedRole(role);
                                  setIsRoleDropdownOpen(false);
                                }}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                                role="menuitem"
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        switchUserRole(
                          selectedUser.username,
                          selectedRole,
                          "add"
                        )
                      }
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm flex items-center"
                    >
                      <UserPlus className="w-4 h-4 mr-1" /> Add Role
                    </button>
                    <button
                      onClick={() =>
                        switchUserRole(
                          selectedUser.username,
                          selectedRole,
                          "remove"
                        )
                      }
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm flex items-center"
                    >
                      <UserMinus className="w-4 h-4 mr-1" /> Remove Role
                    </button>
                    <button
                      onClick={() =>
                        manageUserStatus(
                          selectedUser.username,
                          selectedUser.enabled ? "disable" : "enable"
                        )
                      }
                      className={`${
                        selectedUser.enabled ? "bg-red-500" : "bg-green-500"
                      } text-white px-2 py-1 rounded text-sm flex items-center`}
                    >
                      {selectedUser.enabled ? (
                        <>
                          <Lock className="w-4 h-4 mr-1" /> Disable User
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-1" /> Enable User
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <button
                className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition duration-300"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
