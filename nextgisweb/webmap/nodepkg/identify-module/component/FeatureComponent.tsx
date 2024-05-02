import { FC } from "react";
import { Button, ConfigProvider, Segmented, Select, Tabs, Tooltip } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Description from "@nextgisweb/icon/material/description";
import Attachment from "@nextgisweb/icon/material/attachment";
import EditNote from "@nextgisweb/icon/material/edit_note";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { useSource } from "../hook/useSource";

import GeometryInfo from "@nextgisweb/feature-layer/geometry-info"

const settings = webmapSettings;

export const FeatureComponent: FC = ({ data, store }) => {
    const { resourceItem } = useSource();
    
    const onChange = (value: string) => {
        let val = data.find(item => item.id === value);
        store.setSelected(val);
    };
    const onChangeTabs = (e) => {
        resourceItem(store.selected.layerId, store.selected.id);
    };
    const operations = (
        <Button
            type="text"
            title={gettext("Edit")}
            icon={<EditNote />}
            onClick={(e) => {
                console.log(e);
            }}
        />
    );

    const tabsItems = [
        {
            title: gettext("Attributes"), key: "attribute", visible: settings.identify_attributes, icon: <Info title={gettext("Attributes")} />, children: store.selected && Object.keys(store.selected.fields).map((key) => (
                <div key={key} className="item-fields">
                    <div className="label">{key}</div>
                    <div className="padding-item"></div>
                    <div className="value text-ellipsis" title={store.selected.fields[key]}>{store.selected.fields[key] ? store.selected.fields[key] : gettext("N/A")}</div>
                </div>
            ))
        },
        { title: gettext("Geometry"), key: "geom_info", visible: settings.show_geometry_info, icon: <QueryStats />, children: store.selected && (<GeometryInfo layerId={store.selected.layerId} featureId={store.selected.id} />) },
        { title: gettext("Description"), key: "description", visible: true, icon: <Description /> },
        { title: gettext("Attachments"), key: "attachment", visible: true, icon: <Attachment /> },
    ];



    return (
        <ConfigProvider
            theme={{
                components: {
                    Tabs: {
                        inkBarColor: "#106a90",
                        itemSelectedColor: "#106a90",
                        itemHoverColor: "#106a9080",
                        paddingXS: '0 10',
                        horizontalItemGutter: 10,
                        horizontalMargin: '0 5px 5px 5px',
                    },
                },
            }}
        >
            <div className="item-content">
                <div className="item">
                    <Select
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? "").includes(input)}
                        filterSort={(optionA, optionB) =>
                            (optionA?.label ?? "").toLowerCase().localeCompare((optionB?.label ?? "").toLowerCase())
                        }
                        showSearch
                        size="small"
                        value={store.selected}
                        style={{ width: "100%" }}
                        onChange={onChange}
                        options={data}
                    />
                    <Tabs
                        size="small"
                        onChange={onChangeTabs}
                        tabBarExtraContent={operations}
                        items={tabsItems.map((item, i) => {
                            return item.visible ?
                            {
                                key: item.key,
                                children: item.children,
                                icon: item.icon,
                            } : null
                        })}
                    />
                </div>
            </div>
        </ConfigProvider>
    )
};