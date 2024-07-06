import { useState } from "react";
import { Card, ConfigProvider, Empty, Modal, Typography } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import MapIcon from "@nextgisweb/icon/material/map";
import Info from "@nextgisweb/icon/material/info";
import { DescMapTile } from "./DescMapTile";

const openMap = gettext("открыть карту");
const descTitle = gettext("Описание карты");

const { Meta } = Card;
const { Text, Link } = Typography;

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
                        colorBorderSecondary: "none"
                    },
                    Empty: {
                        marginXL: 0,
                    }
                },
            }}
        >
            <Card
                hoverable
                cover={
                    <Link className="link-map" href={urlWebmap} target="_blank">
                        {
                            preview_fileobj_id ?
                                (<div className="img_preview"
                                    style={{
                                        background: `url(${preview}) center center / cover no-repeat`,
                                    }}
                                ></div>) :
                                (<div className="empty-block"><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /></div>)
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
                        <span title={display_name} className="grid-card-meta-title">{display_name}</span>
                    }
                    description={
                        <>
                            <Link href={urlWebmap} target="_blank">
                                <Text className="open-map" underline>{openMap}</Text>
                                <span className="icon-open-map"><MapIcon /></span>

                            </Link>
                            {description !== null && (
                                <span title={descTitle} className="icon-info-map" onClick={showDescription}>
                                    <Info />
                                </span>
                            )}
                        </>
                    }
                />
            </Card>
            <Modal
                width="auto"
                className="modal-desc-home-page"
                centered title={display_name} footer={null} open={isModalOpen} onCancel={handleCancel}>
                <DescMapTile type={type} upath_info={upath_info} content={description} />
            </Modal>
        </ConfigProvider>
    )
}


