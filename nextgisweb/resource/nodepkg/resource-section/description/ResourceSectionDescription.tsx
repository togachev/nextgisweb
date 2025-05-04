import { useState } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { Collapse, Spin } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { LoadingOutlined } from "@ant-design/icons";
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

    const showLoader = async () => {
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
            label: !descValue ? gettext("View resource description") : gettext("Collapse description"),
            children: descValue && <DescComponent content={descValue} />,
            extra: <Spin indicator={<LoadingOutlined spin />} spinning={spinning} percent={percent} />,
        },
    ];

    return (
        <div className="description-panel">
            {!descValue ?
                <Collapse size="large" items={items} onChange={showLoader} /> :
                <Collapse size="large" items={items} defaultActiveKey={['description']} />
            }
        </div>
    );
};

ResourceSectionDescription.displayName = "ResourceSectionDescription";