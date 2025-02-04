import { useEffect, useRef } from "react";

export const useModal = () => {
    const refPortal = useRef<HTMLDivElement>(null);
    const refContent = useRef<HTMLDivElement>(null);
    const refBlock = useRef<HTMLDivElement>(null);

    const close = (e) => {
        refPortal.current.remove();
        e.stopPropagation();
    }

    useEffect(() => {
        const onWheel = (e) => e.preventDefault();
        const onWheelContent = (e) => e.stopPropagation();

        refPortal.current.addEventListener("wheel", onWheel, { passive: false });
        if (refBlock.current.clientHeight - 44 < refContent.current.clientHeight) {
            refContent.current.addEventListener("wheel", onWheelContent, { passive: true });
        }

        return () => {
            refPortal.current.removeEventListener("wheel", onWheel, false);
            refContent.current.removeEventListener("wheel", onWheelContent, true);
        };
    }, []);


    return { close, refPortal, refBlock, refContent };
}