import { useCallback, useMemo, useState } from "react";
import { Button, Checkbox, Dropdown, Input, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import PolyIcon from "@nextgisweb/icon/material/hexagon/outline";
import LineIcon from "@nextgisweb/icon/material/show_chart/outline";
import CircleIcon from "@nextgisweb/icon/material/scatter_plot/outline";
import EditIcon from "@nextgisweb/icon/material/edit/outline";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";
import SaveIcon from "@nextgisweb/icon/material/save/outline";

import { useDraw } from "./hook/useDraw";

import "./DrawFeatures.less";

import type { DrawEvent } from "ol/interaction/Draw";
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
const SaveLayer = gettext("Save Layer");

type DrawFeatureMode = "default" | "draw";

const typeComponentIcon = [
    { key: "line", component: <LineIcon /> },
    { key: "polygon", component: <PolyIcon /> },
    { key: "point", component: <CircleIcon /> }
]

const iconTypeGeom = (value) => {
    const component = typeComponentIcon.filter(item => item.key === value)[0].component;
    return component
}

const labelTypeGeom = (value) => {
    return (
        <div className="label-type">
            <span className="label">{gettext(`${value} layer`)}</span>
            <span className="icon">
                {iconTypeGeom(value)}
            </span>
        </div>
    )
}

const geomTypesInfo = [
    {
        label: labelTypeGeom("line"),
        key: "line",
        geomType: "LineString",
    },
    {
        label: labelTypeGeom("polygon"),
        key: "polygon",
        geomType: "Polygon",
    },
    {
        label: labelTypeGeom("point"),
        key: "point",
        geomType: "Point",
    },
];

export function DrawFeatures({ display, topic }: DrawFeaturesProps) {
    const { addLayerMap, drawInteractionClear, drawInteraction, olmap } = useDraw(display);

    const [geomType, setGeomType] = useState<string>();
    const [geomTypeDefault, setGeomTypeDefault] = useState<string>("line");
    const [drawEnd, setDrawEnd] = useState<DrawEvent>();

    const [drawLayer, setDrawLayer] = useState([]);
    const [layerName, setLayerName] = useState<string>('');

    const geomTypesOptions = geomTypesInfo.map(({ key, label }) => {
        if (key !== geomTypeDefault) {
            return { key, label };
        }
    });

    const currentTypeGeom = (value) => {
        const geomType = geomTypesInfo.filter(item => item.key === value)[0].geomType;
        return geomType
    }

    const mode = useMemo<DrawFeatureMode>(() => {
        if (drawEnd) {
            return "geometry";
        }
        return geomType ? "draw" : "default";
    }, [drawEnd, geomType]);

    const addLayer = () => {
        addLayerMap()
        olmap.getLayers().forEach((layer, index) => {
            const name = layer?.get("name")
            if (name === 'drawing-layer') {
                setDrawLayer([
                    ...drawLayer,
                    { key: layer.ol_uid, label: layerName ? layerName : "Пользовательский слой " + index, layer: layer }
                ])
                setLayerName(null)
            }
        });
    }

    const geomTypesMenuItems: MenuProps = {
        items: geomTypesOptions,
        onClick: (item) => {
            setGeomTypeDefault(item.key)
            setGeomType(item.key);
            addLayer();
        },
    };

    const clearGeometry = useCallback(() => {
        setDrawEnd(undefined);
        setGeomType(undefined);
    }, []);

    const onDefaultType = () => {
        setGeomType(geomTypeDefault);
        addLayer();
    };

    const buildDropdown = () => (
        <Dropdown.Button trigger={['hover']} menu={geomTypesMenuItems} onClick={onDefaultType} >
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

    const buildDrawSection = () => {
        return (
            <Button type="primary" onClick={clearGeometry}>
                <Space>
                    {geomTypeFilterIcon(geomType, "save")}
                </Space>
            </Button>
        );
    };

    let result;
    if (mode === "default") {
        result = buildDropdown();
    }
    else if (mode === "draw") {
        result = buildDrawSection();
    }

    const onChangeName = (e) => {
        setLayerName(e.target.value)
    };

    return (
        <div className="dropdown-button-draw">
            <div style={{ margin: '5px' }}>
                <div className="dropdown-button">{result}</div>
                <Input
                    value={layerName}
                    className="layer-name-input"
                    placeholder="Введите название слоя"
                    onChange={onChangeName} />
            </div>
            {
                drawLayer.map((item, index) => {
                    return (
                        <div key={item.key} className="layer-item">
                            <div className="checkbox-item">
                                <Checkbox
                                    defaultChecked={true}
                                    onChange={(e) => {
                                        console.log(e);
                                    }}>
                                    {item.label}
                                </Checkbox>
                            </div>
                            <div className="custom-button">
                                <span title={SaveLayer} className="icon-symbol" onClick={() => {
                                    console.log(SaveLayer)
                                }}>
                                    <SaveIcon />
                                </span>
                                <span title={ZoomToLayer} className="icon-symbol" onClick={() => {
                                    console.log(ZoomToLayer)
                                }}>
                                    <ZoomIn />
                                </span>
                                <span title={DeleteLayer} className="icon-symbol" onClick={() => {
                                    console.log(DeleteLayer);
                                }}>
                                    <DeleteForever />
                                </span>
                                <span title={EditLayer} className="icon-symbol" onClick={() => {
                                    console.log(item.layer);
                                }}>
                                    <EditIcon />
                                </span>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    )
}
