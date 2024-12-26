import type { NgwAttributeType } from "@nextgisweb/feature-layer/type/type/FeatureItem";

/** This attributes for loading to NGW */
export type NgwAttributeValue = Record<string, NgwAttributeType>;

/** This attributes for using in web */
export type AppAttributes = Record<string, unknown>;
