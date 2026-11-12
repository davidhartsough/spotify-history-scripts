export type Song = { artist: string; song: string };

export type TalliedSong = Song & { count: number };

export type ArtistCount = { artist: string; count: number };

export type RawEntry = {
	master_metadata_track_name?: string | null;
	master_metadata_album_artist_name?: string | null;
	skipped?: boolean | null;
};

export type RawDataEntry = {
	artistName: string;
	trackName: string;
	msPlayed: number;
};

export type JsonArr = Record<string, string | number>[];
