import { PropTypes } from "prop-types";
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import { message, Upload, List, Button } from "@nextgisweb/gui/antd";
import { useState, useEffect } from 'react';
import i18n from "@nextgisweb/pyramid/i18n";
import "./GeomLoading.less";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GPX from 'ol/format/GPX';
import GeoJSON from "ol/format/GeoJSON";
import { Circle, Fill, Stroke, Style } from 'ol/style';

const validTypeMesssage = i18n.gettext("This file type is not supported");
const validVolumeMessage = i18n.gettext("Exceeding the volume of 16mb");
const areaUpload = i18n.gettext("Click or drag file to this area to upload");

const { Dragger } = Upload;
const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(file);
};

const getDefaultStyle = () => {
    var dataStyle = new Style({
        stroke: new Stroke({
            width: 2,
            color: 'rgba(239,41,41,1)'
        }),
        image: new Circle({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            stroke: new Stroke({
                width: 1,
                color: 'rgba(0,0,0,0.8)'
            }),
            radius: 5,
            fill: new Stroke({
                width: 1,
                color: 'rgba(0,0,160,0.25)'
            }),
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 255, 0.5)',
        }),
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
                addLayerMap({info: info, url: url, format: new GPX()})
                break;
            case 'application/geo+json':
                addLayerMap({info: info, url: url, format: new GeoJSON()})
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

            if (info.file.status === 'uploading') {
                setNameLayer(info.file.uid)
                return;
            }

            if (info.file.status === 'done') {
                getBase64(info.file.originFileObj, (url) => {
                    olLayerMap(url, info)
                });
            }

            if (info.file.status === 'removed') {
                var layers = [];
                map.getLayers().forEach((layer) => {
                    if (layer.get('name') != undefined && layer.get('name') === info.file.uid) {
                        layers.push(layer);
                    }
                });
                var len = layers.length;
                for (var i = 0; i < len; i++) {
                    map.removeLayer(layers[i]);
                }
                fileList.splice(fileList.findIndex(a => a.uid === info.file.uid), 1)
                return;
            }

        },
        multiple: true,
        beforeUpload: (file) => {
            setTypeFile(file.type)
    
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
        onPreview: (file) => {
            map.getLayers().forEach((layer) => {
                if (layer.get('name') === file.uid) {
                    let extent = layer.getSource().getExtent();
                    map.getView().fit(extent, map.getSize());
                }
            })
        },
        // maxCount: 10,
        showUploadList: true,
        listType: "text",
        name: "file"
    };

    const ListLayerName = (props) => (
        <List
            itemLayout="horizontal"
            dataSource={props.list}
            renderItem={(item) => (
                <List.Item>
                    <List.Item.Meta
                        title={item.name}
                        description={item.uid}
                    />
                </List.Item>
            )}
        />
    )

    return (
        <Dragger {...props} fileList={fileList}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">{areaUpload}</p>
        </Dragger>
    );
};

GeomLoading.propTypes = {
    display: PropTypes.object,
};