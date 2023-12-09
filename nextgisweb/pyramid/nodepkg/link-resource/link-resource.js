import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import ResourceGroup from "./icons/resource_group.svg";

import "./link-resource.less";

export function linkResource() {
	const url = routeURL("resource.show", 0);
	return (
		<a title={gettext("Resources")} className="link-resource" href={url}>
			<ResourceGroup />
		</a>
	);
}
