import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Button, ConfigProvider, Empty, Select, Tabs, Typography } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Description from "@nextgisweb/icon/material/description";
import Attachment from "@nextgisweb/icon/material/attachment";
import EditNote from "@nextgisweb/icon/material/edit_note";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { useSource } from "../hook/useSource";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info"

import topic from "dojo/topic";
import { DisplayItemConfig } from "@nextgisweb/webmap/panels-manager/type";

import { FeatureEditorModal } from "@nextgisweb/feature-layer/feature-editor-modal";
import showModal from "@nextgisweb/gui/showModal";

const { Link } = Typography;
const settings = webmapSettings;

export const FeatureComponent: FC = ({ data, store, display }) => {
    const { getAttribute } = useSource();
    const { copyValue, contextHolder } = useCopy();

    const imodule = display.identify_module
    
    const { id, layerId, styleId } = store.selected;

    const [attribute, setAttr] = useState();
    const [keyTabs, setKeyTabs] = useState();
    const [feature, setFeature] = useState();

    const reloadLayer = useCallback(() => {
        const layer = display?.webmapStore.getLayer(store.selected.layerId);
        layer?.reload();
    }, [layerId]);

    useEffect(() => {
        store.setSelected(data[0]);
        getAttribute(data[0])
            .then(item => {
                setAttr(item._fieldmap);
                setFeature(item.feature);
            });
    }, [data]);

    useEffect(() => {
        if (feature) {
            topic.publish("feature.highlight", {
                geom: feature.geom,
                featureId: feature.id,
                layerId: layerId,
            });
        }
    }, [feature])

    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;

    const emailRegex = new RegExp(/\S+@\S+\.\S+/);

    const onChange = (value: number) => {
        const selected = data.find(item => item.value === value);
        store.setSelected(selected);
        setKeyTabs(selected.id)
        getAttribute(selected)
            .then(item => {
                setAttr(item._fieldmap);
                setFeature(item.feature);
            });
    };

    const onSave = () => {
        if (Object.prototype.hasOwnProperty.call(display, "identify_module")) {
            imodule._popup(imodule.mapEvent);
        }
        reloadLayer();
    }

    const onChangeTabs = () => {
        console.log(store.selected);
    };




    let operations;

    Object.values(display._itemConfigById).forEach((config: DisplayItemConfig) => {
        if (
            config.layerId !== layerId ||
            config.styleId !== styleId ||
            !imodule._isEditEnabled(display, config)
        ) {
            return;
        }
        operations = (
            <Button
                style={{ width: 20 }}
                type="text"
                title={gettext("Edit")}
                icon={<EditNote />}
                onClick={() => {
                    const featureId = id;
                    const resourceId = layerId;
                    showModal(FeatureEditorModal, {
                        editorOptions: {
                            featureId,
                            resourceId: resourceId,
                            onSave: () => {
                                if (onSave) {
                                    onSave();
                                }
                            },
                        },
                    });

                }}
            />
        );
    })

    const RenderValue = (value) => {

        for (const k in value) {
            const val = value[k];

            if (val !== null) {
                if (urlRegex.test(val)) {
                    return (<Link style={{ maxWidth: "60%" }} ellipsis={true} href={val} target="_blank">{val}</Link>)
                } else if (emailRegex.test(val)) {
                    return (<div className="value-email" onClick={() => {
                        copyValue(val, gettext("Email address copied"));
                    }} >{val}</div>)
                } else {
                    return (<div className="value text-ellipsis">{val}</div>)
                }
            }
            if (val === null) {
                return (<>{gettext("N/A")}</>)
            }
        }
    };

    const tabsItems = [
        {
            title: gettext("Attributes"),
            label: "Attributes",
            key: "attributes",
            visible: settings.identify_attributes,
            icon: <Info title={gettext("Attributes")} />,
            children: attribute && Object.keys(attribute).length > 0 ?
                (<div className="item">
                    {Object.keys(attribute).map((key) => {
                        return (
                            <div key={key} className="item-fields">
                                <div className="label">{key}</div>
                                <RenderValue value={attribute[key]} />
                            </div>
                        )
                    })}
                </div>) :
                (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)
        },
        { title: gettext("Geometry"), label: "Geometry", key: "geom_info", visible: settings.show_geometry_info, icon: <QueryStats />, children: store.selected && (<GeometryInfo layerId={store.selected.layerId} featureId={store.selected.id} />) },
        { title: gettext("Description"), label: "Description", key: "description", visible: true, icon: <Description /> },
        { title: gettext("Attachments"), label: "Attachments", key: "attachment", visible: true, icon: <Attachment /> },
    ];

    const items = useMemo(
        () =>
            tabsItems.map(item => {
                return item.visible ?
                    {
                        key: item.key,
                        label: item.label,
                        children: item.children,
                        icon: item.icon,
                    } : null
            }),
        [attribute]
    );

    return (
        <ConfigProvider
            theme={{
                components: {
                    Tabs: {
                        inkBarColor: "#106a90",
                        itemSelectedColor: "#106a90",
                        itemHoverColor: "#106a9080",
                        paddingXS: "0 0",
                        horizontalItemGutter: 0,
                        horizontalMargin: "0 0 0 0",
                        verticalItemMargin: 0, /*.ant-tabs-nav .ant-tabs-tab+.ant-tabs-tab*/
                        verticalItemPadding: "5px 0px 5px 7px", /*.ant-tabs-nav .ant-tabs-tab*/
                        controlHeight: 24,
                        paddingLG: 0, /*.ant-tabs-nav .ant-tabs-tab*/


                    },
                    Select: {
                        optionLineHeight: 1,
                        optionHeight: 0,
                        optionSelectedBg: "var(--divider-color)"
                    }
                },
            }}
        >
            {contextHolder}
            <div className="select-feature" >
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
            </div>
            <Tabs
                key={keyTabs}
                defaultActiveKey="attributes"
                tabPosition="left"
                size="small"
                onChange={onChangeTabs}
                tabBarExtraContent={operations}
                className="content-tabs"
                items={items}
            />
        </ConfigProvider>
    )
};