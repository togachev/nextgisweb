import { useEffect, useMemo, useState } from "react";
import { Checkbox, ConfigProvider, Dropdown, message, Modal, Select, Space, Switch, Typography } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import PolyIcon from "@nextgisweb/icon/material/hexagon/outline";
import LineIcon from "@nextgisweb/icon/material/show_chart/outline";
import CircleIcon from "@nextgisweb/icon/material/scatter_plot/outline";
import EditIcon from "@nextgisweb/icon/material/edit/outline";
import EditOffIcon from "@nextgisweb/icon/material/edit_off/outline";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";
import SaveAsIcon from "@nextgisweb/icon/material/save_as/outline";

import CheckAll from "@nextgisweb/icon/mdi/check-all";
import VertexIcon from "@nextgisweb/icon/mdi/vector-point";
import EdgeIcon from "@nextgisweb/icon/mdi/vector-polyline";


import { useDraw } from "./hook/useDraw";
const { Text } = Typography;
import "./DrawFeatures.less";

import type { MenuProps } from "@nextgisweb/gui/antd";

import type { DojoTopic, DojoDisplay } from "../type";

import { DrawStore } from "./DrawStore";
import { observer } from "mobx-react-lite";

interface DrawFeaturesProps {
    display: DojoDisplay;
    topic: DojoTopic;
}

const create = gettext("Create")
const save = gettext("Save")
const DeleteLayer = gettext("Delete Layer");
const ZoomToLayer = gettext("Zoom to layer");
const EditLayer = gettext("Edit layer");
const SaveAs = gettext("Save as");
const allDeleteItems = gettext("Delete all layers");
const maxCountLayer = gettext("The limit of created layers has been exceeded")
const saveFormat = gettext("Format")

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

type ItemType = {
    key: number;
    change: boolean;
    label: string;
    geomType: string;
    allLayer: boolean;
    edge: boolean;
    vertex: boolean;
};

let id = 0;

export const DrawFeatures = observer(
    ({ display, topic }: DrawFeaturesProps) => {
        const { addLayerMap, interactionClear, drawInteraction, featureCount, modifyInteraction, removeItem, removeItems, snapInteraction, saveLayer, snapBuild, visibleLayer, zoomToLayer } = useDraw(display);
        const maxCount = display.clientSettings.max_count_file_upload;

        const [geomTypeDefault, setGeomTypeDefault] = useState<string>("LineString");

        const [open, setOpen] = useState(false);
        const [confirmLoading, setConfirmLoading] = useState(false);
        const itemDefault = { key: '', change: false, label: '', geomType: '', edge: false, vertex: false, allLayer: false };

        const [store] = useState(() => new DrawStore({}));

        const {
            options,
            setOptions,
            drawLayer,
            setDrawLayer,
            switchKey,
            setSwitchKey,
            readonly,
            setReadonly,
            itemModal,
            setItemModal,
            controls,
            setControls
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
                const layer = addLayerMap();
                setDrawLayer([
                    ...drawLayer,
                    { key: layer.ol_uid, change: false, label: labelLayer(geomType) + " " + id++, geomType: geomType, edge: false, vertex: geomType === 'Point' ? false : true, allLayer: false }
                ])
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
            setDrawLayer(prevState => {
                return prevState.map((item: ItemType) => {
                    return item.key === switchKey.key ? { ...item, change: false } : { ...item, change: true }
                })
            })
        }, [switchKey])

        const onSwitchKey = (checked: boolean, item: ItemType) => {
            if (checked) {
                modifyInteraction(item);
                drawInteraction(item);
                snapInteraction(item, false);
                topic.publish("webmap/tool/identify/off");
                setSwitchKey({ key: item.key, change: false });
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
                        return { ...item, change: false }
                    })
                });
                setReadonly(true)
                setControls({ allLayer: false, edge: false, vertex: false });
            }
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

        useMemo(() => {
            if (drawLayer) {
                snapBuild(drawLayer?.filter((x) => x.key === switchKey.key)[0])
            }
        }, [drawLayer]);

        const toggleChecked = (key, item) => {
            if (key === "allLayer") {
                setDrawLayer(prev => {
                    return prev.map((item: ItemType) => {
                        if (item.key === switchKey.key) {
                            return { ...item, allLayer: !item.allLayer }
                        };
                        return item;
                    })
                })
            } else if (key === "vertex") {
                setDrawLayer(prev => {
                    return prev.map((item: ItemType) => {
                        if (item.key === switchKey.key) {
                            return { ...item, vertex: !item.vertex }
                        };
                        return item;
                    })
                })
            } else if (key === "edge") {
                setDrawLayer(prev => {
                    return prev.map((item: ItemType) => {
                        if (item.key === switchKey.key) {
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
                title: "Сегмент",
            },
            {
                keyname: "vertex",
                comp: <VertexIcon />,
                title: "Вершина",
            },
            {
                keyname: "allLayer",
                comp: <CheckAll />,
                title: {
                    enable: "Ко всем слоям",
                    disable: "К текущему слою",
                }
            },
        ];

        const IconControl = ({ item, itemLayer }) => {
            const titleEnable = itemLayer.allLayer ? item.title.disable : item.title.enable;

            return (
                <div
                    className={!readonly && !itemLayer.change ? "button-active" : "button-disable"}
                    onClick={() => {
                        !readonly && !itemLayer.change ? toggleChecked(item.keyname, itemLayer) : undefined
                    }}>
                    <div className={itemLayer[item.keyname] ? "icon-symbol-yes" : "icon-symbol-no"}
                        title={item.keyname === "allLayer" ? titleEnable : item.title}>
                        {item.comp}
                    </div>
                </div>
            )
        }

        const ControlEdit = ({ itemLayer }) => {
            return (
                <div className="control">
                    <div>Инструмент прилипания</div>
                    <div className="control-button">{
                        itemLayer !== null ?
                            iconControlSnap.map((item, index) => {
                                return (
                                    <IconControl key={index} item={item} itemLayer={itemLayer} />
                                )
                            }) :
                            (<></>)
                    }</div>
                </div>
            )
        }

        return (
            <ConfigProvider
                theme={{
                    components: {
                        Switch: {
                            colorPrimary: "#FF0000",
                            colorPrimaryHover: "#106a90",
                        },
                        Modal: {
                            titleFontSize: 15,
                        },
                    },
                }}
            >
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
                    {
                        drawLayer.length > 0 ?
                            switchKey.key ?
                                (<ControlEdit itemLayer={drawLayer?.filter((x) => x.key === switchKey.key)[0]} />) :
                                (<ControlEdit itemLayer={itemDefault} />) : null
                    }
                    {
                        drawLayer.map((item: ItemType, index: number) => {
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
                                                onClick={() => {
                                                    statusFeature ?
                                                        zoomToLayer(item.key)
                                                        : undefined
                                                }}>
                                                <ZoomIn />
                                            </span>
                                            <span title={DeleteLayer} className={readonly ? "icon-symbol" : "icon-symbol-disable"} onClick={() => { onDeleteLayer(item) }}>
                                                <DeleteForever />
                                            </span>
                                            <span title={EditLayer} onClick={() => {

                                            }}>
                                                <Switch
                                                    disabled={item.change}
                                                    size="small"
                                                    checkedChildren={<EditIcon />} unCheckedChildren={<EditOffIcon />}
                                                    onChange={(checked) => onSwitchKey(checked, item)} />
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            )
                        }).reverse()
                    }
                </div>
            </ConfigProvider>
        )
    }
)
