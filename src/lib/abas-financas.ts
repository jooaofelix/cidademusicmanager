// As abas de finanças, montadas conforme quem está olhando.
//
// O painel é aberto a toda a banda: qualquer um vê quanto há em caixa e como
// os projetos vão. As telas que registram dinheiro — lançamentos, projetos e
// streaming — são de quem cuida do caixa.
//
// Esconder a aba é só cortesia com quem não tem acesso; quem digitar o
// endereço direto é barrado pelo requireTreasurer de cada página, e as ações
// de gravar conferem de novo no servidor.

export function abasFinancas(ehTesoureiro: boolean) {
  const abas = [{ href: "/financas", label: "Painel" }];

  if (ehTesoureiro) {
    abas.push(
      { href: "/financas/lancamentos", label: "Lançamentos" },
      { href: "/financas/projetos", label: "Projetos" },
      { href: "/financas/streaming", label: "Streaming" },
    );
  }

  return abas;
}
