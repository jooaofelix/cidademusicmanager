/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "2mb" } },

  // O Prisma carrega um binário em tempo de execução. Se o Next tentar
  // empacotá-lo junto do código, esse binário fica para trás e o site quebra
  // em produção com PrismaClientInitializationError. Listar aqui faz o Next
  // deixar o pacote intacto, resolvido normalmente pelo Node.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
