import React from 'react';
import { Link, useLoaderData } from 'react-router';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { Table, Button, Upload, Space, message, Card } from 'antd';
import { InboxOutlined, DownloadOutlined } from '@ant-design/icons';
import PageHeader from '../components/PageHeader';

import type { TriangleRow } from '../data/triangles';
import { getTriangles } from '../data/triangles';

const API = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.
  VITE_API_BASE_URL;

export const meta = () => [{ title: 'Triangles' }];

export function loader() {
  return Response.json({ triangles: getTriangles() });
}

export default function Triangles() {
  const { triangles } = useLoaderData<typeof loader>();
  const [sortedInfo, setSortedInfo] = React.useState<SorterResult<TriangleRow>>({});
  const [aySum, setAySum] = React.useState<Array<{ accidentYear: number | string; sum: number }>>([]);
  const [uploading, setUploading] = React.useState(false);

  const handleChange: TableProps<TriangleRow>['onChange'] = (_, __, sorter) => {
    if (!Array.isArray(sorter)) {
      setSortedInfo(sorter);
    }
  };

  const dataToExport: TriangleRow[] = React.useMemo(() => {
    if (sortedInfo && !Array.isArray(sortedInfo) && sortedInfo.order && sortedInfo.field) {
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
    const headers = ['Portfolio','LOB','AY','Dev (m)','Paid','Incurred'];
    const rows = dataToExport.map(r => [r.portfolio, r.lob, r.accidentYear, r.dev, r.paid, r.incurred]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'triangles.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<TriangleRow> = [
    { title: 'Portfolio', dataIndex: 'portfolio', key: 'portfolio', width: 120 },
    { title: 'LOB', dataIndex: 'lob', key: 'lob', width: 120 },
    {
      title: 'AY', dataIndex: 'accidentYear', key: 'accidentYear', width: 90,
      sorter: (a, b) => a.accidentYear - b.accidentYear,
      sortOrder: !Array.isArray(sortedInfo) && sortedInfo.field === 'accidentYear' ? sortedInfo.order : null,
    },
    {
      title: 'Dev (m)', dataIndex: 'dev', key: 'dev', width: 90,
      sorter: (a, b) => a.dev - b.dev,
      sortOrder: !Array.isArray(sortedInfo) && sortedInfo.field === 'dev' ? sortedInfo.order : null,
    },
    { title: 'Paid', dataIndex: 'paid', key: 'paid', width: 120, render: (v: number) => v.toLocaleString() },
    { title: 'Incurred', dataIndex: 'incurred', key: 'incurred', width: 120, render: (v: number) => v.toLocaleString() },
  ];

  // ---- Upload to FastAPI: multipart/form-data with CSV ----
  const beforeUpload = () => false; // prevent auto upload by AntD

  const onUpload = async (file: File) => {
    if (!API) {
      message.error('Backend not configured. Set VITE_API_BASE_URL in .env to use the API.');
      return;
    }
    setUploading(true);
    try {
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
      message.success('Summary calculated');
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
        breadcrumb={{ items: [{ title: <Link to="/">Dashboard</Link> }, { title: 'Triangles' }] }}
        extra={<Button icon={<DownloadOutlined />} onClick={handleExport}>Export CSV</Button>}
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

        <Card title="AY Sum (via FastAPI)" extra={<span>{API ? 'API enabled' : 'API not configured'}</span>}>
          <Upload.Dragger
            multiple={false}
            beforeUpload={beforeUpload}
            customRequest={({ file, onSuccess, onError }) => {
              onUpload(file as File).then(() => onSuccess && onSuccess({}, new XMLHttpRequest())).catch(onError);
            }}
            accept=".csv,text/csv"
            disabled={!API || uploading}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">Drop a CSV here, or click to select</p>
            <p className="ant-upload-hint">Must include columns: accidentYear, paid</p>
          </Upload.Dragger>

          {aySum.length > 0 && (
            <Table
              style={{ marginTop: 16 }}
              size="small"
              pagination={false}
              rowKey={(r) => String(r.accidentYear)}
              columns={[
                { title: 'Accident Year', dataIndex: 'accidentYear' },
                { title: 'Sum (paid)', dataIndex: 'sum', render: (v: number) => v.toLocaleString() },
              ]}
              dataSource={aySum}
            />
          )}
        </Card>
      </Space>
    </div>
  );
}
