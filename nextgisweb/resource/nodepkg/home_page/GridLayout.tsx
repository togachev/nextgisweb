import React, { useState, useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Checkbox } from "@nextgisweb/gui/antd";
import "./GridLayout.less";
import { route } from "@nextgisweb/pyramid/api";

const Width = 300;
const Height = 320;

export function GridLayout({ store }) {

	const ResponsiveReactGridLayout = useMemo(
		() => WidthProvider(Responsive),
		[]
	);
	const [staticPosition, setStaticPosition] = useState(true);

	const updatePosition = async (res_id, wmg_id, pmg) => {
		await route("wmgroup.update", res_id, wmg_id, pmg).get()
	};


	useEffect(() => {
		store.setlayout((prev) => {
			return prev.map((item) => {
				return { ...item, static: staticPosition };
			});
		});
		if (staticPosition === false) {
			store.setSource({ coeff: 0.322580645, width: "500px" });
		} else {
			store.setSource({ coeff: 1, width: "100%" });
			store.layout.map(item => {
				let res_id = Number(item.i.split("/")[0]);
				let wmg_id = Number(item.i.split("/")[1]);
				let pmg = {
					x: item.x,
					y: item.y,
					w: item.w,
					h: item.h,
					static: true,
				}
				updatePosition(res_id, wmg_id, JSON.stringify(pmg));
			});
			store.setlayout((prev) => {
				return prev.map((item) => {
					return {
						...item,
						x: item.x,
						y: item.y,
						w: item.w,
						h: item.h,
						static: true,
					};
				});
			});
		}
	}, [staticPosition]);

	return (
		<div
			key={store.source.coeff}
			className="grid-content"
			style={{ overflow: !staticPosition ? "hidden" : undefined }}
		>
			<div className="grid-block">
				<Checkbox
					checked={staticPosition}
					onChange={(e) => {
						setStaticPosition(e.target.checked);
					}}
				>
					{staticPosition
						? "Включить режим редактирования"
						: "Отключить режим редактирования"}
				</Checkbox>
				<ResponsiveReactGridLayout
					style={{
						width: store.source.width,
						// height: !staticPosition ? "100vh" : undefined,
						alignItems: "start",
					}}
					allowOverlap={true}
					compactType={"horizontal"}
					isBounded={true}
					autoSize={true}
					useCSSTransforms={true}
					margin={[0, 0]}
					rowHeight={Height * store.source.coeff}
					isResizable={false}
					breakpoints={{
						lg: 1550 * store.source.coeff,
						md: 1240 * store.source.coeff,
						sm: 930 * store.source.coeff,
						xs: 620 * store.source.coeff,
						xxs: 0,
					}}
					cols={{ lg: 5, md: 4, sm: 3, xs: 2, xxs: 1 }}
					layouts={{ lg: store.layout }}
					onLayoutChange={(layout) => {
						!staticPosition && store.setlayout(layout);
					}}
					onDragStop={(e) => {
						store.setlayout(e);
					}}
				>
					{/* {store.layout.map((itm) => (
						<div key={itm.i} data-grid={itm} className="block">
							<span
								style={{
									width: !staticPosition ? undefined : Width,
									height: !staticPosition ? undefined : Height,
									maxHeight: !staticPosition ? Height * store.source.coeff : Height,
									maxWidth: !staticPosition ? Width * store.source.coeff : Width,
								}}
								className={staticPosition ? "content-block" : "edit-block"}
							>
								{itm.i}
							</span>
						</div>
					))} */}
					{store.layout.map((itm) => {
						let item = store.listMaps.filter(item => item.id + "/" + item.webmap_group_id === itm.i)[0];

						return (
							<div key={itm.i} data-grid={itm} className="block">
								<span
									style={{
										width: !staticPosition ? undefined : Width,
										height: !staticPosition ? undefined : Height,
										maxHeight: !staticPosition ? Height * store.source.coeff : Height,
										maxWidth: !staticPosition ? Width * store.source.coeff : Width,
									}}
									className={staticPosition ? "content-block" : "edit-block"}
								>
									{item.display_name}
								</span>
							</div>
						)
					})}
				</ResponsiveReactGridLayout>
			</div>
		</div>
	);
}
