"use client";

import { useQuery } from "@apollo/client";
import { GET_POSTS } from "@/lib/graphql/operations";

export function PostList() {
  const { loading, error, data } = useQuery(GET_POSTS);

  if (loading) return <p>Loading posts...</p>;
  if (error) return <p>Error loading posts: {error.message}</p>;

  return (
    <div>
      <h2>Posts</h2>
      {data.posts.map((post: any) => (
        <div key={post.id} className="border p-4 mb-2">
          <h3>{post.title}</h3>
          <p>{post.content}</p>
          <p>
            Author: {post.author.name} ({post.author.email})
          </p>
          <p>Created: {new Date(post.createdAt).toUTCString()}</p>
        </div>
      ))}
    </div>
  );
}
