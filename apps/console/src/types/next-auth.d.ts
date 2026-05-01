import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "collector" | "artist" | "operator";
    } & DefaultSession["user"];
  }
}
