import { useEffect, useState } from 'react';

/** 防抖值：输入稳定 delay 毫秒后才更新（搜索 query 用，300ms）。 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);
	return debounced;
}
