import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Inbox, Loader2, Search } from 'lucide-react';
import { getPortalUrl } from '@autional-cn/shared';
import { I18nProvider, useI18n } from '@/lib/i18n';
import { useTenantList, type TenantBase } from '@/lib/tenants';
import {
	buildBrandLoginUrl,
	resolveIncomingTarget,
	resolveLanding,
	type IncomingTarget,
} from '@/lib/target';
import { BrandGrid } from '@/components/BrandGrid';
import { EmptyState } from '@/components/EmptyState';

function LangSwitch() {
	const { lang, setLang, t } = useI18n();
	return (
		<button
			type="button"
			onClick={() => setLang(lang === 'zh-CN' ? 'en-US' : 'zh-CN')}
			aria-label={t('header.langLabel')}
			className="brand-button-secondary !px-4 !py-2 !text-xs"
		>
			{lang === 'zh-CN' ? 'EN' : '中文'}
		</button>
	);
}

function SiteHeader() {
	const { t } = useI18n();
	return (
		<header className="sticky top-0 z-20 border-b border-primary-100 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-primary-900">
			<div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
				<div className="flex items-center gap-3">
					<img src="/logo-mark.svg" alt="" className="h-9 w-9" aria-hidden="true" />
					<div className="leading-tight">
						<p className="text-sm font-semibold text-primary-900 dark:text-white">
							{t('header.brand')}
						</p>
						<p className="text-xs text-neutral-500 dark:text-sky-200">
							{t('header.tagline')}
						</p>
					</div>
				</div>
				<LangSwitch />
			</div>
		</header>
	);
}

function SiteFooter() {
	const { t } = useI18n();
	const links = [
		{ label: t('footer.privacy'), href: `${getPortalUrl('auth')}/privacy` },
		{ label: t('footer.terms'), href: `${getPortalUrl('auth')}/terms` },
		{ label: t('footer.trust'), href: getPortalUrl('trust') },
	];
	return (
		<footer className="mt-16 border-t border-primary-100 dark:border-white/10">
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-neutral-500 sm:flex-row sm:px-6 dark:text-neutral-400">
				<p>© {new Date().getFullYear()} Autional</p>
				<nav className="flex items-center gap-5">
					{links.map((l) => (
						<a
							key={l.label}
							href={l.href}
							className="transition hover:text-primary-700 dark:hover:text-sky-300"
						>
							{l.label}
						</a>
					))}
				</nav>
			</div>
		</footer>
	);
}

function BrandPortal() {
	const { t } = useI18n();
	const { data, isLoading, isError, refetch } = useTenantList();
	const [keyword, setKeyword] = useState('');

	// 入口目标只解析一次（?redirect= 在当前会话内不变）
	const incoming: IncomingTarget = useMemo(() => resolveIncomingTarget(window.location.search), []);

	const hrefFor = useMemo(
		() => (tenant: TenantBase) =>
			buildBrandLoginUrl(tenant.slug, resolveLanding(incoming, tenant.slug)),
		[incoming],
	);

	const tenants = data ?? [];
	const filtered = useMemo(() => {
		const kw = keyword.trim().toLowerCase();
		if (!kw) return tenants;
		return tenants.filter((x) =>
			[x.displayName, x.slug].some((v) => v?.toLowerCase().includes(kw)),
		);
	}, [tenants, keyword]);

	// 单租户自动跳过（与 auth 侧 SelectTenantPage 同口径）
	useEffect(() => {
		if (tenants.length === 1) {
			window.location.replace(hrefFor(tenants[0]));
		}
	}, [tenants, hrefFor]);

	const singleTenantName = tenants.length === 1 ? tenants[0].displayName : '';

	return (
		<div className="relative min-h-screen">
			<div className="brand-grid pointer-events-none absolute inset-x-0 top-0 h-72 opacity-60" aria-hidden="true" />
			<div className="relative flex min-h-screen flex-col">
				<SiteHeader />

				<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
					<div className="mb-10 text-center">
						<span className="brand-kicker">{t('hero.kicker')}</span>
						<h1 className="mt-5 text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl dark:text-white">
							{t('hero.title')}
						</h1>
						<p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base dark:text-neutral-300">
							{t('hero.subtitle')}
						</p>
					</div>

					{isLoading && tenants.length === 0 ? (
						<div className="flex flex-col items-center gap-3 py-16 text-neutral-500 dark:text-neutral-400">
							<Loader2 className="h-6 w-6 animate-spin text-primary-600 dark:text-sky-300" aria-hidden="true" />
							<p className="text-sm">{t('state.loading')}</p>
						</div>
					) : isError ? (
						<EmptyState
							icon={<AlertCircle className="h-7 w-7" aria-hidden="true" />}
							title={t('state.errorTitle')}
							description={t('state.errorDesc')}
							action={
								<button type="button" className="brand-button-primary" onClick={() => refetch()}>
									{t('state.retry')}
								</button>
							}
						/>
					) : tenants.length === 0 ? (
						<EmptyState
							icon={<Inbox className="h-7 w-7" aria-hidden="true" />}
							title={t('state.emptyTitle')}
							description={t('state.emptyDesc')}
						/>
					) : tenants.length === 1 ? (
						<div className="flex flex-col items-center gap-3 py-16 text-neutral-500 dark:text-neutral-400">
							<Loader2 className="h-6 w-6 animate-spin text-primary-600 dark:text-sky-300" aria-hidden="true" />
							<p className="text-sm">{t('state.singleTenant', { name: singleTenantName })}</p>
						</div>
					) : (
						<>
							<div className="mx-auto mb-8 max-w-md">
								<div className="relative">
									<Search
										className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
										aria-hidden="true"
									/>
									<input
										type="search"
										value={keyword}
										onChange={(e) => setKeyword(e.target.value)}
										placeholder={t('search.placeholder')}
										aria-label={t('search.placeholder')}
										className="w-full rounded-full border border-primary-200 bg-white/90 py-3 pl-11 pr-5 text-sm text-primary-900 shadow-soft outline-none transition placeholder:text-neutral-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:border-sky-400"
									/>
								</div>
							</div>

							{filtered.length === 0 ? (
								<p className="py-12 text-center text-sm text-neutral-500 dark:text-neutral-400">
									{t('search.noResult')}
								</p>
							) : (
								<BrandGrid
									tenants={filtered}
									hrefFor={hrefFor}
									enterLabel={t('card.enter')}
									fallbackTag={t('card.fallbackTag')}
								/>
							)}
						</>
					)}
				</main>

				<SiteFooter />
			</div>
		</div>
	);
}

export default function App() {
	return (
		<I18nProvider>
			<BrandPortal />
		</I18nProvider>
	);
}
