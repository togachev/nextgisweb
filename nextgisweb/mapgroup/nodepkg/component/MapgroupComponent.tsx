import { useMemo } from "react";
import { Button, Table } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";
import Pencil from "@nextgisweb/icon/mdi/pencil-outline";

import type { TableProps } from "@nextgisweb/gui/antd";

interface EnabledProps {
    mapgroup_resource: boolean;
    webmap: boolean;
}

type Cls =
    | "mapgroup_resource"
    | "webmap";

interface Groupmaps {
    display_name: string;
    enabled: EnabledProps;
    id: number;
    position: number;
}

interface MapgroupComponentProps {
    array: Groupmaps[];
    cls?: Cls;
    resourceId: number;
    includes: boolean;
}

interface GroupDataType {
    key: number;
    name: string;
    enabled: EnabledProps;
}

export const MapgroupComponent = ({
    array,
    cls,
    resourceId,
    includes,
}: MapgroupComponentProps) => {
    const params = useMemo(() => {
        const columns: TableProps<GroupDataType>["columns"] = [
            {
                title: cls === "mapgroup_resource" ? gettext("Webmap name") : gettext("Group name"),
                dataIndex: "name",
                key: "name",
                render: (value: string, { key, name }: GroupDataType) => !includes || cls === "mapgroup_resource" ? name :
                    <Button
                        size="small"
                        title={name}
                        href={routeURL("resource.update_mapgroup", key, "maps", "false")}
                        target="_blank"
                        type="link"
                        icon={<Pencil />}
                    >
                        {name}
                    </Button>,
                ellipsis: true,
            },
            {
                title: gettext("Status"),
                dataIndex: "enabled",
                key: "enabled",
                render: (value: string, { enabled }: GroupDataType) => {
                    const status = cls === "mapgroup_resource" ? enabled["webmap"] : enabled["mapgroup_resource"];
                    return (
                        <div style={{ color: status ? "inherit" : "var(--danger)" }}>
                            {status ? gettext("enabled") : gettext("disabled")}
                        </div>
                    )
                },
                width: 150,
            },
        ]
        const data: GroupDataType[] = [];

        if (includes) {
            array.sort((a, b) => a.position - b.position)
                .map((item) => {
                    data.push({
                        key: item.id,
                        name: item.display_name,
                        enabled: item.enabled,
                    })
                })
        }

        return {
            columns: columns,
            dataSource: data,
            size: "small",
        };
    }, [array]);

    const includesMapsMsg = includes ? gettext("Web maps are included in the group") : gettext("Web maps are not added. Add them?");

    return (
        <>
            {cls === "mapgroup_resource" ?
                <h2>
                    <Button
                        size="small"
                        title={includesMapsMsg}
                        href={routeURL("resource.update_mapgroup", resourceId, "maps", "false")}
                        target="_blank"
                        type="link"
                        style={{
                            fontSize: "large",
                            padding: 0,
                            color: "inherit",
                        }}
                    >
                        {includesMapsMsg}<Pencil />
                    </Button>
                </h2> :
                includes &&
                <h2>
                    {gettext("The web map is included in group")}
                </h2>
            }
            <Table <GroupDataType>  {...params} />
        </>
    );
}