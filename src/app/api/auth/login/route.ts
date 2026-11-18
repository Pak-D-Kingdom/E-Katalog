import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

const loginSchema = z.object({ email: z.string().email(), kata_sandi: z.string().min(1) });

export async function POST(request: Request) {
  const body = loginSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 400 });

  const admin = await prisma.admin.findUnique({ where: { email: body.data.email } });
  if (!admin || !(await bcrypt.compare(body.data.kata_sandi, admin.kata_sandi))) {
    return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
  }

  const token = await createSession(admin);
  const response = NextResponse.json({ admin: { nama: admin.nama, email: admin.email } });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8
  });
  return response;
}
