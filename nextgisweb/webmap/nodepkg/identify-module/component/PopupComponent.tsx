import { forwardRef, RefObject, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import CloseIcon from "@nextgisweb/icon/material/close";
import EditNote from "@nextgisweb/icon/material/edit_note";
import Identifier from "@nextgisweb/icon/mdi/identifier";

import Pin from "@nextgisweb/icon/mdi/pin";
import PinOff from "@nextgisweb/icon/mdi/pin-off";

import { Rnd } from "react-rnd";
import { Button, ConfigProvider, Select, Tag } from "@nextgisweb/gui/antd";
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

const CheckOnlyOne = ({ store }) => {
    const onChange = (checked: boolean) => {
        store.setFixPopup(checked);
    };

    return (
        <Tag.CheckableTag
            checked={store.fixPopup}
            onChange={onChange}
        >
            {store.fixPopup ? <PinOff style={{ transform: "rotate(30deg)" }} /> : <Pin style={{ transform: "rotate(30deg)" }} />}
        </Tag.CheckableTag>
    );
};

export default observer(
    forwardRef<Element>(
        function PopupComponent(props: Params, ref: RefObject<Element>) {
            const { params, visible, display } = props;
            const { position, response, selectedValue } = params;
            const { getAttribute, generateUrl } = useSource();
            const { copyValue, contextHolder } = useCopy();
            const imodule = display.identify_module;

            const count = response.featureCount;
            const s = display.getUrlParams()

            const [store] = useState(
                () => new IdentifyStore({
                    valueRnd: {
                        x: position.x,
                        y: position.y,
                        width: position.width,
                        height: position.height,
                    },
                    fixPos: null,
                    fixPanel: s.pn ? s.pn : "attributes",
                }));
            imodule.identifyStore = store;

            const {
                contextUrl,
                data,
                fixContentItem,
                fixPanel,
                fixPopup,
                fixPos,
                fullscreen,
                selected,
                setAttribute,
                setContextUrl,
                setData,
                setExtensions,
                setFixPanel,
                setFixPos,
                setFullscreen,
                setLinkToGeometry,
                setSelected,
                setUpdate,
                setValueRnd,
                update,
                valueRnd,
            } = store;

            const offHP = 40;
            const offset = display.clientSettings.offset_point;
            const fX = offHP + offset;
            const fY = offHP + offset;

            const W = window.innerWidth - offHP - offset * 2;
            const H = window.innerHeight - offHP - offset * 2;

            const getContent = async (val: DataProps, key: boolean) => {
                const res = await getAttribute(val);
                setExtensions(res.feature.extensions);
                setAttribute(res.updateName);
                topic.publish("feature.highlight", {
                    geom: res.feature.geom,
                    featureId: res.feature.id,
                    layerId: res.resourceId,
                })

                const noSelectedItem = data;
                setContextUrl(generateUrl(display, { res: val, st: noSelectedItem, pn: fixPanel }));
                setLinkToGeometry(res.resourceId + ":" + res.feature.id);

                if (key === true) {
                    setUpdate(false);
                }
            }

            useEffect(() => {
                setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
                if (count > 0) {
                    const selectVal = selectedValue ? selectedValue : response.data[0];
                    selectVal.label = selectVal.permission === "Forbidden" ? forbidden : selectVal.label;
                    setSelected(selectVal);
                    setData(response.data);
                    getContent(selectVal, false);
                } else {
                    setContextUrl(generateUrl(display, { res: null, st: null, pn: null }));
                    setSelected(null);
                    setData([]);
                    topic.publish("feature.unhighlight");
                }
            }, [response, fixPanel]);

            useEffect(() => {
                if (update === true) {
                    getContent(selected, true);
                }
            }, [update]);

            useEffect(() => {
                if (fixPopup) {
                    setFixPos(valueRnd);
                    setFixPanel(fixContentItem.key)
                } else {
                    setFixPos(null);
                    // setFixPanel(null);
                }
            }, [fixPopup]);

            const onChangeSelect = (value: { value: number; label: string }) => {
                const selectedValue = data.find(item => item.value === value.value);
                const cloneUser = { ...selectedValue };
                cloneUser.label = cloneUser.permission === "Forbidden" ? forbidden : cloneUser.label;
                setSelected(cloneUser);
                getContent(cloneUser, false);
            };

            const filterOption = (input: string, option?: { label: string; value: string; desc: string }) => {
                if ((option?.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
                    (option?.desc ?? "").toLowerCase().includes(input.toLowerCase()))
                    return true
            }

            const linkToGeometry = useMemo(() => {
                if (count > 0 && selected) {
                    const item = Object.values(display._layers).find((itm: DisplayItemConfig) => itm.itemConfig.styleId === selected.styleId);
                    const title = gettext("HTML code of the geometry link, for insertion into the description")
                    const titleCopy = gettext("HTML code copied")
                    if (count > 0 && selected) {
                        if (!imodule._isEditEnabled(display, item)) { return false; }
                        return (<Button
                            size="small"
                            type="link"
                            title={title}
                            className="copy_to_clipboard"
                            icon={<Identifier />}
                            onClick={() => {
                                const linkToGeometryString = `<a href="${linkToGeometry}">${selected.label}</a>`
                                copyValue(linkToGeometryString, titleCopy);
                            }}
                        />)
                    }
                }
            }, [count, selected])

            const editFeature = useMemo(() => {
                if (count > 0 && selected) {
                    const { id, layerId, styleId } = selected;
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
                                                setUpdate(true);
                                                topic.publish("feature.updated", { resourceId: layerId, featureId: id });
                                            },
                                        },
                                    });

                                }}
                            />
                        </div>)
                    }
                }
            }, [selected])

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
                                }
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
                            bounds={valueRnd.width === W ? undefined : "window"}
                            minWidth={position.width}
                            minHeight={position.height}
                            allowAnyClick={true}
                            enableResizing={count > 0 ? (fixPos === null ? true : false) : false}
                            disableDragging={count > 0 && fixPos !== null ? true : false}
                            position={count > 0 && fixPos !== null ? { x: fixPos.x, y: fixPos.y } : { x: valueRnd.x, y: valueRnd.y }}
                            size={count > 0 && fixPos !== null ? { width: fixPos.width, height: fixPos.height } : { width: valueRnd.width, height: valueRnd.height }}
                            onDragStop={(e, d) => {
                                if (valueRnd.x !== d.x || valueRnd.y !== d.y) {
                                    setValueRnd(prev => ({ ...prev, x: d.x, y: d.y }));
                                    if (valueRnd.width === W && valueRnd.height === H) {
                                        setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                                        setFullscreen(false);
                                    }
                                }
                            }}
                            onResize={(e, direction, ref, delta, position) => {
                                setValueRnd(prev => ({ ...prev, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y }));
                            }}
                        >
                            <div ref={ref} className="popup-position" >
                                <div className="title">
                                    <div className="title-name"
                                        onClick={(e) => {
                                            if (count > 0 && e.detail === 2) {
                                                setTimeout(() => {
                                                    if (valueRnd.width > position.width || valueRnd.height > position.height) {
                                                        setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                                                        setFullscreen(false)
                                                    } else {
                                                        setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                                        setFullscreen(true)
                                                    }
                                                }, 200)
                                            } else {
                                                e.stopPropagation();
                                            }
                                        }}
                                    >
                                        <span className="object-select">Объектов: {count}</span>
                                        {count > 0 && selected && (
                                            <span
                                                title={selected?.desc}
                                                className="layer-name">
                                                {selected?.desc}
                                            </span>
                                        )}
                                    </div>
                                    {count > 0 && <CheckOnlyOne store={store} />}
                                    {count > 0 && selected && (
                                        <span
                                            title={fullscreen === true ? gettext("Close fullscreen popup") : gettext("Open fullscreen popup")}
                                            className={count > 0 && fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                            onClick={() => {
                                                if (count > 0 && fixPos === null) {
                                                    if (valueRnd.width > position.width || valueRnd.height > position.height) {
                                                        setValueRnd(prev => ({ ...prev, width: position.width, height: position.height, x: position.x, y: position.y }));
                                                        setFullscreen(false)
                                                    } else {
                                                        setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                                        setFullscreen(true)
                                                    }
                                                    if (valueRnd.width < W && valueRnd.width > position.width || valueRnd.height < H && valueRnd.height > position.height) {
                                                        setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                                        setFullscreen(true)
                                                    }
                                                }
                                            }} >
                                            {fullscreen === true ? (<CloseFullscreen />) : (<OpenInFull />)}
                                        </span>
                                    )}
                                    <span
                                        title={gettext("Close")}
                                        className={count > 0 && fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                        onClick={() => {
                                            visible({ hidden: true, overlay: undefined, key: "popup" })
                                            topic.publish("feature.unhighlight");
                                            setFullscreen(false)
                                            setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
                                        }} >
                                        <CloseIcon />
                                    </span>
                                </div>
                                {count > 0 && selected && (
                                    <div className={selected.permission !== "Forbidden" ? "select-feature" : "select-feature-forbidden"} >
                                        <Select
                                            labelInValue
                                            optionLabelProp="label"
                                            placement="topLeft"
                                            filterOption={filterOption}
                                            showSearch
                                            size="small"
                                            value={selected}
                                            style={{ width: editFeature ? "calc(100% - 26px)" : "100%", padding: "0px 2px 0px 2px" }}
                                            onChange={onChangeSelect}
                                        >
                                            {data.map((item, index) => {
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
                                {selected && selected.permission !== "Forbidden" && (
                                    <div className="content">
                                        <ContentComponent linkToGeometry={linkToGeometry} store={store} display={display} />
                                    </div>
                                )}
                                <div className="footer-popup">
                                    <CoordinateComponent display={display} contextUrl={contextUrl} count={count} op="popup" />
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