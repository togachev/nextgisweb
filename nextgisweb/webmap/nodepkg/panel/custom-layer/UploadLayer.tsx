import { useEffect, useState } from 'react';
import { gettext } from "@nextgisweb/pyramid/i18n";

import { Checkbox, message, Upload } from "@nextgisweb/gui/antd";

import "./UploadLayer.less";

import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";

import { useFeatures } from "./hook/useFeatures";

import type { DojoDisplay, DojoTopic } from "../type";
import type { GetProp, UploadFile, UploadProps } from "@nextgisweb/gui/antd";

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const { Dragger } = Upload;

const getBase64 = (file: FileType, callback): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => callback(reader.result));
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const validTypeMesssage = gettext("This file type is not supported");
const validVolumeMessage = gettext("Exceeding the volume of 16mb");
const areaUpload = gettext("Click or drag file to this area to upload layer");
const allDeleteItems = gettext("Delete all layers");
const DeleteLayer = gettext("Delete Layer");
const supportLayer = gettext("Supported layers for import: GPX, GeoJSON, KML");
const ZoomToLayer = gettext("Zoom to layer");
const ZoomToObject = gettext("Zoom to object");
const noAttribute = gettext("No attribute information available");

interface UploadLayerProps {
    display: DojoDisplay;
    topic: DojoTopic;
}

export function UploadLayer({ display, topic }: UploadLayerProps) {
    const { displayFeatureInfo, olmap, removeItem, setCustomStyle, typeFile, visibleLayer, zoomfeature, zoomToLayer, addLayerMap } = useFeatures(display);

    const maxCount = display.clientSettings.max_count_file_upload;
    const maxCountMesssage = gettext("Maximum number of uploaded files:") + " " + maxCount;

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [features, setFeatures] = useState<string[]>([]);

    const props = {
        onChange: (info) => {
            if (info.file.status === 'done') {
                getBase64(info.file.originFileObj, (url) => {
                    const data = typeFile.find(e => e.type === info.file.type);

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
            const isValidType = typeFile.some(e => e.type === file.type);
            const isMaxCount = info.length <= maxCount;
            if (!isValidType) {
                message.error(validTypeMesssage + ': ' + file.type);
            }
            if (!isMaxCount) {
                message.error(maxCountMesssage);
            }
            const isLimitVolume = file.size / 1024 / 1024 < 16;
            if (!isLimitVolume) {
                message.error(validVolumeMessage);
            }
            return isValidType && isMaxCount && isLimitVolume && file.type || Upload.LIST_IGNORE;
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
        olmap.on('click', (e) => {
            if (e.dragging) return;
            setCustomStyle();
            setFeatures(displayFeatureInfo(e.pixel));
        });
    }, [])

    const onChange: GetProp<typeof Checkbox, 'onChange'> = (e, uid) => {
        visibleLayer(e, uid)
    };
    return (
        <>
            <Dragger {...props}>
                {areaUpload}
            </Dragger>
            <div className="feature-info-block">
                {
                    features.map((item, index) => {
                        const data = item.getProperties();
                        const res = Object.fromEntries(
                            Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
                        )
                        const properties = Object.fromEntries(Object.entries(res).filter(([key]) => !key.includes('geometry')));

                        return (
                            <div className="feature-item"
                                onClick={() => {
                                    zoomfeature(item);
                                    setCustomStyle(item, true);
                                }} key={index} title={ZoomToObject}>
                                {
                                    Object.keys(properties).length > 0 ?
                                        Object.keys(properties).map((keyName, i) => {
                                            return (
                                                <div key={i} className="feature-info">
                                                    <div className="title-info" title={keyName}>{keyName}</div>
                                                    <div className="value-info" title={properties[keyName]}>{properties[keyName]}</div>
                                                </div>
                                            )
                                        }) :
                                        <div className="title-info" >{noAttribute}</div>
                                }
                            </div>
                        )
                    })
                }
            </div>
        </>
    )
};
