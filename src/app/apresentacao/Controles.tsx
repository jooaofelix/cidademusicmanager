"use client";

import { useEffect } from "react";

/**
 * Barra de comandos da apresentação, e o encaixe do slide na tela.
 *
 * Os slides têm 1920×1080 fixos, para o desenho ser o mesmo no projetor e no
 * PDF. Aqui eles são reduzidos por transform até caberem na largura de quem
 * está olhando — no celular fica pequeno, mas inteiro e na proporção certa.
 * Na impressão a redução é desfeita e cada slide ocupa uma página.
 */
export function Controles({ voltarPara }: { voltarPara: string }) {
  useEffect(() => {
    const ajustar = () => {
      const margem = window.innerWidth > 900 ? 48 : 0;
      const escala = Math.min((window.innerWidth - margem) / 1920, 1);
      document.documentElement.style.setProperty("--escala", String(escala));
    };

    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  return (
    <div className="controles">
      <button type="button" className="principal" onClick={() => window.print()}>
        Salvar em PDF
      </button>
      <a href={voltarPara}>Voltar ao relatório</a>
    </div>
  );
}
