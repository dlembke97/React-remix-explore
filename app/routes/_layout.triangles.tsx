import { Link } from 'react-router';
import { PageHeader } from 'antd';

export const meta = () => [{ title: 'Triangles' }];

export default function Triangles() {
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
      />
      <p className="mt-4">This page is about triangles.</p>
    </div>
  );
}
