import path from "node:path";
import type { Song, TalliedSong } from "./types.ts";
import {
	getFileNames,
	mkArtistsFileSet,
	mkFileSet,
	readJSON,
	tally,
} from "./utils.ts";

const YEARS_DIR = "./years";
const OUT_DIR = "./stats";

const fileNameRegex = /^(\d{4})\.json$/i;

async function main() {
	const fileNames = await getFileNames(YEARS_DIR, fileNameRegex);
	for (const file of fileNames) {
		const year = path.basename(file, ".json");
		const songs: Song[] = await readJSON(path.join(YEARS_DIR, file));
		const tallied: TalliedSong[] = tally(songs);
		await mkFileSet(`${OUT_DIR}/${year}`, year, tallied);
		console.log(
			`${year}: ${songs.length} plays -> ${tallied.length} unique songs`,
		);
	}
	await mkCombinedAndArtists();
}

async function mkCombinedAndArtists() {
	const combinedSongs: Song[] = await readJSON("./combined/combined.json");
	const combinedTallied: TalliedSong[] = tally(combinedSongs);
	await mkFileSet(`${OUT_DIR}/combined`, "combined", combinedTallied);
	console.log(
		`combined: ${combinedSongs.length} plays -> ${combinedTallied.length} unique songs`,
	);
	await mkArtistsFileSet(OUT_DIR, combinedTallied);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
