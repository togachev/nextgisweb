import { useEffect, useState } from "react";
import { Checkbox, Radio, ConfigProvider, Dropdown, message, Input, Modal, Select, Space, Typography } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import PolyIcon from "@nextgisweb/icon/material/hexagon/outline";
import LineIcon from "@nextgisweb/icon/material/show_chart/outline";
import CircleIcon from "@nextgisweb/icon/material/scatter_plot/outline";
import EditIcon from "@nextgisweb/icon/material/edit/outline";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";
import SaveAsIcon from "@nextgisweb/icon/material/save_as/outline";
import CheckAll from "@nextgisweb/icon/material/stacked_line_chart/outline";
import VertexIcon from "@nextgisweb/icon/mdi/vector-point";
import EdgeIcon from "@nextgisweb/icon/mdi/vector-polyline";
import ModifyIcon from "@nextgisweb/icon/mdi/vector-polyline-edit";
import AutoMode from "@nextgisweb/icon/mdi/auto-mode";
import topic from "@nextgisweb/webmap/compat/topic";
import { useDraw } from "./hook/useDraw";

import "./DrawFeatures.less";

import type { MenuProps } from "@nextgisweb/gui/antd";
import type { Display } from "@nextgisweb/webmap/display";
import type { ItemType, ItemProps } from "./type";

import { DrawStore } from "./DrawStore";
import { observer } from "mobx-react-lite";

const { Text } = Typography;

const Create = gettext("Create")
const Save = gettext("Save")
const DeleteLayer = gettext("Delete Layer");
const ZoomToLayer = gettext("Zoom to layer");
const EditLayer = gettext("Edit layer");
const SaveAs = gettext("Save as");
const AllDeleteItems = gettext("Delete all layers");
const MaxCountLayer = gettext("The limit of created layers has been exceeded")
const SaveFormat = gettext("Format")
const Segment = gettext("Segment")
const Vertex = gettext("Vertex")
const ToAllLayers = gettext("To all layers")
const ToCurrentLayer = gettext("To current layer")
const StickTool = gettext("Sticky tool")
const AutoStartEdit = gettext("Enable edit mode after layer creation")
const DisableStartEdit = gettext("Do not enable edit mode after creating a layer")
const MaxCreated = gettext("Maximum layers/created:")
const LineLayer = gettext("line layer")
const PolygonLayer = gettext("polygon layer")
const PointLayer = gettext("point layer")
const ChangeGeometry = gettext("Change geometry")

const typeComponentIcon = [
    { key: "LineString", component: <LineIcon />, label: LineLayer },
    { key: "Polygon", component: <PolyIcon />, label: PolygonLayer },
    { key: "Point", component: <CircleIcon />, label: PointLayer }
]

const labelTypeGeom = (value, key) => {
    const item = typeComponentIcon.find(item => item.key === key);
    return (
        <div className="label-type">
            <span className="label">{value}</span>
            <span className="icon">
                {item?.component}
            </span>
        </div>
    )
}

const geomTypesInfo = [
    {
        label: labelTypeGeom(LineLayer, "LineString"),
        key: "LineString",
    },
    {
        label: labelTypeGeom(PolygonLayer, "Polygon"),
        key: "Polygon",
    },
    {
        label: labelTypeGeom(PointLayer, "Point"),
        key: "Point",
    },
];

let id = 0;

export const DrawFeatures = observer(({ display }: Display) => {

    const { addLayerMap, interactionClear, drawInteraction, featureCount, modifyInteraction, olmap, removeItem, removeItems, selectFeatureInfo, snapInteraction, saveLayer, snapBuild, visibleLayer, zoomToLayer } = useDraw(display);

    const maxCount = webmapSettings.max_count_file_upload;

    const [geomTypeDefault, setGeomTypeDefault] = useState<string>("LineString");
    const [editableLayerKey, setEditableLayerKey] = useState();

    const [startEdit, setStartEdit] = useState(false);
    const [open, setOpen] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const itemDefault = { key: 0, change: false, label: '', geomType: '', edge: false, vertex: false, allLayer: false, draw: false, modify: false };

    const [store] = useState(() => new DrawStore({}));

    const {
        options,
        setOptions,
        drawLayer,
        setDrawLayer,
        readonly,
        setReadonly,
        itemModal,
        setItemModal,
    } = store;

    const [defaultOp, setDefaultOp] = useState(options[0]);

    const currentMaxLayer = MaxCreated + " " + maxCount + "/" + drawLayer.length

    const geomTypesOptions = geomTypesInfo.map(({ key, label }) => {
        if (key !== geomTypeDefault) {
            return { key, label };
        }
    });

    const currentTypeGeom = (value) => {
        const item = geomTypesInfo.find(item => item.key === value)
        return item?.key;
    }

    const onChangeSelect = ({ item, value }) => {
        const itemCurrent = !item ? drawLayer.find(item => item.key === value) : item;
        setEditableLayerKey(value)
        setDrawLayer((items: ItemType[]) => {
            return items.map((item: ItemType) => {
                if (item.key === value) {
                    return { ...item, change: false, modify: false }
                }
                else {
                    return { ...item, change: true }
                }
            })
        })

        modifyInteraction(itemCurrent);
        drawInteraction(itemCurrent);
        snapInteraction(itemCurrent, false);
        topic.publish("webmap/tool/identify/off");
        setReadonly(false);
    };

    const deselectOnClick = ({ status, value }) => {
        const itemCurrent = drawLayer.find(item => item.key === value);
        if (value === editableLayerKey) {
            setEditableLayerKey(null);
            setDrawLayer((prev: ItemType[]) => {
                return prev.map((item: ItemType) => {
                    if (status) {
                        if (item.key !== itemCurrent.key) {
                            return { ...item, change: false }
                        }
                        return item;
                    } else {
                        return { ...item, change: false }
                    }

                })
            })
            interactionClear();
            topic.publish("webmap/tool/identify/on");
            setReadonly(true)
        }
    };

    useEffect(() => {
        olmap.on("click", (e) => {
            if (e.dragging) return;
            selectFeatureInfo(e.pixel, editableLayerKey)
        });
    }, [editableLayerKey])

    const addLayer = (geomType: string) => {
        if (drawLayer.length < maxCount) {
            const layer = addLayerMap(id);
            const item = typeComponentIcon.find(item => item.key === geomType);
            const currentItem = { key: layer.ol_uid, change: false, label: item?.label + " " + id++, geomType: geomType, edge: false, vertex: geomType === 'Point' ? false : true, allLayer: false, draw: true, modify: false };
            setDrawLayer([...drawLayer, currentItem])

            if (editableLayerKey) {
                deselectOnClick({ status: false, value: editableLayerKey })
                onChangeSelect({ item: currentItem, value: layer.ol_uid })
            } else {
                startEdit && onChangeSelect({ item: currentItem, value: layer.ol_uid })
            }

        } else {
            message.error(MaxCountLayer);
        }
    }

    const onModify = (checked: boolean) => {
        setDrawLayer((prev: ItemType[]) => {
            return prev.map((item: ItemType) => {
                if (item.key === editableLayerKey) {
                    return { ...item, draw: !checked, modify: checked }
                };
                return item;
            })
        })
    };

    const geomTypesMenuItems: MenuProps = {
        items: geomTypesOptions,
        onClick: (item) => {
            setGeomTypeDefault(item.key)
            if (readonly && !editableLayerKey) {
                addLayer(item.key);
            } else if (startEdit && featureCount.includes(editableLayerKey)) {
                addLayer(item.key);
            }
        },
    };

    const onDefaultType = () => {
        const type = currentTypeGeom(geomTypeDefault) as string;
        if (readonly && !editableLayerKey) {
            addLayer(type);
        } else if (startEdit && featureCount.includes(editableLayerKey)) {
            addLayer(type);
        }
    };

    const DropdownType = () => (
        <Dropdown.Button size="small" trigger={["hover"]} menu={geomTypesMenuItems} onClick={onDefaultType} >
            <Space>
                {geomTypeFilterIcon(geomTypeDefault, "create")}
            </Space>
        </Dropdown.Button>
    );

    const geomTypeFilterIcon = (geomType: string, value: string) => {
        const item = geomTypesInfo.find(item => item.key === geomType);
        const status = value === "save" ? Save : Create
        return (
            <div className="button-operation">
                <div className="status-operation">{status}</div>
                {item?.label}
            </div>
        );
    }

    const DeleteItems = () => {
        return (
            <div
                title={AllDeleteItems}
                className={readonly ? "icon-symbol" : "icon-symbol-disable"}
                onClick={() => {
                    if (readonly) {
                        removeItems();
                        setDrawLayer([]);
                    }
                }}
            >
                <DeleteForever />
            </div>
        )
    };

    const onDeleteLayer = (item: ItemType) => {
        if (readonly) {
            removeItem(item.key);
            setDrawLayer(drawLayer.filter((x) => x.key !== item.key));
        }
    }

    useEffect(() => {
        itemModal?.geomType === "Polygon" ?
            (
                setDefaultOp(options.find(item => item.value !== "application/gpx+xml")),
                setOptions(options => {
                    return options.map((item) => {
                        if (item.value === "application/gpx+xml") {
                            return { ...item, disabled: true }
                        } else {
                            return { ...item, disabled: false }
                        }
                    })
                })
            ) :
            (
                setDefaultOp(options[0]),
                setOptions(options => {
                    return options.map((item) => {
                        return { ...item, disabled: false }
                    })
                })
            )
    }, [itemModal])

    const showModal = () => {
        setOpen(true);
    };

    const handleOk = () => {
        saveLayer(itemModal, defaultOp)
        setConfirmLoading(true);
        setTimeout(() => {
            setOpen(false);
            setConfirmLoading(false);
        }, 0);
    };

    const handleCancel = () => {
        setOpen(false);
    };

    const handleChange = (value) => {
        setDefaultOp(value);
    };

    useEffect(() => {
        if (drawLayer) {
            snapBuild(drawLayer.find((x) => x.key === editableLayerKey))
        }
    }, [drawLayer]);

    const toggleChecked = (key) => {
        if (key === "allLayer") {
            setDrawLayer((prev: ItemType[]) => {
                return prev.map((item: ItemType) => {
                    if (item.key === editableLayerKey) {
                        return { ...item, allLayer: !item.allLayer }
                    };
                    return item;
                })
            })
        } else if (key === "vertex") {
            setDrawLayer((prev: ItemType[]) => {
                return prev.map((item: ItemType) => {
                    if (item.key === editableLayerKey) {
                        return { ...item, vertex: !item.vertex }
                    };
                    return item;
                })
            })
        } else if (key === "edge") {
            setDrawLayer((prev: ItemType[]) => {
                return prev.map((item: ItemType) => {
                    if (item.key === editableLayerKey) {
                        return { ...item, edge: !item.edge }
                    };
                    return item;
                })
            })
        }
    };

    const iconControlSnap = [
        {
            keyname: "edge",
            comp: <EdgeIcon />,
            title: Segment,
        },
        {
            keyname: "vertex",
            comp: <VertexIcon />,
            title: Vertex,
        },
        {
            keyname: "allLayer",
            comp: <CheckAll />,
            titleEnable: ToAllLayers,
            titleDisable: ToCurrentLayer,
        },
    ];

    const ControlSnap = ({ item }: ItemProps) => (
        <div className="control" title={StickTool}>
            {StickTool}
            <div className="control-button">
                {item &&
                    iconControlSnap.map((i, index) => {
                        const titleEnable = item.allLayer ? i.titleDisable : i.titleEnable;
                        return (
                            <div
                                key={index}
                                className={
                                    !readonly && !item.change ?
                                        "button-active" :
                                        "button-disable"
                                }
                                onClick={() => {
                                    !readonly && !item.change ? toggleChecked(i.keyname) : undefined
                                }}>
                                <div className={item[i.keyname] ? "icon-symbol-yes" : "icon-symbol-no"}
                                    title={i.keyname === "allLayer" ? titleEnable : i.title}>
                                    {i.comp}
                                </div>
                            </div>
                        )
                    })
                }
            </div>
        </div >
    )

    return (
        <ConfigProvider
            theme={{
                components: {
                    Modal: {
                        titleFontSize: 15,
                    },
                },
            }}>
            <Modal
                transitionName=""
                maskTransitionName=""
                mask={false}
                title={SaveAs}
                open={open}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
                className="modal-style"
                centered
            >
                <div className="select-format">
                    <span className="select-title">{SaveFormat}</span>
                    <Select
                        labelInValue
                        value={defaultOp}
                        style={{ width: 120 }}
                        onChange={handleChange}
                        options={options}
                    />
                </div>
            </Modal>
            <div className="dropdown-button-draw">
                <div className="info-file">
                    <Text title={currentMaxLayer} ellipsis={true} >{currentMaxLayer}</Text>
                    {drawLayer.length > 1 && (<DeleteItems />)}
                </div>
                <div className="dropdown-button">
                    {DropdownType()}
                    <label className="icon-edit-auto">
                        <Checkbox onChange={(e) => setStartEdit(e.target.checked)} className="input-button-none" />
                        <span title={startEdit ? DisableStartEdit : AutoStartEdit} className={startEdit ? "icon-edit icon-symbol" : "icon-symbol"}>
                            <AutoMode />
                        </span>
                    </label>
                </div>
                {drawLayer.length > 0 ?
                    editableLayerKey ?
                        (<ControlSnap item={drawLayer.find((x) => x.key === editableLayerKey)} />) :
                        (<ControlSnap item={itemDefault} />) : null}
                <Radio.Group className="radio-custom" onChange={(e) => { onChangeSelect({ item: '', value: e.target.value }) }} value={editableLayerKey} >
                    {drawLayer.map((item: ItemType, index: number) => {
                        const statusFeature = featureCount.includes(item.key)
                        return (
                            <div key={index} >
                                <div className="layer-item">
                                    <div className="checkbox-item">
                                        <Checkbox
                                            defaultChecked={true}
                                            onChange={(e) => { visibleLayer(e.target.checked, item.key) }} >
                                            {item.label}
                                        </Checkbox>
                                    </div>
                                    <div className="custom-button">
                                        {statusFeature && (
                                            <>
                                                <span title={SaveAs} className={statusFeature ? "icon-symbol" : "icon-symbol-disable"} onClick={() => {
                                                    if (statusFeature) {
                                                        showModal()
                                                        setItemModal(item)
                                                    }
                                                }}>
                                                    <SaveAsIcon />
                                                </span>
                                                <span
                                                    title={ZoomToLayer}
                                                    className={statusFeature ? "icon-symbol" : "icon-symbol-disable"}
                                                    onClick={() => { if (statusFeature) { zoomToLayer(item.key) } }}>
                                                    <ZoomIn />
                                                </span>

                                            </>
                                        )}
                                        <span
                                            title={DeleteLayer}
                                            className={readonly ? "icon-symbol" : "icon-symbol-disable"}
                                            onClick={() => { onDeleteLayer(item) }}>
                                            <DeleteForever />
                                        </span>
                                        {
                                            !readonly && !item.change ? (
                                                <label className="icon-edit-margin">
                                                    <Input disabled={item.change} type="checkbox"
                                                        onChange={(e) => {
                                                            if (statusFeature) {
                                                                onModify(e.target.checked)
                                                            }
                                                        }}
                                                        className="input-button-none" />
                                                    <span
                                                        title={ChangeGeometry}
                                                        className={!readonly && item.modify ? "icon-edit icon-symbol" : !item.change && statusFeature ? "icon-symbol" : "icon-symbol-disable"}>
                                                        <ModifyIcon />
                                                    </span>
                                                </label>
                                            ) : null
                                        }
                                        <Radio
                                            disabled={item.change}
                                            onClick={(e) => { deselectOnClick({ status: true, value: e.target.value }) }} value={item.key}>
                                            <span title={EditLayer} className={item.key === editableLayerKey ? "icon-edit icon-symbol icon-red" : !item.change ? "icon-symbol" : "icon-symbol-disable"}>
                                                <EditIcon />
                                            </span>
                                        </Radio>
                                    </div>
                                </div>
                            </div>
                        )
                    }).reverse()}
                </Radio.Group>
            </div>
        </ConfigProvider>
    )
})
