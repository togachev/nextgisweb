import { useMemo } from "react";
import { Table } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";

import type { TableProps } from "@nextgisweb/gui/antd";

interface Groupmaps {
    display_name: string;
    enabled: boolean;
    id: number;
}

interface MapgroupComponentProps {
    array: Groupmaps[];
    cls?: string;
}

interface GroupDataType {
    key: number;
    name: string;
    status: boolean;
}

export const MapgroupComponent = ({
    array,
    cls
}: MapgroupComponentProps) => {
    const params = useMemo(() => {
        const columns: TableProps<GroupDataType>["columns"] = [
            {
                title: cls === "mapgroup_resource" ? gettext("Webmap name") : gettext("Group name"),
                dataIndex: "name",
                key: "name",
                render: (value: string, { key, name, status }: GroupDataType) => (
                        <a
                            style={{color: status ? "var(--primary)" : "var(--danger)"}}
                            className="ellipsis"
                            href={routeURL("resource.show", { id: key })}
                            target="_blank"
                        >
                            {name}
                        </a>
                ),
                ellipsis: true,
            },
            {
                title: gettext("Status"),
                dataIndex: "status",
                key: "status",
                render: (value: string, { status }: GroupDataType) =>
                    <div style={{ color: status ? "var(--primary)" : "var(--danger)" }}>{status ? gettext("enabled") : gettext("disabled")}</div>,
                width: 150,
            }
        ]
        const data: GroupDataType[] = [];

        array.sort((a, b) => Number(a.id) - Number(b.id))
            .map((item) => {
                data.push({
                    key: item.id,
                    name: item.display_name,
                    status: item.enabled,
                })
            })

        return {
            columns: columns,
            dataSource: data,
            size: "small",
        };
    }, [array]);

    return (
        <>
            <h2>{cls === "webmap" ? gettext("Web Map Groups") : cls === "mapgroup_resource" ? gettext("Web maps") : null}</h2>
            <Table <GroupDataType>  {...params} />
        </>
    );
}
