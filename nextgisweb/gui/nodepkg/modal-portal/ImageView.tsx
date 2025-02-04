import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@nextgisweb/gui/antd";
import showModal from "@nextgisweb/gui/showModal";
import { useImage } from "./controls/useImage";
import { observer } from "mobx-react-lite";
import { CloseIcon } from "@nextgisweb/gui/icon";
import RotateLeft from "@nextgisweb/icon/mdi/file-rotate-left-outline";
import RotateRight from "@nextgisweb/icon/mdi/file-rotate-right-outline";
import HorizontalRotate from "@nextgisweb/icon/mdi/horizontal-rotate-clockwise";
import AxisZRotate from "@nextgisweb/icon/mdi/axis-z-rotate-clockwise";
import MagnifyPlus from "@nextgisweb/icon/mdi/magnify-plus-outline";
import MagnifyMinus from "@nextgisweb/icon/mdi/magnify-minus-outline";

import { Store } from "./Store";

import "./ImageView.less";

const ImagePortal = observer(({ attribs }) => {
    const refImage = useRef<HTMLDivElement>(null);

    const [store] = useState(() => new Store({ refImg: refImage, scale: 1, rotate: 0, propsImage: { scale: 1, transform: { rotate: 0, rotateX: 0, rotateY: 0 } } }));

    const { propsImage, scale } = store;

    const { close, horizontalRotate, refs, rotateLeft, rotateRight, scalePlus, scaleMinus, verticalRotate } = useImage(store);

    return (
        createPortal(
            <div ref={refs} className="image-portal" onClick={close}>
                <div className="image-block">
                    <div className="close">
                        <Button
                            className="size-button"
                            type="text"
                            icon={<CloseIcon />}
                            onClick={close}
                        />
                    </div>
                    <div className="controls">
                        <Button
                            className="size-button"
                            type="text"
                            icon={<RotateLeft />}
                            onClick={rotateLeft}
                        />
                        <Button
                            className="margin-button size-button"
                            type="text"
                            icon={<RotateRight />}
                            onClick={rotateRight}
                        />
                        <Button
                            className="margin-button size-button"
                            type="text"
                            icon={<HorizontalRotate />}
                            onClick={horizontalRotate}
                        />
                        <Button
                            className="margin-button size-button"
                            type="text"
                            icon={<AxisZRotate />}
                            onClick={verticalRotate}
                        />
                        <Button
                            disabled={scale >= 2 && true}
                            className="margin-button size-button"
                            type="text"
                            icon={<MagnifyPlus />}
                            onClick={scalePlus}
                        />
                        <Button
                            disabled={scale <= 0.2 && true}
                            className="margin-button size-button"
                            type="text"
                            icon={<MagnifyMinus />}
                            onClick={scaleMinus}
                        />
                    </div>
                    <div className="content-block">
                        <img
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                            /*style={propsImage}*/ key="img" src={attribs.src} alt="" />
                    </div>
                </div>
            </div >,
            document.body
        )
    )
})

export function ImageView(props) {
    const { attribs } = props;

    return (
        <div
            className="preview-image"
            onClick={() => {
                showModal(ImagePortal, {
                    attribs: attribs,
                })
            }}
        >
            <img src={attribs.src} alt="" />
        </div>
    );
}
