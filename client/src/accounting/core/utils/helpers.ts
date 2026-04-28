import type { MonthEntry, TributosEntry } from "../types";

export const parseCurrency = (value: string): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const getMonthTotal = (entries: MonthEntry[]): number =>
  entries.reduce((acc, curr) => acc + parseCurrency(curr.importe), 0);

export const computeTributoRow = (row: TributosEntry) => {
  const g = parseCurrency(row.h) + parseCurrency(row.i);
  const k =
    parseCurrency(row.b) + parseCurrency(row.c) + parseCurrency(row.d) +
    parseCurrency(row.e) + parseCurrency(row.f) + g + parseCurrency(row.j);
  return { ...row, g, k };
};

export const computeTributoTotals = (rows: ReturnType<typeof computeTributoRow>[]) => ({
  b: rows.reduce((a, r) => a + parseCurrency(r.b), 0),
  c: rows.reduce((a, r) => a + parseCurrency(r.c), 0),
  d: rows.reduce((a, r) => a + parseCurrency(r.d), 0),
  e: rows.reduce((a, r) => a + parseCurrency(r.e), 0),
  f: rows.reduce((a, r) => a + parseCurrency(r.f), 0),
  g: rows.reduce((a, r) => a + r.g, 0),
  h: rows.reduce((a, r) => a + parseCurrency(r.h), 0),
  i: rows.reduce((a, r) => a + parseCurrency(r.i), 0),
  j: rows.reduce((a, r) => a + parseCurrency(r.j), 0),
  k: rows.reduce((a, r) => a + r.k, 0),
  l: rows.reduce((a, r) => a + parseCurrency(r.l), 0),
  m: rows.reduce((a, r) => a + parseCurrency(r.m), 0),
  n: rows.reduce((a, r) => a + parseCurrency(r.n), 0),
  o: rows.reduce((a, r) => a + parseCurrency(r.o), 0),
  p: rows.reduce((a, r) => a + parseCurrency(r.p), 0),
});
