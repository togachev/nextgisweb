import { useEffect, useState } from "react";
import { route, routeURL } from "@nextgisweb/pyramid/api/route";
import { Button, Dropdown, Space, DatePicker, message, Card, Tooltip } from "@nextgisweb/gui/antd";
import { Balancer } from "react-wrap-balancer";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { SizeType } from "@nextgisweb/gui/antd";
import type { DojoDisplay } from "../type/index.ts";
import type { FeatureLayerField } from "@nextgisweb/feature-layer/type";
import type WebmapStore from "../store/index.ts";

import History from "@nextgisweb/icon/material/history";
import CenterFocusWeak from "@nextgisweb/icon/material/center_focus_weak";

import "./FilterByField.less";

import { parseNgwAttribute } from "../../../feature_layer/nodepkg/util/ngwAttributes.ts";

import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";

const { RangePicker } = DatePicker;

interface FilterByFieldBtnProps {
    id: number;
    display: DojoDisplay;
    store: WebmapStore;
    size?: SizeType;
}

const datatype = "DATE"

const msgRangePicker = gettext("Select date range");
const msgShowLayerFilterByDate = gettext("Filter layer by date");
const msgInfo = gettext("Turn on a layer to get information about an object");
const msgAddFeature = gettext("Zoom to object(s)");
const msgSuccessDataLoaded = gettext("Data loaded");
const msgNoDataAvailable = gettext("No data available");

const InfoCard = () => (
    <Card size="small">
        <Balancer >{msgInfo}</Balancer>
    </Card>
);

const validDate = (feat, r) => {
    if (r == 0) {
        if (!!feat[r].fields.data) {
            return feat[r].fields.data;
        } else {
            return validDate(feat, r + 1);
        }
    } else {
        if (!!feat.at(-r).fields.data) {
            return feat.at(-r).fields.data;
        } else {
            return validDate(feat, r + 1);
        }
    }
}

const success = (messageApi) => {
    messageApi.open({
        type: 'success',
        content: msgSuccessDataLoaded,
    });
};

const error = (messageApi) => {
    messageApi.open({
        type: 'error',
        content: msgNoDataAvailable,
    });
};

export const FilterByField = ({
    id,
    display,
    store,
    size = "middle",
}: FilterByFieldBtnProps) => {
    const [dateType, setDateType] = useState<boolean>(false);
    const [valueStart, setValueStart] = useState<string[]>([]);
    const [value, setValue] = useState<string[]>([]);
    const [status, setStatus] = useState<boolean>(false);
    const [open, setOpen] = useState();
    const [visible, setVisible] = useState<boolean>(false);
    const [messageApi, contextHolder] = message.useMessage();

    const dataTypeCheck = async () => {
        const fields = await route('feature_layer.field', id).get<FeatureLayerField>({ id: id });
        if (fields.find(item => item.datatype === datatype)) {
            setDateType(true)
        }
    };

    useEffect(() => {
        dataTypeCheck()
    }, []);

    const startValue = async () => {
        const fields = await route('resource.item', id).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            const query = { geom: 'no', extensions: 'no', order_by: 'data' }
            const item = await route('feature_layer.feature.collection', id).get({ query });
            let date = [validDate(item, 0), validDate(item, 1)];
            setValueStart([parseNgwAttribute("DATE", date[0]), parseNgwAttribute("DATE", date[1])]);
        }
    };

    useEffect(() => {
        startValue()
    }, [dateType]);

    const disabledDate = (current) => {
        return current && current < valueStart[0] || current && current > valueStart[1];
    };

    const map = display.map.olMap;
    const customLayer = display.map.layers.FilterByFieldLayer.olLayer;

    const setProps = async () => {
        if (!value.includes['']) {
            customLayer.setSource(new VectorSource({
                format: new GeoJSON()
            }))
            customLayer.getSource().setUrl(routeURL("feature_layer.geojson_filter_by_data", id, value[0], value[1]));
            return customLayer
        }
    };

    const featureCount = customLayer.getSource().getFeatures().length;

    useEffect(() => {
        if (status == true && !open) {
            setProps()
                .then((item) => {
                    item.getSource().once('change', function () {
                        let extent = item.getSource().getExtent();
                        if (!isFinite(extent[0])) {
                            setVisible(false)
                            error(messageApi)
                            return
                        } else {
                            setVisible(true)
                            success(messageApi)
                            map.getView().fit(extent, map.getSize());
                        }
                    });

                })
            setStatus(false)
        }
    }, [status, open]);

    const onOpenChangeRange = (open) => {
        setOpen(open);
    }

    const onChangeRangePicker = (item, dateString) => {
        if (item) {
            setValue(dateString);
            setStatus(true)
        }
        if (!item) {
            clearObject();
        }
        
    }

    const clearObject = () => {
        customLayer.getSource().clear();
        display._zoomToInitialExtent();
        setStatus(false)
        setVisible(false);
        startValue();
    };

    const zoomToObject = () => {
        const extent = customLayer.getSource().getExtent();
        if (!isFinite(extent[0])) {
            return
        } else {
            map.getView().fit(extent, map.getSize());
        }
    };

    return (
        <>
            {contextHolder}
            <Dropdown
                overlayClassName="filter-by-field-menu"
                destroyPopupOnHide={true}
                dropdownRender={() => (
                    <>
                        {dateType ?
                            <div className="menu-filter">
                                <Tooltip title={msgRangePicker}>
                                    <RangePicker
                                        allowclear={!visible ? true : false}
                                        defaultValue={valueStart}
                                        disabledDate={disabledDate}
                                        onOpenChange={onOpenChangeRange}
                                        onChange={onChangeRangePicker}
                                    />
                                </Tooltip>
                                <div className="button-list">
                                    {
                                        visible ?
                                            <Button
                                                className="button-style"
                                                type="text"
                                                onClick={zoomToObject}
                                                icon={<CenterFocusWeak />}
                                            >{msgAddFeature}</Button>
                                            : <></>
                                    }
                                    {
                                        featureCount !== 0 ? store.checked.includes(display.item.id[0]) ? <></> : <InfoCard /> : null
                                    }
                                </div>
                            </div>
                            : null}
                    </>
                )}
            >
                <Button title={msgShowLayerFilterByDate} size={size}>
                    <Space>
                        <History />
                    </Space>
                </Button>
            </Dropdown >
        </>
    );
};
