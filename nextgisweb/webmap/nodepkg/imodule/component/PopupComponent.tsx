import { forwardRef, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import CloseIcon from "@nextgisweb/icon/material/close";
import EditNote from "@nextgisweb/icon/material/edit_note";
import Pin from "@nextgisweb/icon/mdi/pin";
import PinOff from "@nextgisweb/icon/mdi/pin-off";
import { Rnd } from "react-rnd";
import { ConfigProvider, Select, Tag } from "@nextgisweb/gui/antd";
import { Store } from "../Store";
import { observer } from "mobx-react-lite";
import { FeatureEditorModal } from "@nextgisweb/feature-layer/feature-editor-modal";
import showModal from "@nextgisweb/gui/showModal";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ContentComponent } from "./ContentComponent";
import { CoordinateComponent } from "./CoordinateComponent";
import { getEntries } from "../useSource";

import type { Params, Props } from "../type";
import topic from "@nextgisweb/webmap/compat/topic";

const { Option } = Select;
const forbidden = gettext("The data is not available for reading");

const CheckOnlyOne = ({ store }) => {
    const msgFixPopup = gettext("Lock popup position");
    const msgFixOffPopup = gettext("Disable lock popup position");
    const onChange = (checked: boolean) => {
        store.setFixPopup(checked);
    };

    return (
        <span title={store.fixPopup ? msgFixOffPopup : msgFixPopup}>
            <Tag.CheckableTag
                checked={store.fixPopup}
                onChange={onChange}
                className="legend-hide-button"
            >
                {store.fixPopup ? <PinOff /> : <Pin />}
            </Tag.CheckableTag>
        </span>
    );
};

export default observer(
    forwardRef<Element>(
        function PopupComponent(props, ref) {
            const { params, visible, display } = props as Params;
            const { op, position, response, selected: selectedValue } = params as Props;
            
            const urlParams = display.getUrlParams()
            const opts = display.config.options;
            const attrs = opts["webmap.identification_attributes"];
            const geoms = opts["webmap.identification_geometry"];

            const imodule = display.imodule;

            const offHP = imodule.offHP;
            const offset = display.clientSettings.offset_point;
            const fX = offHP + offset;
            const fY = offHP + offset;
            const W = window.innerWidth - offHP - offset * 2;
            const H = window.innerHeight - offHP - offset * 2;

            const [store] = useState(
                () => new Store({
                    display: display,
                    valueRnd: {
                        x: position.x,
                        y: position.y,
                        width: position.width,
                        height: position.height,
                    },
                    fixPos: null,
                    fixPanel: urlParams.pn ? urlParams.pn :
                        attrs === true ? "attributes" :
                            attrs === false && geoms === true ? "geom_info" :
                                (attrs === false && geoms === false) && "description",
                }));

            imodule.iStore = store;

            useEffect(() => {
                store.setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
                if (imodule.countFeature > 0) {
                    const selectVal = selectedValue ? selectedValue : response.data[0];
                    selectVal.label = selectVal.permission === "Forbidden" ? forbidden : selectVal.label;
                    store.setSelected(selectVal);
                    store.setData(response.data);
                    store.getContent(selectVal, false);
                    store.LinkToGeometry(selectVal);
                    store.setCountFeature(imodule.countFeature);
                } else {
                    store.generateUrl({ res: null, st: null, pn: null, disable: false });
                    store.setSelected({});
                    store.setData([]);
                    store.setLinkToGeometry("");
                    topic.publish("feature.unhighlight");
                    store.setCountFeature(0);
                }
            }, [response]);

            useEffect(() => {
                store.generateUrl({ res: response.data[0], st: response.data, pn: store.fixPanel, disable: false })
            }, [store.currentUrlParams]);

            useEffect(() => {
                if (store.selected && store.update === true) {
                    store.getContent(store.selected, true);
                }
            }, [store.update]);

            useEffect(() => {
                if (store.fixPopup) {
                    store.setFixPos(store.valueRnd);
                    store.setFixPanel(store.fixContentItem.key)
                } else {
                    store.setFixPos(null);
                }
            }, [store.fixPopup]);

            const onChangeSelect = async (value) => {
                const selectedValue = store.data.find(item => item.value === value.value);
                const copy = { ...selectedValue };
                copy.label = copy.permission === "Forbidden" ? forbidden : copy.label;
                store.setSelected(copy);
                store.getContent(copy, false);
                store.LinkToGeometry(copy);
            };

            const filterOption = (input, option?: { label: string; value: string; desc: string }) => {
                if ((option?.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
                    (option?.desc ?? "").toLowerCase().includes(input.toLowerCase())) {
                    return true
                } else {
                    return false
                }
            }

            const editFeature = useMemo(() => {
                if (store.countFeature > 0 && store.selected && store.selected.type === "vector") {
                    const { id, layerId, styleId } = store.selected;
                    const item = getEntries(display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.styleId === styleId)?.[1];

                    if (display.isTinyMode() && !display.isTinyModePlugin("@nextgisweb/webmap/plugin/feature-layer")) {
                        return false;
                    } else if (!imodule._isEditEnabled(display, item)) {
                        return false;
                    } else if (store.selected.permission === "Forbidden") {
                        return false;
                    } else {
                        return (
                            <span
                                title={gettext("Edit")}
                                className="link-button"
                                onClick={() => {
                                    const featureId = id;
                                    const resourceId = layerId;
                                    showModal(FeatureEditorModal, {
                                        transitionName: "",
                                        maskTransitionName: "",
                                        editorOptions: {
                                            featureId,
                                            resourceId: resourceId,
                                            onSave: () => {
                                                store.setUpdate(true);
                                                topic.publish("feature.updated", { resourceId: layerId, featureId: id });
                                            },
                                        },
                                    });

                                }}
                            >
                                <EditNote />
                            </span>
                        )
                    }
                }
            }, [store.selected]);

            const contentProps = { store: store, display: display };
            const coordinateProps = { display: display, store: store, op: "popup" };

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
                                Tag: {
                                    colorFillSecondary: "#00000010",
                                    defaultColor: "var(--text-secondary)",
                                    colorPrimary: "var(--primary)",
                                    colorPrimaryActive: "#00000010",
                                    colorPrimaryHover: "#00000010",
                                    borderRadiusSM: 2,
                                },
                                Message: {
                                    colorSuccess: "var(--primary)",
                                }
                            }
                        }}
                    >

                        <Rnd
                            style={{ zIndex: 10 }}
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
                            cancel=".select-feature,.select-feature-forbidden,.radio-block,.radio-group,.value-link,.value-email,.icon-symbol,.coordinate-value,.link-value,.content-item"
                            bounds={store.valueRnd.width === W ? undefined : "window"}
                            minWidth={position.width}
                            minHeight={position.height}
                            allowAnyClick={true}
                            enableResizing={store.countFeature > 0 ? (store.fixPos === null ? true : false) : false}
                            disableDragging={store.countFeature > 0 && store.fixPos !== null ? true : false}
                            position={store.countFeature > 0 && store.fixPos !== null ? { x: store.fixPos?.x, y: store.fixPos?.y } : { x: store.valueRnd.x, y: store.valueRnd.y }}
                            size={store.countFeature > 0 && store.fixPos !== null ? { width: store.fixPos?.width, height: store.fixPos?.height } : { width: store.valueRnd.width, height: store.valueRnd.height }}
                            onDragStop={(e, d) => {
                                if (store.valueRnd.x !== d.x || store.valueRnd.y !== d.y) {
                                    store.setValueRnd({ ...store.valueRnd, x: d.x, y: d.y });
                                    if (store.valueRnd.width === W && store.valueRnd.height === H) {
                                        store.setValueRnd({ ...store.valueRnd, width: position.width, height: position.height, x: position.x, y: position.y });
                                        store.setFullscreen(false);
                                    }
                                }
                            }}
                            onResize={(e, direction, ref, delta, position) => {
                                store.setValueRnd({ ...store.valueRnd, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y });
                            }}
                        >
                            <div ref={ref as any} className="popup-position" >
                                <div className="title">
                                    <div className="title-name"
                                        onClick={(e) => {
                                            if (store.countFeature > 0 && e.detail === 2) {
                                                setTimeout(() => {
                                                    if (store.valueRnd.width > position.width || store.valueRnd.height > position.height) {
                                                        store.setValueRnd({ ...store.valueRnd, width: position.width, height: position.height, x: position.x, y: position.y });
                                                        store.setFullscreen(false)
                                                    } else {
                                                        store.setValueRnd({ ...store.valueRnd, width: W, height: H, x: fX, y: fY });
                                                        store.setFullscreen(true);
                                                    }
                                                }, 200)
                                            } else {
                                                e.stopPropagation();
                                            }
                                        }}
                                    >
                                        <span className="object-select">Объектов: {store.countFeature}</span>
                                        {store.countFeature > 0 && store.selected && (
                                            <span
                                                title={store.selected?.desc}
                                                className="layer-name">
                                                {store.selected?.desc}
                                            </span>
                                        )}
                                    </div>
                                    {store.countFeature > 0 && <CheckOnlyOne store={store} />}
                                    {store.countFeature > 0 && store.selected && (
                                        <span
                                            title={store.fullscreen === true ? gettext("Сollapse fullscreen popup") : gettext("Open fullscreen popup")}
                                            className={store.countFeature > 0 && store.fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                            onClick={() => {
                                                if (store.countFeature > 0 && store.fixPos === null) {
                                                    if (store.valueRnd.width > position.width || store.valueRnd.height > position.height) {
                                                        store.setValueRnd({ ...store.valueRnd, width: position.width, height: position.height, x: position.x, y: position.y });
                                                        store.setFullscreen(false)
                                                    } else {
                                                        store.setValueRnd({ ...store.valueRnd, width: W, height: H, x: fX, y: fY });
                                                        store.setFullscreen(true)
                                                    }
                                                    if (store.valueRnd.width < W && store.valueRnd.width > position.width || store.valueRnd.height < H && store.valueRnd.height > position.height) {
                                                        store.setValueRnd({ ...store.valueRnd, width: W, height: H, x: fX, y: fY });
                                                        store.setFullscreen(true)
                                                    }
                                                }
                                            }} >
                                            {store.fullscreen === true ? (<CloseFullscreen />) : (<OpenInFull />)}
                                        </span>
                                    )}
                                    <span
                                        title={gettext("Close")}
                                        className={store.countFeature > 0 && store.fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                        onClick={() => {
                                            visible({ hidden: true, overlay: undefined, key: "popup" })
                                            topic.publish("feature.unhighlight");
                                            store.setFullscreen(false)
                                            store.setValueRnd({ ...store.valueRnd, x: -9999, y: -9999 });
                                        }} >
                                        <CloseIcon />
                                    </span>
                                </div>
                                {store.countFeature > 0 && store.selected && (
                                    <div className={store.selected.permission !== "Forbidden" ? "select-feature" : "select-feature-forbidden"} >
                                        <Select
                                            labelInValue
                                            optionLabelProp="label"
                                            placement="topLeft"
                                            filterOption={filterOption}
                                            showSearch
                                            size="small"
                                            value={{ label: store.selected.label, value: store.selected.value }}
                                            style={{ width: editFeature ? "calc(100% - 26px)" : "100%", padding: "0px 2px 0px 2px" }}
                                            onChange={onChangeSelect}
                                        >
                                            {store.data.map((item, index) => {
                                                const alias = item.permission === "Forbidden" ? forbidden : item.label;
                                                return (
                                                    <Option key={index} type={item.type} value={item.value} label={alias} desc={item.desc}>
                                                        {alias}
                                                    </Option>
                                                )
                                            })}
                                        </Select>
                                        {editFeature}
                                    </div>
                                )}
                                {store.countFeature > 0 && store.selected && store.selected.permission !== "Forbidden" && (
                                    <div className="content">
                                        <ContentComponent {...contentProps} />
                                    </div>
                                )}
                                {op === "popup" && (<div className="footer-popup">
                                    <CoordinateComponent {...coordinateProps} />
                                </div>)}
                            </div>
                        </Rnd >
                    </ConfigProvider>,
                    document.body
                )
            )
        }
    )
);