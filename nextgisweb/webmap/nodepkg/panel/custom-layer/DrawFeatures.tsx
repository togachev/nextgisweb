import { useEffect, useState } from "react";
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
};

let id = 0;

export const DrawFeatures = observer(
    ({ display, topic }: DrawFeaturesProps) => {
        const { addLayerMap, drawInteractionClear, drawInteraction, featureCount, removeItem, removeItems, saveLayer, visibleLayer, zoomToLayer } = useDraw(display);
        const maxCount = display.clientSettings.max_count_file_upload;

        const [geomTypeDefault, setGeomTypeDefault] = useState<string>("LineString");

        const [open, setOpen] = useState(false);
        const [confirmLoading, setConfirmLoading] = useState(false);

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
            setItemModal
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

        const addLayer = (geomType: ItemType) => {
            if (drawLayer.length < maxCount) {
                const layer = addLayerMap();
                setDrawLayer([
                    ...drawLayer,
                    { key: layer.ol_uid, change: false, label: labelLayer(geomType) + " " + id++, geomType: geomType }
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
                addLayer(currentTypeGeom(geomTypeDefault));
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
                        removeItems();
                        setDrawLayer([]);
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
                drawInteraction(item);
                topic.publish("webmap/tool/identify/off");
                setSwitchKey({ key: item.key, change: false });
                setDrawLayer(prevState => {
                    return prevState.map((item) => {
                        return { ...item, change: true }
                    })
                });
                setReadonly(false);
            } else {
                drawInteractionClear();
                topic.publish("webmap/tool/identify/on");
                setDrawLayer(prevState => {
                    return prevState.map((item: ItemType) => {
                        return { ...item, change: false }
                    })
                });
                setReadonly(true)
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
                        drawLayer.map((item: ItemType, index: number) => {
                            const statusFeature = featureCount.includes(item.key)
                            return (
                                <div key={index} className="layer-item">
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
                            )
                        }).reverse()
                    }
                </div>
            </ConfigProvider>
        )
    }
)
