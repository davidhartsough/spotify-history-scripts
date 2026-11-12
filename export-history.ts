import path from "node:path";
import type { RawDataEntry, Song, TalliedSong } from "./types.ts";
import {
	getFileNames,
	mkArtistsFileSet,
	mkFileSet,
	readJSON,
	tally,
} from "./utils.ts";

/*
account-data/StreamingHistory_music_0.json
account-data/StreamingHistory_music_1.json
RawDataEntry[]
*/

const INPUT_DIR = "./account-data";
const OUTPUT_DIR = "./stats/music";
const fileNameRegex = /^StreamingHistory_music_(\d+)\.json$/i;

async function main() {
	const fileNames = await getFileNames(INPUT_DIR, fileNameRegex);
	console.log(`Found ${fileNames.length} files: \n${fileNames.join("\n")}`);
	const combined: Song[] = [];
	for (const fileName of fileNames) {
		const filePath = path.join(INPUT_DIR, fileName);
		const entries: RawDataEntry[] = await readJSON(filePath);
		const songs: Song[] = entries
			.filter(({ msPlayed }) => msPlayed > 10000)
			.map(({ artistName, trackName }) => ({
				artist: artistName,
				song: trackName,
			}));
		combined.push(...songs);
	}
	const tallied: TalliedSong[] = tally(combined);
	await mkFileSet(OUTPUT_DIR, "music", tallied);
	await mkArtistsFileSet(OUTPUT_DIR, tallied);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
