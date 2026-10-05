// 用父目录自动识别系列：同一目录下的文章 = 一个系列。
// 系列名 = 目录名；系列内排序 = 文件名（README 置顶，数字前缀按数序，其余按字母）。
// 顶层文章（无父目录）不分组，侧边栏不显示。

import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";

/** 从 post id 取系列 slug（父目录名）。顶层文章返回 null。 */
export function getSeriesSlug(id: string): string | null {
	const segs = id.split("/");
	return segs.length > 1 ? segs[0]! : null;
}

// 排序键：readme 置顶 → 数字前缀（01- 02-）按数序 → 其余按字母
function sortKey(filename: string): [number, number, string] {
	const base = filename.toLowerCase();
	if (base === "readme") return [0, 0, base];
	const m = base.match(/^(\d+)[-_. ]/);
	if (m) return [1, Number(m[1]), base];
	return [2, 0, base];
}

function compareByFilename(
	a: CollectionEntry<"post">,
	b: CollectionEntry<"post">,
): number {
	const fa = a.id.split("/").pop()!;
	const fb = b.id.split("/").pop()!;
	const ka = sortKey(fa);
	const kb = sortKey(fb);
	for (let i = 0; i < 3; i++) {
		if (ka[i] < kb[i]) return -1;
		if (ka[i] > kb[i]) return 1;
	}
	return 0;
}

/** 取某系列下的所有文章，按文件名列序排序。 */
export async function getSeriesPosts(
	slug: string,
): Promise<CollectionEntry<"post">[]> {
	const all = await getCollection("post");
	return all.filter((p) => getSeriesSlug(p.id) === slug).sort(compareByFilename);
}

/** 系列标题：优先取首篇（通常 README）标题的前段，否则用目录名的友好形式。 */
export function seriesTitle(posts: CollectionEntry<"post">[], slug: string): string {
	const first = posts[0]?.data.title;
	if (first) {
		const cut = first.split(/[·：]/)[0]?.trim();
		if (cut) return cut;
	}
	return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
