# Spotify History Scripts

First, go to: https://www.spotify.com/us/account/privacy/

And request a copy of your personal data.
Request "your extended streaming history for the lifetime of your account" and wait for an email from Spotify.

After you download the data, unzip it.

Put all your streaming history JSON files into `./streaming-history/`

- `streaming-history/Streaming_History_Audio_2015.json`
- `streaming-history/Streaming_History_Audio_2016.json`
- `streaming-history/Streaming_History_Audio_2017.json`
- `streaming-history/Streaming_History_Audio_2017_1.json`
- `streaming-history/Streaming_History_Audio_2018.json`

and so on.

Install the dependencies (with whichever package manager you like: npm, pnpm, yarn, etc).

Then run the following scripts:

1. `tsx build.ts`
2. `tsx tally.ts`
3. `tsx csv.ts`
4. `tsx artists.ts`
5. `tsx this-year.ts`
