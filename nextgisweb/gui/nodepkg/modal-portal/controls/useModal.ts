import { useEffect, useRef } from "react";

export const useModal = () => {
    const refs = useRef<HTMLDivElement>(null);
    const close = (e) => {
        refs.current.remove(); e.stopPropagation();
    }

    useEffect(() => {
        const onWheel = (e) => {
            e.preventDefault();
        }
        refs.current.addEventListener("wheel", onWheel, false);
        return () => {
            refs.current.removeEventListener("wheel", onWheel, false);
        };
    }, []);


    return { close, refs };
}