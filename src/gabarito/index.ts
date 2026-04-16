import { GABARITO_PENSE_BEM as GABARITO_021 } from "./021";
import { GABARITO_PENSE_BEM as GABARITO_131 } from "./131";
import {
  GABARITO_PENSE_BEM as GABARITO_081,
  type GabaritoPenseBem,
} from "./081";

export type { GabaritoCor, GabaritoItem, GabaritoPenseBem } from "./081";

const GABARITOS_POR_LIVRO: Record<string, GabaritoPenseBem> = {
  "021": GABARITO_021,
  "081": GABARITO_081,
  "131": GABARITO_131,
};

export function getAvailableBookCodes(): string[] {
  return Object.keys(GABARITOS_POR_LIVRO).sort();
}

export function normalizeBookCode(code: string): string | null {
  const onlyDigits = code.trim().replace(/\D/g, "").slice(0, 3);
  if (!onlyDigits) {
    return null;
  }

  return onlyDigits.padStart(3, "0");
}

export function getBookAnswerKey(bookCode: string) {
  const normalizedCode = normalizeBookCode(bookCode);
  if (!normalizedCode) {
    return { normalizedCode: null, answerKey: null };
  }

  return {
    normalizedCode,
    answerKey: GABARITOS_POR_LIVRO[normalizedCode] ?? null,
  };
}
