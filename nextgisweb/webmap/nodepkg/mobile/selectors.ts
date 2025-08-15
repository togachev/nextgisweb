import * as types from "./types";
import * as UAHelper from "./parse";

export const isMobile = types.isMobileAndTabletType(UAHelper.device) || types.getIPad13();