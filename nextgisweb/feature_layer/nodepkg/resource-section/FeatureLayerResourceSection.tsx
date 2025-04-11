import React, { useMemo } from "react";
import { routeURL } from "@nextgisweb/pyramid/api";
import { Space, Table } from "@nextgisweb/gui/antd";
import type { TableColumnsType } from "@nextgisweb/gui/antd";
import { sorterFactory } from "@nextgisweb/gui/util";
import { assert } from "@nextgisweb/jsrealm/error";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { ResourceSection } from "@nextgisweb/resource/resource-section";
import { FormattedDecimalForm } from "@nextgisweb/feature-layer/fields-widget/FieldsStore";

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

export const FeatureLayerResourceSection: ResourceSection = ({
    resourceData,
}) => {
    const fields = resourceData.feature_layer?.fields;
    assert(fields);

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

    const dataSource = fields.map((itm, index) => ({
        key: index,
        keyname: itm.keyname,
        datatype: itm.datatype,
        display_name: itm.display_name,
        table: itm.grid_visibility ? gettext("Yes") : gettext("No"),
        additional_props: <AdditionalProps item={itm} />,
    }));

    const columns = useMemo<TableColumnsType[]>(() => {
        return [
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
    }, []);

    return (
        <Table<DataType>
            bordered
            columns={columns}
            dataSource={dataSource}
            showSorterTooltip={{ target: "sorter-icon" }}
        />
    );
};

FeatureLayerResourceSection.displayName = "FeatureLayerResourceSection";
FeatureLayerResourceSection.title = gettext("Fields");
