import { forwardRef, RefObject, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import CloseIcon from "@nextgisweb/icon/material/close";
import EditNote from "@nextgisweb/icon/material/edit_note";
import Identifier from "@nextgisweb/icon/mdi/identifier";

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
import { useCopy } from "@nextgisweb/webmap/useCopy";

import type { DataProps, Params } from "./type";
import topic from "dojo/topic";

const { Option } = Select;
const forbidden = gettext("The data is not available for reading")

export default observer(
    forwardRef<Element>(
        function PopupComponent(props: Params, ref: RefObject<Element>) {
            const { params, visible, display } = props;
            const { position, response, selected } = params;
            const { getAttribute, generateUrl } = useSource();
            const { copyValue, contextHolder } = useCopy();
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

            const getContent = async (val: DataProps, key: boolean) => {
                const res = await getAttribute(val);
                store.setAttribute(res.updateName);
                topic.publish("feature.highlight", {
                    geom: res.feature.geom,
                    featureId: res.feature.id,
                    layerId: res.resourceId,
                })

                const noSelectedItem = store.data;
                store.setContextUrl(generateUrl(display, { res: val, all: noSelectedItem }));
                store.setLinkToGeometry(res.resourceId + ":" + res.feature.id);

                if (key === true) {
                    store.setUpdate(false);
                }
            }

            useEffect(() => {
                store.setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
                if (count > 0) {
                    const selectVal = selected ? selected : response.data[0];
                    selectVal.label = selectVal.permission === "Forbidden" ? forbidden : selectVal.label;
                    store.setSelected(selectVal);
                    store.setData(response.data);
                    getContent(selectVal, false);
                } else {
                    store.setContextUrl(generateUrl(display, { res: null, all: null }));
                    store.setSelected(null);
                    store.setData([]);
                    topic.publish("feature.unhighlight");
                }
            }, [response]);

            useEffect(() => {
                if (store.update === true) {
                    getContent(store.selected, true);
                }
            }, [store.update]);

            const onChangeSelect = (value: { value: number; label: string }) => {
                const selectedValue = store.data.find(item => item.value === value.value);
                const cloneUser = { ...selectedValue };
                cloneUser.label = cloneUser.permission === "Forbidden" ? forbidden : cloneUser.label;
                store.setSelected(cloneUser);
                getContent(cloneUser, false);
            };

            const filterOption = (input: string, option?: { label: string; value: string; desc: string }) => {
                if ((option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                    (option?.desc ?? '').toLowerCase().includes(input.toLowerCase()))
                    return true
            }

            const linkToGeometry = useMemo(() => {
                if (count > 0 && store.selected) {
                    const item = Object.values(display._layers).find((itm: DisplayItemConfig) => itm.itemConfig.styleId === store.selected.styleId);
                    const title = gettext("HTML code of the geometry link, for insertion into the description")
                    const titleCopy = gettext("HTML code copied")
                    if (count > 0 && store.selected) {
                        if (!imodule._isEditEnabled(display, item)) { return false; }
                        return (<Button
                            size="small"
                            type="link"
                            title={title}
                            className="copy_to_clipboard"
                            icon={<Identifier />}
                            onClick={() => {
                                const linkToGeometryString = `<a href="${store.linkToGeometry}">${store.selected.label}</a>`
                                copyValue(linkToGeometryString, titleCopy);
                            }}
                        />)
                    }
                }
            }, [count, store.selected])

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
                        {contextHolder}
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
                            cancel=".select-feature,.select-feature-forbidden,.radio-block,.radio-group,.value-link,.value-email,.icon-symbol,.coordinate-value,.link-value,.content-item"
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
                                                title={store.selected?.desc}
                                                className="layer-name">
                                                {store.selected?.desc}
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
                                    <div className={store.selected.permission !== "Forbidden" ? "select-feature" : "select-feature-forbidden"} >
                                        <Select
                                            labelInValue
                                            optionLabelProp="label"
                                            placement="topLeft"
                                            filterOption={filterOption}
                                            showSearch
                                            size="small"
                                            value={store.selected}
                                            style={{ width: editFeature ? "calc(100% - 26px)" : "100%", padding: "0px 2px 0px 2px" }}
                                            onChange={onChangeSelect}
                                        >
                                            {store.data.map((item, index) => {
                                                const alias = item.permission === "Forbidden" ? forbidden : item.label;
                                                return (
                                                    <Option key={index} value={item.value} label={alias} desc={item.desc}>
                                                        {alias}
                                                    </Option>
                                                )
                                            })}
                                        </Select>
                                        {editFeature}
                                    </div>
                                )}
                                {store.selected && store.selected.permission !== "Forbidden" && (
                                    <div className="content">
                                        <ContentComponent linkToGeometry={linkToGeometry} store={store} display={display} />
                                    </div>
                                )}
                                <div className="footer-popup">
                                    <CoordinateComponent display={display} contextUrl={store.contextUrl} count={count} op="popup" />
                                </div>
                            </div>
                        </Rnd >
                    </ConfigProvider>,
                    document.body
                )
            )
        }
    )
);