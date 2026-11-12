import songs from "./stats/combined.ts";
import { mkArtistsFileSet } from "./utils.ts";

const OUT_DIR = "./stats";

async function main() {
	await mkArtistsFileSet(OUT_DIR, songs);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
