import React, { useState, useEffect, useMemo, useRef } from "react";
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
	const [source, setSource] = useState({
		coeff: 1,
		width: undefined,
	});
	// let a = store.layout.i;
	// let arr = a.split('/');
	console.log(store.layout);
	
	// const updatePosition = useRef(
    //     async ({ query: q }) => {
    //         await route("wmgroup.update").get({ query: q, signal: makeSignal() })
    //     }
    // );

	useEffect(() => {
		store.setlayout((prev) => {
			return prev.map((item) => {
				return { ...item, static: staticPosition };
			});
		});
		staticPosition === false
			? setSource({ coeff: 0.322580645, width: "500px" })
			: setSource({ coeff: 1, width: "100%" });
	}, [staticPosition]);

	return (
		<div
			className="grid-content"
			style={{ overflow: !staticPosition ? "hidden" : undefined }}
		>
			<div className="left-block">left</div>
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
				>
					{store.layout.map((itm, i) => (
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
			<div className="right-block">right</div>
		</div>
	);
}
