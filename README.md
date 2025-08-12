# graphql_next_mockup
GraphQL API using Next.js, Drizzle ORM, and PostgreSQL with onDelete: "cascade" relations. Includes user and post management with automatic cleanup of related posts when a user is deleted, reducing the need for manual delete queries. Demonstrates both database-level cascade deletes and application-level delete logic for comparison.


Next.js App Router + GraphQL + Drizzle + PostgreSQL Setup Guide
Step 1: Create Next.js Project
npx create-next-app@latest my-app
cd my-app
Step 2: Install Required Dependencies
# Core dependencies
npm install drizzle-orm drizzle-kit pg
npm install @apollo/server @apollo/client graphql graphql-tag
npm install @as-integrations/next

# Development dependencies
npm install -D @types/pg
Step 3: Set up Environment Variables
Create .env.local file:

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"

# GraphQL
GRAPHQL_ENDPOINT="http://localhost:3000/api/graphql"
Step 4: Configure Drizzle ORM
Create drizzle.config.ts in the root:

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
Step 5: Create Database Schema
Create src/lib/db/schema.ts:

import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Infer TypeScript types for selecting and inserting data using Drizzle ORM.
export type User = typeof users.$inferSelect; // Type of a user row from the database
export type NewUser = typeof users.$inferInsert; // Type for creating a new user
export type Post = typeof posts.$inferSelect; // Type of a post row from the database
export type NewPost = typeof posts.$inferInsert; // Type for creating a new post
Step 6: Set up Database Connection
Create src/lib/db/index.ts:

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
Step 7: Generate and Run Migrations
# Generate migration files
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate
Step 8: Create GraphQL Schema
Create src/lib/graphql/typeDefs.ts:

import { gql } from "graphql-tag";

export const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    createdAt: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String
    authorId: Int!
    author: User!
    createdAt: String!
  }

  type Query {
    users: [User!]!
    user(id: ID!): User
    posts: [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    createPost(title: String!, content: String, authorId: Int!): Post!
    updateUser(id: ID!, name: String, email: String): User!
    deleteUser(id: ID!): Boolean!
  }
`;
Step 9: Create GraphQL Resolvers
Create src/lib/graphql/resolvers.ts:

import { db } from "../db";
import { users, posts } from "../db/schema";
import { eq } from "drizzle-orm";

export const resolvers = {
  Query: {
    users: async () => {
      return await db.select().from(users);
    },

    user: async (_: any, { id }: { id: string }) => {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)));
      return result[0] || null;
    },

    posts: async () => {
      return await db.select().from(posts);
    },

    post: async (_: any, { id }: { id: string }) => {
      const result = await db
        .select()
        .from(posts)
        .where(eq(posts.id, parseInt(id)));
      return result[0] || null;
    },
  },

  Mutation: {
    createUser: async (
      _: any,
      { name, email }: { name: string; email: string }
    ) => {
      const result = await db.insert(users).values({ name, email }).returning();
      return result[0];
    },

    createPost: async (
      _: any,
      {
        title,
        content,
        authorId,
      }: { title: string; content?: string; authorId: number }
    ) => {
      const result = await db
        .insert(posts)
        .values({ title, content, authorId })
        .returning();
      return result[0];
    },

    updateUser: async (
      _: any,
      { id, name, email }: { id: string; name?: string; email?: string }
    ) => {
      const updateData: any = {};
      if (name) updateData.name = name;
      if (email) updateData.email = email;

      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, parseInt(id)))
        .returning();
      return result[0];
    },

    deleteUser: async (_: any, { id }: { id: string }) => {
      await db.delete(users).where(eq(users.id, parseInt(id)));
      return true;
    },
  },

  User: {
    posts: async (parent: any) => {
      return await db.select().from(posts).where(eq(posts.authorId, parent.id));
    },
  },

  Post: {
    author: async (parent: any) => {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, parent.authorId));
      return result[0];
    },
  },
};
Step 10: Create GraphQL API Route
Create src/app/api/graphql/route.ts:

import { ApolloServer } from "@apollo/server";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { typeDefs } from "@/lib/graphql/typeDefs";
import { resolvers } from "@/lib/graphql/resolvers";

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server);

export { handler as GET, handler as POST };
Step 11: Set up Apollo Client
Create src/lib/apollo-client.ts:

import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

const httpLink = createHttpLink({
  uri:
    process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT ||
    "http://localhost:3000/api/graphql",
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
Step 12: Create Apollo Provider
Create src/components/providers/ApolloProvider.tsx:

"use client";

import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apollo-client";
import { ReactNode } from "react";

export function ApolloProviderWrapper({ children }: { children: ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
Step 13: Update Root Layout
Update src/app/layout.tsx:

import { ApolloProviderWrapper } from "@/components/providers/ApolloProvider";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ApolloProviderWrapper>{children}</ApolloProviderWrapper>
      </body>
    </html>
  );
}
Step 14: Create GraphQL Operations
Create src/lib/graphql/operations.ts:

import { gql } from "@apollo/client";

export const GET_USERS = gql`
  query GetUsers {
    users {
      id
      name
      email
      createdAt
    }
  }
`;

export const GET_USER = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      createdAt
      posts {
        id
        title
        content
        createdAt
      }
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($name: String!, $email: String!) {
    createUser(name: $name, email: $email) {
      id
      name
      email
      createdAt
    }
  }
`;

export const GET_POSTS = gql`
  query GetPosts {
    posts {
      id
      title
      content
      createdAt
      author {
        id
        name
        email
      }
    }
  }
`;
Step 15: Create UserList Component
Create src/components/UserList.tsx:

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
Step 16: Update Homepage
Update src/app/page.tsx:

import { UserList } from "@/components/UserList";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">GraphQL + Drizzle + Next.js</h1>
      <UserList />
    </main>
  );
}
Step 17: Package.json Scripts
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
Step 18: Run the Application
# Start development server
npm run dev

# In another terminal, you can explore your database
npm run db:studio
Visit http://localhost:3000/api/graphql to access GraphQL Playground.

Example GraphQL Queries
# Get all users
query {
  users {
    id
    name
    email
    posts {
      id
      title
    }
  }
}

# Create a user
mutation {
  createUser(name: "John Doe", email: "john@example.com") {
    id
    name
    email
  }
}
