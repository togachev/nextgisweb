import { useCallback, useEffect, useMemo, useState } from 'react';

import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { gettext } from "@nextgisweb/pyramid/i18n";

import {
    Button, Card,
    Checkbox, Tree,
    Col, Empty, message, Row, Upload
} from "@nextgisweb/gui/antd";

import "./UploadLayer.less";

import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ZoomIn from "@nextgisweb/icon/material/zoom_in/outline";

import { useFeatures } from "./hook/useFeatures";

import GPX from 'ol/format/GPX';
import KML from 'ol/format/KML';
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";

import { Circle, Fill, Stroke, Style } from 'ol/style';

import type { DojoDisplay, DojoTopic } from "../type";
import type { GetProp, UploadFile, UploadProps, TreeProps } from "@nextgisweb/gui/antd";

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

const typeFile = [
    { type: 'application/gpx+xml', format: new GPX() },
    { type: 'application/geo+json', format: new GeoJSON() },
    { type: 'application/vnd.google-earth.kml+xml', format: new KML() },
];

export function UploadLayer({ display, topic }: UploadLayerProps) {
    const { visibleLayer, displayFeatureInfo, zoomfeature } = useFeatures(display);

    const olmap = display.map.olMap;
    const maxCount = display.clientSettings.max_count_file_upload;
    const maxCountMesssage = gettext("Maximum number of uploaded files:") + " " + maxCount;

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [defaultKey, setDefaultKey] = useState<string[]>([]);

    const props = {
        onChange: (info) => {
            if (info.file.status === 'done') {
                getBase64(info.file.originFileObj, (url) => {
                    setFileList(info.fileList.map(x => ({ ...x, url: url, title: x.name, key: x.uid, checked: true })));
                    setDefaultKey(info.fileList.map(x => x.uid))
                })
            }
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
        // showUploadList: false,
        listType: "text",
        name: "file",
        onRemove: (file) => {
            setFileList(fileList.filter((item) => item.uid !== file.uid));
        }
    };

    olmap.on('click', (e) => {
        if (e.dragging) return;
        // console.log(e.pixel);
    });

    const removeItem = (nodeData, uid) => {
        console.log(nodeData, uid, fileList);
        
        // setFileList(l => l.filter(item => item.uid !== uid));
    }

    const onCheck: TreeProps["onCheck"] = (val) => {
        setDefaultKey(val)
    };

    const titleRender = (nodeData) => {
        // console.log(nodeData);

        const { title, uid } = nodeData;
        const deleteLayer = (
            <div
                className="custom-button"
                onClick={(e) => e.stopPropagation()}
            >
                <span title={ZoomToLayer} className="icon-symbol"
                // onClick={() => zoomToLayer(item.uid)}
                >
                    <ZoomIn />
                </span>
                <span title={DeleteLayer} className="icon-symbol"
                    onClick={() => removeItem(nodeData, uid)}
                >
                    <DeleteForever />
                </span>
            </div>
        );

        return (

            <Row wrap={false}>
                <Col flex="auto" className="tree-item-title">
                    {title}
                </Col>
                <Col flex="none" className="tree-item-title">
                    {deleteLayer}
                </Col>
            </Row>
        );
    };

    return (
        <>
            <Dragger {...props}>
                {areaUpload}
            </Dragger>
            <Tree
                titleRender={titleRender}
                className="upload-layers"
                checkable
                selectable={false}
                onCheck={onCheck}
                treeData={fileList}
                blockNode
                checkedKeys={defaultKey}
            />
        </>
    )
};
