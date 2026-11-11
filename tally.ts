import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Song = { artist: string; song: string };
type TalliedSong = Song & { count: number };

const YEARS_JSON_DIR = "./years/json";
const COMBINED_JSON = "./combined.json";

const OUT_DIR = "./stats";
const OUT_YEARS_JSON_DIR = path.join(OUT_DIR, "years/json");
const OUT_YEARS_TS_DIR = path.join(OUT_DIR, "years/ts");

function tally(songs: Song[]): TalliedSong[] {
	const map = new Map<string, TalliedSong>();

	for (const { artist, song } of songs) {
		const key = `${artist}\u0000${song}`; // same title by a different artist stays separate
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

const readSongs = async (file: string): Promise<Song[]> =>
	JSON.parse(await readFile(file, "utf8"));

async function writeBoth(
	jsonPath: string,
	tsPath: string,
	songs: TalliedSong[],
) {
	const json = JSON.stringify(songs, null, 0);
	await writeFile(jsonPath, `${json}\n`);
	await writeFile(tsPath, `export default ${json};\n`);
}

async function main() {
	await mkdir(OUT_YEARS_JSON_DIR, { recursive: true });
	await mkdir(OUT_YEARS_TS_DIR, { recursive: true });

	// Per-year
	const yearFiles = (await readdir(YEARS_JSON_DIR))
		.filter((f) => f.endsWith(".json"))
		.sort();

	for (const file of yearFiles) {
		const year = path.basename(file, ".json");
		const songs = await readSongs(path.join(YEARS_JSON_DIR, file));
		const tallied = tally(songs);

		await writeBoth(
			path.join(OUT_YEARS_JSON_DIR, `${year}.json`),
			path.join(OUT_YEARS_TS_DIR, `${year}.ts`),
			tallied,
		);
		console.log(
			`${year}: ${songs.length} plays -> ${tallied.length} unique songs`,
		);
	}

	// Combined
	const combinedSongs = await readSongs(COMBINED_JSON);
	const combinedTallied = tally(combinedSongs);

	await writeBoth(
		path.join(OUT_DIR, "combined.json"),
		path.join(OUT_DIR, "combined.ts"),
		combinedTallied,
	);
	console.log(
		`combined: ${combinedSongs.length} plays -> ${combinedTallied.length} unique songs`,
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
