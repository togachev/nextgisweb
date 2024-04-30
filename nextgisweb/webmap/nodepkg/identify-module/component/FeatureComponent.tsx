import { FC, useState, useEffect } from 'react';
import { Button } from "@nextgisweb/gui/antd";

export const FeatureComponent: FC = ({ data }) => {

    const [value, setValue] = useState(1);

    useEffect(() => {
        console.log(value);
    }, [value])


    return (
        <div className="item-content">
            <div className="item">
                <Button onClick={() => {
                    setValue(prev => prev + 1)
                }} >{value}</Button>
                <div>{data[0].label}</div>
                <div>атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты атрибуты</div>
            </div>
        </div>
    )
};