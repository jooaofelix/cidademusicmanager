import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";

const COOKIE = "cm_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 dias

function secret() {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv) return fromEnv;

  // Em produção, sem chave própria qualquer um poderia forjar um cookie de
  // sessão — melhor não subir do que subir aberto.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET não está definida. Configure uma chave aleatória longa antes de publicar."
    );
  }

  return "dev-secret-cidade-music";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function verify(value: string, signature: string) {
  const expected = Buffer.from(sign(value));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export async function createSession(memberId: string) {
  const jar = await cookies();
  jar.set(COOKIE, `${memberId}.${sign(memberId)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export type SessionMember = {
  id: string;
  name: string;
  instrument: string;
  isAdmin: boolean;
  /** Cuida do dinheiro: lançamentos, projetos, streaming e quem mais acessa. */
  isTreasurer: boolean;
};

export async function getCurrentMember(): Promise<SessionMember | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const idx = raw.lastIndexOf(".");
  if (idx < 1) return null;

  const id = raw.slice(0, idx);
  const signature = raw.slice(idx + 1);
  if (!verify(id, signature)) return null;

  const member = await db.member.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      instrument: true,
      isAdmin: true,
      isTreasurer: true,
      active: true,
    },
  });
  if (!member || !member.active) return null;

  return {
    id: member.id,
    name: member.name,
    instrument: member.instrument,
    isAdmin: member.isAdmin,
    isTreasurer: member.isTreasurer,
  };
}

/** Usa em rotas protegidas — manda para o login se não houver sessão válida. */
export async function requireMember(): Promise<SessionMember> {
  const member = await getCurrentMember();
  if (!member) redirect("/entrar");
  return member;
}

/**
 * Usa nas telas de dinheiro além do painel. Quem não cuida do caixa volta
 * para o painel de finanças, que é aberto a todos — em vez de tomar um erro
 * ou cair no login já estando logado.
 */
export async function requireTreasurer(): Promise<SessionMember> {
  const member = await requireMember();
  if (!member.isTreasurer) redirect("/financas");
  return member;
}
