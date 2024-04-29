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

import { identifyStore } from "../IdentifyStore";

interface FeaturesProps {
    key: number | string;
    value: object;
}

const FeatureComponent: FC = ({ response, height }) => {
    const itemHeight = height - 60
    // const count = response.featureCount;
    const filter = Object.keys(response).reduce(function (r, e) {
        if (e !== "featureCount") r[e] = response[e]
        return r;
    }, {})
    console.log(response, filter);
    

    return (
        <div className="item-content"
            style={{ height: itemHeight }}
        >
            {response?.featureCount}
            ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
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

    const { width, height, visible, coords, position } = props;
    const response = identifyStore.attrFeature.response;
    const count = response.featureCount;
    const [state, setState] = useState({
        width: width,
        height: height,
        x: position.x,
        y: position.y,
    });

    const [refRnd, setRefRnd] = useState();

    useEffect(() => {
        setState({ x: position.x, y: position.y, width: width, height: height })
    }, [position])

    return (
        createPortal(
            <Rnd
                dragHandleClassName="title-name"
                bounds="window"
                minWidth={width}
                minHeight={height}
                allowAnyClick={true}
                enableResizing={count > 0 ? true : false}
                position={{ x: state.x, y: state.y }}
                size={{ width: state.width, height: state.height }}
                onDragStop={(e, d) => {
                    setState(prev => ({ ...prev, x: d.x, y: d.y }));
                }}
                onResize={(e, direction, ref, delta, position) => {
                    setState(prev => ({ ...prev, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y }));
                }}
                ref={c => {
                    setRefRnd(c);
                    if (c) {
                        c.resizableElement.current.hidden = false;
                    }
                }}
            >
                <div ref={ref} className="popup-position" >
                    <div className="title">
                        <div className="title-name">Объектов: {count}</div>
                        <span
                            className="icon-symbol"
                            onClick={() => {
                                visible({ portal: true, overlay: undefined, key: "popup" })
                                refRnd.resizableElement.current.hidden = true;
                            }} >
                            <CloseIcon />
                        </span>
                    </div>
                    {count > 0 && (
                        <div className="content">
                            <FeatureComponent response={response} height={state.height} />
                        </div>
                    )}
                    <div className="footer-popup">{coords && coords[0].toFixed(6) + ", " + coords[1].toFixed(6)}</div>
                </div>
            </Rnd>,
            document.body
        )
    )
});