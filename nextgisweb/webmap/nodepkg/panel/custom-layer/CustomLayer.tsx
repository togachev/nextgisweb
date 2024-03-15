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


type DrawFeatureMode = "default" | "draw";


const geomTypesInfo = [
    {
        label: gettext("Line"),
        key: "line",
        geomType: "LineString",
        icon: <LineIcon />,
    },
    {
        label: gettext("Polygon"),
        key: "poly",
        geomType: "Polygon",
        icon: <PolyIcon />,
    },
    {
        label: gettext("Point"),
        key: "point",
        geomType: "Point",
        icon: <CircleIcon />,
    },
];

const geomTypesMap = new Map();
geomTypesInfo.forEach((i) => {
    geomTypesMap.set(i.key, i);
});

const geomTypesOptions = geomTypesInfo.map(({ icon, key, label }) => {
    return { icon, key, label };
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

    console.log(mode, geomType);

    const clearGeometry = useCallback(() => {
        setDrawEnd(undefined);
        setGeomType(undefined);
    }, []);

    const buildDropdown = () => (
        <Dropdown trigger={['click']} menu={geomTypesMenuItems}>
            <Button size="small">
                <Space>
                    <CropFreeIcon />
                </Space>
            </Button>
        </Dropdown>
    );

    const buildDrawSection = () => {
        return (
            <Button
                type="primary"
                size="small"
                danger
                onClick={clearGeometry}
            >
                <Space>
                    <DrawIcon />
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
    // else if (mode === "geometry") {
    //     result = buildGeomSection();
    // }

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
                <>{result}</>,
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