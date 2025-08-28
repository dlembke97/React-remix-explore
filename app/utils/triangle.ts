import type { ColumnsType } from 'antd/es/table';
import type { CsvRow } from './csv';

/** Map of triangle names to their table rows. */
export type TriangleMap = Record<string, CsvRow[]>;

export interface BuildTriangleOptions {
  originCol: string;
  developmentCol: string;
  valueCol: string;
  categoryCol?: string;
}

export interface BuiltTriangles {
  triangles: TriangleMap;
  ldfTriangles: TriangleMap;
}

/**
 * Request triangle data from the backend.
 *
 * The backend expects a CSV file plus column names describing origin,
 * development and numeric value columns. It returns two triangle maps:
 * a standard cumulative triangle and an "age-to-age" LDF triangle.
 */
export async function buildTriangles(
  api: string,
  file: File,
  opts: BuildTriangleOptions,
): Promise<BuiltTriangles> {
  const form = new FormData();
  form.append('file', file);
  form.append('origin_col', opts.originCol);
  form.append('development_col', opts.developmentCol);
  form.append('value_col', opts.valueCol);
  if (opts.categoryCol) form.append('category_col', opts.categoryCol);

  const res = await fetch(`${api}/triangle`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Unknown backend error');
  return {
    triangles: json.triangles || {},
    ldfTriangles: json.ldf_triangles || {},
  };
}

/**
 * Build Ant Design table column definitions from triangle rows.
 * The optional `primary` column is placed first if present.
 */
export const buildColumns = (
  rows: CsvRow[],
  primary?: string,
): ColumnsType<CsvRow> => {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);
  if (primary && headers.includes(primary)) {
    headers.splice(headers.indexOf(primary), 1);
    headers.unshift(primary);
  }
  return headers.map((h) => ({ title: h, dataIndex: h, key: h }));
};
