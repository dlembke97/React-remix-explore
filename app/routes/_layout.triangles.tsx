import React from 'react';
import { Link, useLoaderData } from 'react-router';
import type { ColumnsType } from 'antd/es/table';
import { Table, Button, Upload, Space, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader';

export type CsvRow = Record<string, string | number>;

// --- API base: baked env (Vite) with a safe runtime fallback for browsers ---
const baked = import.meta.env.VITE_API_BASE_URL;
const runtimeGuess =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : undefined;
const API = baked ?? runtimeGuess;

export const meta = () => [{ title: 'Triangles' }];

export function loader() {
  return Response.json({ triangles: [] });
}

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

export default function Triangles() {
  const { triangles: initialTriangles } = useLoaderData<typeof loader>();
  const [rows, setRows] = React.useState<CsvRow[]>(initialTriangles);
  const [columns, setColumns] = React.useState<ColumnsType<CsvRow>>([]);
  const [aySum, setAySum] = React.useState<
    Array<{ accidentYear: number | string; sum: number }>
  >([]);
  const [uploading, setUploading] = React.useState(false);

  const handleExport = () => {
    if (rows.length === 0) return;
    const headers = columns.map((c) => String(c.title));
    const csvRows = rows.map((r) => headers.map((h) => r[h] ?? '').join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'triangles.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const text = await file.text();
      const parsed = parseTrianglesCsv(text);
      setRows(parsed);
      const headers = Object.keys(parsed[0] ?? {});
      setColumns(headers.map((h) => ({ title: h, dataIndex: h, key: h })));

      if (headers.includes('accidentYear') && headers.includes('paid')) {
        if (API) {
          const form = new FormData();
          form.append('file', file);
          form.append('ay_col', 'accidentYear');
          form.append('value_col', 'paid');
          const res = await fetch(`${API}/summary/ay-sum`, {
            method: 'POST',
            body: form,
          });
          if (!res.ok) throw new Error(`Backend error: ${res.status}`);
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || 'Unknown backend error');
          setAySum(json.results || []);
        } else {
          const map = new Map<number | string, number>();
          parsed.forEach((r) => {
            const ay = String(r['accidentYear']);
            const paid = Number(r['paid']);
            if (!Number.isNaN(paid)) {
              map.set(ay, (map.get(ay) ?? 0) + paid);
            }
          });
          setAySum(
            Array.from(map, ([accidentYear, sum]) => ({ accidentYear, sum })),
          );
        }
      } else {
        setAySum([]);
      }
      message.success('Data loaded');
    } catch (e: unknown) {
      console.error(e);
      message.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <PageHeader
        title="Triangles"
        breadcrumb={{
          items: [
            { title: <Link to="/">Dashboard</Link> },
            { title: 'Triangles' },
          ],
        }}
        extra={
          <Space>
            <Upload
              beforeUpload={(file) => {
                handleUpload(file as File);
                return false;
              }}
              showUploadList={false}
              accept=".csv,text/csv"
              disabled={uploading}
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                Upload Data
              </Button>
            </Upload>
            {rows.length > 0 && (
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                Export CSV
              </Button>
            )}
          </Space>
        }
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {rows.length > 0 && (
          <>
            <Table
              columns={columns}
              dataSource={rows}
              rowKey={(_, i) => String(i)}
              pagination={{ pageSize: 20 }}
              sticky
              scroll={{ x: 'max-content', y: 600 }}
            />

            {aySum.length > 0 && (
              <Table
                title={() => 'AY Sum'}
                style={{ marginTop: 16 }}
                size="small"
                pagination={false}
                rowKey={(r) => String(r.accidentYear)}
                columns={[
                  { title: 'Accident Year', dataIndex: 'accidentYear' },
                  {
                    title: 'Sum (paid)',
                    dataIndex: 'sum',
                    render: (v: number) => v.toLocaleString(),
                  },
                ]}
                dataSource={aySum}
              />
            )}
          </>
        )}
      </Space>
    </div>
  );
}
