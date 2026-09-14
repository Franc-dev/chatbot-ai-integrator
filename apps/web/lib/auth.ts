import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { prisma } from "@signal/db";

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;

// The console answers on its own domain plus every Vercel alias, and Better Auth
// rejects any origin it was not told about up front.
const trustedOrigins = [
  baseURL,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`,
  process.env.VERCEL_BRANCH_URL && `https://${process.env.VERCEL_BRANCH_URL}`,
  process.env.VERCEL_PROJECT_PRODUCTION_URL &&
    `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`,
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  trustedOrigins: Array.from(new Set(trustedOrigins)),
  emailAndPassword: { enabled: true },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
    }),
    apiKey([
      {
        configId: "org-secret",
        defaultPrefix: "sk_",
        references: "organization",
      },
      {
        configId: "org-public",
        defaultPrefix: "pk_",
        references: "organization",
      },
    ]),
  ],
  session: {
    cookieCache: { enabled: true, maxAge: 60 },
  },
});

export type Session = typeof auth.$Infer.Session;
