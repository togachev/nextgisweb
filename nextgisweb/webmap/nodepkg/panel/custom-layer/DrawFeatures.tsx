import { useCallback, useMemo, useState } from "react";
import { Button, Checkbox, Dropdown, Input, message, Space, Switch, Typography } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import PolyIcon from "@nextgisweb/icon/material/hexagon/outline";
import LineIcon from "@nextgisweb/icon/material/show_chart/outline";
import CircleIcon from "@nextgisweb/icon/material/scatter_plot/outline";
import EditIcon from "@nextgisweb/icon/material/edit/outline";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";
import SaveAsIcon from "@nextgisweb/icon/material/save_as/outline";

import { useDraw } from "./hook/useDraw";
const { Text } = Typography;
import "./DrawFeatures.less";

import type { MenuProps } from "@nextgisweb/gui/antd";

import type { DojoTopic, DojoDisplay } from "../type";

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
        geomType: "LineString",
    },
    {
        label: labelTypeGeom(gettext("polygon layer"), "Polygon"),
        key: "Polygon",
        geomType: "Polygon",
    },
    {
        label: labelTypeGeom(gettext("point layer"), "Point"),
        key: "Point",
        geomType: "Point",
    },
];

export function DrawFeatures({ display, topic }: DrawFeaturesProps) {
    const { addLayerMap, drawInteractionClear, drawInteraction, featureCount, layerKeyDraw, olmap, removeItem, visibleLayer, zoomToLayer } = useDraw(display);
    const maxCount = display.clientSettings.max_count_file_upload;

    const [geomTypeDefault, setGeomTypeDefault] = useState<string>("LineString");

    const [drawLayer, setDrawLayer] = useState([]);
    const [layerName, setLayerName] = useState<string>('');

    const maxCountLayer = gettext("The limit of created layers has been exceeded")

    const currentMaxLayer = gettext("Number of layers maximum/created:") + " " + maxCount + "/" + drawLayer.length

    const geomTypesOptions = geomTypesInfo.map(({ key, label }) => {
        if (key !== geomTypeDefault) {
            return { key, label };
        }
    });

    const currentTypeGeom = (value) => {
        const geomType = geomTypesInfo.filter(item => item.key === value)[0].geomType;
        return geomType
    }

    const addLayer = (geomType) => {
        if (drawLayer.length < maxCount) {
            const layer = addLayerMap();
            setDrawLayer([
                ...drawLayer,
                { key: layer.ol_uid, change: false, label: layerName ? layerName : labelLayer(geomType), geomType: geomType, layer: layer }
            ])
            setLayerName(null)
        } else {
            message.error(maxCountLayer);
        }
    }

    const geomTypesMenuItems: MenuProps = {
        items: geomTypesOptions,
        onClick: (item) => {
            setGeomTypeDefault(item.key)
            addLayer(item.key);
        },
    };

    const onDefaultType = () => {
        addLayer(currentTypeGeom(geomTypeDefault));
    };

    const DropdownType = () => (
        <Dropdown.Button size="small" trigger={['hover']} menu={geomTypesMenuItems} onClick={onDefaultType} >
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

    const onChangeName = (e) => {
        setLayerName(e.target.value)
    };

    const DeleteItems = () => {
        return (
            <div title={allDeleteItems} className="custom-button icon-symbol"
                onClick={() => {
                    console.log(allDeleteItems);
                }}
            >
                <DeleteForever />
            </div>
        )
    };

    return (
        <div className="dropdown-button-draw">
            <div className="info-file">
                <Text
                    title={currentMaxLayer}
                    ellipsis={true}
                >
                    {currentMaxLayer}
                </Text>
                {drawLayer.length > 1 && (<DeleteItems />)}
            </div>
            <div style={{ margin: '5px' }}>
                <div className="dropdown-button">{DropdownType()}</div>
            </div>
            {
                drawLayer.map((item, index) => {
                    const statusFeature = featureCount.includes(item.key)

                    return (
                        <div key={index} className="layer-item">
                            <div className="checkbox-item">
                                <Checkbox
                                    defaultChecked={true}
                                    onChange={(e) => {
                                        visibleLayer(e, item.layer)
                                    }}>
                                    {item.label} {index + 1}
                                </Checkbox>
                            </div>
                            <div className="custom-button">
                                <span title={SaveAs} className="icon-symbol" onClick={() => {
                                    console.log(SaveAs)
                                }}>
                                    <SaveAsIcon />
                                </span>
                                <span
                                    title={ZoomToLayer}
                                    className={statusFeature ? "icon-symbol" : "icon-symbol-disable"}
                                    onClick={() => {
                                        statusFeature ?
                                            zoomToLayer(item.layer)
                                            : undefined
                                        console.log(layerKeyDraw, item)
                                    }}>
                                    <ZoomIn />
                                </span>
                                <span title={DeleteLayer} className="icon-symbol" onClick={(e) => {
                                    removeItem(item.layer);
                                    setDrawLayer(drawLayer.filter((x) => x.key !== item.key));
                                }}>
                                    <DeleteForever />
                                </span>
                                <span title={EditLayer} className="icon-symbol" onClick={() => {

                                }}>
                                    {/* <EditIcon /> */}
                                    <Switch
                                        size="small"
                                        defaultChecked={false}
                                        onChange={
                                            (checked) => {
                                                checked ?
                                                    (drawInteraction(item),
                                                        topic.publish("webmap/tool/identify/off"))
                                                    :
                                                    (drawInteractionClear(item),
                                                        topic.publish("webmap/tool/identify/on"))
                                            }

                                        } />
                                </span>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    )
}
