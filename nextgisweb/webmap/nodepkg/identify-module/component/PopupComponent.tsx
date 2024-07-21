import { forwardRef, RefObject, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import CloseIcon from "@nextgisweb/icon/material/close";
import EditNote from "@nextgisweb/icon/material/edit_note";

import { Rnd } from "react-rnd";
import { Button, ConfigProvider, Select } from "@nextgisweb/gui/antd";
import { IdentifyStore } from "../IdentifyStore";
import { observer } from "mobx-react-lite";
import { FeatureEditorModal } from "@nextgisweb/feature-layer/feature-editor-modal";
import showModal from "@nextgisweb/gui/showModal";
import { DisplayItemConfig } from "@nextgisweb/webmap/panels-manager/type";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ContentComponent } from "./ContentComponent";
import { CoordinateComponent } from "./CoordinateComponent";
import { useSource } from "../hook/useSource";
import type { DojoDisplay } from "@nextgisweb/webmap/type";
import topic from "dojo/topic";

interface Visible {
    hidden: boolean;
    overlay: boolean | undefined;
    key: string;
}

interface StyleRequestProps {
    id: number;
    label: string;
    layerId: number;
    layer_name: string;
    styleId: number;
    value: string;
}

interface Response {
    featureCount: number;
    data: StyleRequestProps[];
    fields: object;
}

interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Rnd {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Props {
    response: Response;
    position: Position;
}

interface Params {
    params: Props;
    visible: ({ hidden, overlay, key }: Visible) => void;
    display: DojoDisplay;
}

export default observer(forwardRef<Element>(function PopupComponent(props: Params, ref: RefObject<Element>) {
    const { params, visible, display } = props;
    const { position, response } = params;
    const { getAttribute, generateUrl } = useSource();
    const imodule = display.identify_module;

    const count = response.featureCount;

    const [store] = useState(
        () => new IdentifyStore({
            valueRnd: {
                x: position.x,
                y: position.y,
                width: position.width,
                height: position.height,
            },
        }));
    imodule.identifyStore = store;

    const offHP = 40;
    const offset = display.clientSettings.offset_point;
    const fX = offHP + offset;
    const fY = offHP + offset;

    const W = window.innerWidth - offHP - offset * 2;
    const H = window.innerHeight - offHP - offset * 2;

    useEffect(() => {
        store.setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
        if (count > 0) {
            store.setSelected(response.data[0]);
            store.setData(response.data);

        } else {
            store.setContextUrl(generateUrl(display, { res: null, all: null }));
            store.setSelected(undefined);
            store.setData([]);
            topic.publish("feature.unhighlight");
        }
    }, [response]);

    useEffect(() => {
        if (store.update === true) {
            (async () => {
                const value = await getAttribute(store.selected);
                store.setAttribute(value.updateName);
                topic.publish("feature.highlight", {
                    geom: value.feature.geom,
                    featureId: value.feature.id,
                    layerId: value.resourceId,
                })
                store.setUpdate(false);
            })();
        }
    }, [store.update]);

    const onChange = (value: { value: number; label: string }) => {
        const selectedValue = store.data.find(item => item.value === value.value);
        store.setSelected(selectedValue);
        const noSelectedItem = store.data.filter(item => item.value !== value.value);
        store.setContextUrl(generateUrl(display, { res: selectedValue, all: noSelectedItem }));
        if (count > 0 && !selectedValue.value.includes("Forbidden")) {
            store.setLinkToGeometry(selectedValue.layerId + ":" + selectedValue.id);
        }
    };

    const filterOption = (input: string, option?: { label: string; value: string; layer_name: string }) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
        (option?.layer_name ?? '').toLowerCase().includes(input.toLowerCase());

    const editFeature = useMemo(() => {
        if (count > 0 && store.selected) {
            const { id, layerId, styleId } = store.selected;
            const item = Object.values(display._layers).find((itm: DisplayItemConfig) => itm.itemConfig.styleId === styleId);

            if (display.isTinyMode() && !display.isTinyModePlugin("ngw-webmap/plugin/FeatureLayer")) {
                return false;
            } else if (!imodule._isEditEnabled(display, item)) {
                return false;
            } else {
                return (<div title={gettext("Edit")}>
                    <Button
                        type="text"
                        className="edit-symbol"
                        icon={<EditNote />}
                        onClick={() => {
                            const featureId = id;
                            const resourceId = layerId;
                            showModal(FeatureEditorModal, {
                                editorOptions: {
                                    featureId,
                                    resourceId: resourceId,
                                    onSave: () => {
                                        store.setUpdate(true);
                                        topic.publish("feature.updated", { resourceId: layerId, featureId: id });
                                        store.setUpdateContent(true);
                                    },
                                },
                            });

                        }}
                    />
                </div>)
            }
        }
    }, [store.selected])

    return (
        createPortal(
            <ConfigProvider
                theme={{
                    components: {
                        Dropdown: {
                            paddingBlock: 5,
                            controlPaddingHorizontal: 5,
                            controlItemBgActiveHover: "var(--divider-color)",
                            colorPrimary: "var(--text-base)",
                            lineHeight: 1,
                        },
                        Radio: {
                            buttonPaddingInline: 3,
                            buttonSolidCheckedHoverBg: "var(--icon-color)",
                            colorPrimary: "var(--primary)",
                            borderRadius: 4,
                            controlHeight: 24,
                            fontSize: 16,
                            lineWidth: 1,
                            lineHeight: 1,
                            paddingXS: 50
                        },
                        Select: {
                            optionSelectedBg: "var(--divider-color)",
                            colorPrimaryHover: "var(--divider-color)",
                            colorPrimary: "var(--text-secondary)",
                            controlOutline: "var(--divider-color)",
                            colorBorder: "var(--divider-color)",
                        },
                        Button: {
                            colorLink: "var(--text-base)",
                            colorLinkHover: "var(--primary)",
                            defaultHoverColor: "var(--primary)",
                        },
                    }
                }}
            >
                <Rnd
                    resizeHandleClasses={{
                        right: "hover-right",
                        left: "hover-left",
                        top: "hover-top",
                        bottom: "hover-bottom",
                        bottomRight: "hover-angle-bottom-right",
                        bottomLeft: "hover-angle-bottom-left",
                        topRight: "hover-angle-top-right",
                        topLeft: "hover-angle-top-left",
                    }}
                    cancel=".select-feature,.radio-block,.radio-group,.value-link,.value-email,.icon-symbol,.coordinate-value,.content-item"
                    bounds={store.valueRnd.width === W ? undefined : "window"}
                    minWidth={position.width}
                    minHeight={position.height}
                    allowAnyClick={true}
                    enableResizing={count > 0 ? true : false}
                    position={{ x: store.valueRnd.x, y: store.valueRnd.y }}
                    size={{ width: store.valueRnd.width, height: store.valueRnd.height }}
                    onDragStop={(e, d) => {
                        if (store.valueRnd.x !== d.x || store.valueRnd.y !== d.y) {
                            store.setValueRnd(prev => ({ ...prev, x: d.x, y: d.y }));
                            if (store.valueRnd.width === W && store.valueRnd.height === H) {
                                store.setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                                store.setFullscreen(false);
                            }
                        }
                    }}
                    onResize={(e, direction, ref, delta, position) => {
                        store.setValueRnd(prev => ({ ...prev, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y }));
                    }}
                >
                    <div ref={ref} className="popup-position" >
                        <div className="title">
                            <div className="title-name"
                                onClick={(e) => {
                                    if (count > 0 && e.detail === 2) {
                                        setTimeout(() => {
                                            if (store.valueRnd.width > position.width || store.valueRnd.height > position.height) {
                                                store.setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                                                store.setFullscreen(false)
                                            } else {
                                                store.setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                                store.setFullscreen(true)
                                            }
                                        }, 200)
                                    } else {
                                        e.stopPropagation();
                                    }
                                }}
                            >
                                <span className="object-select">Объектов: {count}</span>
                                {count > 0 && store.selected && (
                                    <span
                                        title={store.selected?.layer_name}
                                        className="layer-name">
                                        {store.selected?.layer_name}
                                    </span>
                                )}
                            </div>
                            {count > 0 && store.selected && (<span
                                title={store.fullscreen === true ? gettext("Close fullscreen popup") : gettext("Open fullscreen popup")}
                                className="icon-symbol"
                                onClick={() => {
                                    if (store.valueRnd.width > position.width || store.valueRnd.height > position.height) {
                                        store.setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                                        store.setFullscreen(false)
                                    } else {
                                        store.setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                        store.setFullscreen(true)
                                    }
                                    if (store.valueRnd.width < W && store.valueRnd.width > position.width || store.valueRnd.height < H && store.valueRnd.height > position.height) {
                                        store.setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                        store.setFullscreen(true)
                                    }
                                }} >
                                {store.fullscreen === true ? (<CloseFullscreen />) : (<OpenInFull />)}
                            </span>)}
                            <span
                                title={gettext("Close")}
                                className="icon-symbol"
                                onClick={() => {
                                    visible({ hidden: true, overlay: undefined, key: "popup" })
                                    topic.publish("feature.unhighlight");
                                    store.setFullscreen(false)
                                    store.setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
                                }} >
                                <CloseIcon />
                            </span>
                        </div>
                        {count > 0 && store.selected && (
                            <div className="select-feature" >
                                <Select
                                    labelInValue
                                    placement="topLeft"
                                    optionFilterProp="children"
                                    filterOption={filterOption}
                                    filterSort={(optionA, optionB) =>
                                        (optionA?.label ?? "").toLowerCase().localeCompare((optionB?.label ?? "").toLowerCase())
                                    }
                                    showSearch
                                    size="small"
                                    value={store.selected}
                                    style={{ width: editFeature ? "calc(100% - 26px)" : "100%", padding: "0px 2px 0px 2px" }}
                                    onChange={onChange}
                                    options={store.data}
                                    optionRender={(option) => (
                                        <div className="label-select">
                                            <div title={option.data.label} className="label-feature">
                                                {option.data.label}
                                            </div>
                                            <div title={option.data.layer_name} className="label-style">
                                                {option.data.layer_name}
                                            </div>
                                        </div>
                                    )}
                                />
                                {editFeature}
                            </div>
                        )}
                        {store.selected && (<div className="content">
                            <ContentComponent store={store} display={display} />
                        </div>)}
                        <div className="footer-popup">
                            <CoordinateComponent display={display} contextUrl={store.contextUrl} count={count} op="popup" />
                        </div>
                    </div>
                </Rnd >
            </ConfigProvider>,
            document.body
        )
    )
}));