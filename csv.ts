import { writeFile } from "node:fs/promises";
import songs from "./stats/combined.ts";

const OUTPUT = "./stats/combined.csv";

const escapeCsv = (value: string | number): string => {
	const str = String(value);
	return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const rows = [
	"artist,song,count",
	...songs.map((s) => [s.artist, s.song, s.count].map(escapeCsv).join(",")),
].join("\n");

async function main() {
	await writeFile(OUTPUT, `${rows}\n`);
	console.log(`Wrote ${songs.length} rows to ${OUTPUT}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
