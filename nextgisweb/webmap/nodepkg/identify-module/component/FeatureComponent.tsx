import { FC, useEffect } from "react";
import { Button, ConfigProvider, Empty, Segmented, Select, Tabs, Tooltip } from "@nextgisweb/gui/antd";
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
    const { fieldsAttribute, resourceItem, fields } = useSource();
    
    const onChange = (value: number) => {
        let val = data.find(item => item.value === value);
        store.setSelected(val);
    };

    const onChangeTabs = () => {
        console.log(store.selected);
    };

    useEffect(() => {
        store.setSelected(data[0]);
        fieldsAttribute(store.selected).then(item => console.log(item))
    }, [data])

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
            title: gettext("Attributes"),
            key: "attributes",
            visible: settings.identify_attributes,
            icon: <Info title={gettext("Attributes")} />,
            // children: store.selected && Object.keys(store.selected.fields).length > 0 ?
            //     Object.keys(store.selected.fields).map((key) => {
            //         return (
            //             <div key={key} className="item-fields">
            //                 <div className="label">{key}</div>
            //                 <div className="padding-item"></div>
            //                 <div className="value text-ellipsis" title={store.selected.fields[key]}>{store.selected.fields[key] ? store.selected.fields[key] : gettext("N/A")}</div>
            //             </div>
            //         )
            //     }) :
            //     (<Empty style={{marginBlock: 10}} image={Empty.PRESENTED_IMAGE_SIMPLE} />)
            children: <>{store.selected && (<>{store.selected.id}</>)}</>
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