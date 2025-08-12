"use client";

import { useQuery } from "@apollo/client";
import { GET_USERS } from "@/lib/graphql/operations";

export function UserList() {
  const { loading, error, data } = useQuery(GET_USERS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>Users</h2>
      {data.users.map((user: any) => (
        <div key={user.id} className="border p-4 mb-2">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <p>Created: {new Date(Number(user.createdAt)).toUTCString()}</p>
        </div>
      ))}
    </div>
  );
}