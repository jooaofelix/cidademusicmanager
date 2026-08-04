"use client";

/**
 * Abre a impressão do navegador, que no celular e no computador oferece
 * "Salvar como PDF". É o caminho mais curto entre o relatório na tela e um
 * arquivo para enviar ou projetar — sem precisar de nenhuma biblioteca.
 */
export function BotaoImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-primary btn-sm flex-1">
      Salvar em PDF
    </button>
  );
}
