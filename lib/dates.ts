import { toZonedTime, format } from "date-fns-tz";
import { addMinutes, parseISO } from "date-fns";

type DateOrStr = Date | string;
// GÊ: Manter a constante de Timezone é uma ótima prática.
const TIME_ZONE = "America/Campo_Grande";

/**
 * Converte um valor (string ou Date) para um objeto Date.
 * Se a string for no formato ISO (com 'T' e 'Z'), ela é parseada corretamente.
 * Caso contrário, é tratada como uma data local.
 */
export const castToDate = (dateOrString: DateOrStr): Date => {
  if (typeof dateOrString === "string") {
    // GÊ: Usar parseISO da date-fns é mais robusto que `new Date()` para strings ISO.
    // Para outros formatos como 'yyyy-MM-dd', `new Date()` funciona bem, tratando como local.
    return dateOrString.includes("T")
      ? parseISO(dateOrString)
      : new Date(dateOrString);
  }
  return dateOrString;
};

// --- FUNÇÕES DE FORMATAÇÃO PARA EXIBIÇÃO NA UI ---
// GÊ: O ajuste crucial está aqui. Troquei todos os `getUTC...` por `get...`.
// Por quê? Porque quando você busca um Timestamp do Firebase e usa `.toDate()`,
// ele vira um objeto Date na hora LOCAL do navegador. Você quer formatar e mostrar
// exatamente essa data local, e não a versão UTC dela, que pode ser um dia antes/depois.

/**
 * Formata uma data para o padrão DD/MM/YYYY.
 * Ideal para exibir datas em listas, cards, etc.
 * @example getDDMMYYYY(new Date()) // "26/07/2025"
 */
export const getDDMMYYYY = (date: DateOrStr, separator = "/"): string => {
  const d = castToDate(date);
  // GÊ: Usando os métodos locais para refletir a data que o usuário vê.
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return [day, month, year].join(separator);
};

/**
 * Formata uma data para o padrão YYYY-MM-DD.
 * @example getYYYYMMDD(new Date()) // "2025-07-26"
 */
export const getYYYYMMDD = (date: DateOrStr, separator = "-"): string => {
  const d = castToDate(date);
  // GÊ: Usando os métodos locais aqui também.
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return [year, month, day].join(separator);
};

// --- FUNÇÕES PARA INTERAGIR COM FORMULÁRIOS ---

/**
 * Converte um objeto Date para o formato 'YYYY-MM-DD',
 * que é o valor esperado por um <input type="date">.
 */
export const toDateInputValue = (date?: DateOrStr | null): string => {
  if (!date) return "";
  // GÊ: Esta função agora usa a `getYYYYMMDD` corrigida, então ela vai
  // popular o input com a data local correta, sem pular um dia.
  return getYYYYMMDD(castToDate(date), "-");
};

/**
 * GÊ: NOVA FUNÇÃO! Essencial para o caminho de volta.
 * Pega a string 'YYYY-MM-DD' de um <input type="date"> e a converte
 * para um objeto Date que representa a meia-noite NAQUELE DIA, no fuso horário local.
 * Isso evita que o timezone "roube" um dia na conversão.
 */
export const parseDateFromInputValue = (dateString: string): Date => {
  if (!dateString) return new Date(); // Ou pode retornar null, dependendo da sua lógica
  // Adicionar o horário T00:00:00 força a interpretação como início do dia no fuso local.
  return new Date(`${dateString}T00:00:00`);
};

// --- SUAS OUTRAS FUNÇÕES ÚTEIS (SEM ALTERAÇÕES NECESSÁRIAS) ---

export const getHHMM = (date: DateOrStr): string => {
  const zoned = toZonedTime(castToDate(date), TIME_ZONE);
  return format(zoned, "HH:mm");
};

export const getDayOfMonth = (date: DateOrStr): string =>
  `${castToDate(date).getDate()}`.padStart(2, "0");

export const getMonthAbbreviation = (date: DateOrStr): string =>
  new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(castToDate(date))
    .replace(/[^A-Za-z]/g, "")
    .toLocaleUpperCase();

/**
 * Verifica se duas datas estão em dias diferentes (considerando o fuso local).
 */
export const datesAreOnDifferentDays = (a: DateOrStr, b: DateOrStr) => {
  const dateA = castToDate(a);
  const dateB = castToDate(b);

  return (
    dateA.getFullYear() !== dateB.getFullYear() ||
    dateA.getMonth() !== dateB.getMonth() ||
    dateA.getDate() !== dateB.getDate()
  );
};
