import { forwardRef, RefObject, useState, useEffect } from "react";
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
    const imodule = display.identify_module;

    const count = response.featureCount;
    const selectedItem = response.data[0];

    const heightForbidden = selectedItem && selectedItem.value.includes("Forbidden") ? 75 : position.height;

    const [valueRnd, setValueRnd] = useState<Rnd>({
        x: position.x,
        y: position.y,
        width: position.width,
        height: heightForbidden,
    });

    const { generateUrl, getAttribute } = useSource();

    const [store] = useState(() => new IdentifyStore({
        data: response.data,
    }));

    imodule.identifyStore = store;

    useEffect(() => {
        if (store.update)
            getAttribute(store.selected)
                .then(item => {
                    store.setAttribute(item._fieldmap);
                    store.setFeature({
                        geom: item.feature.geom,
                        featureId: item.feature.id,
                        layerId: item.resourceId,
                    });
                    topic.publish("feature.highlight", {
                        geom: item.feature.geom,
                        featureId: item.feature.id,
                        layerId: item.resourceId,
                    })
                    store.setUpdate(false);
                });
    }, [store.update]);

    useEffect(() => {
        setValueRnd({ x: position.x, y: position.y, width: position.width, height: heightForbidden });
        if (count > 0 && !selectedItem.value.includes("Forbidden")) {
            store.setData(response.data);
            store.setSelected(selectedItem);
            const noSelectedItem = store.data.filter(item => item.value !== selectedItem.value)
            store.setContextUrl(generateUrl(display, { res: selectedItem, all: noSelectedItem }));
            store.setLinkToGeometry(selectedItem.layerId + ":" + selectedItem.id);
            getAttribute(selectedItem)
                .then(item => {
                    store.setAttribute(item._fieldmap);
                    store.setFeature({
                        geom: item.feature.geom,
                        featureId: item.feature.id,
                        layerId: item.resourceId,
                    });
                    topic.publish("feature.highlight", {
                        geom: item.feature.geom,
                        featureId: item.feature.id,
                        layerId: item.resourceId,
                    })
                });
        } else if (count > 0 && selectedItem.value.includes("Forbidden")) {
            setValueRnd(prev => ({ ...prev, height: 75 }));
        } else {
            store.setContextUrl(generateUrl(display, { res: null, all: null }));
            store.setData([]);
            store.setAttribute(null);
            store.setFeature(null);
            topic.publish("feature.unhighlight");
        }
    }, [response]);

    const currentLayer = store.selected !== null ? store.selected.layer_name : undefined

    const onChange = (value: { value: number; label: string }) => {
        const selectedValue = store.data.find(item => item.value === value.value);
        store.setSelected(selectedValue);
        const noSelectedItem = store.data.filter(item => item.value !== value.value);
        store.setContextUrl(generateUrl(display, { res: selectedValue, all: noSelectedItem }));
        store.setLinkToGeometry(selectedValue.layerId + ":" + selectedValue.id);
        getAttribute(selectedValue)
            .then(item => {
                store.setAttribute(item._fieldmap);
                store.setFeature({
                    geom: item.feature.geom,
                    featureId: item.feature.id,
                    layerId: item.resourceId,
                });

                topic.publish("feature.highlight", {
                    geom: item.feature.geom,
                    featureId: item.feature.id,
                    layerId: item.resourceId,
                })
            });
    };

    const filterOption = (input: string, option?: { label: string; value: string; layer_name: string }) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
        (option?.layer_name ?? '').toLowerCase().includes(input.toLowerCase());

    let operations, linkToGeometry;
    count > 0 && store.selected && Object.values(display._itemConfigById).forEach((config: DisplayItemConfig) => {
        const { id, layerId, styleId } = store.selected;
        if (
            config.layerId !== layerId ||
            config.styleId !== styleId ||
            !imodule._isEditEnabled(display, config)
        ) {
            return;
        }
        const onSave = () => {
            store.setUpdate(true);
            topic.publish("feature.updated", {
                resourceId: layerId,
                featureId: id,
            });
        }

        linkToGeometry = store.linkToGeometry;

        operations = (
            <div title={gettext("Edit")}>
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
                                    if (onSave) {
                                        onSave();
                                        store.setUpdateContent(true);
                                    }
                                },
                            },
                        });

                    }}
                />
            </div>
        );
    })

    const offHP = 40;
    const offset = display.clientSettings.offset_point;

    const W = display.mapNode.clientWidth - offset * 2;
    const H = display.mapNode.clientHeight - offset * 2;

    const fX = display.panelsManager._activePanelKey ?
        display.leftPanelPane.w + offHP + offset :
        offHP + offset;
    const fY = offHP + offset;

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
                        Table: {
                            borderRadiusLG: 0
                        }
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
                    bounds={valueRnd.width === W ? undefined : "window"}
                    minWidth={position.width}
                    minHeight={heightForbidden}
                    allowAnyClick={true}
                    enableResizing={count > 0 ? true : false}
                    position={{ x: valueRnd.x, y: valueRnd.y }}
                    size={{ width: valueRnd.width, height: valueRnd.height }}
                    onDragStop={(e, d) => {
                        if (valueRnd.x !== d.x || valueRnd.y !== d.y) {
                            setValueRnd(prev => ({ ...prev, x: d.x, y: d.y }));
                            if (valueRnd.width === W && valueRnd.height === H) {
                                setValueRnd(prev => ({ ...prev, width: position.width, height: heightForbidden, x: position.x, y: position.y }));
                                store.setFullscreen(false);
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
                                            if (valueRnd.width > position.width || valueRnd.height > heightForbidden) {
                                                setValueRnd(prev => ({ ...prev, width: position.width, height: heightForbidden, x: position.x, y: position.y }));
                                                store.setFullscreen(false)
                                            } else {
                                                setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                                store.setFullscreen(true)
                                            }
                                        }, 200)
                                    } else {
                                        e.stopPropagation();
                                    }
                                }}
                            >
                                <span className="object-select">Объектов: {count}</span>
                                {count > 0 && (
                                    <span
                                        title={currentLayer}
                                        className="layer-name">
                                        {currentLayer}
                                    </span>
                                )}
                            </div>
                            {count > 0 && (<span
                                title={store.fullscreen === true ? gettext("Close fullscreen popup") : gettext("Open fullscreen popup")}
                                className="icon-symbol"
                                onClick={() => {
                                    if (valueRnd.width > position.width || valueRnd.height > heightForbidden) {
                                        setValueRnd(prev => ({ ...prev, width: position.width, height: heightForbidden, x: position.x, y: position.y }));
                                        store.setFullscreen(false)
                                    } else {
                                        setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
                                        store.setFullscreen(true)
                                    }
                                    if (valueRnd.width < W && valueRnd.width > position.width || valueRnd.height < H && valueRnd.height > heightForbidden) {
                                        setValueRnd(prev => ({ ...prev, width: W, height: H, x: fX, y: fY }));
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
                                    setValueRnd(prev => ({ ...prev, x: -9999, y: -9999 }));
                                }} >
                                <CloseIcon />
                            </span>
                        </div>
                        {count > 0 && store.selected !== null && (
                            <>
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
                                        style={{ width: operations ? "calc(100% - 26px)" : "100%", padding: "0px 2px 0px 2px" }}
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
                                    {operations}
                                </div>

                                <div className="content">
                                    <ContentComponent store={store} linkToGeometry={linkToGeometry} attribute={store.attribute} count={count} position={valueRnd} display={display}/>
                                </div>

                            </>
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
}));