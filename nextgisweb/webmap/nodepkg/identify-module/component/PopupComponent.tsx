import { FC, forwardRef, RefObject, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from "@nextgisweb/icon/material/close";
import { useGeom } from "../hook/useGeom";
import MapBrowserEvent from 'ol/MapBrowserEvent';
import Draggable from 'react-draggable';
import type { DraggableData, DraggableEvent } from 'react-draggable';

import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import EditNote from "@nextgisweb/icon/material/edit_note";
import { ConfigProvider, Tabs, Tooltip } from "@nextgisweb/gui/antd";

const FeatureComponent: FC = () => (
    <ConfigProvider
        theme={{
            components: {
                Tabs: {
                    inkBarColor: "#106a90",
                    itemSelectedColor: "#106a90",
                    itemHoverColor: "#106a9080",
                    paddingXS: '0 10',
                    horizontalItemGutter: 10,
                    horizontalMargin: '0 5px 5px 5px',
                },
                Tooltip: {
                    colorTextLightSolid: '#000',
                    borderRadius: 3,
                }
            },
        }}
    >
        <Tabs
            size="small"
            defaultActiveKey="1"
            items={[Info, QueryStats, EditNote].map((Icon, i) => {
                const id = String(i + 1);
                return {
                    key: id,
                    children: <div className="item-content">
                        Content {id}
                    </div>,
                    icon: <Tooltip title="prompt text" color="#fff" >
                        <Icon />
                    </Tooltip>,
                };
            })}
        />
    </ConfigProvider>
);


interface VisibleProps {
    portal: boolean;
    overlay: boolean | undefined;
    key: string;
}

interface PopupProps {
    width: number;
    height: number;
    event: MapBrowserEvent;
    visible: ({ portal, overlay, key }: VisibleProps) => void;
    tool: string;
}

export default forwardRef<HTMLInputElement>(function PopupComponent(props: PopupProps, ref: RefObject<HTMLInputElement>) {
    const [coords, setSoords] = useState(undefined);

    const { width, height, event, visible, tool } = props;
    const { displayFeatureInfo, transformFrom } = useGeom(tool);

    useEffect(() => {
        transformFrom(event, 3857).then(item => setSoords(item))
        displayFeatureInfo(event.pixel);
    }, [event]);

    const [bounds, setBounds] = useState({
        left: 0,
        top: 0,
        bottom: 0,
        right: 0,
    });
    
    const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = ref.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    return (
        createPortal(
            <Draggable
                handle=".title-name"
                bounds={bounds}
                onStart={(event: DraggableEvent, uiData: DraggableData) => onStart(event, uiData)}
            >
                <div ref={ref} className="popup-position"
                    style={{
                        width: width,
                        height: height,
                    }}
                >
                    <div className="title">
                        <div className="title-name">Атрибутивные данные объекта</div>
                        <span className="icon-symbol"
                            onClick={() => { visible({ portal: true, overlay: undefined, key: "popup" }) }}
                        ><CloseIcon /></span>
                    </div>
                    <div className="content">
                        <FeatureComponent />
                    </div>
                    <div className="footer-popup">{coords && coords[0].toFixed(6) + ", " + coords[1].toFixed(6)}</div>
                </div>
            </Draggable>,
            document.body
        )
    )
});