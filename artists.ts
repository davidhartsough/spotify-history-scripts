import { writeFile } from "node:fs/promises";
import songs from "./stats/combined.ts";

type ArtistCount = { artist: string; count: number };

const OUT_DIR = "./stats";

const escapeCsv = (value: string | number): string => {
	const str = String(value);
	return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const totals = new Map<string, number>();

for (const { artist, count } of songs) {
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
	await mkFile(`${OUT_DIR}/artists.json`, json);
	await mkFile(`${OUT_DIR}/artists.ts`, `export default ${json};`);
	await mkFile(`${OUT_DIR}/artists.csv`, csv);

	console.log(
		`Wrote ${artists.length} artists to ${OUT_DIR}/artists.{json,ts,csv}`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
