import React from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { Space, Table } from "@nextgisweb/gui/antd";
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
    additional_props: any[]
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
        responsive: ["sm"],
    },
    {
        title: gettext("Type"),
        dataIndex: "datatype",
        sorter: sorterFactory("datatype"),
        ellipsis: true,
        responsive: ["md"],
    },
    {
        title: gettext("Visibility in the table"),
        dataIndex: "table",
        sorter: sorterFactory("table"),
        align: "center",
        responsive: ["lg"],
    },
    {
        title: gettext("Additional properties"),
        dataIndex: "additional_props",
        render: (text) => text,
        align: "center",
        responsive: ["xl"],
    },
];

const AdditionalProps = ({ item }) => {
    const items: any = []
    item.lookup_table !== null &&
        items.push(<a href={routeURL("resource.show", { id: item?.lookup_table?.id })}>{gettext("Reference book added")}</a>);
        item.format_field !== null && item.format_field.checked &&
        items.push(<span title={gettext("Formatted value")} className="formatted-icon">{gettext("Formatted value")}</span>);

    return (
        <Space>{items.map((i, index) => {
            return (<span key={index}>{i}</span>)
        })}</Space>
    )
}

export const FieldsView = (props) => {
    const fields = getEntries(props);

    const dataSource = fields.map<DataType>(([key, itm]) => ({
        key: key,
        keyname: itm.keyname,
        datatype: itm.datatype,
        display_name: itm.display_name,
        table: itm.grid_visibility ? gettext("Yes") : gettext("No"),
        additional_props: <AdditionalProps item={itm} />,
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