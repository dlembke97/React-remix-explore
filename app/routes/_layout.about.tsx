import { Link } from 'react-router';
import { PageHeader } from 'antd';

export const meta = () => [{ title: 'About' }];

export default function About() {
  return (
    <div className="p-4">
      <PageHeader
        title="About"
        breadcrumb={{
          items: [{ title: <Link to="/">Dashboard</Link> }, { title: 'About' }],
        }}
      />
      <p className="mt-4">This app explores React Remix with Ant Design.</p>
    </div>
  );
}
