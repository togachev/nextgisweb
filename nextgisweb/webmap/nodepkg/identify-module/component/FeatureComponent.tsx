import { FC, useEffect, useState } from "react";
import { Button, ConfigProvider, Empty, Segmented, Select, Tabs, Tooltip, Typography } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Description from "@nextgisweb/icon/material/description";
import Attachment from "@nextgisweb/icon/material/attachment";
import EditNote from "@nextgisweb/icon/material/edit_note";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { useSource } from "../hook/useSource";
import lookupTableCached from "ngw-lookup-table/cached";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info"

const { Link, Text } = Typography;
const settings = webmapSettings;

export const FeatureComponent: FC = ({ data, store }) => {
    const { getFeature } = useSource();

    const [feature, setFeature] = useState();

    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;

    const emailRegex = new RegExp(/\S+@\S+\.\S+/);

    const onChange = (value: number) => {

        const selected = data.find(item => item.value === value);
        store.setSelected(selected);

        getFeature(selected)
            .then(item => {
                setFeature(item);
            });
    };

    const onChangeTabs = () => {
        console.log(store.selected);
    };

    useEffect(() => {
        store.setSelected(data[0]);
        getFeature(data[0])
            .then(item => {
                setFeature(item);
            });
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

    const RenderValue = (value) => {

        for (const k in value) {
            let val = value[k];

            if (val !== null) {
                if (urlRegex.test(val)) {
                    return (<Link style={{ maxWidth: '75%' }} ellipsis={true} href={val} target="_blank">{val}</Link>)
                } else if (emailRegex.test(val)) {
                    return (<Text style={{ maxWidth: '75%' }} ellipsis={true} copyable>{val}</Text>)
                } else {
                    return (<div className="value text-ellipsis">{val}</div>)
                }
            }
        }
    };

    const tabsItems = [
        {
            title: gettext("Attributes"),
            key: "attributes",
            visible: settings.identify_attributes,
            icon: <Info title={gettext("Attributes")} />,
            children: feature && Object.keys(feature).length > 0 ?
                (<div className="item">
                    {Object.keys(feature).map((key) => {
                        return (

                            <div key={key} className="item-fields">
                                <div className="label">{key}</div>
                                <div className="padding-item"></div>
                                {/* <div className="value text-ellipsis" title={feature[key]}>{feature[key]}</div> */}
                                <RenderValue value={feature[key]} />
                            </div>

                        )
                    })}
                </div>) :
                (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)
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
                className="content-tabs"
                items={tabsItems.map((item, i) => {
                    return item.visible ?
                        {
                            key: item.key,
                            children: item.children,
                            icon: item.icon,
                        } : null
                })}
            />
        </ConfigProvider>
    )
};