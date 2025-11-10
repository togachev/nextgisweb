import { useCallback, useMemo, useState } from "react";
import { Button, Input, Space, Table, Tag } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { observer } from "mobx-react-lite";
import { Store } from "./Store";

import AddCircle from "@nextgisweb/icon/material/add_circle";
import CheckboxBlank from "@nextgisweb/icon/mdi/checkbox-blank-circle-outline";
import CheckboxMarked from "@nextgisweb/icon/mdi/checkbox-marked-circle-outline";
import Pencil from "@nextgisweb/icon/mdi/pencil";

import { useResourcePicker } from "@nextgisweb/resource/component/resource-picker";

import type { TableProps } from "@nextgisweb/gui/antd";

import "./GroupManagement.less";

interface GroupManagementProps {
    id: number;
}

interface GroupDataType {
    key: number;
    name: string;
    status: boolean;
    web_maps: string[];
    maps_add: null;
}

const ellipsisStyle = {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "block",
    maxWidth: "300px",
};

export const GroupManagement = observer(({ id }: GroupManagementProps) => {
    const [store] = useState(() => new Store({ id: id }));
    const [value, SetValue] = useState<string>("");

    const { showResourcePicker } = useResourcePicker({ initParentId: 0 });

    const params = useMemo(() => {
        const columns: TableProps<GroupDataType>["columns"] = [
            {
                title: gettext("Group name"),
                dataIndex: "name",
                key: "name",
                render: (value: string, { key, name, status }: GroupDataType) => (<Tag color={!status ? "volcano" : "green"} key={key}>
                    <span style={ellipsisStyle} title={name}>
                        <a href={routeURL("resource.update_mapgroup", key, "group")} target="_blank">
                            <span style={{ padding: "0 5px" }}>
                                <Pencil />
                            </span>
                            {name}
                        </a>
                    </span>
                </Tag>),
                ellipsis: true,
            },
            {
                title: gettext("Web maps"),
                dataIndex: "web_maps",
                key: "web_maps",
                render: (value: string, { web_maps }) => (
                    <Space direction="vertical">
                        {web_maps.map((tag) => (
                            <Tag
                                closable
                                color={!tag.enabled ? "volcano" : "green"} key={tag.id}
                            >
                                <span style={ellipsisStyle} title={tag.display_name}>
                                    <a href={routeURL("resource.update_mapgroup", tag.webmap_group_id, "maps")} target="_blank">
                                        <span style={{ padding: "0 5px" }}>
                                            {tag.enabled ? <CheckboxMarked /> : <CheckboxBlank />}
                                        </span>
                                        {tag.display_name}
                                    </a>
                                </span>
                            </Tag>
                        ))}
                    </Space>
                ),
            },
            {
                title: gettext("Controls"),
                dataIndex: "maps_add",
                key: "maps_add",
                width: 100,
                align: "center",
                render: (id: number) => {
                    return (
                        <Button
                            title={gettext("Add maps")}
                            icon={<AddCircle />}
                            type="text"
                            onClick={() => {
                                onMaps(id);
                            }}
                        />
                    )
                },
            }
        ]
        const data: GroupDataType[] = [];

        store.groups.map((item) => {
            data.push({
                key: item.resource.id,
                name: item.resource.display_name,
                status: item.mapgroup_resource.enabled,
                web_maps: item.mapgroup_group.groupmaps,
                maps_add: item.resource.id,
            })
        })

        return {
            columns: columns,
            dataSource: data,
            size: "small",
        };
    }, [store.groups]);

    const onGroups = useCallback((display_name: string) => {
        showResourcePicker({
            pickerOptions: {
                requireClass: "resource_group",
                initParentId: 0,
                clsFilter: "resource_group",
            },
            onSelect: (resourceId: number) => {
                store.setParent(resourceId);
                store.createNewGroup(display_name)
            },
        });
    }, [showResourcePicker]);

    const onMaps = useCallback((id: number) => {
        showResourcePicker({
            pickerOptions: {
                requireClass: "webmap",
                multiple: true,
                clsFilter: "mapgroup_group",
            },
            onSelect: (resourceIds: number[]) => {
                store.setMaps(resourceIds);
                store.addMaps(id, resourceIds);
                console.log(id, resourceIds);
            },
        });
    }, [showResourcePicker]);

    return (
        <div className="mapgroup-component">
            <Space.Compact align="baseline" block className="create-group">
                <label style={{ width: "20%" }} htmlFor="display_name">{gettext("Creating a new group")}</label>
                <Input
                    style={{ width: "60%" }}
                    id="display_name"
                    allowClear
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => SetValue(e.target.value)}
                    placeholder={gettext("Enter the group name")}
                />
                <Button
                    style={{ width: "20%" }}
                    disabled={value !== "" ? false : true}
                    type="primary"
                    onClick={() => {
                        onGroups(value);
                    }}
                >{gettext("Add a new group")}</Button>
            </Space.Compact>
            <Table <GroupDataType>  {...params} />
        </div>
    );
});
