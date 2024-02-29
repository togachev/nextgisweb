import { useState } from 'react';
import { message, Upload, Button, Card, Col, Row, Empty } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import DeleteForever from "@nextgisweb/icon/material/delete_forever";
import "./UploadLayer.less";
import { PanelHeader } from "../header";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GPX from 'ol/format/GPX';
import KML from 'ol/format/KML';
import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';

const title = gettext("UploadLayer")
const validTypeMesssage = gettext("This file type is not supported");

const validVolumeMessage = gettext("Exceeding the volume of 16mb");
const areaUpload = gettext("Click or drag file to this area to upload layer");
const allDeleteItems = gettext("Delete all layers");
const DeleteLayer = gettext("Delete Layer");
const supportLayer = gettext("Supported layers for import: GPX, GeoJSON, KML");
const ZoomToObject = gettext("Zoom to object");

const { Dragger } = Upload;
const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(file);
};

const getDefaultStyle = () => {
    var dataStyle = new Style({
        stroke: new Stroke({
            width: 1.66,
            color: '#FF8B00'
        }),
        image: new Circle({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            stroke: new Stroke({
                width: 1,
                color: 'rgba(0,0,0,0.8)'
            }),
            radius: 4,
            fill: new Stroke({
                width: 1,
                color: 'rgba(16,106,144,0.5)'
            }),
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 255, 0.5)',
        }),
        text: new Text({
            textAlign: 'center',
            textBaseline: "bottom",
            font: '12px Calibri,sans-serif',

            fill: new Fill({
                color: '#000'
            }),
            stroke: new Stroke({
                color: '#fff',
                width: 2
            }),
            offsetY: -10,
            offsetX: 15,
            placement: "point",
            maxAngle: 0,
            overflow: true,
            rotation: 0,
        })
    });

    return dataStyle;
}

export function UploadLayer({ display, close }) {

    const map = display.map.olMap;
    const maxCount = display.clientSettings.max_count_file_upload;
    const maxCountMesssage = gettext("Maximum number of uploaded files:") + " " + maxCount;

    const [fileList, setFileList] = useState([]);
    const [result, setResult] = useState([]);

    const numberOfFiles = gettext("Number of files:") + " " + fileList.length;

    const addLayerMap = (props) => {
        const customSource = new VectorSource({ url: props.url, format: props.format })
        const customLayer = new VectorLayer({
            style: () => getDefaultStyle(),
            source: customSource
        })
        customLayer.set("name", props.info.file.uid);
        map.addLayer(customLayer);
        props.info.fileList.length <= 1 &&
            customSource.once('change', function () {
                if (customSource.getState() === 'ready') {
                    map.getView().fit(customSource.getExtent(), map.getSize());
                }
            });
    }

    const olLayerMap = (url, info) => {
        switch (info.file.type) {
            case 'application/gpx+xml':
                addLayerMap({ info: info, url: url, format: new GPX() })
                break;
            case 'application/geo+json':
                addLayerMap({ info: info, url: url, format: new GeoJSON() })
                break;
            case 'application/vnd.google-earth.kml+xml':
                addLayerMap({ info: info, url: url, format: new KML() })
                break;
            default:
                return;
        }
    }

    const props = {
        onChange: (info) => {
            let newFileList = [...info.fileList];
            newFileList = newFileList.map((file) => {
                if (file.response) {
                    file.url = file.response.url;
                }
                return file;
            });
            setFileList(newFileList);

            if (info.file.status === 'done') {
                getBase64(info.file.originFileObj, (url) => {
                    olLayerMap(url, info);
                });
            }
        },
        multiple: true,
        beforeUpload: (file, info) => {
            const isValidType = file.type === 'application/gpx+xml' || file.type === 'application/geo+json' || file.type === 'application/vnd.google-earth.kml+xml';
            const isMaxCount = info.length <= maxCount;
            if (!isValidType) {
                message.error(validTypeMesssage);
            }
            if (!isMaxCount) {
                message.error(maxCountMesssage);
            }
            const isLimitVolume = file.size / 1024 / 1024 < 16;
            if (!isLimitVolume) {
                message.error(validVolumeMessage);
            }
            return isValidType && isMaxCount && isLimitVolume && file.type;
        },
        maxCount: maxCount,
        showUploadList: false,
        listType: "text",
        name: "file",
    };

    const zoomToLayer = (uid) => {
        map.getLayers().forEach((layer) => {
            if (layer.get('name') === uid) {
                let extent = layer.getSource().getExtent();
                map.getView().fit(extent, map.getSize());
            }
        })
    }

    const removeItem = (uid) => {
        setFileList(fileList.filter((item) => item.uid !== uid));
        var layers = [];
        map.getLayers().forEach((layer) => {
            if (layer.get('name') !== undefined && layer.get('name') === uid) {
                layers.push(layer);
            }
        });
        var len = layers.length;
        for (var i = 0; i < len; i++) {
            map.removeLayer(layers[i]);
        }
        map.getView().fit(display._extent, map.getSize());
        setResult([]);
    }

    const LayerList = ({ list, onRemove, zoomToLayer }) => (
        list.map(item => {
            return (
                <Row wrap={false} key={item.uid}>
                    <Col className="layer-item-title" title={item.name} onClick={() => zoomToLayer(item.uid)}>{item.name}</Col>
                    <Col className="custom-button">
                        <span title={DeleteLayer} className="icon-symbol" onClick={() => onRemove(item.uid)}>
                            <DeleteForever />
                        </span>
                    </Col>
                </Row>
            )
        })
    );

    const removeItems = (items) => {
        let nameLayer = items.map(e => e.uid)
        map.getLayers().getArray().slice(0).forEach(function (layer) {
            if (nameLayer.includes(layer.get('name'))) {
                map.removeLayer(layer);
            }
        });
        map.getView().fit(display._extent, map.getSize());
        setFileList([]);
        setResult([]);
    }

    const DeleteItems = ({ list, onRemove }) => (
        <Button type="primary" ghost={true} icon={<DeleteForever />} size="small" onClick={() => onRemove(list)} block>
            {allDeleteItems}
        </Button>
    );


    const displayFeatureInfo = (pixel) => {
        const features = [];
        map.forEachFeatureAtPixel(pixel, (feature) => {
            features.push(feature);
        },
            { hitTolerance: 10 });
        if (features.length > 0) {
            const info = [];
            let i, ii;
            for (i = 0, ii = features.length; i < ii; ++i) {
                const data = features[i].getProperties();
                delete data.geometry;
                if (data) {
                    info.push({ properties: data, feature: features[i] });
                }
            }
            setResult(info)
        } else {
            setResult([])
        }
    };

    map.on('click', (e) => {
        if (e.dragging) {
            return;
        }
        const pixel = map.getEventPixel(e.originalEvent);
        displayFeatureInfo(pixel);
    });

    return (
        <div className="ngw-webmap-upload-layer-panel">
            <PanelHeader {...{ title, close }} />
            <Dragger {...props} fileList={fileList}>
                {areaUpload}
            </Dragger>
            {
                fileList.length > 0 ?
                    (
                        <Card
                            size="small"
                            title={numberOfFiles}
                            extra={
                                fileList.length > 1 && (
                                    <Row>
                                        <Col>
                                            <DeleteItems list={fileList} onRemove={removeItems} />
                                        </Col>
                                    </Row>
                                )
                            }
                        >
                            <LayerList list={fileList} onRemove={e => removeItem(e)} zoomToLayer={zoomToLayer} />
                        </Card>
                    ) : (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={supportLayer} />
                    )
            }
            {
                result.map((item, index) => {
                    const res = Object.fromEntries(
                        Object.entries(item.properties).filter(([, v]) => v !== null && v !== undefined)
                    )
                    return (
                        <div key={index} title={ZoomToObject} >
                            <Card size="small" style={{ cursor: 'pointer', backgroundColor: "#e7f0f350", margin: '5px' }}
                                onClick={() => {
                                    let extent = item.feature.getGeometry().getExtent();
                                    map.getView().fit(extent, map.getSize());
                                }}
                            >
                                {
                                    Object.keys(res).map((keyName, i) => {
                                        return (
                                            <div key={i} className="feature-info">
                                                <div className="title-info" >{keyName}</div>
                                                <div className="value-info" title={res[keyName]}>{res[keyName]}</div>
                                            </div>
                                        )
                                    })
                                }
                            </Card>
                        </div>
                    )
                })
            }
        </div>
    );
};