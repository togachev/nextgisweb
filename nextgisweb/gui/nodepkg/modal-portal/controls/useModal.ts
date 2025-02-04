import { useEffect, useRef } from "react";

export const useModal = () => {
    const refs = useRef<HTMLDivElement>(null);
    const close = (e) => {
        refs.current.remove(); e.stopPropagation();
    }

    return { close, refs };
}