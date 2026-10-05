export function flavorFor(path: string): string {
  if (path.startsWith("/protocolos") || path.startsWith("/administracao")) return "Cuidai das relíquias como cuidais da doutrina.";
  if (path.startsWith("/codex") || path.startsWith("/abrir")) return "A doutrina se escreve em velino. A convicção, em corrente.";
  if (path.startsWith("/agumentarium")) return "A lâmina não pergunta duas vezes.";
  if (path.startsWith("/conditionarium")) return "Onde a Cruzada hesita, o Reclusiam decide.";
  if (path.startsWith("/tomar")) return "A Cruzada não abençoa. A Cruzada conta.";
  return "Não há piedade. Não há remorso. Não há medo.";
}
