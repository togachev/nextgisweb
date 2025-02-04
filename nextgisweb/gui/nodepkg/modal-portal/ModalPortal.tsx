import { createPortal } from "react-dom";
import { Button } from "@nextgisweb/gui/antd";
import { CloseIcon } from "@nextgisweb/gui/icon";
import { useModal } from "./controls/useModal";
import { DescComponent } from "@nextgisweb/resource/description";

import "./ModalPortal.less"
export function ModalPortal(props) {
    const { content, width, height, type, upath_info } = props;

    const { refPortal, refBlock, refContent, close } = useModal();

    return (
        createPortal(
            <div ref={refPortal} className="portal" onClick={close}>
                <div className="block" ref={refBlock}
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                    style={{
                        width: width,
                        height: height,
                    }}>
                    <div className="close">
                        <Button
                            className="size-button"
                            type="text"
                            icon={<CloseIcon />}
                            onClick={close}
                        />
                    </div>
                    <div className="content-block">
                        <div className="content" ref={refContent}>
                            <DescComponent type={type} upath_info={upath_info} content={content} />
                        </div>
                    </div>
                </div>
            </div >,
            document.body
        )
    )
}
