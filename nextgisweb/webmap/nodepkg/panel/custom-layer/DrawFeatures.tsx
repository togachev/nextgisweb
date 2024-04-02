import { useEffect, useMemo, useState } from "react";
import { Checkbox, ConfigProvider, Dropdown, message, Input, Modal, Select, Space, Typography } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

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

import { useDraw } from "./hook/useDraw";

import "./DrawFeatures.less";

import type { MenuProps } from "@nextgisweb/gui/antd";

import type { DojoTopic, DojoDisplay } from "../type";

import { DrawStore } from "./DrawStore";
import { observer } from "mobx-react-lite";

type DrawFeaturesProps = {
    display: DojoDisplay;
    topic: DojoTopic;
}

type ItemType = {
    key: number;
    change: boolean;
    label: string;
    geomType: string;
    allLayer: boolean;
    edge: boolean;
    vertex: boolean;
    draw: boolean;
    modify: boolean;
};

const { Text } = Typography;

const create = gettext("Create")
const save = gettext("Save")
const DeleteLayer = gettext("Delete Layer");
const ZoomToLayer = gettext("Zoom to layer");
const EditLayer = gettext("Edit layer");
const SaveAs = gettext("Save as");
const allDeleteItems = gettext("Delete all layers");
const maxCountLayer = gettext("The limit of created layers has been exceeded")
const saveFormat = gettext("Format")
const Segment = gettext("Segment")
const Vertex = gettext("Vertex")
const ToAllLayers = gettext("To all layers")
const ToCurrentLayer = gettext("To current layer")
const StickTool = gettext("Stick Tool")


const typeComponentIcon = [
    { key: "LineString", component: <LineIcon />, label: gettext("line layer") },
    { key: "Polygon", component: <PolyIcon />, label: gettext("polygon layer") },
    { key: "Point", component: <CircleIcon />, label: gettext("point layer") }
]

const iconTypeGeom = (value) => {
    const component = typeComponentIcon.filter(item => item.key === value)[0].component;
    return component
}

const labelLayer = (value) => {
    const label = typeComponentIcon.filter(item => item.key === value)[0].label;
    return label
}

const labelTypeGeom = (value, key) => {
    return (
        <div className="label-type">
            <span className="label">{value}</span>
            <span className="icon">
                {iconTypeGeom(key)}
            </span>
        </div>
    )
}

const geomTypesInfo = [
    {
        label: labelTypeGeom(gettext("line layer"), "LineString"),
        key: "LineString",
    },
    {
        label: labelTypeGeom(gettext("polygon layer"), "Polygon"),
        key: "Polygon",
    },
    {
        label: labelTypeGeom(gettext("point layer"), "Point"),
        key: "Point",
    },
];


let id = 0;

export const DrawFeatures = observer(
    ({ display, topic }: DrawFeaturesProps) => {
        const { addLayerMap, interactionClear, drawInteraction, featureCount, modifyInteraction, removeItem, removeItems, snapInteraction, saveLayer, snapBuild, visibleLayer, zoomToLayer } = useDraw(display);
        const maxCount = display.clientSettings.max_count_file_upload;

        const [geomTypeDefault, setGeomTypeDefault] = useState<string>("LineString");

        const [open, setOpen] = useState(false);
        const [confirmLoading, setConfirmLoading] = useState(false);
        const itemDefault = { key: '', change: false, label: '', geomType: '', edge: false, vertex: false, allLayer: false, draw: false, modify: false };

        const [store] = useState(() => new DrawStore({}));

        const {
            options,
            setOptions,
            drawLayer,
            setDrawLayer,
            checkedKey,
            setCheckedKey,
            readonly,
            setReadonly,
            itemModal,
            setItemModal,
        } = store;

        const [defaultOp, setDefaultOp] = useState(options[0]);

        const currentMaxLayer = gettext("Number of layers maximum/created:") + " " + maxCount + "/" + drawLayer.length

        const geomTypesOptions = geomTypesInfo.map(({ key, label }) => {
            if (key !== geomTypeDefault) {
                return { key, label };
            }
        });

        const currentTypeGeom = (value) => {
            const geomType = geomTypesInfo.filter(item => item.key === value)[0].key;
            return geomType
        }

        const addLayer = (geomType: string) => {
            if (drawLayer.length < maxCount) {
                const layer = addLayerMap(id);
                const currentItem = { key: layer.ol_uid, change: true, label: labelLayer(geomType) + " " + id++, geomType: geomType, edge: false, vertex: geomType === 'Point' ? false : true, allLayer: false, draw: true, modify: false };
                setDrawLayer([
                    ...drawLayer,
                    currentItem
                ])
                onCheckedKey(true, currentItem);             
            } else {
                message.error(maxCountLayer);
            }
        }

        const geomTypesMenuItems: MenuProps = {
            items: geomTypesOptions,
            onClick: (item) => {
                if (readonly) {
                    setGeomTypeDefault(item.key)
                    addLayer(item.key);
                }
            },
        };

        const onDefaultType = () => {
            if (readonly) {
                const type = currentTypeGeom(geomTypeDefault);
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
            const label = geomTypesInfo.filter(item => item.key === geomType)[0].label
            const status = value === "save" ? save : create
            return (
                <div className="button-operation">
                    <div className="status-operation">{status}</div>
                    {label}
                </div>
            );
        }

        const DeleteItems = () => {
            return (
                <div
                    title={allDeleteItems}
                    className="custom-button icon-symbol"
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
            console.log(checkedKey);
            setDrawLayer(prevState => {
                return prevState.map((item: ItemType) => {
                    return item.key === checkedKey.key ? { ...item, change: false } : { ...item, change: true }
                })
            })
        }, [checkedKey])

        const onCheckedKey = (checked: boolean, item: ItemType) => {
            if (checked) {
                modifyInteraction(item);
                drawInteraction(item);
                snapInteraction(item, false);
                topic.publish("webmap/tool/identify/off");
                setCheckedKey({ key: item.key, change: false });
                setDrawLayer(prevState => {
                    return prevState.map((item) => {
                        return { ...item, change: true }
                    })
                });
                setReadonly(false);
            } else {
                interactionClear();
                topic.publish("webmap/tool/identify/on");
                setDrawLayer(prevState => {
                    return prevState.map((item: ItemType) => {
                        return { ...item, change: false, modify: false }
                    })
                });
                setReadonly(true)
            }
        };

        const onModify = (checked: boolean) => {
            setDrawLayer(prev => {
                return prev.map((item: ItemType) => {
                    if (item.key === checkedKey.key) {
                        return { ...item, draw: !checked, modify: checked }
                    };
                    return item;
                })
            })
        };

        useEffect(() => {
            itemModal?.geomType === "Polygon" ?
                (
                    setDefaultOp(options.filter(item => item.value !== "application/gpx+xml")[0]),
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
                snapBuild(drawLayer?.filter((x) => x.key === checkedKey.key)[0])
            }
        }, [drawLayer]);

        const toggleChecked = (key, item) => {
            if (key === "allLayer") {
                setDrawLayer(prev => {
                    return prev.map((item: ItemType) => {
                        if (item.key === checkedKey.key) {
                            return { ...item, allLayer: !item.allLayer }
                        };
                        return item;
                    })
                })
            } else if (key === "vertex") {
                setDrawLayer(prev => {
                    return prev.map((item: ItemType) => {
                        if (item.key === checkedKey.key) {
                            return { ...item, vertex: !item.vertex }
                        };
                        return item;
                    })
                })
            } else if (key === "edge") {
                setDrawLayer(prev => {
                    return prev.map((item: ItemType) => {
                        if (item.key === checkedKey.key) {
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

        const ControlEdit = ({ itemLayer }) => {
            return (
                <div className="control" title={StickTool}>
                    {StickTool}
                    <div className="control-button">
                        {itemLayer &&
                            iconControlSnap.map((item, index) => {
                                const titleEnable = itemLayer.allLayer ? item.titleDisable : item.titleEnable;
                                return (
                                    <div
                                        key={index}
                                        className={
                                            !readonly && !itemLayer.change ?
                                                "button-active" :
                                                "button-disable"
                                        }
                                        onClick={() => {
                                            !readonly && !itemLayer.change ?
                                                toggleChecked(item.keyname, itemLayer) :
                                                undefined
                                        }}>
                                        <div className={itemLayer[item.keyname] ? "icon-symbol-yes" : "icon-symbol-no"}
                                            title={item.keyname === "allLayer" ? titleEnable : item.title}>
                                            {item.comp}
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div >
            )
        }

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
                    mask={false}
                    title={SaveAs}
                    open={open}
                    onOk={handleOk}
                    confirmLoading={confirmLoading}
                    onCancel={handleCancel}
                    className="modal-style"
                    okButtonProps={{ size: "small" }}
                    cancelButtonProps={{ size: "small" }}
                    centered
                >
                    <div className="select-format">
                        <span className="select-title">{saveFormat}</span>
                        <Select
                            labelInValue
                            value={defaultOp}
                            style={{ width: 120 }}
                            onChange={handleChange}
                            options={options}
                            size="small"
                            title="knfjko"
                        />
                    </div>
                </Modal>
                <div className="dropdown-button-draw">
                    <div className="info-file">
                        <Text title={currentMaxLayer} ellipsis={true} >
                            {currentMaxLayer}
                        </Text>
                        {drawLayer.length > 1 && (<DeleteItems />)}
                    </div>
                    <div style={{ margin: "5px" }}>
                        <div className="dropdown-button">{DropdownType()}</div>
                    </div>
                    {drawLayer.length > 0 ?
                        checkedKey.key ?
                            (<ControlEdit itemLayer={drawLayer?.filter((x) => x.key === checkedKey.key)[0]} />) :
                            (<ControlEdit itemLayer={itemDefault} />) : null}
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
                                        <span title={DeleteLayer} className={readonly ? "icon-symbol" : "icon-symbol-disable"} onClick={() => { onDeleteLayer(item) }}>
                                            <DeleteForever />
                                        </span>
                                        {!readonly && !item.change ? (
                                            <label className="icon-edit-margin">
                                                <Input disabled={item.change} type="checkbox"
                                                    onChange={(e) => {
                                                        if (statusFeature) {
                                                            onModify(e.target.checked)
                                                        }
                                                    }}
                                                    className="input-button-none" />
                                                <span title="Изменить геометрию" className={!readonly && item.modify ? "icon-edit icon-symbol" : !item.change && statusFeature ? "icon-symbol" : "icon-symbol-disable"}>
                                                    <ModifyIcon />
                                                </span>
                                            </label>
                                        ) : null}
                                        <label className="icon-edit-margin">
                                            <Input disabled={item.change} type="checkbox"
                                                onChange={(e) => onCheckedKey(e.target.checked, item)}
                                                className="input-button-none" />
                                            <span title={EditLayer} className={!readonly && item.key === checkedKey.key ? "icon-edit icon-symbol icon-red" : !item.change ? "icon-symbol" : "icon-symbol-disable"}>
                                                <EditIcon />
                                            </span>
                                        </label>
                                    </div>
                                </div>

                            </div>
                        )
                    }).reverse()}
                </div>
            </ConfigProvider>
        )
    }
)
