import React from 'react';
import { Link, useLoaderData } from 'react-router';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import { Table, Button } from 'antd';
import PageHeader from '../components/PageHeader';

import type { TriangleRow } from '../data/triangles';
import { getTriangles } from '../data/triangles';

export const meta = () => [{ title: 'Triangles' }];

export function loader() {
  return { triangles: getTriangles() };
}

export default function Triangles() {
  const { triangles } = useLoaderData<typeof loader>();
  const [sortedInfo, setSortedInfo] = React.useState<SorterResult<TriangleRow>>(
    {},
  );

  const handleChange: TableProps<TriangleRow>['onChange'] = (_, __, sorter) => {
    if (!Array.isArray(sorter)) {
      setSortedInfo(sorter);
    }
  };

  const dataToExport = React.useMemo(() => {
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
    {
      title: 'LOB',
      dataIndex: 'lob',
      key: 'lob',
      width: 120,
    },
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
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Incurred',
      dataIndex: 'incurred',
      key: 'incurred',
      width: 120,
      render: (value: number) => value.toLocaleString(),
    },
  ];

  return (
    <div className="p-4">
      <PageHeader
        title="Triangles"
        breadcrumb={{
          items: [
            { title: <Link to="/">Dashboard</Link> },
            { title: 'Triangles' },
          ],
        }}
        extra={<Button onClick={handleExport}>Export CSV</Button>}
      />
      <Table
        className="mt-4"
        columns={columns}
        dataSource={triangles}
        onChange={handleChange}
        rowKey={(r) => `${r.portfolio}-${r.lob}-${r.accidentYear}-${r.dev}`}
        pagination={{ pageSize: 20 }}
        sticky
        scroll={{ x: 'max-content', y: 600 }}
      />
    </div>
  );
}
