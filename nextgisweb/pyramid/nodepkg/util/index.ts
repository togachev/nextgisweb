import { RequestQueue } from "./queue";

export { tileLoadFunction, transparentImage } from "./tileLoadFunction";
export * from "./loader";
export * from "./abort";

const imageQueue = new RequestQueue({ debounce: 150, limit: 6 });

export const makeUid = () => Math.random().toString(36).slice(2);

export { RequestQueue, imageQueue };
