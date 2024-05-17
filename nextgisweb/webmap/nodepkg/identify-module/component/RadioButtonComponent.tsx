import { FC, useMemo, useState, useEffect, useRef } from "react";
import { Button, ConfigProvider, Dropdown, Empty, Radio, Space, Tooltip, Typography } from "@nextgisweb/gui/antd";
import type { MenuProps } from "@nextgisweb/gui/antd";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Description from "@nextgisweb/icon/material/description";
import Attachment from "@nextgisweb/icon/material/attachment";
import MoreVert from "@nextgisweb/icon/material/more_vert";
import EditNote from "@nextgisweb/icon/material/edit_note";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { gettext } from "@nextgisweb/pyramid/i18n";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info";
import { FeatureEditorModal } from "@nextgisweb/feature-layer/feature-editor-modal";
import showModal from "@nextgisweb/gui/showModal";
import topic from "dojo/topic";
import { DisplayItemConfig } from "@nextgisweb/webmap/panels-manager/type";

const { Link } = Typography;
const settings = webmapSettings;

export const RadioButtonComponent: FC = ({ display, store, attribute, position }) => {
    const [radioValue, setRadioValue] = useState('attributes');
    const { copyValue, contextHolder } = useCopy();
    const imodule = display.identify_module;
    const { id, layerId, styleId, value } = store.selected;
    const panelRef = useRef<HTMLDivElement>(null);

    const heightRadio = 106 + 2 + 2; /* ~ height and padding 2px */
    const [heightPanel, setHeightPanel] = useState();

    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;
    const emailRegex = new RegExp(/\S+@\S+\.\S+/);
    const onSave = () => {
        store.setUpdate(true);
        topic.publish("feature.updated", {
            resourceId: layerId,
            featureId: id,
        });
    }
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

    const options = useMemo(
        () =>
            [
                {
                    label: <Info />, value: 'attributes', key: 'attributes', title: gettext("Attributes"), visible: settings.identify_attributes, children:
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
                { label: <QueryStats />, value: 'geom_info', key: 'geom_info', title: gettext("Geometry info"), visible: settings.show_geometry_info, children: store.selected && (<GeometryInfo layerId={store.selected.layerId} featureId={store.selected.id} />) },
                { label: <Description />, value: 'description', key: 'description', title: gettext("Description"), visible: true },
                { label: <Attachment />, value: 'attachment', key: 'attachment', title: gettext("Attachments"), visible: true },
            ],
        [store.attribute]
    );

    console.log(options);
    

    // const options = [
    //     {
    //         label: <Info />, value: 'attributes', key: 'attributes', title: gettext("Attributes"), visible: settings.identify_attributes, children:
    //             <span
    //                 onMouseEnter={(e) => { e.type === 'mouseenter' && store.setStyleContent(false) }}
    //                 onTouchMove={(e) => { e.type === 'touchmove' && store.setStyleContent(true) }}
    //             >
    //                 {attribute && Object.keys(attribute).length > 0 ?
    //                     (<div className="item"

    //                     >
    //                         {Object.keys(attribute).map((key) => {
    //                             return (
    //                                 <div onTouchEnd={() => { copyValue(key + ": " + attribute[key], gettext("Rows copied")) }} key={key} className="item-fields">
    //                                     <div className="label">{key}</div>
    //                                     <RenderValue value={attribute[key]} />
    //                                 </div>
    //                             )
    //                         })}
    //                     </div>) :
    //                     (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)}
    //             </span>
    //     },
    //     { label: <QueryStats />, value: 'geom_info', key: 'geom_info', title: gettext("Geometry info"), visible: settings.show_geometry_info, children: store.selected && (<GeometryInfo layerId={store.selected.layerId} featureId={store.selected.id} />) },
    //     { label: <Description />, value: 'description', key: 'description', title: gettext("Description"), visible: true },
    //     { label: <Attachment />, value: 'attachment', key: 'attachment', title: gettext("Attachments"), visible: true },
    // ];

    const onChange = ({ target: { value } }) => {
        setRadioValue(options.find(item => item.key === value));
    };

    const onClick: MenuProps['onClick'] = ({ key }) => {
        setRadioValue(options.find(item => item.key === key));
    };

    useEffect(() => {
        setHeightPanel(position.height - 70);
        setRadioValue(options.find(item => item.key === "attributes"));
    }, [position.x]);

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

    return (
        <ConfigProvider
            theme={{
                components: {
                    Radio: {
                        buttonBg: "#ffffff",
                        buttonCheckedBg: "#106a90",
                        buttonCheckedBgDisabled: "#000000",
                        buttonCheckedColorDisabled: "#EF2929",
                        buttonColor: "var(--text-base)",
                        buttonPaddingInline: 2,
                        buttonSolidCheckedActiveBg: "#C17D11",
                        buttonSolidCheckedBg: "var(--divider-color)",
                        buttonSolidCheckedColor: "var(--primary)",
                        buttonSolidCheckedHoverBg: "var(--divider-color)",
                        dotColorDisabled: "#4E9A06",
                        colorBgContainer: "#FCAF3E",
                        colorBgContainerDisabled: "#A40000",
                        colorBorder: "var(--divider-color)",
                        colorPrimary: "#106a90",
                        colorPrimaryActive: "var(--primary)",
                        colorPrimaryBorder: "#204A87",
                        colorPrimaryHover: "#000",
                        colorText: "#8F5902",
                        colorTextDisabled: "#2E3436",
                        borderRadius: 4,
                        controlHeight: 24,
                        fontSize: 16,
                        lineWidth: 1,
                        lineHeight: 1,
                        paddingXS: 50
                    }
                }
            }}
        >
            {contextHolder}
            <div className="radio-block" style={{ height: position.height - 70 }}>
                < div className="content-item">{radioValue.children}</div>
                {heightPanel > heightRadio ?
                    (<div ref={panelRef} className="radio-group" >
                        <Radio.Group defaultValue={radioValue} buttonStyle="solid" className="radio-component" >
                            <Space direction="vertical" style={{ rowGap: 3 }}>
                                {
                                    options.map((item, i) => (
                                        <Tooltip placement="left" key={i} title={item.title}>
                                            <Radio.Button onChange={onChange} value={item.value}>{item.label}</Radio.Button>
                                        </Tooltip>
                                    ))
                                }
                            </Space>
                        </Radio.Group>
                    </div>) :
                    (<Dropdown placement="bottomRight" menu={{ items: options, onClick }} trigger={['click', 'hover', 'touchstart']}>
                        <span className="drop-down-icon"><MoreVert /></span>
                    </Dropdown>)}
            </div>
        </ConfigProvider >
    )
};