import { PropTypes } from "prop-types";
import { LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { message, Upload } from "@nextgisweb/gui/antd";
import { useState } from 'react';
import i18n from "@nextgisweb/pyramid/i18n";
import "./GeomLoading.less";

import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GPX from 'ol/format/GPX';
import { Circle, Fill, Stroke, Style } from 'ol/style';

const validTypeMesssage = i18n.gettext("This file type is not supported");
const validVolumeMessage = i18n.gettext("Exceeding the volume of 16mb");

const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
};

const beforeUpload = (file) => {
    const isValidType = file.type === 'application/gpx+xml' || file.type === 'application/geo+json';
    if (!isValidType) {
        message.error(validTypeMesssage);
    }
    const isLimitVolume = file.size / 1024 / 1024 < 16;
    if (!isLimitVolume) {
        message.error(validVolumeMessage);
    }
    return isValidType && isLimitVolume;
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
    const [loading, setLoading] = useState(false);
    const [dataUrl, setDataUrl] = useState();
    const handleChange = (info) => {
        if (info.file.status === 'uploading') {
            setLoading(true);
            return;
        }
        if (info.file.status === 'done') {
            getBase64(info.file.originFileObj, (url) => {
                setLoading(false);
                setDataUrl(url);
            });
        }
    };
    const uploadButton = (
        <div>
            {loading ? <LoadingOutlined /> : <PlusOutlined />}
            <div
                style={{
                    marginTop: 8,
                }}
            >
                Upload
            </div>
        </div>
    );

    const { map } = display;

    const styleCustom = getDefaultStyle();

    const _overlay = new VectorLayer({
        style: (features) => {
            return styleCustom;
        },
        source: new VectorSource({
            url: dataUrl,
            format: new GPX(),
        })
    });

    map.olMap.addLayer(_overlay);

    return (
        <Upload
            name="avatar"
            listType="picture-card"
            className="avatar-uploader"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleChange}
        >
            {dataUrl ?
                (
                    <span>Слой загружен!!!</span>
                )
                : (
                    uploadButton
                )}
        </Upload>
    );
};

GeomLoading.propTypes = {
    display: PropTypes.object,
};
