import React from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { Table } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import { sorterFactory } from "@nextgisweb/gui/util";
import type { TableColumnsType } from "@nextgisweb/gui/antd";
import { FormattedDecimalForm } from "@nextgisweb/feature-layer/fields-widget/FieldsStore";

import "./FieldsView.less";

interface DataType {
    key: React.Key;
    keyname: string;
    type: string;
    display_name: string;
    table: string;
    lookup_table: string | null;
    format_field: FormattedDecimalForm | null;
}

const columns: TableColumnsType<DataType>["columns"] = [
    {
        title: gettext("Display name"),
        dataIndex: "display_name",
        sorter: sorterFactory("display_name"),
        ellipsis: true,
    },
    {
        title: gettext("Keyname"),
        dataIndex: "keyname",
        sorter: sorterFactory("keyname"),
        ellipsis: true,
        responsive:["sm"],
    },
    {
        title: gettext("Type"),
        dataIndex: "datatype",
        sorter: sorterFactory("datatype"),
        ellipsis: true,
        responsive:["md"],
    },
    {
        title: gettext("Visibility in the table"),
        dataIndex: "table",
        sorter: sorterFactory("table"),
        align: "center",
        responsive:["lg"],
    },
    {
        title: gettext("Lookup table"),
        dataIndex: "lookup_table",
        render: (text) => text && <a href={text}>{gettext("Yes")}</a>,
        align: "center",
        responsive:["xl"],
    },
    {
        title: gettext("Formatted value"),
        dataIndex: "format_field",
        align: "center",
        responsive: ['xl'],
    },
];

export const FieldsView = (props) => {
    const fields = getEntries(props);

    const dataSource = fields.map<DataType>(([key, itm]) => ({
        key: key,
        keyname: itm.keyname,
        datatype: itm.datatype,
        display_name: itm.display_name,
        table: itm.grid_visibility ? gettext("Yes") : gettext("No"),
        lookup_table: itm.lookup_table !== null ? routeURL("resource.show", { id: itm.lookup_table.id }) : undefined,
        format_field: itm.format_field !== null ?
            <span title={gettext("Formatted value")} className="formatted-icon">F</span> :
            undefined,
    }))

    return (
        <Table<DataType>
        bordered
            columns={columns}
            dataSource={dataSource}
            showSorterTooltip={{ target: "sorter-icon" }}
        />
    );
};

FieldsView.displayName = "FieldsView";
FieldsView.title = gettext("Fields view");