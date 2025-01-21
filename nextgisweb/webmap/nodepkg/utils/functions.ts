import * as pako from "pako";

export const compressed = (str) => {
    return btoa(String.fromCharCode.apply(null, pako.gzip(str)));
}

export const decompressed = (val) => {
    const compressedData = Uint8Array.from(atob(val), (c) => c.charCodeAt(0));
    return new TextDecoder().decode(pako.inflate(compressedData));
}