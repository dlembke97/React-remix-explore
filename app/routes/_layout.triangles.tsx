import { Link, json } from 'react-router';
import { PageHeader } from 'antd';

import { getTriangles } from '../data/triangles';

export const meta = () => [{ title: 'Triangles' }];

export function loader() {
  return json({ triangles: getTriangles() });
}

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
