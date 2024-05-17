import { FC, useMemo } from "react";
import { Button, ConfigProvider, Empty, Tabs, Tooltip, Typography } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Description from "@nextgisweb/icon/material/description";
import Attachment from "@nextgisweb/icon/material/attachment";
import EditNote from "@nextgisweb/icon/material/edit_note";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info";
import topic from "dojo/topic";
import { DisplayItemConfig } from "@nextgisweb/webmap/panels-manager/type";
import { RadioButtonComponent } from "./RadioButtonComponent";
import { FeatureEditorModal } from "@nextgisweb/feature-layer/feature-editor-modal";
import showModal from "@nextgisweb/gui/showModal";

const { Link } = Typography;
const settings = webmapSettings;

export const FeatureComponent: FC = ({ display, store, attribute, position }) => {

    const { copyValue, contextHolder } = useCopy();
    const imodule = display.identify_module
    const { id, layerId, styleId, value } = store.selected;
    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;
    const emailRegex = new RegExp(/\S+@\S+\.\S+/);

    const onSave = () => {
        store.setUpdate(true);
        topic.publish("feature.updated", {
            resourceId: layerId,
            featureId: id,
        });
    }

    const onChangeTabs = (e) => {
        console.log(e);
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
            <Tooltip title={gettext("Edit")}>
                <Button
                    type="text"
                    className="edit-button"
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
            </Tooltip>
        );
    })

    const RenderValue = (value) => {
        for (const k in value) {
            const val = value[k];

            if (val !== null) {
                if (urlRegex.test(val)) {
                    return (<Link title={val} className="value-link" ellipsis={true} href={val} target="_blank">{val}</Link>)
                } else if (emailRegex.test(val)) {
                    return (<div title={val} className="value-email" onClick={() => {
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
            label: <Tooltip title={gettext("Attributes")}><Info title={gettext("Attributes")} /></Tooltip>,
            key: "attributes",
            visible: settings.identify_attributes,
            children:
                <span
                    onMouseEnter={(e) => { e.type === 'mouseenter' && store.setStyleContent(false) }}
                    onTouchMove={(e) => { e.type === 'touchmove' && store.setStyleContent(true) }}
                >
                    {attribute && Object.keys(attribute).length > 0 ?
                        (<div className="item"

                        >
                            {Object.keys(attribute).map((key) => {
                                return (
                                    <div onTouchEnd={() => { copyValue(key + ": " + attribute[key], gettext("Rows copied")) }} key={key} className="item-fields">
                                        <div className="label">{key}</div>
                                        <RenderValue value={attribute[key]} />
                                    </div>
                                )
                            })}
                        </div>) :
                        (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)}
                </span>
        },
        {
            label: <Tooltip title={gettext("Geometry info")}><QueryStats /></Tooltip>,
            key: "geom_info",
            visible: settings.show_geometry_info,
            children: store.selected && (<GeometryInfo layerId={store.selected.layerId} featureId={store.selected.id} />)
        },
        {
            label: <Tooltip title={gettext("Description")}><Description /></Tooltip>,
            key: "description",
            visible: true
        },
        {
            label: <Tooltip title={gettext("Attachments")}><Attachment /></Tooltip>,
            key: "attachment",
            visible: true
        },
    ];

    const items = useMemo(
        () =>
            tabsItems.map(item => {
                if (item.visible) {
                    return {
                        key: item.key,
                        children: item.children,
                        label: item.label,
                    }
                }
            }),
        [store.attribute]
    );

    return (
        <ConfigProvider
            theme={{
                components: {
                    Tabs: {
                        inkBarColor: "#106a90",
                        itemSelectedColor: "#106a90",
                        itemHoverColor: "#106a9080",
                        // paddingXS: 1,
                        // horizontalItemGutter: 2,
                        // horizontalMargin: 3,
                        // verticalItemMargin: 0, /*.ant-tabs-nav .ant-tabs-tab+.ant-tabs-tab*/
                        paddingLG: 0, /*.ant-tabs-nav .ant-tabs-tab*/
                        // horizontalItemPaddingSM: 6,
                        // controlHeight: 0,
                        // verticalItemPadding: "10px 10px",
                        // cardHeight: 9,

                    },
                },
            }}
        >
            {contextHolder}
            <RadioButtonComponent display={display} attribute={attribute} store={store} position={position} />
            {/* <Tabs
                popupClassName="more-tabs"
                key={value}
                style={{ height: position.height - 70, width: position.width }}
                defaultActiveKey="attributes"
                size="small"
                onChange={onChangeTabs}
                // tabBarExtraContent={{ right: operations }}
                className="content-tabs"
                items={items}
                tabPosition="left"
            /> */}
        </ConfigProvider>
    )
};