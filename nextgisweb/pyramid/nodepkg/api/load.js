/** @entrypoint */
import { LoaderCache } from "../util/loader";

import { request } from "./request";

const cache = new LoaderCache();

export function load(path, require, ready) {
    const loader = () => {
        return request(path).catch((error) => {
            console.error(`Failed to fetch "${path}"`, error);
            throw error;
        });
    };

    cache.promiseFor(path, loader).then(ready, () => ready(undefined));
}
