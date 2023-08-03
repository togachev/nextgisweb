import { PropTypes } from "prop-types";
import { ZoomInOutlined, DeleteOutlined } from '@ant-design/icons';
import { message, Upload, Button, Row, Col, Card } from "@nextgisweb/gui/antd";
import { useState } from 'react';
import i18n from "@nextgisweb/pyramid/i18n";
import "./GeomLoading.less";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GPX from 'ol/format/GPX';
import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style, Text } from 'ol/style';

const validTypeMesssage = i18n.gettext("This file type is not supported");
const validVolumeMessage = i18n.gettext("Exceeding the volume of 16mb");
const areaUpload = i18n.gettext("Click or drag file to this area to upload");
const allDeleteItems = i18n.gettext("Delete all layers");
const customLayers = i18n.gettext("Custom Layers");
const ZoomtoLayer = i18n.gettext("Zoom to Layer");
const DeleteLayer = i18n.gettext("Delete Layer");

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

export const GeomLoading = ({ display }) => {

    const map = display.map.olMap;

    const [fileList, setFileList] = useState([]);

    const addLayerMap = (props) => {
        const customSource = new VectorSource({ url: props.url, format: props.format })
        const customLayer = new VectorLayer({
            style: features => getDefaultStyle(),
            source: customSource
        })
        customLayer.set("name", props.info.file.uid);
        map.addLayer(customLayer);
        customSource.once('change', function (e) {
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
                    olLayerMap(url, info)
                });
            }
        },
        multiple: true,
        beforeUpload: (file) => {
            const isValidType = file.type === 'application/gpx+xml' || file.type === 'application/geo+json';
            if (!isValidType) {
                message.error(validTypeMesssage);
            }
            const isLimitVolume = file.size / 1024 / 1024 < 16;
            if (!isLimitVolume) {
                message.error(validVolumeMessage);
            }
            return isValidType && isLimitVolume && file.type;
        },
        // maxCount: 10,
        showUploadList: false,
        listType: "text",
        name: "file"
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
            if (layer.get('name') != undefined && layer.get('name') === uid) {
                layers.push(layer);
            }
        });
        var len = layers.length;
        for (var i = 0; i < len; i++) {
            map.removeLayer(layers[i]);
        }
    }


    const LayerList = ({ list, onRemove, zoomToLayer }) => (
        list.map(item => {
            return (
                <Row className wrap={false} key={item.uid}>
                    <Col className="layer-item-title" title={item.name}>{item.name}</Col>
                    <Col className="custom-button">
                        <ZoomInOutlined title={ZoomtoLayer} className="icon-symbol" onClick={() => zoomToLayer(item.uid)} />
                        <DeleteOutlined title={DeleteLayer} className="icon-symbol" onClick={() => onRemove(item.uid)} />
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
        map.getView().fit(display._defaultExtent());
        setFileList([]);
    }

    const DeleteItems = ({ list, onRemove }) => (
        <Button type="primary" ghost={true} shape="round" icon={<DeleteOutlined />} size="small" onClick={() => onRemove(list)}>
            {allDeleteItems}
        </Button>
    );

    return (
        <>
            <Dragger {...props} fileList={fileList}>{areaUpload}</Dragger>
            {
                fileList.length > 0 &&
                <>
                    <Card
                        size="small"
                        title={customLayers}
                        extra={<Row>
                            <Col>
                                <DeleteItems list={fileList} onRemove={removeItems} />
                            </Col>
                        </Row>}
                    >
                        <LayerList list={fileList} onRemove={removeItem} zoomToLayer={zoomToLayer} />
                    </Card>

                </>
            }
        </>
    );
};

GeomLoading.propTypes = {
    display: PropTypes.object,
};