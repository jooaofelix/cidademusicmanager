// Confere as variáveis de ambiente antes do build.
//
// Sem isso, esquecer de cadastrar DATABASE_URL faz o Prisma falhar com um
// erro críptico (P1012, "get-config wasm"). Aqui a mensagem diz o que fazer.

const problemas = [];

if (!process.env.DATABASE_URL) {
  problemas.push({
    nome: "DATABASE_URL",
    explicacao: "É o endereço do banco de dados PostgreSQL.",
    comoResolver: [
      "Crie um banco grátis em https://neon.com (Create project).",
      'Copie a "connection string" que ele mostra — começa com postgresql://',
      "Cadastre como DATABASE_URL nas variáveis de ambiente do seu host.",
      "No Neon, se aparecerem duas opções, use a direct (não a pooled).",
    ],
  });
}

if (!process.env.SESSION_SECRET) {
  problemas.push({
    nome: "SESSION_SECRET",
    explicacao: "É a chave que assina o login. Sem ela qualquer um poderia forjar uma sessão.",
    comoResolver: [
      "Invente um texto longo e aleatório (30+ caracteres, sem espaços).",
      "Cadastre como SESSION_SECRET nas variáveis de ambiente do seu host.",
      "Não precisa memorizar — só não pode mudar depois, senão todo mundo é deslogado.",
    ],
  });
}

if (problemas.length === 0) {
  console.log("✓ Variáveis de ambiente OK");
  process.exit(0);
}

console.error("\n" + "─".repeat(64));
console.error("  O BUILD PAROU: falta configurar variável de ambiente");
console.error("─".repeat(64));

for (const p of problemas) {
  console.error(`\n  ✗ ${p.nome} não está definida`);
  console.error(`    ${p.explicacao}\n`);
  for (const passo of p.comoResolver) {
    console.error(`      • ${passo}`);
  }
}

console.error(`
─${"─".repeat(63)}
  Onde cadastrar:

    Vercel   Project Settings → Environment Variables
    Railway  aba Variables do serviço
    Fly.io   fly secrets set NOME="valor"
    Local    arquivo .env na raiz do projeto (copie de .env.example)

  Depois de cadastrar, rode o deploy de novo.
─${"─".repeat(63)}
`);

process.exit(1);
