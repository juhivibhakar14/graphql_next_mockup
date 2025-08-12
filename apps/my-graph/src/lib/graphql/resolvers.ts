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
      const result = await db
        .insert(users)
        .values({ name, email })
        .returning();
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
      const userId = parseInt(id);

      // First delete posts by this user
      await db.delete(posts).where(eq(posts.authorId, userId));

      // Then delete the user
      await db.delete(users).where(eq(users.id, userId));

      return true;
    },
  },

  User: {
    posts: async (parent: any) => {
      return await db
        .select()
        .from(posts)
        .where(eq(posts.authorId, parent.id));
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
