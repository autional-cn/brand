/**
 * 简易并发闸 —— 品牌数据是 N+1 前端并发拉取（零后端改动），
 * 租户数一多即向网关打洪峰（dev 库实测 ~200 租户）。上限 8 兼顾吞吐与礼貌。
 */
export function createLimiter(max: number) {
	let active = 0;
	const queue: Array<() => void> = [];

	return async function limit<T>(fn: () => Promise<T>): Promise<T> {
		if (active >= max) {
			await new Promise<void>((resolve) => queue.push(resolve));
		}
		active++;
		try {
			return await fn();
		} finally {
			active--;
			queue.shift()?.();
		}
	};
}
