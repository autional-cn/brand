import { describe, it, expect, beforeAll } from 'vitest';
import {
	buildBrandLoginUrl,
	resolveIncomingTarget,
	resolveLanding,
	withSlug,
} from '../target';

beforeAll(() => {
	// 逐字复制 apps/brand-portal/public/env.js 的门户表
	(window as any).__APP_CONFIG__ = {
		BASE_PATH: '/',
		VITE_ROOT_DOMAIN: 'autional.cn',
		VITE_PORTAL_CONFIG: {
			landing: { host: 'www', base: '' },
			brand: { host: 'brand', base: '' },
			auth: { host: 'auth', base: '' },
			user: { host: 'user', base: '' },
			authenticator: { host: 'authenticator', base: '' },
			admin: { host: 'admin', base: '' },
			developer: { host: 'developer', base: '' },
			security: { host: 'security', base: '' },
			platform: { host: 'platform', base: '' },
			status: { host: 'status', base: '' },
			trust: { host: 'trust', base: '' },
		},
		VITE_API_BASE_URL: '/bff',
	};
});

describe('resolveIncomingTarget', () => {
	it('接受白名单门户的 redirect', () => {
		const r = resolveIncomingTarget('?redirect=https%3A%2F%2Fuser.autional.cn%2F');
		expect(r.explicit).toBe(true);
		expect(r.url).toBe('https://user.autional.cn/');
	});

	it('缺省落到 auth 门户', () => {
		const r = resolveIncomingTarget('');
		expect(r.explicit).toBe(false);
		expect(r.url).toBe('https://auth.autional.cn/');
	});

	it('拒绝外部 origin，回落缺省', () => {
		const r = resolveIncomingTarget('?redirect=https%3A%2F%2Fevil.example.com%2F');
		expect(r.explicit).toBe(false);
		expect(r.url).toBe('https://auth.autional.cn/');
	});

	it('拒绝协议相对变体 //evil.com', () => {
		const r = resolveIncomingTarget('?redirect=%2F%2Fevil.com');
		expect(r.explicit).toBe(false);
	});

	it('接受站内相对路径', () => {
		const r = resolveIncomingTarget('?redirect=%2Fdashboard');
		expect(r.explicit).toBe(true);
		expect(r.url).toBe('/dashboard');
	});
});

describe('withSlug', () => {
	it('裸根补 slug', () => {
		expect(withSlug('https://user.autional.cn/', 'demo')).toBe(
			'https://user.autional.cn/demo/',
		);
	});

	it('已带 slug 的深链原样保留', () => {
		expect(withSlug('https://security.autional.cn/acme/', 'demo')).toBe(
			'https://security.autional.cn/acme/',
		);
	});

	it('无 slug 的门户深链不静默兜底（保持 404 口径）', () => {
		expect(withSlug('https://admin.autional.cn/users', 'demo')).toBe(
			'https://admin.autional.cn/users',
		);
	});
});

describe('resolveLanding', () => {
	it('显式 redirect 裸根 → 带 slug 落地', () => {
		const incoming = resolveIncomingTarget('?redirect=https%3A%2F%2Fuser.autional.cn%2F');
		expect(resolveLanding(incoming, 'demo')).toBe('https://user.autional.cn/demo/');
	});

	it('缺省 → auth 门户 <slug>/dashboard', () => {
		const incoming = resolveIncomingTarget('');
		expect(resolveLanding(incoming, 'demo')).toBe(
			'https://auth.autional.cn/demo/dashboard',
		);
	});

	it('显式 auth 裸根 → 带 slug 的 auth 根（波 3 的 :tenantSlug index 承接）', () => {
		const incoming = resolveIncomingTarget('?redirect=https%3A%2F%2Fauth.autional.cn%2F');
		expect(resolveLanding(incoming, 'demo')).toBe('https://auth.autional.cn/demo/');
	});
});

describe('buildBrandLoginUrl', () => {
	it('组装 auth 登录页并编码 redirect', () => {
		const url = buildBrandLoginUrl('demo', 'https://user.autional.cn/demo/');
		expect(url).toBe(
			'https://auth.autional.cn/demo/login?redirect=https%3A%2F%2Fuser.autional.cn%2Fdemo%2F',
		);
	});
});
