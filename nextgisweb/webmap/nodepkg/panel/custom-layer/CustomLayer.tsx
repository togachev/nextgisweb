import { useCallback, useMemo, useState } from "react";
import { Tabs, Button, Dropdown, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import UploadIcon from "@nextgisweb/icon/material/upload/outline";
import Draw from "@nextgisweb/icon/material/draw/outline";
import PolyIcon from "@nextgisweb/icon/material/hexagon/outline";
import LineIcon from "@nextgisweb/icon/material/show_chart/outline";
import CircleIcon from "@nextgisweb/icon/material/scatter_plot/outline";

import type { DrawEvent } from "ol/interaction/Draw";
import type { MenuProps } from "@nextgisweb/gui/antd";

import "./CustomLayer.less";
import { PanelHeader } from "../header";

import { UploadLayer } from "./UploadLayer";
// import { DrawFeature } from "./DrawFeature";
import type { DojoDisplay, DojoTopic } from "../type";

interface CustomLayerProps {
    display: DojoDisplay;
    topic: DojoTopic;
    close: () => void;
}

const title = gettext("CustomLayer")
const loading = gettext("Loading")
const creation = gettext("Creation")
const create = gettext("Create")
const save = gettext("Save")

type DrawFeatureMode = "default" | "draw";

const typeComponentIcon = [
    { key: "line", component: <LineIcon /> },
    { key: "polygon", component: <PolyIcon /> },
    { key: "point", component: <CircleIcon /> }
]

const iconTypeGeom = (value) => {
    const comp = typeComponentIcon.filter(item => item.key === value);
    return comp[0].component
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


export function CustomLayer({ display, close, topic }: CustomLayerProps) {

    const [geomType, setGeomType] = useState<string>();
    const [geomTypeDefault, setGeomTypeDefault] = useState<string>("line");
    const [drawEnd, setDrawEnd] = useState<DrawEvent>();

    const geomTypesOptions = geomTypesInfo.map(({ key, label }) => {
        if (key !== geomTypeDefault) {
            return { key, label };
        }
    });

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

    const geomTypeFilterIcon = (geomType, value) => {
        const type = geomTypesInfo.filter(item => item.key === geomType)
        const status = value === "save" ? save : create
        return <div className="button-operation"><div className="status-operation">{status}</div>{type[0].label}</div>;
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

    const items = [
        {
            key: '1',
            label: loading,
            children:
                <UploadLayer display={display} topic={topic} />,
            icon: <UploadIcon />,
        },
        {
            key: '2',
            label: creation,
            children:
                <div className="dropdown-button-draw">{result}</div>,
            icon: <Draw />,
        },
    ];

    return (
        <div className="ngw-webmap-custom-layer-panel">
            <PanelHeader {...{ title, close }} />
            <Tabs
                items={items}
                defaultActiveKey="1"
                type="card"
            />
        </div>
    );
};