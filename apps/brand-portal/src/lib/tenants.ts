import { useQuery } from '@tanstack/react-query';
import {
	tenantPublicTenants,
	tenantPublicTenantsByTenants,
} from '@autional-cn/shared/generated/api';
import { extractList } from '@autional-cn/shared';
import { extractBrandingFields } from './branding';
import { createLimiter } from './concurrency';

/* 列表与品牌分两条查询：列表先到先渲染（~200 租户时不必等全部品牌）。
   品牌按 slug 逐条查询，react-query 按 key 去重 + 各自缓存。 */

/** 列表项（后端 PublicTenantInfo 直出 snake_case，apiClient 转 camelCase，两种键都兜） */
interface RawTenant {
	id: string;
	name?: string;
	display_name?: string;
	displayName?: string;
	slug?: string;
}

export interface TenantBase {
	id: string;
	/** 即租户 slug —— 后端 GetPublicTenant 走 GetByName(ctx, slug)，故 name 就是 slug */
	slug: string;
	displayName: string;
}

export interface TenantBranding {
	logoUrl: string;
	primaryColor: string;
	secondaryColor: string;
	companyName: string;
}

export const EMPTY_BRANDING: TenantBranding = {
	logoUrl: '',
	primaryColor: '',
	secondaryColor: '',
	companyName: '',
};

const TTL = 6 * 60 * 60 * 1000; // 6h，与 auth 侧 PUBLIC_TENANTS 同口径
const LIST_KEY = 'brand-portal:tenants';
const BRANDING_PREFIX = 'brand-portal:branding:';

// ─── localStorage 缓存（读时同步，首屏零等待） ───

function readCache<T>(key: string): T | null {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return null;
		const entry = JSON.parse(raw) as { data: T };
		return entry?.data ?? null;
	} catch {
		return null;
	}
}

function writeCache<T>(key: string, data: T): void {
	try {
		localStorage.setItem(key, JSON.stringify({ data, _ts: Date.now() }));
	} catch {
		/* storage full or unavailable */
	}
}

// ─── 查询 ───

export function useTenantList() {
	return useQuery<TenantBase[]>({
		queryKey: [LIST_KEY],
		queryFn: async () => {
			const res = await tenantPublicTenants();
			const items = extractList<RawTenant>(res)
				.map((t) => {
					const slug = t.name || t.slug || '';
					return { id: t.id, slug, displayName: t.display_name || t.displayName || slug };
				})
				.filter((t) => t.slug)
				.sort((a, b) => a.displayName.localeCompare(b.displayName));
			writeCache(LIST_KEY, items);
			return items;
		},
		staleTime: TTL,
		gcTime: TTL * 2,
		placeholderData: () => readCache<TenantBase[]>(LIST_KEY) ?? undefined,
	});
}

const limitBranding = createLimiter(8);

/** 品牌拉取失败不影响整表：回落空品牌（卡片退化为首字母色块） */
async function fetchBrandingSafe(slug: string): Promise<TenantBranding> {
	try {
		const res = await tenantPublicTenantsByTenants(slug);
		const b = extractBrandingFields(res);
		return {
			logoUrl: b?.logoUrl ?? '',
			primaryColor: b?.primaryColor ?? '',
			secondaryColor: b?.secondaryColor ?? '',
			companyName: b?.companyName ?? '',
		};
	} catch {
		return EMPTY_BRANDING;
	}
}

export function useTenantBranding(slug: string) {
	const cacheKey = `${BRANDING_PREFIX}${slug}`;
	return useQuery<TenantBranding>({
		queryKey: ['tenant-branding', slug],
		queryFn: async () => {
			const data = await limitBranding(() => fetchBrandingSafe(slug));
			writeCache(cacheKey, data);
			return data;
		},
		staleTime: TTL,
		gcTime: TTL * 2,
		enabled: Boolean(slug),
		placeholderData: () => readCache<TenantBranding>(cacheKey) ?? undefined,
	});
}
