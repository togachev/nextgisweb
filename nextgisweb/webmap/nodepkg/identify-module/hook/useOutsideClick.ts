import { useEffect } from "react";

export const useOutsideClick = (ref, opened = true) => {
    useEffect(() => {
        if (!opened) return;

        const handleClick = (e) => {
            if (!ref.current) return;

            if (!ref.current.contains(e.target)) {
                ref.current.hidden = true
            }
        };

        document.addEventListener("click", handleClick);

        return () => {
            document.removeEventListener("click", handleClick);
        };
    }, [ref, opened]);
};