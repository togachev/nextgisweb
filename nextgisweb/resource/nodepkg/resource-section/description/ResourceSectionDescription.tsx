import { useState } from "react";
import { route } from "@nextgisweb/pyramid/api";
import { Button, Spin } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { LoadingOutlined } from "@ant-design/icons";
import Close from "@nextgisweb/icon/mdi/close";
import { DescComponent } from "@nextgisweb/resource/description";
import type { ResourceSection } from "../type";
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
    const handleClose = () => {
        setDescValue(undefined);
    };

    if (!description_status) {
        return;
    }

    return (
        <div className="description-panel">
            {!descValue &&
                <div className="button-upload">
                    <Button
                        iconPosition="end"
                        icon={<Spin indicator={<LoadingOutlined spin />} spinning={spinning} percent={percent} />}
                        onClick={showLoader}
                        type="link"
                    >
                        {gettext("View resource description")}
                    </Button>
                </div>
            }
                {descValue &&
                    <>
                        <div className="result-title">
                            <div className="title">{gettext("Description")}</div>
                            <Button
                                icon={<Close />}
                                onClick={handleClose}
                                type="link"
                            />
                        </div>

                        <DescComponent content={descValue} />
                    </>
                }
        </div>
    );
};

ResourceSectionDescription.displayName = "ResourceSectionDescription";