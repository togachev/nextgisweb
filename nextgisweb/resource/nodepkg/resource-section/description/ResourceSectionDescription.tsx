import { CSSProperties, useState } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { Button, Spin } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { LoadingOutlined } from "@ant-design/icons";

import { DescComponent } from "@nextgisweb/resource/description";
import type { ResourceSection } from "../type";

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
    const handleClose = () => {
        setDescValue(undefined);
    };

    if (!description_status) {
        return;
    }

    const style: CSSProperties = { fontWeight: 500, fontSize: 18 };

    return (
        <>
            {descValue !== undefined ?
                <Button style={style} onClick={handleClose}>{gettext("Close description")}</Button> :
                <Button style={style}
                    iconPosition="end"
                    icon={<Spin indicator={<LoadingOutlined spin />} spinning={spinning} percent={percent} />}
                    onClick={showLoader}
                >
                    {gettext("Upload description")}
                </Button>}
            {descValue && <DescComponent content={descValue} />}
        </>
    );
};

ResourceSectionDescription.displayName = "ResourceSectionDescription";