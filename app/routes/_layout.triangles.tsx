import React from 'react';
import { Link, useLoaderData } from 'react-router';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { Table, Button, Upload, Space, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader';

import type { TriangleRow } from '../data/triangles';

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

export default function Triangles() {
  const { triangles: initialTriangles } = useLoaderData<typeof loader>();
  const [triangles, setTriangles] =
    React.useState<TriangleRow[]>(initialTriangles);
  const [sortedInfo, setSortedInfo] = React.useState<SorterResult<TriangleRow>>(
    {},
  );
  const [aySum, setAySum] = React.useState<
    Array<{ accidentYear: number | string; sum: number }>
  >([]);
  const [uploading, setUploading] = React.useState(false);

  const handleChange: TableProps<TriangleRow>['onChange'] = (_, __, sorter) => {
    if (!Array.isArray(sorter)) {
      setSortedInfo(sorter);
    }
  };

  const dataToExport: TriangleRow[] = React.useMemo(() => {
    if (
      sortedInfo &&
      !Array.isArray(sortedInfo) &&
      sortedInfo.order &&
      sortedInfo.field
    ) {
      const field = sortedInfo.field as keyof TriangleRow;
      const sorted = [...triangles].sort((a, b) => {
        const aVal = a[field] as number;
        const bVal = b[field] as number;
        return sortedInfo.order === 'ascend' ? aVal - bVal : bVal - aVal;
      });
      return sorted;
    }
    return triangles;
  }, [triangles, sortedInfo]);

  const handleExport = () => {
    const headers = ['Portfolio', 'LOB', 'AY', 'Dev (m)', 'Paid', 'Incurred'];
    const rows = dataToExport.map((r) => [
      r.portfolio,
      r.lob,
      r.accidentYear,
      r.dev,
      r.paid,
      r.incurred,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'triangles.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<TriangleRow> = [
    {
      title: 'Portfolio',
      dataIndex: 'portfolio',
      key: 'portfolio',
      width: 120,
    },
    { title: 'LOB', dataIndex: 'lob', key: 'lob', width: 120 },
    {
      title: 'AY',
      dataIndex: 'accidentYear',
      key: 'accidentYear',
      width: 90,
      sorter: (a, b) => a.accidentYear - b.accidentYear,
      sortOrder:
        !Array.isArray(sortedInfo) && sortedInfo.field === 'accidentYear'
          ? sortedInfo.order
          : null,
    },
    {
      title: 'Dev (m)',
      dataIndex: 'dev',
      key: 'dev',
      width: 90,
      sorter: (a, b) => a.dev - b.dev,
      sortOrder:
        !Array.isArray(sortedInfo) && sortedInfo.field === 'dev'
          ? sortedInfo.order
          : null,
    },
    {
      title: 'Paid',
      dataIndex: 'paid',
      key: 'paid',
      width: 120,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: 'Incurred',
      dataIndex: 'incurred',
      key: 'incurred',
      width: 120,
      render: (v: number) => v.toLocaleString(),
    },
  ];

  const parseTrianglesCsv = (text: string): TriangleRow[] => {
    const [headerLine, ...lines] = text.trim().split(/\r?\n/);
    const headers = headerLine.split(',').map((h) => h.trim());
    const required = [
      'portfolio',
      'lob',
      'accidentYear',
      'dev',
      'paid',
      'incurred',
    ];
    if (!required.every((h) => headers.includes(h))) {
      throw new Error('Missing required columns');
    }
    return lines.filter(Boolean).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      return {
        portfolio: cols[headers.indexOf('portfolio')],
        lob: cols[headers.indexOf('lob')],
        accidentYear: Number(cols[headers.indexOf('accidentYear')]),
        dev: Number(cols[headers.indexOf('dev')]),
        paid: Number(cols[headers.indexOf('paid')]),
        incurred: Number(cols[headers.indexOf('incurred')]),
      };
    });
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const text = await file.text();
      const parsed = parseTrianglesCsv(text);
      setTriangles(parsed);

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
        const map = new Map<number, number>();
        parsed.forEach((r) => {
          map.set(r.accidentYear, (map.get(r.accidentYear) ?? 0) + r.paid);
        });
        setAySum(
          Array.from(map, ([accidentYear, sum]) => ({ accidentYear, sum })),
        );
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
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              Export CSV
            </Button>
          </Space>
        }
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Table
          columns={columns}
          dataSource={triangles}
          onChange={handleChange}
          rowKey={(r) => `${r.portfolio}-${r.lob}-${r.accidentYear}-${r.dev}`}
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
      </Space>
    </div>
  );
}
