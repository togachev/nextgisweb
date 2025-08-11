import { useState } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { Collapse, Divider, Spin } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { CaretRightOutlined, LoadingOutlined } from "@ant-design/icons";
import { DescComponent } from "@nextgisweb/resource/description";

import type { ResourceSection } from "../type";
import type { CollapseProps } from "@nextgisweb/gui/antd";

import "./ResourceSectionDescription.less";

export const ResourceSectionDescription: ResourceSection = ({
    resourceData,
}) => {
    const description_status = resourceData.resource.description_status;
    const [descValue, setDescValue] = useState(undefined);
    const [spinning, setSpinning] = useState(false);
    const [percent, setPercent] = useState(0);
    const [collapse, setCollapse] = useState(false);

    const showLoader = async () => {
        setCollapse(true)
        setSpinning(true);
        let ptg = -10;
        const value = await route("resource.item", resourceData.resource.id).get({
            cache: true,
            query: {
                serialization: "resource",
            },
        });

        const interval = setInterval(() => {
            ptg += 5;
            setPercent(ptg);

            if (ptg > 10) {
                clearInterval(interval);
                setSpinning(false);
                setPercent(0);
                setDescValue(value.resource.description)
            }
        }, 100);
    };

    if (!description_status) {
        return;
    }

    const items: CollapseProps["items"] = [
        {
            key: "description",
            label: descValue && collapse ? gettext("Collapse description") : gettext("View resource description"),
            children: descValue && <DescComponent content={descValue} />,
            extra: <Spin indicator={<LoadingOutlined spin />} spinning={spinning} percent={percent} />,
        },
    ];

    const onChange = () => {
        setCollapse(!collapse);
    }

    return (
        <div className="description-panel">
            <Divider orientation="left" orientationMargin="0">{gettext("Description")}</Divider>
            <Collapse
                defaultActiveKey={!descValue ? [] : ["description"]}
                expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
                size="small"
                items={items}
                onChange={!descValue ? showLoader : onChange}
            />
        </div>
    );
};

ResourceSectionDescription.displayName = "ResourceSectionDescription";