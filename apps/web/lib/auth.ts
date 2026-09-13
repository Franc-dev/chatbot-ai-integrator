import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { organization } from "better-auth/plugins";
import { apiKey } from "@better-auth/api-key";
import { prisma } from "@signal/db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
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
