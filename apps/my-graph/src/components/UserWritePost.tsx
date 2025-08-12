"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  GET_USERS,
  GET_USER,
  CREATE_USER,
  CREATE_POST,
  UPDATE_USER,
  DELETE_USER,
  UPDATE_POST,
  DELETE_POST,
} from "@/lib/graphql/operations";

export function UserWritePost() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");

  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostContent, setEditPostContent] = useState("");

  const { loading, error, data, refetch } = useQuery(GET_USERS);

  const {
    loading: userLoading,
    error: userError,
    data: userData,
    refetch: refetchUser,
  } = useQuery(GET_USER, {
    variables: { id: selectedUserId || "" },
    skip: !selectedUserId,
  });

  const [createUser, { loading: creatingUser }] = useMutation(CREATE_USER, {
    onCompleted: () => {
      setShowCreateUser(false);
      setNewUserName("");
      setNewUserEmail("");
      refetch();
    },
  });

  const [updateUser, { loading: updatingUser }] = useMutation(UPDATE_USER, {
    onCompleted: () => {
      setEditingUserId(null);
      setEditUserName("");
      setEditUserEmail("");
      refetch();
    },
  });

  const [deleteUser] = useMutation(DELETE_USER, {
    onCompleted: () => {
      alert("User deleted successfully");
      if (selectedUserId) setSelectedUserId(null);
      refetch();
    },
    onError: (err) => alert("Error deleting user: " + err.message),
  });

  const [createPost, { loading: creatingPost }] = useMutation(CREATE_POST, {
    onCompleted: () => {
      setShowCreatePost(false);
      setNewPostTitle("");
      setNewPostContent("");
      refetchUser();
    },
  });

  const [updatePost, { loading: updatingPost }] = useMutation(UPDATE_POST, {
    onCompleted: () => {
      setEditingPostId(null);
      setEditPostTitle("");
      setEditPostContent("");
      refetchUser();
    },
  });

  const [deletePost] = useMutation(DELETE_POST, {
    onCompleted: () => {
      alert("Post deleted successfully");
      refetchUser();
    },
    onError: (err) => alert("Error deleting post: " + err.message),
  });

  // User handlers
  const handleUserClick = (id: string) => {
    if (selectedUserId === id) {
      setSelectedUserId(null);
      setShowCreatePost(false);
      setEditingUserId(null);
    } else {
      setSelectedUserId(id);
      setShowCreatePost(false);
      setEditingUserId(null);
      setEditingPostId(null);
    }
  };

  const handleCreateUser = () => {
    if (!newUserName || !newUserEmail) return alert("Please fill all fields.");
    createUser({ variables: { name: newUserName, email: newUserEmail } });
  };

  const startEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
  };

  const handleUpdateUser = () => {
    if (!editUserName || !editUserEmail) return alert("Please fill all fields.");
    if (!editingUserId) return;
    updateUser({ variables: { id: editingUserId, name: editUserName, email: editUserEmail } });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUser({ variables: { id: parseInt(id) } });
    }
  };

  // Post handlers
  const handleCreatePost = () => {
    if (!newPostTitle) return alert("Title is required.");
    if (!selectedUserId) return alert("No user selected.");
    createPost({
      variables: {
        title: newPostTitle,
        content: newPostContent,
        authorId: parseInt(selectedUserId),
      },
    });
  };

  const startEditPost = (post: any) => {
    setEditingPostId(post.id);
    setEditPostTitle(post.title);
    setEditPostContent(post.content);
  };

  const handleUpdatePost = () => {
    if (!editPostTitle) return alert("Title is required.");
    if (!editingPostId) return;
    updatePost({ variables: { id: editingPostId, title: editPostTitle, content: editPostContent } });
  };

  const handleDeletePost = (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      deletePost({ variables: { id: parseInt(id) } });
    }
  };

  if (loading)
    return <p className="text-center text-gray-500 mt-10 text-lg">Loading users...</p>;
  if (error)
    return (
      <p className="text-center text-red-500 mt-10 text-lg">
        Error loading users: {error.message}
      </p>
    );

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Header + Create User Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-indigo-600">Users</h2>
        <button
          onClick={() => {
            setShowCreateUser(!showCreateUser);
            setEditingUserId(null);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          + Create User
        </button>
      </div>

      {/* Create User Form */}
      {showCreateUser && (
        <div className="mb-6 p-4 border rounded bg-indigo-50">
          <input
            type="text"
            placeholder="Name"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            className="p-2 border rounded mr-2"
          />
          <input
            type="email"
            placeholder="Email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            className="p-2 border rounded mr-2"
          />
          <button
            onClick={handleCreateUser}
            disabled={creatingUser}
            className="bg-indigo-700 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {creatingUser ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {/* Users List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {[...data.users].reverse().map((user: any) => (
          <div
            key={user.id}
            className={`border rounded-lg p-4 shadow hover:shadow-lg transition-shadow ${
              selectedUserId === user.id ? "bg-indigo-50 border-indigo-400" : "bg-white border-gray-200"
            }`}
          >
            {/* If editing this user, show inputs */}
            {editingUserId === user.id ? (
              <div>
                <input
                  type="text"
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="p-2 border rounded mb-2 w-full"
                />
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  className="p-2 border rounded mb-2 w-full"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateUser}
                    disabled={updatingUser}
                    className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                  >
                    {updatingUser ? "Updating..." : "Update"}
                  </button>
                  <button
                    onClick={() => setEditingUserId(null)}
                    className="bg-gray-400 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => handleUserClick(user.id)} className="cursor-pointer">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{user.name}</h3>
                <p className="text-gray-600 mb-1">{user.email}</p>
                <p className="text-gray-400 text-sm">
                  Created: {new Date(Number(user.createdAt)).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Buttons for edit/delete user */}
            {editingUserId !== user.id && (
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={() => startEditUser(user)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                >
                  Edit User
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Posts Section */}
      {selectedUserId && (
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-indigo-600">
              Posts by {userData?.user.name}
            </h2>
            <button
              onClick={() => {
                setShowCreatePost(!showCreatePost);
                setEditingPostId(null);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              + Create Post
            </button>
          </div>

          {/* Create Post Form */}
          {showCreatePost && (
            <div className="mb-6 p-4 border rounded bg-green-50">
              <input
                type="text"
                placeholder="Post Title"
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="p-2 border rounded mb-2 w-full"
              />
              <textarea
                placeholder="Post Content"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="p-2 border rounded mb-2 w-full"
                rows={4}
              />
              <button
                onClick={handleCreatePost}
                disabled={creatingPost}
                className="bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {creatingPost ? "Creating..." : "Create"}
              </button>
            </div>
          )}

          {userLoading && <p className="text-gray-500 text-center">Loading posts...</p>}
          {userError && (
            <p className="text-red-500 text-center">Error loading posts: {userError.message}</p>
          )}
          {userData && userData.user.posts.length === 0 && (
            <p className="text-gray-600 text-center">No posts found for this user.</p>
          )}

          {/* Posts List */}
          <div className="space-y-5">
            {userData &&
              userData.user.posts.map((post: any) => (
                <div
                  key={post.id}
                  className="border rounded-lg p-5 bg-indigo-50 shadow-sm"
                >
                  {editingPostId === post.id ? (
                    <>
                      <input
                        type="text"
                        value={editPostTitle}
                        onChange={(e) => setEditPostTitle(e.target.value)}
                        className="p-2 border rounded mb-2 w-full"
                      />
                      <textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        className="p-2 border rounded mb-2 w-full"
                        rows={4}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpdatePost}
                          disabled={updatingPost}
                          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        >
                          {updatingPost ? "Updating..." : "Update"}
                        </button>
                        <button
                          onClick={() => setEditingPostId(null)}
                          className="bg-gray-400 text-white px-4 py-2 rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                      <p className="text-gray-700 mb-3">{post.content}</p>
                      <p className="text-gray-400 text-sm">
                        Created: {new Date(post.createdAt).toLocaleString()}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => startEditPost(post)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                        >
                          Edit Post
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Delete Post
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
