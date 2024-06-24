import React, { useState, useEffect, useMemo, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Button, Checkbox } from "@nextgisweb/gui/antd";
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
	const [source, setSource] = useState({
		coeff: 1,
		width: undefined,
	});
	// let a = store.layout.i;
	// let arr = a.split('/');

	const updatePosition = async (res_id, wmg_id, pmg ) => {
		await route("wmgroup.update", res_id, wmg_id, pmg).get()
	};


	useEffect(() => {
		store.setlayout((prev) => {
			return prev.map((item) => {
				return { ...item, static: staticPosition };
			});
		});
		if (staticPosition === false) {
			setSource({ coeff: 0.322580645, width: "500px" });
		} else {
			setSource({ coeff: 1, width: "100%" });
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
		}
	}, [staticPosition]);

	return (
		<div
			className="grid-content"
			style={{ overflow: !staticPosition ? "hidden" : undefined }}
		>
			{/* <div className="left-block">left</div> */}
			<div className="grid-block" key={source.coeff}>
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
				{/* {!staticPosition && (<Button
					onClick={() => {
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
						setStaticPosition(true);
					}}
				>Сохранить</Button>)} */}
				<ResponsiveReactGridLayout
					style={{
						width: source.width,
						// height: !staticPosition ? "100vh" : undefined,
						alignItems: "start",
					}}
					allowOverlap={true}
					compactType={"horizontal"}
					isBounded={true}
					autoSize={true}
					useCSSTransforms={true}
					margin={[0, 0]}
					rowHeight={Height * source.coeff}
					isResizable={false}
					breakpoints={{
						lg: 1550 * source.coeff,
						md: 1240 * source.coeff,
						sm: 930 * source.coeff,
						xs: 620 * source.coeff,
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
					{store.layout.map((itm) => (
						<div key={itm.i} data-grid={itm} className="block">
							<span
								style={{
									width: !staticPosition ? undefined : Width,
									height: !staticPosition ? undefined : Height,
									maxHeight: !staticPosition ? Height * source.coeff : Height,
									maxWidth: !staticPosition ? Width * source.coeff : Width,
								}}
								className={staticPosition ? "content-block" : "edit-block"}
							>
								{itm.i}
							</span>
						</div>
					))}
				</ResponsiveReactGridLayout>
			</div>
			{/* <div className="right-block">right</div> */}
		</div>
	);
}
