import { observer } from "mobx-react-lite";
import React, { useEffect, useRef, useState } from "react";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";

import {
    Button,
    Card,
    DatePicker,
    DateTimePicker,
    TimePicker,
    Input,
    Modal,
    Select,
} from "@nextgisweb/gui/antd";

import { gettext } from "@nextgisweb/pyramid/i18n";
import { topics } from "@nextgisweb/webmap/identify-module"

import type { ResourceItem } from "@nextgisweb/resource/type/Resource";
import type { FeatureGridStore } from "@nextgisweb/feature-layer/feature-grid/FeatureGridStore";

import "./FilterLayer.less";


export const FilterLayer = (props) => {
    console.log(props);
    
    const { id, open } = props

    const { data: resourceData, isLoading } = useRouteGet<ResourceItem>({
        name: "resource.item",
        params: { id: id },
    });

    const [modalFilter, setModalFilter] = useState(open);
    const [fields, setFields] = useState(false)

    useEffect(() => {
        if (resourceData) {
            const featureLayer = resourceData.feature_layer!;

            const fields_ = featureLayer?.fields;
            if (fields_) {
                setFields(fields_);
            }
        }
    }, [resourceData]);

    console.log(fields);
    const close = () => {
        setModalFilter(false);
    };

    return (
        <Modal
            style={{ padding: 0 }}
            styles={{ body: { overflowY: "auto", maxHeight: "calc(100vh - 206px)" } }}
            maskClosable={true}
            open={modalFilter}
            onOk={close} onCancel={close}
        // closable={false}
        // cancelButtonProps={{ style: { display: "none" } }}
        // okButtonProps={{ style: { display: "none" } }}
        // modalRender={(modal) => {
        //     return React.cloneElement(modal, {
        //         style: { ...modal.props.style, ...{ padding: 16 } },
        //     });
        // }}

        >
            <div className="ngw-filter-layer">
                test
            </div>
        </Modal >
    );
};