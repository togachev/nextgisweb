import { forwardRef, RefObject, useMemo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import CloseIcon from "@nextgisweb/icon/material/close";
import EditNote from "@nextgisweb/icon/material/edit_note";
import Identifier from "@nextgisweb/icon/mdi/identifier";
import Pin from "@nextgisweb/icon/mdi/pin";
import PinOff from "@nextgisweb/icon/mdi/pin-off";
import { Rnd } from "react-rnd";
import { ConfigProvider, Select, Tag } from "@nextgisweb/gui/antd";
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
import type { WebmapItem } from "@nextgisweb/webmap/type";
import type { DataProps, Params } from "./type";
import topic from "dojo/topic";
import { useOutsideClick } from "@nextgisweb/webmap/useOutsideClick";

const { Option } = Select;
const forbidden = gettext("The data is not available for reading")

const CheckOnlyOne = ({ store }) => {
    const msgFixPopup = gettext("Lock popup position");
    const msgFixOffPopup = gettext("Disable lock popup position");
    const onChange = (checked: boolean) => {
        store.setFixPopup(checked);
    };

    return (
        <Tag.CheckableTag
            checked={store.fixPopup}
            onChange={onChange}
            className="legend-hide-button"
            title={store.fixPopup ? msgFixOffPopup : msgFixPopup}
        >
            {store.fixPopup ? <PinOff /> : <Pin />}
        </Tag.CheckableTag>
    );
};

export default observer(
    forwardRef<Element>(
        function PopupComponent(props: Params, ref: RefObject<Element>) {
            const { params, visible, display } = props;
            const { op, position, response, selectedValue } = params;
            const { getAttribute, generateUrl } = useSource(display);
            const { copyValue, contextHolder } = useCopy();

            const refs = useRef(null);
            useOutsideClick(refs?.current?.resizableElement, "z-index");

            const imodule = display.identify_module;

            const count = response.featureCount;
            const urlParams = display.getUrlParams();

            const [store] = useState(
                () => new IdentifyStore({
                    valueRnd: {
                        x: position.x,
                        y: position.y,
                        width: position.width,
                        height: position.height,
                    },
                    fixPos: null,
                    fixPanel: urlParams.pn ? urlParams.pn : "attributes",
                }));

            const {
                data,
                fixContentItem,
                fixPanel,
                fixPopup,
                fixPos,
                fullscreen,
                linkToGeometry,
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
                currentUrlParams,
                update,
                valueRnd,
            } = store;

            imodule.identifyStore = store;

            const offHP = imodule.offHP;
            const offset = display.clientSettings.offset_point;
            const fX = offHP + offset;
            const fY = offHP + offset;

            const W = window.innerWidth - offHP - offset * 2;
            const H = window.innerHeight - offHP - offset * 2;

            const LinkToGeometry = (value: DataProps) => {
                const styles: number[] = [];
                display.getVisibleItems()
                    .then((items: WebmapItem[]) => {
                        items.map(i => {
                            styles.push(i.styleId[0]);
                        });
                    })
                setLinkToGeometry(value.layerId + ":" + value.id + ":" + styles);
            }

            const getContent = async (val: DataProps, key: boolean) => {
                const res = await getAttribute(val);
                setExtensions(res.feature.extensions);
                setAttribute(res.updateName);
                
                topic.publish("feature.highlight", {
                    geom: res.feature.geom,
                    featureId: res.feature.id,
                    layerId: res.resourceId,
                });

                LinkToGeometry(res)
                setContextUrl(generateUrl({ res: val, st: response.data, pn: fixPanel }));

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
                    LinkToGeometry(selectVal);
                } else {
                    setContextUrl(generateUrl({ res: null, st: null, pn: null }));
                    setSelected(null);
                    setData([]);
                    // topic.publish("feature.unhighlight");
                }
            }, [response]);

            useEffect(() => {
                setContextUrl(generateUrl({ res: response.data[0], st: response.data, pn: fixPanel }));
            }, [currentUrlParams]);

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
                }
            }, [fixPopup]);

            const onChangeSelect = (value: { value: number; label: string }) => {
                const selectedValue = data.find(item => item.value === value.value);
                const copy = { ...selectedValue };
                copy.label = copy.permission === "Forbidden" ? forbidden : copy.label;
                setSelected(copy);
                getContent(copy, false);
                LinkToGeometry(copy);
            };

            const filterOption = (input: string, option?: { label: string; value: string; desc: string }) => {
                if ((option?.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
                    (option?.desc ?? "").toLowerCase().includes(input.toLowerCase()))
                    return true
            }

            const linkToGeometryFeature = useMemo(() => {
                if (count > 0 && selected) {
                    const item = Object.values(display._layers).find((itm: DisplayItemConfig) => itm.itemConfig.styleId === selected.styleId);
                    if (count > 0 && selected) {
                        if (!imodule._isEditEnabled(display, item)) { return false; }
                        return (
                            <span
                                title={gettext("HTML code of the geometry link, for insertion into the description")}
                                className="link-button"
                                onClick={() => {
                                    const linkToGeometryString = `<a href="${linkToGeometry}">${selected.label}</a>`
                                    copyValue(linkToGeometryString, gettext("HTML code copied"));
                                }}
                            ><Identifier />
                            </span>
                        )
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
                    } else if (selected.permission === "Forbidden") {
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
                            >
                                <EditNote />
                            </span>
                        )
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
                            ref={refs}
                            onClick={() => refs!.current.resizableElement.current.style.zIndex = 1}
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
                            bounds="window"
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
                                            title={fullscreen === true ? gettext("Сollapse fullscreen popup") : gettext("Open fullscreen popup")}
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
                                        className="icon-symbol"
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
                                        <ContentComponent linkToGeometry={linkToGeometryFeature} store={store} display={display} />
                                    </div>
                                )}
                                {op === "popup" && (<div className="footer-popup">
                                    <CoordinateComponent display={display} count={count} store={store} op="popup" />
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