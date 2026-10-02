import { describe, it, expect } from 'vitest';
import { mergeRecent, RECENT_CAP, type RecentTenant } from '../tenants';

const tenant = (slug: string, displayName = slug.toUpperCase()) => ({ slug, displayName });

describe('mergeRecent', () => {
	it('新记录置顶并记录时间戳', () => {
		const result = mergeRecent([{ ...tenant('a'), ts: 1 }], tenant('b'), 2);
		expect(result).toEqual([
			{ ...tenant('b'), ts: 2 },
			{ ...tenant('a'), ts: 1 },
		]);
	});

	it('重复访问去重并提前，保留最新时间戳', () => {
		const prev: RecentTenant[] = [
			{ ...tenant('b'), ts: 2 },
			{ ...tenant('a'), ts: 1 },
		];
		const result = mergeRecent(prev, tenant('a'), 3);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({ ...tenant('a'), ts: 3 });
		expect(result[1].slug).toBe('b');
	});

	it(`超过上限（${RECENT_CAP}）淘汰最旧`, () => {
		let list: RecentTenant[] = [];
		for (let i = 0; i < RECENT_CAP + 3; i++) {
			list = mergeRecent(list, tenant(`t${i}`), i);
		}
		expect(list).toHaveLength(RECENT_CAP);
		expect(list[0].slug).toBe(`t${RECENT_CAP + 2}`);
		expect(list.map((r) => r.slug)).not.toContain('t0');
		expect(list.map((r) => r.slug)).not.toContain('t1');
		expect(list.map((r) => r.slug)).not.toContain('t2');
	});

	it('空列表直接入列', () => {
		expect(mergeRecent([], tenant('solo'), 9)).toEqual([{ ...tenant('solo'), ts: 9 }]);
	});
});
