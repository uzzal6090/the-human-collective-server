import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { database, mongoClient } from "./database.js";

export const auth = betterAuth({
  database: mongodbAdapter(database, {
    client: mongoClient,
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,

  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:3000",
    "https://*.vercel.app",
  ],

  emailAndPassword: {
    enabled: true,
  },

  plugins: [jwt()],
});