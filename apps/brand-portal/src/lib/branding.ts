/**
 * 租户品牌字段提取 —— 移植自 sites/auth apps/auth-pages/src/hooks/useAuthPageInit.ts:38
 * （app 级文件，不在 packages/shared，故本站自带一份；两份须保持同源语义）。
 *
 * 兼容 snake_case 与 camelCase：后端直出为 snake_case，
 * 但 apiClient 的响应拦截器会做 camelCase 转换，故两种键都可能出现。
 */

export interface BrandingData {
	primaryColor: string;
	primaryColorDark?: string;
	logoUrl: string;
	faviconUrl: string;
	customCss: string;
	secondaryColor?: string;
	companyName?: string;
	loginPageTitle?: string;
	loginPageDescription?: string;
	privacyPolicyUrl?: string;
	termsOfServiceUrl?: string;
}

export function extractBrandingFields(raw: unknown): BrandingData | null {
	if (!raw || typeof raw !== 'object') return null;
	const data = (raw as Record<string, unknown>)?.branding || raw;
	const r = data as Record<string, unknown>;
	if (r.logo_url || r.logoUrl || r.primary_color || r.primaryColor) {
		return {
			primaryColor: (r.primary_color as string) || (r.primaryColor as string) || '',
			primaryColorDark:
				(r.primary_color_dark as string) || (r.primaryColorDark as string) || undefined,
			logoUrl: (r.logo_url as string) || (r.logoUrl as string) || '',
			faviconUrl: (r.favicon_url as string) || (r.faviconUrl as string) || '',
			customCss: (r.custom_css as string) || (r.customCss as string) || '',
			secondaryColor: (r.secondary_color as string) || (r.secondaryColor as string) || undefined,
			companyName: (r.company_name as string) || (r.companyName as string) || undefined,
			loginPageTitle: (r.login_page_title as string) || (r.loginPageTitle as string) || undefined,
			loginPageDescription:
				(r.login_page_description as string) || (r.loginPageDescription as string) || undefined,
			privacyPolicyUrl:
				(r.privacy_policy_url as string) || (r.privacyPolicyUrl as string) || undefined,
			termsOfServiceUrl:
				(r.terms_of_service_url as string) || (r.termsOfServiceUrl as string) || undefined,
		};
	}
	return null;
}
