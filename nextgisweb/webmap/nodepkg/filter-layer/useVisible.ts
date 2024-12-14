import { useState, useEffect, useRef } from "react";

export default function useVisible() {
    const refs = useRef<HTMLDivElement>(null);

    const OutsideClick = (event: Event) => {
        if (refs.current && !refs.current.contains(event.target as Node)) {
            refs.current.hidden = true
        }
    };

    useEffect(() => {
        document.addEventListener("click", OutsideClick, true);
        return () => {
            document.removeEventListener("click", OutsideClick, true);
        };
    });

    return { refs };
}