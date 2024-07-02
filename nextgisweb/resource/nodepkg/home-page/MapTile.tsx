import { useState } from "react";
import { Card, ConfigProvider, Empty, Modal, Tooltip, Typography } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import MapIcon from "@nextgisweb/icon/material/map";
import Info from "@nextgisweb/icon/material/info";
import { DescMapTile } from "./DescMapTile";

const openMap = gettext("открыть карту");
const descTitle = gettext("Описание карты");

const { Meta } = Card;
const { Text, Link } = Typography;

const Width = 300;
const Height = 320;

export const MapTile = (props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { id, display_name, preview_fileobj_id, description } = props.item;
    const { type, upath_info } = props.config;

    const preview = routeURL("resource.preview", id)
    const urlWebmap = routeURL("webmap.display", id)
    const showDescription = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    return (
        <ConfigProvider
            theme={{
                components: {
                    Card: {
                        paddingLG: 0,
                        colorBorderSecondary: "var(--divider-color)"
                    },
                },
            }}
        >
            <Card
                style={{
                    width: Width,
                    height: Height,
                }}
                hoverable
                cover={
                    <Link style={{ padding: 0, display: "contents" }} href={urlWebmap} target="_blank">
                        {
                            preview_fileobj_id ?
                                (<div className="img_preview"
                                    style={{
                                        background: `url(${preview}) center center / cover no-repeat`,
                                    }}
                                ></div>) :
                                (<div className="img_preview_none">
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                </div>)
                        }
                    </Link>
                }
            >
                <Meta
                    className="meta-card"
                    style={{
                        fontWeight: 500,
                        height: 125
                    }}
                    title={
                        <Tooltip placement="top" title={display_name} >
                            <span className="grid-card-meta-title">{display_name}</span>
                        </Tooltip>
                    }
                    description={
                        <>
                            <Link href={urlWebmap} target="_blank">
                                <Text className="open-map" underline>{openMap}</Text>
                                <span className="icon-open-map"><MapIcon /></span>

                            </Link>
                            {description !== null && (
                                <Tooltip placement="top" title={descTitle} >
                                    <span className="icon-info-map" onClick={showDescription}>
                                        <Info />
                                    </span>
                                </Tooltip>
                            )}
                        </>
                    }
                />
            </Card>
            <Modal
            className="modal-desc-home-page"
            centered title={display_name} footer={null} open={isModalOpen} onCancel={handleCancel}>
                <DescMapTile type={type} upath_info={upath_info} content={description} />
            </Modal>
        </ConfigProvider>
    )
}


