import { useEffect, useRef } from "react";

export const useOnWindowResize = (callback) => {
    const listener = useRef(null);

    useEffect(() => {
        if (listener.current) {
            window.removeEventListener("resize", listener.current);
        }
        listener.current = callback;
        window.addEventListener("resize", callback);
        return () => {
            window.removeEventListener("resize", callback);
        };
    }, [callback]);
};
