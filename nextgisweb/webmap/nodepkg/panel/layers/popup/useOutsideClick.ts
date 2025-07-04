import { useEffect } from "react";

export const useOutsideClick = (ref) => {
    useEffect(() => {
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
    }, [ref]);
};