import { useEffect } from "react";
import { useTimeTrackingStore } from "@/store/time-tracking";

const TimeTrackingTicker = () => {
	const setNow = useTimeTrackingStore((state) => state.setNow);

	useEffect(() => {
		const interval = window.setInterval(() => {
			setNow(Date.now());
		}, 1000);

		return () => {
			window.clearInterval(interval);
		};
	}, [setNow]);

	return null;
};

export default TimeTrackingTicker;
