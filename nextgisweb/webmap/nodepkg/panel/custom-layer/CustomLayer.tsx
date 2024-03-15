import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Select, Tabs, Button, Dropdown, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import UploadIcon from "@nextgisweb/icon/material/upload/outline";
import Draw from "@nextgisweb/icon/material/draw/outline";
import CropFreeIcon from "@nextgisweb/icon/material/crop_free/outline";
import PolyIcon from "@nextgisweb/icon/material/hexagon/outline";
import LineIcon from "@nextgisweb/icon/material/show_chart/outline";
import CircleIcon from "@nextgisweb/icon/material/scatter_plot/outline";
import DrawIcon from "@nextgisweb/icon/material/draw/outline";
import SaveIcon from "@nextgisweb/icon/material/save/outline";

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
const selectGeometryType = gettext("Select geometry type")

type DrawFeatureMode = "default" | "draw";

const geomTypeDefault = "line"

const geomTypesInfo = [
    {
        label: gettext("Line"),
        titleSave: gettext("line layer"),
        key: "line",
        geomType: "LineString",
        icon: <LineIcon />,
    },
    {
        label: gettext("Polygon"),
        titleSave: gettext("polygon layer"),
        key: "poly",
        geomType: "Polygon",
        icon: <PolyIcon />,
    },
    {
        label: gettext("Point"),
        titleSave: gettext("point layer"),
        key: "point",
        geomType: "Point",
        icon: <CircleIcon />,
    },
];

const geomTypesOptions = geomTypesInfo.map(({ icon, key, label }) => {
    if (key !== geomTypeDefault) {
        return { icon, key, label };
    }
});

export function CustomLayer({ display, close, topic }: CustomLayerProps) {

    const [geomType, setGeomType] = useState<string>();
    const [drawEnd, setDrawEnd] = useState<DrawEvent>();

    const mode = useMemo<DrawFeatureMode>(() => {
        if (drawEnd) {
            return "geometry";
        }
        return geomType ? "draw" : "default";
    }, [drawEnd, geomType]);

    const geomTypesMenuItems: MenuProps = {
        items: geomTypesOptions,
        onClick: (item) => {
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
        return <><div>{status + " "}{type[0].titleSave}</div>{type[0].icon}</>;
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