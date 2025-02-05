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
        const resizeObserver = new ResizeObserver((entries) => {
            const onWheel = (e) => e.preventDefault();
            const onWheelScroll = (e) => e.stopPropagation();

            const heigthContent = entries[0].contentRect.height

            refPortal.current.addEventListener("wheel", onWheel, { passive: false });

            if (refBlock.current.clientHeight - 10 < heigthContent) {
                refContent.current.addEventListener("wheel", onWheelScroll, { passive: true });
            } else {
                refContent.current.addEventListener("wheel", onWheel, { passive: false });
            }

            return () => {
                refPortal.current.removeEventListener("wheel", onWheel);
                if (refBlock.current.clientHeight - 10 < heigthContent) {
                    refContent.current.removeEventListener("wheel", onWheelScroll);
                } else {
                    refContent.current.removeEventListener("wheel", onWheel);
                }
                resizeObserver.disconnect();
            };
        });
        resizeObserver.observe(refContent.current);
    }, []);

    return { close, refPortal, refBlock, refContent };
}