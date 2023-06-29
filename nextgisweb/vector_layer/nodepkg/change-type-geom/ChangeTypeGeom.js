import {useEffect, useState} from "react";
import PropTypes from "prop-types";
import {Button} from "@nextgisweb/gui/antd";
import "./ChangeTypeGeom.less";
import MouseIcon from "@material-icons/svg/mouse";

export function ChangeTypeGeom({operation}) {

    const changeGeomType = (e) => {
        console.log(e);
    }

    return (
        <>
            <span>
                <Button
                    className="switch"
                    title="title"
                    icon={ <MouseIcon/> }
                    onClick={() => changeGeomType(operation)}
                />
            </span>
        </>
    );
}

ChangeTypeGeom.propTypes = {
    operation: PropTypes.string
};
