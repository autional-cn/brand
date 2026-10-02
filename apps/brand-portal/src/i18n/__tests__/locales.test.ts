import { describe, it, expect } from 'vitest';
import zh from '../locales/zh-CN.json';
import en from '../locales/en-US.json';

type JsonObject = Record<string, unknown>;

function leafEntries(obj: JsonObject, prefix = ''): Array<[string, string]> {
	return Object.entries(obj).flatMap(([key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key;
		return value !== null && typeof value === 'object' && !Array.isArray(value)
			? leafEntries(value as JsonObject, path)
			: ([[path, String(value)]] as Array<[string, string]>);
	});
}

function placeholders(text: string): string[] {
	return [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();
}

const zhEntries = new Map(leafEntries(zh as JsonObject));
const enEntries = new Map(leafEntries(en as JsonObject));

describe('locales 一致性', () => {
	it('zh-CN 与 en-US 键集合完全一致', () => {
		expect([...zhEntries.keys()].sort()).toEqual([...enEntries.keys()].sort());
	});

	it('同键的插值占位符一致', () => {
		for (const [key, zhText] of zhEntries) {
			const enText = enEntries.get(key);
			if (enText !== undefined) {
				expect(placeholders(zhText), `key: ${key}`).toEqual(placeholders(enText));
			}
		}
	});
});
