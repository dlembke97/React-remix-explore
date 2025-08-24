import * as React from "react";
import { Breadcrumb, Space, Typography } from "antd";
import { Link } from "react-router";

type BreadcrumbItem = { title: React.ReactNode };
type BreadcrumbProp =
    | { items: BreadcrumbItem[] }
    | undefined;

export default function PageHeader({
    title,
    breadcrumb,
    extra,
}: {
    title: React.ReactNode;
    breadcrumb?: BreadcrumbProp;
    extra?: React.ReactNode;
}) {
    const items = breadcrumb?.items ?? [];

    return (
        <div style={{ marginBottom: 16 }}>
            {items.length > 0 && (
                <Breadcrumb items={items} />
            )}
            <Space align="center" style={{ width: "100%", justifyContent: "space-between" }}>
                <Typography.Title level={3} style={{ margin: 0 }}>
                    {title}
                </Typography.Title>
                {extra ?? null}
            </Space>
        </div>
    );
}

/**
 * Helper for common breadcrumb patterns (optional).
 * Usage:
 *   breadcrumb={{ items: bc("/", "Dashboard"), { title: "Triangles" } }}
 */
export function bc(to: string, label: React.ReactNode): BreadcrumbItem {
    return { title: <Link to={to}>{label}</Link> };
}
