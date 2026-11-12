import path from "node:path";
import type { RawEntry, Song } from "./types.ts";
import { getFileNames, mkFileSet, readJSON } from "./utils.ts";

const INPUT_DIR = "./streaming-history";
const YEARS_DIR = "./years";
const COMBINED_DIR = "./combined";

const fileNameRegex = /^Streaming_History_Audio_(\d{4})(?:_(\d+))?\.json$/i;

const byYear = new Map<string, Song[]>();
const combined: Song[] = [];

async function main() {
	const fileNames = await getFileNames(INPUT_DIR, fileNameRegex);
	const files = fileNames
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
		const entries: RawEntry[] = await readJSON(filePath);

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

	for (const [year, songs] of [...byYear.entries()].sort()) {
		await mkFileSet(`${YEARS_DIR}/${year}`, year, songs);
		combined.push(...songs);
		console.log(`${year}: ${songs.length} songs`);
	}

	await mkFileSet(COMBINED_DIR, "combined", combined);

	console.log(`Done. ${byYear.size} years, ${combined.length} total plays.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
