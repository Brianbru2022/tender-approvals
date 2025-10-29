// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { USERS } from "@/lib/users"; // <-- 1. We import your user list

export const authOptions = {
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // This is where we check the password
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        // 2. We find the user in your hard-coded list
        const user = USERS.find(
          (u) =>
            u.email.toLowerCase() === credentials.email.toLowerCase() &&
            u.password === credentials.password
        );

        // 3. If a user is found, we return their data
        if (user) {
          // This data is what gets saved in the secure cookie
          return {
            id: user.email, // Use email as ID
            email: user.email,
            roles: user.roles, // Pass our roles array
          };
        } else {
          // If you return null then an error will be displayed
          return null;
        }
      },
    }),
  ],

  // We need to tell NextAuth how to handle our custom `roles`
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      // On sign in, pass the roles to the token
      if (user) {
        token.roles = user.roles;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      // Pass the roles to the client-side session
      if (token && session.user) {
        session.user.roles = token.roles;
      }
      return session;
    },
  },

  // Tell NextAuth to use our custom login page
  pages: {
    signIn: "/login",
  },
};

// This exports the GET and POST handlers
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };