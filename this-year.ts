import { mkdir, writeFile } from "node:fs/promises";
import stats from "./stats/years/ts/2026.ts";

type ArtistCount = { artist: string; count: number };

const CSV_OUTPUT_DIR = "./stats/artists/csv";
const JSON_OUTPUT_DIR = "./stats/artists/json";

const escapeCsv = (value: string | number): string => {
	const str = String(value);
	return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const totals = new Map<string, number>();

for (const { artist, count } of stats) {
	totals.set(artist, (totals.get(artist) ?? 0) + count);
}

const artists: ArtistCount[] = [...totals.entries()]
	.map(([artist, count]) => ({ artist, count }))
	.sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));

const csv = [
	"artist,count",
	...artists.map((a) => [a.artist, a.count].map(escapeCsv).join(",")),
].join("\n");

const json = JSON.stringify(artists, null, 0);

const mkFile = (fileName: string, content: string) =>
	writeFile(fileName, `${content}\n`, "utf8");

async function main() {
	await mkdir(CSV_OUTPUT_DIR, { recursive: true });
	await mkdir(JSON_OUTPUT_DIR, { recursive: true });
	await mkFile(`${JSON_OUTPUT_DIR}/2026-artists.json`, json);
	await mkFile(`${CSV_OUTPUT_DIR}/2026-artists.csv`, csv);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
