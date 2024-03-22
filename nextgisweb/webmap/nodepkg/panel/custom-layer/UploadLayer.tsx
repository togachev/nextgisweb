import { useEffect, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Checkbox, Empty, message, Space, Typography, Upload } from "@nextgisweb/gui/antd";

import "./UploadLayer.less";

import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";

import { useFeatures } from "./hook/useFeatures";

import type { DojoDisplay } from "../type";
import type { GetProp, UploadFile, UploadProps } from "@nextgisweb/gui/antd";
import type { Feature, Features } from "ol/Feature";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

type FeatureContext = {
    name: string;
    value: any;
}
type UploadLayerProps = {
    display: DojoDisplay;
}

const { Dragger } = Upload;
const { Text } = Typography;

const getBase64 = (file: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(file as Blob);
};

const validTypeMesssage = gettext("This file type is not supported");
const validVolumeMessage = gettext("Exceeding the volume of 16mb");
const areaUpload = gettext("Click or drag file to this area to upload layer");
const allDeleteItems = gettext("Delete all layers");
const DeleteLayer = gettext("Delete Layer");
const supportLayer = gettext("Supported layers for import: GPX, GeoJSON, KML");
const ZoomToLayer = gettext("Zoom to layer");
const ZoomToObject = gettext("Zoom to object");
const noAttribute = gettext("No attribute information available");

export function UploadLayer({ display }: UploadLayerProps) {
    const { displayFeatureInfo, olmap, removeItem, removeItems, setCustomStyle, typeFile, visibleLayer, zoomfeature, zoomToLayer, addLayerMap } = useFeatures(display);

    const maxCount = display.clientSettings.max_count_file_upload;
    const maxCountMesssage = gettext("Maximum number of uploaded files:") + " " + maxCount;
    const [uploadkey, setUploadkey] = useState(Date.now())

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [features, setFeatures] = useState<string[]>([]);

    const numberOfFiles = gettext("Number of files maximum/downloaded:") + " " + maxCount + "/" + fileList.length;


    const props: UploadProps = {
        onChange: (info) => {
            if (info.file.status === "done") {
                getBase64(info.file.originFileObj, (url) => {
                    const fileName = info.file.name
                    const extension = fileName.slice(fileName.lastIndexOf("."))

                    const data = typeFile.find(e => e.extension === extension);
                    setFileList(info.fileList.map(x => ({ ...x, url: url, label: x.name, value: x.uid, checked: true })));
                    addLayerMap({ info: info, url: url, format: data?.format })
                })
            }
        },
        itemRender: (originNode, file, fileList, actions) => {
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
        },
        multiple: true,
        beforeUpload: (file, info) => {
            const fileName = file.name
            const extension = fileName.slice(fileName.lastIndexOf("."))

            const isValidType = typeFile.some(e => e.extension === extension);
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

    const onChange: GetProp<typeof Checkbox, "onChange"> = (e, uid) => {
        visibleLayer(e, uid)
    };

    const LayerList = ({ features }: Features) => (
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
        <div className="upload-tab-panel">
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
            {
                fileList.length > 0 ?
                    (
                        <LayerList features={features} />
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={supportLayer} />
                    )
            }
        </div>
    )
};
