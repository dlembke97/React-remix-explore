/**
 * Utilities for working with CSV data used in triangle analysis.
 *
 * These helpers are standalone so they can be reused and tested in isolation.
 */
export type CsvRow = Record<string, string | number>;

export const aggregationLevels = ['yearly', 'quarterly', 'monthly'] as const;
export type AggregationLevel = (typeof aggregationLevels)[number];

/**
 * Parse raw CSV text into an array of {@link CsvRow} objects.
 *
 * The first line is treated as the header row. Numeric values are converted to
 * numbers; everything else remains a string.
 */
export const parseTrianglesCsv = (text: string): CsvRow[] => {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((h) => h.trim());

  return lines.filter(Boolean).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const row: CsvRow = {};
    headers.forEach((h, i) => {
      const value = cols[i] ?? '';
      const num = Number(value);
      row[h] = value === '' || Number.isNaN(num) ? value : num;
    });
    return row;
  });
};

/**
 * Determine whether a value resembles a year or date between 1950 and 2030.
 */
const isDateLike = (value: unknown): boolean => {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1950 && value <= 2030;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return false;
    if (/^\d{4}$/.test(trimmed)) {
      const year = Number(trimmed);
      return year >= 1950 && year <= 2030;
    }
    const timestamp = Date.parse(trimmed);
    if (!Number.isNaN(timestamp)) {
      const year = new Date(timestamp).getFullYear();
      return year >= 1950 && year <= 2030;
    }
  }
  return false;
};

/**
 * Identify headers whose values are date-like.
 */
export const getDateLikeColumns = (data: CsvRow[]): string[] => {
  if (data.length === 0) return [];
  const headers = Object.keys(data[0]);
  return headers.filter((h) => {
    let hasValue = false;
    const allValid = data.every((row) => {
      const value = row[h];
      if (value === '' || value === null || value === undefined) return true;
      hasValue = true;
      return isDateLike(value);
    });
    return allValid && hasValue;
  });
};

/**
 * Identify headers whose non-empty values are numeric.
 */
export const getNumericColumns = (data: CsvRow[]): string[] => {
  if (data.length === 0) return [];
  const headers = Object.keys(data[0]);
  return headers.filter((h) => {
    let hasValue = false;
    const allNumeric = data.every((row) => {
      const value = row[h];
      if (value === '' || value === null || value === undefined) return true;
      if (typeof value === 'number') {
        hasValue = true;
        return true;
      }
      return false;
    });
    return allNumeric && hasValue;
  });
};

/**
 * Identify headers that are neither date-like nor numeric.
 */
export const getCategoricalColumns = (
  data: CsvRow[],
  dateColumns: string[],
  numericColumns: string[],
): string[] => {
  if (data.length === 0) return [];
  const headers = Object.keys(data[0]);
  return headers.filter(
    (h) => !dateColumns.includes(h) && !numericColumns.includes(h),
  );
};

/**
 * Determine which aggregation levels are supported by a date column.
 *
 * Columns containing only year values support yearly aggregation. Columns with
 * full dates (anything beyond a bare year) can also be aggregated quarterly or
 * monthly.
 */
export const getDateAggregationOptions = (
  data: CsvRow[],
  column: string,
): AggregationLevel[] => {
  if (!column) return [...aggregationLevels];
  const values = data
    .map((r) => r[column])
    .filter((v) => v !== '' && v !== null && v !== undefined);
  const hasFullDate = values.some((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return false;
      if (/^\d{4}$/.test(trimmed)) return false;
      return !Number.isNaN(Date.parse(trimmed));
    }
    return false;
  });
  return hasFullDate ? [...aggregationLevels] : ['yearly'];
};
