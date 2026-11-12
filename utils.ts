import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import type { ArtistCount, JsonArr, Song, TalliedSong } from "./types.ts";

export async function mkFile(fileName: string, content: string) {
	await writeFile(fileName, `${content}\n`, "utf8");
	console.log(`Wrote ${fileName}`);
}
export async function mkTsFile(fileName: string, content: string) {
	await mkFile(fileName, `export default ${content};`);
}

export function escapeCSV(value: string | number): string {
	const str = String(value);
	return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function readJSON(filePath: string) {
	return JSON.parse(await readFile(filePath, "utf8"));
}

export async function ensureDir(path: string) {
	await mkdir(path, { recursive: true });
}

export function toCSV(arr: JsonArr): string {
	const first = arr[0];
	if (!first) return "";
	const keys = Object.keys(first);
	const header = keys.join(",");
	const rows = arr
		.map((o) =>
			keys
				.map((k) => {
					const v = o[k];
					return v ? escapeCSV(v) : "";
				})
				.join(","),
		)
		.join("\n");
	return `${header}\n${rows}`;
}

export async function mkFileSet(dir: string, title: string, data: JsonArr) {
	const json = JSON.stringify(data, null, 0);
	const csv = toCSV(data);
	await ensureDir(dir);
	await ensureDir(`${dir}/json`);
	await ensureDir(`${dir}/ts`);
	await ensureDir(`${dir}/csv`);
	await mkFile(`${dir}/json/${title}.json`, json);
	await mkTsFile(`${dir}/ts/${title}.ts`, json);
	await mkFile(`${dir}/csv/${title}.csv`, csv);
}

export async function mkArtistsFileSet(dir: string, songs: TalliedSong[]) {
	const totals = new Map<string, number>();
	for (const { artist, count } of songs) {
		totals.set(artist, (totals.get(artist) ?? 0) + count);
	}
	const artists: ArtistCount[] = [...totals.entries()]
		.map(([artist, count]) => ({ artist, count }))
		.sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));
	const outputDir = `${dir}/artists`;
	await mkFileSet(outputDir, "artists", artists);
	console.log(`Wrote ${artists.length} artists to ${outputDir}/`);
}

export async function getFileNames(dir: string, regex: RegExp) {
	return (await readdir(dir, { recursive: true }))
		.filter((name) => regex.test(name))
		.sort();
}

export function tally(songs: Song[]): TalliedSong[] {
	const map = new Map<string, TalliedSong>();

	for (const { artist, song } of songs) {
		const key = `${artist}\u0000${song}`;
		const existing = map.get(key);
		if (existing) {
			existing.count++;
		} else {
			map.set(key, { artist, song, count: 1 });
		}
	}

	return [...map.values()].sort(
		(a, b) =>
			b.count - a.count ||
			a.artist.localeCompare(b.artist) ||
			a.song.localeCompare(b.song),
	);
}
