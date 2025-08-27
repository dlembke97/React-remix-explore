import React from 'react';
import { Link, useLoaderData } from 'react-router';
import type { ColumnsType } from 'antd/es/table';
import {
  Table,
  Button,
  Upload,
  Space,
  message,
  Layout,
  Tabs,
  Select,
  Typography,
} from 'antd';
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

const getDateLikeColumns = (data: CsvRow[]): string[] => {
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

const getNumericColumns = (data: CsvRow[]): string[] => {
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

export default function Triangles() {
  const { triangles: initialTriangles } = useLoaderData<typeof loader>();
  const [rows, setRows] = React.useState<CsvRow[]>(initialTriangles);
  const [columns, setColumns] = React.useState<ColumnsType<CsvRow>>([]);
  const [aySum, setAySum] = React.useState<
    Array<{ origin: number | string; sum: number }>
  >([]);
  const [uploading, setUploading] = React.useState(false);
  const [dateColumns, setDateColumns] = React.useState<string[]>([]);
  const [originColumn, setOriginColumn] = React.useState('');
  const [developmentColumn, setDevelopmentColumn] = React.useState('');
  const [numericColumns, setNumericColumns] = React.useState<string[]>([]);
  const [lossColumn, setLossColumn] = React.useState('');
  const [categoricalColumns, setCategoricalColumns] = React.useState<string[]>(
    [],
  );
  const [categoryColumn, setCategoryColumn] = React.useState('');
  const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
  const [triangles, setTriangles] = React.useState<Record<string, CsvRow[]>>(
    {},
  );
  const [triangleColumns, setTriangleColumns] = React.useState<
    ColumnsType<CsvRow>
  >([]);
  const { Sider, Content } = Layout;
  const { Title } = Typography;

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
      const dateCols = getDateLikeColumns(parsed);
      setDateColumns(dateCols);
      setOriginColumn(dateCols[0] ?? '');
      setDevelopmentColumn(dateCols[0] ?? '');
      const numericCols = getNumericColumns(parsed).filter(
        (c) => !dateCols.includes(c),
      );
      setNumericColumns(numericCols);
      setLossColumn(numericCols[0] ?? '');
      const catCols = headers.filter(
        (h) => !dateCols.includes(h) && !numericCols.includes(h),
      );
      setCategoricalColumns(catCols);
      setCategoryColumn('');
      setUploadedFile(file);
      message.success('Data loaded');
    } catch (e: unknown) {
      console.error(e);
      message.error(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  React.useEffect(() => {
    const compute = async () => {
      if (
        !originColumn ||
        rows.length === 0 ||
        !lossColumn ||
        typeof rows[0]?.[lossColumn] !== 'number'
      ) {
        setAySum([]);
        return;
      }
      if (uploadedFile && API) {
        try {
          const form = new FormData();
          form.append('file', uploadedFile);
          form.append('ay_col', originColumn);
          form.append('value_col', lossColumn);
          const res = await fetch(`${API}/summary/ay-sum`, {
            method: 'POST',
            body: form,
          });
          if (!res.ok) throw new Error(`Backend error: ${res.status}`);
          const json = await res.json();
          if (!json.ok) throw new Error(json.error || 'Unknown backend error');
          type BackendSum = {
            accidentYear?: number | string;
            origin?: number | string;
            sum: number;
          };
          setAySum(
            (json.results || []).map((r: BackendSum) => ({
              origin: r.accidentYear ?? r.origin,
              sum: r.sum,
            })),
          );
          return;
        } catch (err) {
          console.error(err);
        }
      }
      const map = new Map<number | string, number>();
      rows.forEach((r) => {
        const ay = String(r[originColumn]);
        const value = Number(r[lossColumn]);
        if (!Number.isNaN(value) && ay) {
          map.set(ay, (map.get(ay) ?? 0) + value);
        }
      });
      setAySum(Array.from(map, ([origin, sum]) => ({ origin, sum })));
    };
    compute();
  }, [originColumn, lossColumn, rows, uploadedFile]);

  React.useEffect(() => {
    const buildTriangle = async () => {
      if (
        !originColumn ||
        !developmentColumn ||
        !lossColumn ||
        !uploadedFile ||
        !API
      ) {
        setTriangles({});
        setTriangleColumns([]);
        return;
      }
      try {
        const form = new FormData();
        form.append('file', uploadedFile);
        form.append('origin_col', originColumn);
        form.append('development_col', developmentColumn);
        form.append('value_col', lossColumn);
        if (categoryColumn) {
          form.append('category_col', categoryColumn);
        }
        const res = await fetch(`${API}/triangle`, {
          method: 'POST',
          body: form,
        });
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Unknown backend error');
        const returned: Record<string, CsvRow[]> = json.triangles || {};
        setTriangles(returned);
        const first = Object.values(returned)[0] ?? [];
        if (first.length > 0) {
          const headers = Object.keys(first[0]);
          if (originColumn && headers.includes(originColumn)) {
            headers.splice(headers.indexOf(originColumn), 1);
            headers.unshift(originColumn);
          }
          setTriangleColumns(
            headers.map((h) => ({ title: h, dataIndex: h, key: h })),
          );
        } else {
          setTriangleColumns([]);
        }
      } catch (err) {
        console.error(err);
        setTriangles({});
        setTriangleColumns([]);
      }
    };
    buildTriangle();
  }, [
    originColumn,
    developmentColumn,
    lossColumn,
    categoryColumn,
    uploadedFile,
  ]);

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

      <Layout style={{ marginTop: 16 }}>
        <Sider
          width={200}
          style={{ background: '#fff', padding: 16, marginRight: 16 }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Title
              level={4}
              id="origin-date-heading"
              style={{ margin: 0, color: '#000' }}
            >
              Origin Date
            </Title>
            <Select
              id="origin-date-select"
              aria-labelledby="origin-date-heading"
              style={{ width: '100%' }}
              placeholder="Select origin column"
              value={originColumn || undefined}
              onChange={(v) => setOriginColumn(v)}
              options={dateColumns.map((c) => ({ value: c, label: c }))}
              disabled={dateColumns.length === 0}
            />
            <Title
              level={4}
              id="development-date-heading"
              style={{ margin: 0, color: '#000' }}
            >
              Development Date
            </Title>
            <Select
              id="development-date-select"
              aria-labelledby="development-date-heading"
              style={{ width: '100%' }}
              placeholder="Select development column"
              value={developmentColumn || undefined}
              onChange={(v) => setDevelopmentColumn(v)}
              options={dateColumns.map((c) => ({ value: c, label: c }))}
              disabled={dateColumns.length === 0}
            />
            <Title
              level={4}
              id="loss-field-heading"
              style={{ margin: 0, color: '#000' }}
            >
              Loss Field
            </Title>
            <Select
              id="loss-field-select"
              aria-labelledby="loss-field-heading"
              style={{ width: '100%' }}
              placeholder="Select loss column"
              value={lossColumn || undefined}
              onChange={(v) => setLossColumn(v)}
              options={numericColumns.map((c) => ({ value: c, label: c }))}
              disabled={numericColumns.length === 0}
            />
            <Title
              level={4}
              id="category-field-heading"
              style={{ margin: 0, color: '#000' }}
            >
              Category Field
            </Title>
            <Select
              id="category-field-select"
              aria-labelledby="category-field-heading"
              style={{ width: '100%' }}
              placeholder="Select category column"
              value={categoryColumn || undefined}
              onChange={(v) => setCategoryColumn(v)}
              options={categoricalColumns.map((c) => ({ value: c, label: c }))}
              allowClear
              disabled={categoricalColumns.length === 0}
            />
          </Space>
        </Sider>
        <Content>
          <Tabs
            items={[
              {
                key: 'upload',
                label: 'Data Upload',
                children: (
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: '100%' }}
                  >
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
                            title={() =>
                              `Sum of ${lossColumn} by ${originColumn}`
                            }
                            style={{ marginTop: 16 }}
                            size="small"
                            pagination={false}
                            rowKey={(r) => String(r.origin)}
                            columns={[
                              { title: originColumn, dataIndex: 'origin' },
                              {
                                title: `Sum (${lossColumn})`,
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
                ),
              },
              {
                key: 'triangle',
                label: 'Triangle',
                children: (
                  <Space
                    direction="vertical"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    {Object.entries(triangles).map(([key, data]) => (
                      <Table
                        key={key}
                        title={() => key}
                        columns={triangleColumns}
                        dataSource={data}
                        rowKey={(_, i) => String(i)}
                        pagination={{ pageSize: 20 }}
                        sticky
                        scroll={{ x: 'max-content', y: 600 }}
                      />
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </Content>
      </Layout>
    </div>
  );
}
