const labels: Record<string, string> = {
  new: "Novo",
  contacted: "Contatado",
  interested: "Interessado",
  not_interested: "Não interessado",
  callback: "Retornar ligação",
  converted: "Convertido",
  do_not_contact: "Não contatar",
  answered: "Atendida",
  no_answer: "Não atendeu",
  busy: "Ocupado",
  voicemail: "Correio de voz",
  dnc: "Não contatar",
  wrong_number: "Número incorreto",
  disconnected: "Desconectado",
  active: "Ativa",
  paused: "Pausada",
  completed: "Concluída",
  cancelled: "Cancelada",
  rescheduled: "Reagendada",
};

export function operationalLabel(value: string): string {
  return labels[value] ?? value.replace(/_/g, " ");
}
