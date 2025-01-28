import { createPortal } from "react-dom";
import { Button } from "@nextgisweb/gui/antd";
import { CloseIcon } from "@nextgisweb/gui/icon";
import showModal from "@nextgisweb/gui/showModal";
import { useControls } from "./controls/useControls";
import "./ImageView.less";

const ImagePortal = ({ attribs }) => {
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
                        className="size-button"
                        type="text"
                        icon={<CloseIcon />}
                        onClick={() => {
                            refs.current.remove();
                        }}
                    />
                </div>
                <div className="controls">
                    <Button
                        className="size-button"
                        type="text"
                        icon={<CloseIcon />}
                    />
                    <Button
                        className="margin-button size-button"
                        type="text"
                        icon={<CloseIcon />}
                    />
                    <Button
                        className="margin-button size-button"
                        type="text"
                        icon={<CloseIcon />}
                    />
                    <Button
                        className="margin-button size-button"
                        type="text"
                        icon={<CloseIcon />}
                    />
                </div>
                <div className="image-block">
                    <img key="img" src={attribs.src} alt="" />
                </div>
            </div >,
            document.body
        )
    )
}

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
