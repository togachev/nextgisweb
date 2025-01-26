import { useEffect, useState } from "react";
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

    const [sizeBlock, setSizeBlock] = useState({ height: "80%" });
    const [sizeImage, setSizeImage] = useState({ width: "auto", height: "100%" });
    const H = window.innerHeight;
    const W = window.innerWidth;
    useEffect(() => {
        const updateWindowDimensions = () => {

            W >= H ?
                setSizeBlock({ height: "80%", width: undefined }) :
                setSizeBlock({ width: "80%", height: undefined })
            W >= H ?
                setSizeImage({ width: "auto", height: "100%" }) :
                setSizeImage({ width: "100%", height: "auto" })
        };

        window.addEventListener("resize", updateWindowDimensions);

        return () => window.removeEventListener("resize", updateWindowDimensions)

    }, []);

    console.log(sizeBlock, sizeImage, "H", H, "W", W);


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
                <div style={sizeBlock} className="image-block">
                    <img style={{ width: sizeImage?.width, height: sizeImage?.height }} src={attribs.src} alt="" />
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
