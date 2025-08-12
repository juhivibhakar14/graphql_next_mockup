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