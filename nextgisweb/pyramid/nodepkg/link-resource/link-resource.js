import { routeURL } from "@nextgisweb/pyramid/api";
import React from 'react';
import { useState, useEffect } from "react";
import Folder from "@material-icons/svg/folder";
import i18n from "@nextgisweb/pyramid/i18n";

import "./link-resource.less";

export function linkResource(props) {

  const [link, setLink] = useState([]);
  useEffect(async () => {
    const url = routeURL("resource.show", 0);
    if (props.scope === true) {
      setLink(<a title={i18n.gettext("Resources")} className="link-resource" href={url}><Folder/></a>);
    } 
  }, [])

  return (
    <>{link}</>
  );
}
