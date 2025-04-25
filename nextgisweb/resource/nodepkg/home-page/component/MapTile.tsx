import { useEffect, useRef, useState } from "react";
import { Button, Card, ConfigProvider, Empty, Typography } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Cogs from "@nextgisweb/icon/mdi/cogs";
import ImageOff from "@nextgisweb/icon/mdi/image-off";
import Info from "@nextgisweb/icon/material/info";
import { DescComponent } from "@nextgisweb/resource/description";
import { ModalComponent } from ".";
import MapIcon from "@nextgisweb/icon/material/map";
import "./MapTile.less";

const openMap = gettext("Open map");
const descTitle = gettext("Map description");
const settingsTitle = gettext("Map settings");

const { Meta } = Card;
const { Text, Link } = Typography;

export const MapTile = (props) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [descValue, setDescValue] = useState(null);
    const [perm, setPerm] = useState();
    const { id, display_name, preview_fileobj_id, description_status } = props.item;
    const { upath_info } = props.config;
    const { store, size } = props;

    const preview = routeURL("resource.preview", id);
    const urlWebmap = routeURL("webmap.display", id);
    const descRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        store.getPermission(id)
            .then(value => {
                setPerm(value);
            })
    }, [id])

    const urlWebmapSettings = routeURL("resource.update", id);

    const showDescription = async () => {
        const value = await route("resource.item", id).get({
            cache: true,
        });
        setDescValue(value.resource.description)
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const contentDesc = (
        <DescComponent type="home_page" upath_info={upath_info} content={descValue} />
    )

    const TitleMap = ({ className }) => (
        <div title={display_name} className={className + " grid-card-meta-title grid-card-meta-title-min"} >
            {display_name}
        </div >
    )

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
            <div ref={descRef}>
                <Card
                    styles={{ cover: { height: size.cardCoverH }, body: { height: size.cardBodyH } }}
                    hoverable
                    cover={
                        preview_fileobj_id ?
                            <Link title={display_name} className="link-map" href={urlWebmap} target="_blank">
                                <div className="img_preview"
                                    style={
                                        !size.min ?
                                            { background: `url(${preview}) center center / cover no-repeat` } :
                                            {
                                                background: `linear-gradient(to right, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url(${preview}) center center / cover no-repeat`
                                            }
                                    }
                                >
                                    {size.min && <TitleMap />}
                                </div>
                            </Link> :
                            <Link title={display_name} className="link-map" href={urlWebmap} target="_blank">
                                {size.min ? <TitleMap /> : <Empty description="" image={<ImageOff />} />}
                            </Link>
                    }
                >
                    <Meta
                        className="meta-card"
                        style={{
                            fontWeight: 500,
                        }}
                        title={
                            <div className="title-map">
                                <span title={display_name} className="title">
                                    <div className="content-title">
                                        {!size.min && display_name}
                                    </div>
                                </span>
                                <div className={size.min ? "button-min control-button" : "control-button"} >
                                    <Button
                                        href={urlWebmap}
                                        target="_blank"
                                        type="text"
                                        icon={<MapIcon />}
                                    >
                                        {!size.min && <Text >{openMap}</Text>}
                                    </Button>
                                    {perm && perm.resource.update === true && (
                                        <Button
                                            title={settingsTitle}
                                            href={urlWebmapSettings}
                                            target="_blank"
                                            type="text"
                                            icon={<Cogs />}
                                        />)}
                                    {description_status === true && (
                                        <Button
                                            title={descTitle}
                                            onClick={showDescription}
                                            type="text"
                                            icon={<Info />}
                                        />)}
                                </div>
                            </div>
                        }
                    // title={
                    //     <span title={display_name} className="grid-card-meta-title">
                    //         {!size.min && display_name}
                    //     </span>
                    // }
                    // description={
                    //     <>
                    //         <Button
                    //             href={urlWebmap}
                    //             target="_blank"
                    //             type="text"
                    //         >
                    //             <span className="open-map">
                    //                 <MapIcon />
                    //                 {!size.min && <Text >{openMap}</Text>}
                    //             </span>
                    //         </Button>
                    //         {perm && perm.resource.update === true && (
                    //             <Button
                    //                 title={settingsTitle}
                    //                 href={urlWebmapSettings}
                    //                 target="_blank"
                    //                 type="text"
                    //                 icon={<Cogs />}
                    //             />)}
                    //         {description_status === true && (
                    //             <Button
                    //                 title={descTitle}
                    //                 onClick={showDescription}
                    //                 type="text"
                    //                 icon={<Info />}
                    //             />)}
                    //     </>
                    // }
                    />
                </Card>
                <ModalComponent title={display_name} form={contentDesc} open={isModalOpen} handleCancel={handleCancel} />
            </div>
        </ConfigProvider>
    )
}