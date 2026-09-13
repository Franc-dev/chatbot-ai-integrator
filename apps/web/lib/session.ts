import { headers } from "next/headers";
import { auth } from "./auth";
import { prisma } from "@signal/db";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return session;
}

export async function requireOrg() {
  const session = await requireSession();
  if (!session) return null;
  const orgId = session.session.activeOrganizationId;
  if (!orgId) return null;
  const member = await prisma.member.findFirst({
    where: { organizationId: orgId, userId: session.user.id },
  });
  if (!member) return null;
  return { session, orgId, member };
}
