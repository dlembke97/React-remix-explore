import { Link } from 'react-router';
import { PageHeader } from 'antd';

export const meta = () => [{ title: 'Dashboard' }];

export default function Dashboard() {
  return (
    <div className="p-4">
      <PageHeader
        title="Dashboard"
        breadcrumb={{ items: [{ title: 'Dashboard' }] }}
      />
      <ul className="mt-4 list-disc list-inside">
        <li>
          <Link to="triangles">Triangles</Link>
        </li>
        <li>
          <Link to="about">About</Link>
        </li>
      </ul>
    </div>
  );
}
