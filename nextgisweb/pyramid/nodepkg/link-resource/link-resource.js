import { routeURL } from "@nextgisweb/pyramid/api";
import React from 'react';
import { useState, useEffect } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";

import "./link-resource.less";

export function linkResource() {

  const [link, setLink] = useState([]);
  useEffect(async () => {
    const url = routeURL("resource.show", 0);
    setLink(<a title={gettext("Resources")} className="link-resource" href={url}>
      <svg className="icon"><use xlinkHref="#icon-rescls-resource_group" /></svg>
    </a>);
  }, [])

  return (
    <>{link}</>
  );
}
