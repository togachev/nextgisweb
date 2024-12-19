import { useEffect, useRef } from "react";

export const useOutsideClick = (ref, type) => {

    const OutsideClick = (event: Event) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            ref.current.hidden = true
        }
    };

    const ZIndexStyle = (event: Event) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
            ref.current.style.zIndex = 0
        }
    };

    useEffect(() => {
        if (type === "z-index") {
            document.addEventListener("click", ZIndexStyle, true);
            return () => {
                document.removeEventListener("click", ZIndexStyle, true);
            };
        } else {
            document.addEventListener("click", OutsideClick, true);
            return () => {
                document.removeEventListener("click", OutsideClick, true);
            };
        }

    });
};