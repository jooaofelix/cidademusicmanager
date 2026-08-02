import "server-only";
import { cookies } from "next/headers";

// A aparência escolhida fica num cookie, e não no banco, por dois motivos:
// é preferência do aparelho, não da pessoa (o mesmo integrante pode querer
// claro no celular e escuro no computador), e assim o servidor já sabe a cor
// antes de desenhar a página — sem aquele instante de tela branca ou preta
// antes de corrigir.

export const TEMAS = ["sistema", "claro", "escuro"] as const;
export type Tema = (typeof TEMAS)[number];

const COOKIE = "cm_tema";
const UM_ANO = 60 * 60 * 24 * 365;

export function ehTema(valor: unknown): valor is Tema {
  return typeof valor === "string" && (TEMAS as readonly string[]).includes(valor);
}

export async function temaAtual(): Promise<Tema> {
  const salvo = (await cookies()).get(COOKIE)?.value;
  return ehTema(salvo) ? salvo : "sistema";
}

export async function salvarTema(tema: Tema): Promise<void> {
  (await cookies()).set(COOKIE, tema, {
    path: "/",
    maxAge: UM_ANO,
    sameSite: "lax",
  });
}

/**
 * O que vai no atributo data-tema do <html>.
 *
 * "sistema" não vira atributo nenhum: sem ele, o CSS cai no gosto do
 * aparelho pelo prefers-color-scheme, que é justamente o comportamento
 * esperado dessa opção.
 */
export function atributoDoTema(tema: Tema): { "data-tema"?: string } {
  return tema === "sistema" ? {} : { "data-tema": tema };
}
