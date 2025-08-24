import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  route('', 'routes/_layout.tsx', [
    index('routes/_layout._index.tsx'),
    route('triangles', 'routes/_layout.triangles.tsx'),
    route('about', 'routes/_layout.about.tsx'),
  ]),
] satisfies RouteConfig;
