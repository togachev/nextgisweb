import {useEffect, useState} from "react";
import PropTypes from "prop-types";
import {Button} from "@nextgisweb/gui/antd";
import "./ChangeTypeGeom.less";
import MouseIcon from "@material-icons/svg/mouse";

export function ChangeTypeGeom({testFunc, testOperation}) {
    const operation = "ALTER TABLE table ALTER COLUMN geom TYPE geometry(<MULTI*>,3857) USING ST_Multi(geom);"
    const changeGeomType = (e) => {
        testFunc(e);
        testOperation.key = "update"
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
    testFunc: PropTypes.func,
    testOperation: PropTypes.object
};
