import { useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@nextgisweb/gui/antd";
import showModal from "@nextgisweb/gui/showModal";
import { useControls } from "./controls/useControls";
import { observer } from "mobx-react-lite";
import { CloseIcon } from "@nextgisweb/gui/icon";
import RotateLeft from "@nextgisweb/icon/mdi/file-rotate-left-outline";
import RotateRight from "@nextgisweb/icon/mdi/file-rotate-right-outline";
import HorizontalRotate from "@nextgisweb/icon/mdi/horizontal-rotate-clockwise";
import AxisZRotate from "@nextgisweb/icon/mdi/axis-z-rotate-clockwise";
import MagnifyPlus from "@nextgisweb/icon/mdi/magnify-plus-outline";
import MagnifyMinus from "@nextgisweb/icon/mdi/magnify-minus-outline";

import { ImageViewStore } from "./ImageViewStore";

import "./ImageView.less";

const ImagePortal = observer(({ attribs }) => {
    const [store] = useState(
        () => new ImageViewStore({
            scale: 1,
        })
    );

    const { scale, setScale} = store;

    const { horizontalRotate, refs, refImage, rotateLeft, rotateRight, verticalRotate } = useControls(store);

    return (
        createPortal(
            <div ref={refs} className="image-portal">
                <div
                    className="mask"
                    onClick={() => refs.current.remove()}
                ></div>
                <div className="close-block">
                    <Button
                        className="size-button"
                        type="text"
                        icon={<CloseIcon />}
                        onClick={() => refs.current.remove()}
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
                        onClick={() => {
                            scale <= 1.9 ? setScale(scale + 0.1) : setScale(2)
                            console.log(scale);
                        }}
                    />
                    <Button
                        disabled={scale <= 0.2 && true}
                        className="margin-button size-button"
                        type="text"
                        icon={<MagnifyMinus />}
                        onClick={() => {
                            scale >= 0.1 ? setScale(scale - 0.1) : setScale(0.1)
                            console.log(scale);
                        }}
                    />
                </div>
                <div
                    className="image-block"
                    onClick={() => refs.current.remove()}>
                    <img
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        ref={refImage} key="img" src={attribs.src} alt="" />
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
