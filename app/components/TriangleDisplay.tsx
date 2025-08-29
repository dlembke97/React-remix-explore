import React from 'react';
import { Table, Space, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CsvRow } from '../utils/csv';
import type { TriangleMap } from '../utils/triangle';

interface TriangleDisplayProps {
  triangles: TriangleMap;
  columns: ColumnsType<CsvRow>;
  /** Optional text appended to each triangle title. */
  titleSuffix?: string;
  ldfTables?: TriangleMap;
  ldfColumns?: ColumnsType<CsvRow>;
  cdfTables?: TriangleMap;
  cdfColumns?: ColumnsType<CsvRow>;
  onCdfChange?: (triKey: string, col: string, value: number) => void;
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
  ldfTables,
  ldfColumns,
  cdfTables,
  cdfColumns,
  onCdfChange,
}: TriangleDisplayProps) {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {Object.entries(triangles).map(([key, data]) => (
        <Space
          key={key}
          direction="vertical"
          size="large"
          style={{ width: '100%' }}
        >
          <Table
            title={() => (titleSuffix ? `${key} ${titleSuffix}` : key)}
            columns={columns}
            dataSource={data}
            rowKey={(_, i) => String(i)}
            pagination={{ pageSize: 20 }}
            sticky
            scroll={{ x: 'max-content', y: 600 }}
          />
          {ldfTables && ldfTables[key] && ldfColumns && (
            <Table
              title={() => `${key} LDF`}
              columns={ldfColumns}
              dataSource={ldfTables[key]}
              rowKey={(_, i) => String(i)}
              size="small"
              pagination={false}
            />
          )}
          {cdfTables && cdfTables[key] && cdfColumns && (
            <Table
              title={() => `${key} CDF`}
              columns={cdfColumns.map((col) =>
                'dataIndex' in col && col.dataIndex !== 'type'
                  ? {
                      ...col,
                      render: (value: number, record: CsvRow) =>
                        record.type === 'Selected CDF' ? (
                          <InputNumber
                            value={value}
                            min={0}
                            step={0.01}
                            onChange={(v) =>
                              onCdfChange?.(
                                key,
                                String(col.dataIndex),
                                Number(v),
                              )
                            }
                          />
                        ) : (
                          value
                        ),
                    }
                  : col,
              )}
              dataSource={cdfTables[key]}
              rowKey={(_, i) => String(i)}
              size="small"
              pagination={false}
            />
          )}
        </Space>
      ))}
    </Space>
  );
}
