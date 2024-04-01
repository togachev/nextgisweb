import { ChangeEvent, useEffect, useState } from "react";
import { Checkbox, Empty, message, Space, Typography, Upload } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./CustomLayers.less";
import { PanelHeader } from "../header";
import { useLayers } from "./hook/useLayers";

import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";

import type { DojoDisplay, DojoTopic } from "../type";
import type { GetProp, UploadFile, UploadProps } from "@nextgisweb/gui/antd";
import type { Feature, Features } from "ol/Feature";

import { TYPE_FILE } from "./constant";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

type FeatureContext = {
    name: string;
    value: any;
}

type CustomLayersProps = {
    display: DojoDisplay;
    topic: DojoTopic;
    close: () => void;
}

const { Dragger } = Upload;
const { Text } = Typography;

let id = 0;
const getBase64 = (file: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(file as Blob);
};


const title = gettext("CustomLayers")
const loading = gettext("Loading")
const creation = gettext("Creation")
const validTypeMesssage = gettext("This file type is not supported");
const validVolumeMessage = gettext("Exceeding the volume of 16mb");
const areaUpload = gettext("Click or drag file to this area to upload layer");
const allDeleteItems = gettext("Delete all layers");
const DeleteLayer = gettext("Delete Layer");
const supportLayer = gettext("Supported layers for import: GPX, GeoJSON, KML");
const ZoomToLayer = gettext("Zoom to layer");
const ZoomToObject = gettext("Zoom to object");
const noAttribute = gettext("No attribute information available");

export function CustomLayers({ display, close, topic }: CustomLayersProps) {
    const { displayFeatureInfo, olmap, removeItem, removeItems, setCustomStyle, visibleLayer, zoomfeature, zoomToLayer, addLayerMap } = useLayers(display);

    const maxCount = display.clientSettings.max_count_file_upload;
    const maxCountMesssage = gettext("Maximum number of uploaded files:") + " " + maxCount;
    const [uploadkey, setUploadkey] = useState(Date.now())

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [features, setFeatures] = useState<string[]>([]);

    const numberOfFiles = gettext("Number of files maximum/downloaded:") + " " + maxCount + "/" + fileList.length;

    const LayerList = ({ file, actions }) => {
        return (
            <div className="item-list">
                <div className="checkbox-item" title={file.name}>
                    <Checkbox
                        defaultChecked={true} onChange={(e) => {
                            onChange(e, file.uid)
                        }}>
                        {file.name}
                    </Checkbox>
                </div>
                <div className="custom-button">
                    <span title={ZoomToLayer} className="icon-symbol" onClick={() => zoomToLayer(file.uid)}>
                        <ZoomIn />
                    </span>
                    <span title={DeleteLayer} className="icon-symbol" onClick={() => {
                        actions.remove(file.uid);
                        setFeatures([])
                    }}>
                        <DeleteForever />
                    </span>
                </div>
            </div>
        )
    }

    const props: UploadProps = {
        customRequest: async options => {
            const { onSuccess, onError, file } = options;
            try {
                await getBase64(file, (url) => {
                    const fileName = file.name
                    const extension = fileName.slice(fileName.lastIndexOf("."))
                    const data = TYPE_FILE.find(e => e.extension === extension);
                    setFileList(fileList.map(x => ({ ...x, url: url, label: x.name, value: x.uid, checked: true })));
                    addLayerMap({ id: id++, url: url, format: data?.format, file: file, length: fileList.length }, "geomType", "upload")
                })
                onSuccess("Ok");
            } catch (err) {
                onError({ err });
            }
        },
        onChange: ({ fileList }) => {
            setFileList(fileList);
        },
        itemRender: (originNode, file, fileList, actions) => {
            return (
                <LayerList file={file} actions={actions} />
            )
        },
        multiple: true,
        beforeUpload: (file, info) => {
            const fileName = file.name
            const extension = fileName.slice(fileName.lastIndexOf("."))

            const isValidType = TYPE_FILE.some(e => e.extension === extension);
            const isMaxCount = info.length <= maxCount;
            if (!isValidType) {
                message.error(validTypeMesssage + ": " + file.type);
            }
            if (!isMaxCount) {
                message.error(maxCountMesssage);
            }
            const isLimitVolume = file.size / 1024 / 1024 < 16;
            if (!isLimitVolume) {
                message.error(validVolumeMessage);
            }
            return isValidType && isMaxCount && isLimitVolume || Upload.LIST_IGNORE;
        },
        maxCount: maxCount,
        listType: "text",
        name: "file",
        onRemove: (file) => {
            setFileList(fileList.filter((item) => item.uid !== file.uid));
            removeItem(file.uid)
        }
    };

    useEffect(() => {
        olmap.on("click", (e) => {
            if (e.dragging) return;
            setCustomStyle(null, false);
            setFeatures(displayFeatureInfo(e.pixel));
        });
    }, [])

    const onChange: GetProp<typeof Checkbox, "onChange"> = (e: ChangeEvent<HTMLInputElement>, uid: string) => {
        const checked = e.target.checked;
        visibleLayer(checked, uid);
    };

    const FeatureList = ({ features }: Features) => (
        <div className="feature-info-block">
            {
                features.map((feature: Feature, index: number) => {
                    const data = feature.getProperties();
                    const res = Object.fromEntries(
                        Object.entries(data).filter(([key, value]) =>
                            value !== null && value !== undefined && value !== "" && key !== "geometry"
                        )
                    )

                    const values: FeatureContext[] = [];

                    Object.keys(res).map(key => {
                        if (res[key] !== null && res[key] !== "") {
                            values.push({ name: key, value: res[key] })
                        }
                    })

                    return (
                        <div
                            className="feature-item"
                            onClick={() => {
                                zoomfeature(feature);
                                setCustomStyle(feature, true);
                            }}
                            key={index}
                            title={ZoomToObject}
                        >
                            {
                                Object.keys(res).length > 0 ?
                                    values.map((i, idx) => {
                                        return (
                                            <div key={idx} className="feature-info">
                                                <div className="title-info" title={i.name}>{i.name}</div>
                                                <div className="value-info" title={i.value}>{i.value}</div>
                                            </div>
                                        )
                                    }) : <div className="title-info" >{noAttribute}</div>
                            }
                        </div>
                    )
                })
            }
        </div>
    )

    const DeleteItems = () => {
        return (
            <div title={allDeleteItems} className="custom-button icon-symbol"
                onClick={() => {
                    setUploadkey(Date.now());
                    removeItems();
                    setFileList([]);
                }}
            >
                <DeleteForever />
            </div>
        )
    };

    return (
        <div className="ngw-webmap-custom-layers-panel">
            <PanelHeader {...{ title, close }} />
            <div className="upload-panel">
                <div className="info-file">
                    <Text
                        title={numberOfFiles}
                        ellipsis={true}
                    >
                        {numberOfFiles}
                    </Text>
                    {fileList.length > 1 && (<DeleteItems />)}
                </div>
                <div key={uploadkey}>
                    <Dragger {...props} accept=".gpx,.geojson,.kml">
                        <Space direction="vertical">
                            <Text>{areaUpload}</Text>
                        </Space>
                    </Dragger>
                </div>
                {fileList.length > 0 && (<FeatureList features={features} />)}
            </div>
        </div>
    )
};