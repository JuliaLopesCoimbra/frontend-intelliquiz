import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, refreshToken } = await req.json();

    if (!token) {
      return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });
    }

    const res = NextResponse.json({ ok: true });

    // ~30 dias para refresh, access conforme seu exp (~1h) — aqui uso o exp do próprio JWT se quiser
    const ONE_DAY = 60 * 60 * 24;

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      // maxAge opcional: se preferir confiar no exp do JWT, pode omitir
      maxAge: ONE_DAY, 
    });

    if (refreshToken) {
      res.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: ONE_DAY * 30,
      });
    }

    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: "bad payload" }, { status: 400 });
  }
}
