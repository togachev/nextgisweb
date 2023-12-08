import { routeURL } from "@nextgisweb/pyramid/api";
import React from 'react';
import { useState, useEffect } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import ResourceGroup from "./icons/resource_group.svg";

import "./link-resource.less";

export function linkResource() {

	const [link, setLink] = useState([]);

	const links_show = async () => {
		const url = routeURL("resource.show", 0);
		return url;

	}

	useEffect(() => {
		links_show().then(url =>
			setLink(<a title={gettext("Resources")} className="link-resource" href={url}>
				<ResourceGroup />
			</a>)
		)
	}, [])

	return (
		<>{link}</>
	);
}
