import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

console.log("Let's go!");

type RawEntry = {
	master_metadata_track_name?: string | null;
	master_metadata_album_artist_name?: string | null;
	skipped?: boolean | null;
};

type Song = { artist: string; song: string };

const INPUT_DIR = "./streaming-history";
const YEARS_JSON_DIR = "./years/json";
const YEARS_TS_DIR = "./years/ts";

const mkFile = (fileName: string, content: string) =>
	writeFile(fileName, `${content}\n`, "utf8");

const mkTsFile = (fileName: string, content: string) =>
	mkFile(fileName, `export default ${content};`);

const fileNameRegex = /^Streaming_History_Audio_(\d{4})(?:_(\d+))?\.json$/i;

const byYear = new Map<string, Song[]>();
const combined: Song[] = [];

async function main() {
	const filenames = (await readdir(INPUT_DIR))
		.filter((name) => fileNameRegex.test(name))
		.sort();
	const files = filenames
		.map((name) => {
			const match = name.match(fileNameRegex);
			if (!match) {
				console.warn(`Skipping unrecognized file: ${name}`);
				return null;
			}
			return { name, year: match[1] ?? "", part: Number(match[2] ?? 0) };
		})
		.filter((f): f is NonNullable<typeof f> => f !== null)
		// Sort by year, then by part (2021.json before 2021_1.json)
		.sort((a, b) => a.year.localeCompare(b.year) || a.part - b.part);

	for (const file of files) {
		const filePath = path.join(INPUT_DIR, file.name);
		const raw = await readFile(filePath, "utf8");
		const entries: RawEntry[] = JSON.parse(raw);

		const songs: Song[] = entries
			.filter(
				(e) =>
					e.skipped !== true &&
					e.master_metadata_track_name &&
					e.master_metadata_album_artist_name,
			)
			.map((e) => ({
				artist: e.master_metadata_album_artist_name as string,
				song: e.master_metadata_track_name as string,
			}));

		const existing = byYear.get(file.year) ?? [];
		existing.push(...songs);
		byYear.set(file.year, existing);

		console.log(`Read ${file.name}: ${songs.length} plays kept`);
	}

	await mkdir(YEARS_JSON_DIR, { recursive: true });
	await mkdir(YEARS_TS_DIR, { recursive: true });

	for (const [year, songs] of [...byYear.entries()].sort()) {
		const json = JSON.stringify(songs, null, 0);
		await mkFile(path.join(YEARS_JSON_DIR, `${year}.json`), json);
		await mkTsFile(path.join(YEARS_TS_DIR, `${year}.ts`), json);
		combined.push(...songs);
		console.log(`${year}: ${songs.length} songs`);
	}

	const combinedJson = JSON.stringify(combined, null, 0);
	await mkFile("./combined.json", combinedJson);
	await mkTsFile("./combined.ts", combinedJson);

	console.log(`Done. ${byYear.size} years, ${combined.length} total plays.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
