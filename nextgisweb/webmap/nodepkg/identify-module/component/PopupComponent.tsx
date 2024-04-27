import { FC, forwardRef, RefObject, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CloseIcon from "@nextgisweb/icon/material/close";

import Draggable from 'react-draggable';
import type { DraggableData, DraggableEvent } from 'react-draggable';

import { Rnd } from "react-rnd";

import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import EditNote from "@nextgisweb/icon/material/edit_note";
import { ConfigProvider, Tabs, Tooltip } from "@nextgisweb/gui/antd";

// interface FeaturesProps {
//     key: number | string;
//     value: object;
// }

const FeatureComponent: FC = ({ response, height }) => {
    const itemHeight = height - 60
    // features && (Object.entries<FeaturesProps>(features)).forEach(([key, value]) => {
    //     console.log(key, value);
    // });
    // console.log(response, height);
    return (
        <div className="item-content" style={{ height: itemHeight }} >
            {response?.featureCount}
        </div>
    )
};

interface VisibleProps {
    portal: boolean;
    overlay: boolean | undefined;
    key: string;
}
interface ResponseProps {
    featureCount: number;
    y: number;
}

interface PosProps {
    x: number;
    y: number;
}

interface PopupProps {
    width: number;
    height: number;
    visible: ({ portal, overlay, key }: VisibleProps) => void;
    coords: number[];
    response: ResponseProps;
    position: PosProps;
    element: HTMLElement;
}

export default forwardRef<HTMLInputElement>(function PopupComponent(props: PopupProps, ref: RefObject<HTMLInputElement>) {

    const { width, height, visible, coords, response, position, element } = props;

    const [state, setState] = useState({
        width: width,
        height: height,
        x: position.x,
        y: position.y,
    });

    useEffect(() => {
        setState({ x: position.x, y: position.y, width: width, height: height })
    }, [position])

    return (
        createPortal(
            <Rnd
                // scale={scale}
                dragHandleClassName="title-name"
                bounds="canvas"
                minWidth={width}
                minHeight={height}
                allowAnyClick={true}
                enableResizing={response?.featureCount > 0 ? true : false}
                position={{ x: state.x, y: state.y }}
                size={{ width: state.width, height: state.height }}
                onDragStop={(e, d) => {
                    setState(prev => ({ ...prev, x: d.x, y: d.y }));
                }}
                onResize={(e, direction, ref, delta, position) => {
                    setState(prev => ({ ...prev, width: ref.offsetWidth, height: ref.offsetHeight }));
                }}
                ref={ref}
            >
                <div className="popup-position" >
                    <div className="title">
                        <div className="title-name">Объектов: {response?.featureCount}</div>
                        <span
                            className="icon-symbol"
                            onClick={() => { visible({ portal: true, overlay: undefined, key: "popup" }) }} >
                            <CloseIcon />
                        </span>
                    </div>
                    {response?.featureCount > 0 && (
                        <div className="content">
                            <FeatureComponent response={response} height={state.height} />
                        </div>
                    )}
                    <div className="footer-popup">{coords && coords[0].toFixed(6) + ", " + coords[1].toFixed(6)}</div>
                </div>
            </Rnd>,
            element
        )
    )
});