import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { Space, Table, Tag } from "@nextgisweb/gui/antd";
import type { TableProps } from "@nextgisweb/gui/antd";

import { gettext } from "@nextgisweb/pyramid/i18n";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import "./FieldsView.less";

const msgDisplayName = gettext("Display name");


interface DataType {
    key: string;
    keyname: string;
    type: string;
    name: string;
    table: string;
    lookup_table: string | null;
}

const columns: TableProps<DataType>["columns"] = [
    {
        title: gettext("Display name"),
        dataIndex: "name",
        key: "name",
    },
    {
        title: gettext("Keyname"),
        dataIndex: "keyname",
        key: "keyname",

    },
    {
        title: gettext("Type"),
        dataIndex: "type",
        key: "type",
    },
    {
        title: gettext("Visibility in the table"),
        dataIndex: "table",
        key: "table",
        align: 'center',
    },
    {
        title: gettext("Lookup table"),
        dataIndex: "lookup_table",
        key: "lookup_table",
        render: (text) => text && <a href={text}>{gettext("Yes")}</a>,
        align: 'center',
    },
];

export const FieldsView = (props) => {
    const fields = getEntries(props);

    const dataSource = fields.map<DataType>(([key, itm]) => ({
        key: key,
        keyname: itm.keyname,
        type: itm.datatype,
        name: itm.display_name,
        table: itm.grid_visibility ? gettext("Yes") : gettext("No"),
        lookup_table: itm.lookup_table !== null ? routeURL("resource.show", { id: itm.lookup_table.id }) : undefined,
    }))

    return (
        <Table<DataType> columns={columns} dataSource={dataSource} />
    );
};

FieldsView.displayName = "FieldsView";
FieldsView.title = gettext("Fields view");