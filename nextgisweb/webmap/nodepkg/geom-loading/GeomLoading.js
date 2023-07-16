import { PropTypes } from "prop-types";

import "./GeomLoading.less";

export const GeomLoading = ({ display }) => {
    
    console.log(display);

    return (
        <div className="">
            test
        </div>
    );
};

GeomLoading.propTypes = {
    display: PropTypes.object,
};
