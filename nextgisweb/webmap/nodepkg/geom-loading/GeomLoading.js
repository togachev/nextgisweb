import { PropTypes } from "prop-types";
import { LoadingOutlined, PlusOutlined, InboxOutlined } from '@ant-design/icons';
import { message, Upload } from "@nextgisweb/gui/antd";
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
const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
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

    const [dataUrl, setDataUrl] = useState();
    const [nameLayer, setNameLayer] = useState();
    const [typeFile, setTypeFile] = useState();

    const map = display.map.olMap;

    const handleChange = (info) => {
        if (info.file.status === 'uploading') {
            setNameLayer(info.file.uid)
            return;
        }
        if (info.file.status === 'done') {
            getBase64(info.file.originFileObj, (url) => {
                setDataUrl(url);
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
            return;
        }
    };

    const onPreview = (file) => {
        console.log(file);
        map.getLayers().forEach((layer) => {
            if (layer.get('name') === file.uid) {
                let extent = layer.getSource().getExtent();
                map.getView().fit(extent, map.getSize());
            }
        })
    };

    const beforeUpload = (file) => {
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
    };

    const addLayerMap = (source) => {
        const customLayer = new VectorLayer({
            style: features => getDefaultStyle(),
            source: source
        })

        customLayer.set("name", nameLayer);
        map.addLayer(customLayer);

        source.once('change', function (e) {
            if (source.getState() === 'ready') {
                map.getView().fit(source.getExtent(), map.getSize());
            }
        });
    }

    useEffect(() => {
        switch (typeFile) {
            case 'application/gpx+xml':
                addLayerMap(new VectorSource({ url: dataUrl, format: new GPX() }))
                break;
            case 'application/geo+json':
                addLayerMap(new VectorSource({ url: dataUrl, format: new GeoJSON() }))
                break;
            default:
                return;
        }
    }, [dataUrl]);

    const TestName = () => {
        return (
            <span>test</span>
        )
    }

    return (
        <Dragger
            multiple={false}
            name="file"
            listType="text"
            showUploadList={true}
            beforeUpload={beforeUpload}
            onChange={handleChange}
            onPreview={onPreview}
            maxCount={10} // maximum number of uploaded files
        >
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
