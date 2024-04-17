
import type { DojoDisplay } from "../type";

export class IdentifyModule {
    private _display: DojoDisplay;

    constructor(
        display: DojoDisplay,
    ) {
        this._display = display;

        const olmap = this._display.map.olMap;

        olmap.on("singleclick", (e) => {
            if (e.type === "singleclick" && e.originalEvent.shiftKey === true) {
                console.log(e.pixel, display);
            }
        });
    }
}