import { createPortal } from "react-dom";
import { Button, Flex } from "@nextgisweb/gui/antd";
import { CloseIcon } from "@nextgisweb/gui/icon";
import showModal from "@nextgisweb/gui/showModal";
import { useControls } from "./controls/useControls";

import "./ImageView.less";

const ImagePortal = ({
    attribs,
}) => {

    const { refs } = useControls();

    return (
        createPortal(
            <div ref={refs} className="image-portal">
                <div
                    className="mask"
                    onClick={() => {
                        refs.current.remove();
                    }}
                ></div>
                <div className="close-block">
                    <Button
                        type="text"
                        icon={<CloseIcon />}
                        onClick={() => {
                            refs.current.remove();
                        }}
                    />
                </div>
                <div
                    className="controls"
                >
                    <Flex wrap gap="small" className="site-button-ghost-wrapper">
                        <Button
                            type="text"
                            icon={<CloseIcon />}
                        />
                        <Button
                            type="text"
                            icon={<CloseIcon />}
                        />
                        <Button
                            type="text"
                            icon={<CloseIcon />}
                        />
                        <Button
                            type="text"
                            icon={<CloseIcon />}
                        />
                    </Flex>
                </div>
                <div className="image-block">
                    <img src={attribs.src} alt="" />
                </div>
            </div>,
            document.body
        )
    )
}

export function ImageView(props) {
    const { attribs } = props;

    return (
        <span
            className="preview-image"
            onClick={() => {
                showModal(ImagePortal, {
                    attribs: attribs,
                })
            }}
        >
            <img src={attribs.src} alt="" />
        </span>
    );
}
