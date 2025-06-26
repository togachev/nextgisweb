import { forwardRef, useCallback, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import OpenInFull from "@nextgisweb/icon/material/open_in_full";
import CloseFullscreen from "@nextgisweb/icon/material/close_fullscreen";
import CloseIcon from "@nextgisweb/icon/material/close";
import EditNote from "@nextgisweb/icon/material/edit_note";
import Pin from "@nextgisweb/icon/mdi/pin";
import PinOff from "@nextgisweb/icon/mdi/pin-off";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import FitToScreenOutline from "@nextgisweb/icon/mdi/fit-to-screen-outline";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";

import { Rnd } from "react-rnd";
import { Button, ConfigProvider, Select } from "@nextgisweb/gui/antd";
import { Store } from "../Store";
import { observer } from "mobx-react-lite";
import { FeatureEditorModal } from "@nextgisweb/feature-layer/feature-editor-modal";
import showModal from "@nextgisweb/gui/showModal";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ContentComponent } from "./ContentComponent";
import { CoordinateComponent } from "./CoordinateComponent";
import { ButtonZoomComponent } from "./ButtonZoomComponent";
import { getEntries } from "../useSource";

import type SelectedFeatureStore from "@nextgisweb/webmap/panel/selected-feature/SelectedFeatureStore";
import type { Params, Props } from "../type";
import topic from "@nextgisweb/webmap/compat/topic";

const { Option } = Select;
const forbidden = gettext("The data is not available for reading");

const CheckOnlyOne = ({ store, /*imodule*/ }) => {
    const msgFixPopup = gettext("Lock popup position");
    const msgFixOffPopup = gettext("Disable lock popup position");

    const onClick = useCallback((e) => {
        e.preventDefault();
        store.setFixPopup(!store.fixPopup);
    }, []);

    const props = {
        icon: store.fixPopup ? <PinOff /> : <Pin />,
        onTouchEnd: onClick,
        onClick: onClick,
        type: "text",
        variant: "filled",
        size: "small",
        color: store.fixPopup && "primary",
        title: store.fixPopup ? msgFixOffPopup : msgFixPopup,
        className: !store.fixPopup ? "icon-symbol" : "icon-checked",
    }

    return (<Button {...props} />);
};

export default observer(
    forwardRef<Element>(
        function PopupComponent(props, ref) {
            const { params, display } = props as Params;
            const { op, position, response, selected: selectedValue, mode, point } = params as Props;
            const imodule = display.imodule;

            const pm = display.panelManager;
            const pkey = "selected-feature";
            const panel = pm.getPanel<SelectedFeatureStore>(pkey);

            const urlParams = display.getUrlParams()
            const opts = display.config.options;
            const attrs = opts["webmap.identification_attributes"];
            const geoms = opts["webmap.identification_geometry"];

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
                    control: {
                        reset: {
                            icon: <LockReset />,
                            title: gettext("Reset url"),
                            disabled: true,
                        },
                        popup: {
                            icon: <UpdateLink />,
                            url: "",
                            title: gettext("Update current web map address"),
                            status: false,
                            checked: false,
                        },
                        fixedscreen: {
                            icon: <FitToScreenOutline />,
                            url: "",
                            title: gettext("Set current map coverage"),
                            status: false,
                            checked: false,
                        }
                    },
                    pointClick: position.pointClick,
                    buttonZoom: position.buttonZoom,
                }));

            topic.subscribe("update.point", (status) => {
                store.setValueRnd({ ...store.valueRnd, x: store.pointClick.x, y: store.pointClick.y, width: position.width, height: position.height });
                status && store.setButtonZoom({});
            });

            const propsCoords = useCallback(() => {
                const styles: string[] = [];
                display.getVisibleItems()
                    .then((items) => {
                        items.forEach((i) => {
                            const item = display.itemStore.dumpItem(i);
                            if (item.visibility === true) {
                                styles.push(item.styleId);
                            }
                        });
                    })

                return {
                    coordinate: imodule.params.point,
                    lonlat: imodule.lonlat,
                    extent: display.map.olMap.getView().calculateExtent(),
                    styles: styles
                };
            }, [response, display.mapExtentDeferred]);

            const updateSelectFeatures = (panel, props) => {
                const obj = { ...panel.selectedFeatures }
                const [key] = getEntries(obj).filter(([_, val]) => val.styleId === props.styleId)[0];

                const value = {
                    ...obj,
                    [key]: {
                        ...obj[key],
                        ...{
                            items: {
                                ...obj[key].items,
                                [String(props.value)]: props
                            }
                        }
                    }
                }

                getEntries(value)
                    .map(([key, _]) => {
                        if (Object.keys(value[key].items).length > 10) {
                            delete value[key].items[Object.keys(value[key].items)[0]];
                        }
                    });
                panel.setSelectedFeatures(value)
            };

            useEffect(() => {
                store.setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
                store.setMode(mode);

                if (imodule.countFeature > 0) {
                    const selectVal = selectedValue ? selectedValue : response.data[0];
                    selectVal.label = selectVal.permission === "Forbidden" ? forbidden : selectVal.label;
                    store.setSelected(selectVal);
                    store.setData(response.data);
                    store.getContent(selectVal, false);
                    store.LinkToGeometry(selectVal);
                    store.setCountFeature(imodule.countFeature);
                    store.setPointClick(position.pointClick);
                    store.setButtonZoom({ [Object.keys(position.buttonZoom)[0]]: true });

                    const selectedProps = { ...selectVal };
                    Object.assign(selectedProps, propsCoords());
                    if (panel) {
                        updateSelectFeatures(panel, selectedProps);
                    }
                } else {
                    store.generateUrl({ res: null, st: null, pn: null, disable: false });
                    store.setSelected({});
                    store.setData([]);
                    store.setLinkToGeometry("");
                    topic.publish("feature.unhighlight");
                    store.setCountFeature(0);
                    store.setButtonZoom({ [Object.keys(position.buttonZoom)[0]]: false });
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
                topic.publish("visible.point", copy);
                store.setButtonZoom({ [Object.keys(position.buttonZoom)[0]]: true });

                const selectedProps = { ...selectedValue };
                Object.assign(selectedProps, propsCoords());
                if (panel) {
                    updateSelectFeatures(panel, selectedProps)
                }
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
                            <Button
                                title={gettext("Edit")}
                                className="icon-symbol"
                                type="text"
                                size="small"
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
                            </Button>
                        )
                    }
                }
            }, [store.selected]);

            const contentProps = { store: store, display: display };
            const coordinateProps = { display: display, store: store, op: "popup", point: point };

            return (
                createPortal(
                    <ConfigProvider
                        theme={{
                            token: {
                                colorPrimary: "#106a90",
                            },
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
                                    colorPrimary: "var(--primary)",
                                    colorBorder: "transparent",
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
                                    borderRadius: 4,
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
                            <div ref={ref as any} className="popup-position">
                                <div className="title">
                                    {store.buttonZoom["topLeft"] && <div style={{ margin: "0 6px 0 0" }}><ButtonZoomComponent {...contentProps} /></div>}
                                    <Button
                                        className="title-name"
                                        size="small"
                                        type="text"
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
                                        title={store.selected?.desc}
                                    >
                                        <span className="object-select">Объектов: {store.countFeature}</span>
                                        {store.countFeature > 0 && store.selected && (
                                            <span
                                                className="layer-name">
                                                {store.selected?.desc}
                                            </span>
                                        )}
                                    </Button>
                                    {store.countFeature > 0 && <CheckOnlyOne {...{ imodule, store }} />}
                                    {store.countFeature > 0 && store.selected && (
                                        <Button
                                            size="small"
                                            type="text"
                                            icon={store.fullscreen === true ? (<CloseFullscreen />) : (<OpenInFull />)}
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
                                            }}
                                        />
                                    )}
                                    <Button
                                        icon={<CloseIcon />}
                                        title={gettext("Close")}
                                        className={store.countFeature > 0 && store.fixPos !== null ? "icon-disabled" : "icon-symbol"}
                                        onClick={() => {
                                            display.imodule.popup_destroy();
                                            panel && panel.setActiveChecked({
                                                ...panel.activeChecked,
                                                achecked: false,
                                            });
                                        }} />
                                    {store.buttonZoom["topRight"] && <div style={{ margin: "0 0 0 6px" }}><ButtonZoomComponent {...contentProps} /></div>}
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
                                    {store.buttonZoom["bottomLeft"] && <div style={{ margin: "0 6px 0 0" }}><ButtonZoomComponent {...contentProps} /></div>}
                                    <CoordinateComponent {...coordinateProps} />
                                    {store.buttonZoom["bottomRight"] && <div style={{ margin: "0 0 0 6px" }}><ButtonZoomComponent {...contentProps} /></div>}
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