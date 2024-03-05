import { useEffect, useState } from 'react';
import { Button, Card, Checkbox, Col, Empty, FloatButton, message, Row, Select, Tabs, Upload } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import DeleteForever from "@nextgisweb/icon/material/delete_forever";
import UploadIcon from "@nextgisweb/icon/material/upload";
import Draw from "@nextgisweb/icon/material/draw";
import ZoomIn from "@nextgisweb/icon/material/zoom_in";
import "./CustomLayer.less";
import { PanelHeader } from "../header";
import Feature from "ol/Feature";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GPX from 'ol/format/GPX';
import KML from 'ol/format/KML';
import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style } from 'ol/style';

const title = gettext("CustomLayer")
const validTypeMesssage = gettext("This file type is not supported");

const validVolumeMessage = gettext("Exceeding the volume of 16mb");
const areaUpload = gettext("Click or drag file to this area to upload layer");
const allDeleteItems = gettext("Delete all layers");
const DeleteLayer = gettext("Delete Layer");
const supportLayer = gettext("Supported layers for import: GPX, GeoJSON, KML");
const ZoomToLayer = gettext("Zoom to layer");
const ZoomToObject = gettext("Zoom to object");
const noAttribute = gettext("No attribute information available");

const { Dragger } = Upload;
const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(file);
};

var customStyle = new Style({
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
});

var clickStyle = new Style({
    stroke: new Stroke({
        width: 4,
        color: '#FFE900'
    }),
    fill: new Fill({
        color: 'rgba(0, 0, 255, 0.5)',
    }),
    image: new Circle({
        anchor: [0.5, 46],
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        stroke: new Stroke({
            width: 1,
            color: '#000000'
        }),
        radius: 6,
        fill: new Stroke({
            width: 1,
            color: '#FFE900'
        }),
    }),
    zIndex: 100,
});

export function CustomLayer({ display, close, topic }) {
    const map = display.map.olMap;
    const maxCount = display.clientSettings.max_count_file_upload;
    const maxCountMesssage = gettext("Maximum number of uploaded files:") + " " + maxCount;

    const [fileList, setFileList] = useState([]);
    const [result, setResult] = useState([]);
    const [feature, setFeature] = useState([]);

    const numberOfFiles = gettext("Number of files:") + " " + fileList.length;

    const addLayerMap = (props) => {
        const customSource = new VectorSource({ url: props.url, format: props.format })
        const customLayer = new VectorLayer({
            source: customSource,
        })
        customLayer.setStyle(customStyle);
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

    const actionControl = (value) => {
        value.length === 0 ?
            topic.publish("webmap/tool/identify/on") :
            (
                topic.publish("webmap/tool/identify/off"),
                topic.publish("feature.unhighlight")
            )
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
            actionControl(newFileList);
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
        actionControl(fileList.filter((item) => item.uid !== uid));
    }

    const visibleLayer = (e, item) => {
        map.getLayers().getArray().forEach(layer => {
            if (layer.get('name') === item.uid) {
                e.target.checked ? layer.setVisible(true) : layer.setVisible(false);
            }
        });
    }

    const LayerList = ({ list, onRemove, zoomToLayer }) => (
        list.map(item => {
            return (
                <div className="layer-item" key={item.uid}>
                    <label className="layer-item-title" title={item.name}>
                        <Checkbox
                            defaultChecked={true}
                            onChange={(e) => visibleLayer(e, item)}
                        />
                        <span className="title">{item.name}</span>
                    </label>
                    <div className="custom-button">
                        <span title={ZoomToLayer} className="icon-symbol" onClick={() => zoomToLayer(item.uid)}>
                            <ZoomIn />
                        </span>
                        <span title={DeleteLayer} className="icon-symbol" onClick={() => onRemove(item.uid)}>
                            <DeleteForever />
                        </span>
                    </div>
                </div >
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
        actionControl([]);
        setResult([]);
    }

    const DeleteItems = ({ list, onRemove }) => (
        <Button type="primary" ghost={true} icon={<DeleteForever />} size="small" onClick={() => onRemove(list)} block>
            {allDeleteItems}
        </Button>
    );

    const displayFeatureInfo = (pixel) => {
        const features = [];
        map.forEachFeatureAtPixel(pixel, function (feature) {
            features.push(feature);
        }, {
            layerFilter: function (layer) {
                return layer.get('name') !== 'drawing-layer';
            }
        },
            { hitTolerance: 10 }
        );
        setFeature(features)
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
        if (e.dragging) return;
        const pixel = map.getEventPixel(e.originalEvent);
        const items = fileList.map(e => e.uid)

        map.getLayers().forEach(layer => {
            if (items.includes(layer.get('name'))) {
                layer.getSource().forEachFeature((e) => {
                    e.setStyle(customStyle)
                })
            }
        })

        displayFeatureInfo(pixel);
    });

    useEffect(() => {
        if (result.length > 0) {
            const res = result.filter(item => item.feature !== feature)
            res.map(item => item.feature.setStyle(customStyle))
            feature.map(item => item.setStyle(clickStyle))
        }
    }, [feature, result])

    const zoomfeature = (item) => {
        const geometry = item.feature.getGeometry()
        display.map.zoomToFeature(
            new Feature({ geometry })
        );
        setFeature([item.feature]);
    }

    const items = [
        {
            key: '1',
            label: 'Загрузка',
            children:
                <>
                    <Dragger {...props} fileList={fileList}>
                        {areaUpload}
                    </Dragger>
                    {
                        fileList.length > 0 ?
                            (
                                <Card
                                    bordered={false}
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
                                    <div className="layer-list-block">
                                        <LayerList list={fileList} onRemove={e => removeItem(e)} zoomToLayer={zoomToLayer} />
                                    </div>
                                </Card>
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={supportLayer} />
                            )
                    }
                </>,
            icon: <UploadIcon />,
        },
        {
            key: '2',
            label: 'Создание',
            children: <Select
                showSearch
                style={{
                    width: 200,
                }}
                placeholder="Search to Select"
                optionFilterProp="children"
                filterOption={(input, option) => (option?.label ?? '').includes(input)}
                filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                }
                options={[
                    {
                        value: '1',
                        label: 'Линия',
                    },
                    {
                        value: '2',
                        label: 'Точка',
                    },
                    {
                        value: '3',
                        label: 'Полигон',
                    },
                ]}
            />,
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
            {
                result.map((item, index) => {
                    const res = Object.fromEntries(
                        Object.entries(item.properties).filter(([, v]) => v !== null && v !== undefined)
                    )
                    return (
                        <div key={index} title={ZoomToObject} >
                            <Card
                                size="small"
                                onClick={() => zoomfeature(item)}
                            >
                                <div className="feature-info-block">
                                    {
                                        Object.keys(res).length > 0 ?
                                            Object.keys(res).map((keyName, i) => {
                                                return (
                                                    <div key={i} className="feature-info">
                                                        <div className="title-info" title={keyName}>{keyName}</div>
                                                        <div className="value-info" title={res[keyName]}>{res[keyName]}</div>
                                                    </div>
                                                )
                                            }) :
                                            <div className="title-info" >{noAttribute}</div>
                                    }
                                </div>
                            </Card>
                        </div>
                    )
                })
            }
            <FloatButton.BackTop />
        </div>
    );
};