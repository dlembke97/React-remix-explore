import React from 'react';
import { Table, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CsvRow } from '../utils/csv';
import type { TriangleMap } from '../utils/triangle';

interface TriangleDisplayProps {
  triangles: TriangleMap;
  columns: ColumnsType<CsvRow>;
  /** Optional text appended to each triangle title. */
  titleSuffix?: string;
}

/**
 * Render one or more triangles using Ant Design tables.
 *
 * Pass in a map of triangle names to row data. This component handles the
 * repetitive table markup so new exhibits can reuse it directly.
 */
export default function TriangleDisplay({
  triangles,
  columns,
  titleSuffix,
}: TriangleDisplayProps) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {Object.entries(triangles).map(([key, data]) => (
        <Table
          key={key}
          title={() => (titleSuffix ? `${key} ${titleSuffix}` : key)}
          columns={columns}
          dataSource={data}
          rowKey={(_, i) => String(i)}
          pagination={{ pageSize: 20 }}
          sticky
          scroll={{ x: 'max-content', y: 600 }}
        />
      ))}
    </Space>
  );
}
