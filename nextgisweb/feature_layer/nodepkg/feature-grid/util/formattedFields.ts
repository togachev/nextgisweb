import type {
    FeatureLayerFieldCol,
} from "../type";
import type { NgwAttributeType } from "../../type";
export const formattedFields = () => {

    const getNumberValue = (attribute: FeatureLayerFieldCol, val?: NgwAttributeType) => {
        const { format_field, value } = attribute;
        const value_ = value ? value : val;
    
        if (value_) {
            if (typeof value_ === "number") {
                const round = format_field?.round !== null ? { maximumFractionDigits: format_field?.round } : {};
                const prefix = format_field?.prefix ? format_field?.prefix : "";
                return format_field?.checked === true ?
                    new Intl.NumberFormat(navigator.languages[0], { ...round }).format(value_) + " " + prefix :
                    value_;
            } else {
                return value_;
            }
        }
    }

    return { getNumberValue };
}
