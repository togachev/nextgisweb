import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Dropdown, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import PolyIcon from "@nextgisweb/icon/material/hexagon/outline";
import LineIcon from "@nextgisweb/icon/material/show_chart/outline";
import CircleIcon from "@nextgisweb/icon/material/scatter_plot/outline";
import EditIcon from "@nextgisweb/icon/material/edit/outline";

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

    const geomTypesMenuItems: MenuProps = {
        items: geomTypesOptions,
        onClick: (item) => {
            setGeomTypeDefault(item.key)
            setGeomType(item.key);
        },
    };

    const clearGeometry = useCallback(() => {
        setDrawEnd(undefined);
        setGeomType(undefined);
    }, []);

    const onDefaultType = () => {
        setGeomType(geomTypeDefault);
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

    useEffect(() => {
        console.log(drawLayer);
        
    }, [drawLayer])
    
    return (
        <div className="dropdown-button-draw">
            <Button type="primary" onClick={() => {
                addLayerMap()
                olmap.getLayers().forEach((layer) => {
                    const name = layer?.get("name")
                    if (name === 'drawing-layer') {
                        setDrawLayer([
                            ...drawLayer,
                            layer
                        ])
                    }
                });

            }}>
                add layer
            </Button>
            {
                drawLayer.map((item, index) => {

                     return (
                        <div key={index} style={{display: 'flex', justifyContent: 'space-between'}}>
                            <div>Пользовательский слой {index}</div><div><EditIcon /></div>
                        </div>
                     )
                })
            }
            {/* {result} */}
        </div>
    )
}
