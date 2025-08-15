import { UAParser } from "ua-parser-js";

export const ClientUAInstance = new UAParser();

export const device = ClientUAInstance.getDevice();