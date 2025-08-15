import { DeviceTypes } from "./constant";
import { isIOS13Check } from "./utils";

export const isMobileAndTabletType = ({ type }) =>
  type === DeviceTypes.Mobile || type === DeviceTypes.Tablet;

export const getIPad13 = () => isIOS13Check("iPad");