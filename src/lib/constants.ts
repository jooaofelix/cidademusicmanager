export const EVENT_TYPES = [
  { value: "CULTO", label: "Culto" },
  { value: "ENSAIO", label: "Ensaio" },
  { value: "EVENTO", label: "Evento externo" },
  { value: "GRAVACAO", label: "Gravação" },
  { value: "OUTRO", label: "Outro" },
] as const;

export const EVENT_STATUS = [
  { value: "PLANEJADO", label: "Planejado" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "REALIZADO", label: "Realizado" },
  { value: "CANCELADO", label: "Cancelado" },
] as const;

export const INSTRUMENTS = [
  "Baixo",
  "Guitarra",
  "Bateria",
  "Teclado",
  "Vocal",
  "Violão",
  "Sax",
  "Som / Técnica",
  "Admin",
] as const;

export const TASK_CATEGORIES = [
  { value: "LOGISTICA", label: "Logística" },
  { value: "CULTO", label: "Organização do culto" },
  { value: "ADMIN", label: "Administrativo" },
  { value: "EQUIPAMENTO", label: "Equipamento" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "GERAL", label: "Geral" },
] as const;

export const PRIORITIES = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Média" },
  { value: "BAIXA", label: "Baixa" },
] as const;

export const INCOME_CATEGORIES = [
  { value: "OFERTA", label: "Oferta" },
  { value: "CACHE", label: "Cachê" },
  { value: "DOACAO", label: "Doação" },
  { value: "STREAMING", label: "Streaming" },
  { value: "VENDA", label: "Venda (produtos)" },
  { value: "OUTRO", label: "Outra entrada" },
] as const;

export const EXPENSE_CATEGORIES = [
  { value: "TRANSPORTE", label: "Transporte" },
  { value: "ALIMENTACAO", label: "Alimentação" },
  { value: "EQUIPAMENTO", label: "Equipamento" },
  { value: "ESTUDIO", label: "Estúdio / Produção" },
  { value: "HOSPEDAGEM", label: "Hospedagem" },
  { value: "MARKETING", label: "Marketing" },
  { value: "OUTRO", label: "Outra saída" },
] as const;

export const PAYMENT_METHODS = [
  "PIX",
  "Dinheiro",
  "Transferência",
  "Cartão",
] as const;

export const PLATFORMS = [
  { value: "SPOTIFY", label: "Spotify" },
  { value: "APPLE_MUSIC", label: "Apple Music" },
  { value: "DEEZER", label: "Deezer" },
  { value: "AMAZON", label: "Amazon Music" },
  { value: "OUTRO", label: "Outra" },
] as const;

export const FEEDBACK_SECTORS = [
  { value: "ORGANIZACAO", label: "Organização geral", hint: "Comunicação, horários, escala" },
  { value: "LOCAL", label: "Local", hint: "Estrutura, acolhida, espaço" },
  { value: "SOM", label: "Som e técnica", hint: "Retorno, mixagem, cabos" },
  { value: "REPERTORIO", label: "Repertório", hint: "Escolha das músicas, tons, fluidez" },
  { value: "VIAGEM", label: "Viagem / Deslocamento", hint: "Transporte, pontualidade" },
  { value: "EQUIPE", label: "Equipe", hint: "Entrosamento, postura, ensaio" },
  { value: "ESPIRITUAL", label: "Espiritual", hint: "Condução, sensibilidade, ministração" },
  { value: "ESTRUTURA", label: "Alimentação e conforto", hint: "Água, lanche, camarim" },
] as const;

export const MOMENTS = [
  "Abertura",
  "Louvor",
  "Adoração",
  "Ministração",
  "Oferta",
  "Palavra",
  "Apelo",
  "Encerramento",
] as const;

export const KEYS = [
  "C", "C#", "Db", "D", "D#", "Eb", "E", "F", "F#", "Gb",
  "G", "G#", "Ab", "A", "A#", "Bb", "B",
  "Cm", "C#m", "Dm", "D#m", "Ebm", "Em", "Fm", "F#m",
  "Gm", "G#m", "Am", "A#m", "Bbm", "Bm",
] as const;

export function labelOf(
  list: readonly { value: string; label: string }[],
  value: string | null | undefined
) {
  if (!value) return "—";
  return list.find((i) => i.value === value)?.label ?? value;
}
