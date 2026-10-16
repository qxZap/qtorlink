<p align="center">
  <img src="preview/splash.svg" alt="torlink, curated torrents straight from your terminal" style="max-width: 832px; width: 100%; height: auto;">
</p>

> **qtorlink** is a fork of [torlink](https://github.com/baairon/torlink) that adds one thing: sending torrents to your own [qBittorrent](https://www.qbittorrent.org/) over its Web UI. Press `a` on a search result, or `A` for the magnet on your clipboard, and it lands in qBittorrent, saved to the folder you choose. Jump to [Send to qBittorrent](#send-to-qbittorrent-qtorlink) for setup. Everything else below is torlink as you know it.

Finding a torrent these days sucks. One site is a minefield of fake download buttons. Another hides the real link under a popup that spawns two more tabs. And after all that, half the results are dead, zero seeders.

torlink is a torrent finder that lives in your terminal, with zero setup and nothing to configure. One search checks a short, curated list of reputable sources at once, and whatever you pick downloads straight to your computer. The files are yours, saved to your downloads folder.

## Get started

1. **Install Node** (from [nodejs.org](https://nodejs.org)), it's all torlink needs.
2. **Open your terminal.**
3. **Install qtorlink** (it isn't on npm, so it comes from GitHub):

   ```sh
   git clone https://github.com/qxZap/qtorlink.git
   cd qtorlink
   npm install
   npm run build
   npm link
   ```

4. **Start it**, from any folder:

   ```sh
   qtorlink
   ```

That's the only command you need from here on. torlink opens straight to a search bar: search for what you want, paste in a magnet link or a bare infohash, drag a `.torrent` file from your file manager onto the window, or just press Enter on an empty box to browse the curated library. From there it's all keypresses, nothing to memorize, and `?` brings up the full list anytime.

## Finding something

Type what you're looking for and press Enter. Results stream in from every source as they answer, tagged with size and how many people are sharing each one, so you can see what'll come down fast. Arrow to what you want and press `d` to save it, or `shift+d` to pick a different folder for just that download.

<p align="center">
  <img src="preview/browse.svg" alt="torlink's browse view: the sidebar, the search bar, and merged results from every source" style="max-width: 832px; width: 100%; height: auto;">
</p>

## Your downloads

Active downloads sit up top with their progress, speed, and time left; when one finishes it drops into Recently downloaded just below, so the list stays tidy. Everything's still there when you come back, and anything interrupted picks up where it left off.

Downloads run in the background while you keep searching, so you can queue up as many as you want. They save to your downloads folder, and the Downloads pane keeps tabs on each one; press `o` anytime to change where that is, or grab one result with `shift+d` to send it somewhere else without touching the default. When something finishes it keeps seeding automatically so the next person can find it too, and the Seeding tab lets you pause or stop that anytime.

<p align="center">
  <img src="preview/downloads.svg" alt="torlink's Downloads pane: live progress on top, recently downloaded below" style="max-width: 832px; width: 100%; height: auto;">
</p>

When a download comes with several videos or tracks, torlink drops a `playlist.m3u` into each folder holding more than one, so a course split into modules plays straight through in order. Run `qtorlink --no-playlist` if you'd rather it didn't.

## Send to qBittorrent (qtorlink)

qtorlink is a fork of [torlink](https://github.com/baairon/torlink) that can hand torrents to a running qBittorrent instead of downloading them itself. Everything torlink does still works the same way.

### Setup

1. In qBittorrent, enable **Tools → Options → Web UI** and note the port.
2. Copy `.env.example` to `.env` and fill it in:

   ```ini
   QBIT_URL=http://localhost:8666
   QBIT_USER=admin
   QBIT_PASS=admin123
   QBIT_SAVEPATH=E:/plex
   ```

| Setting | What it does | Default |
| --- | --- | --- |
| `QBIT_URL` | qBittorrent Web UI address | `http://localhost:8080` |
| `QBIT_USER` | Web UI username | none: skips login, which is fine when "Bypass authentication for clients on localhost" is ticked |
| `QBIT_PASS` | Web UI password | empty |
| `QBIT_SAVEPATH` | Folder qBittorrent saves into | qBittorrent's own default folder |

Each setting can come from four places. When the same one is set twice, the first in this list wins:

1. A flag: `--QBIT_SAVEPATH=E:/Games` (or `--qbit-savepath=E:/Games`)
2. Your shell environment
3. `.env` in the folder you run qtorlink from
4. `.env` in the folder you cloned qtorlink into

### Running it

```sh
npm install
npm run build
npm link                     # once: puts `qtorlink` on your PATH
qtorlink                     # open the TUI with your .env settings
qtorlink --QBIT_SAVEPATH=E:/Games          # this run saves to E:/Games instead
qtorlink --QBIT_URL=http://nas:8080 --QBIT_USER=me --QBIT_PASS=secret
```

Without `npm link`, run `npm run dev -- --QBIT_SAVEPATH=E:/Games` or `node dist/cli.cjs --QBIT_SAVEPATH=E:/Games` from the project folder. Note the `--` after `npm run dev`.

### Keys

| Key | Where | What |
| --- | --- | --- |
| `a` | search results / details | send the highlighted result to qBittorrent, or every result marked with space |
| `A` (shift+a) | anywhere | send the magnet on your clipboard to qBittorrent |

The top line of the app shows `Sent to qBittorrent: …`, or the reason it failed. A magnet you paste with `m` or type into the search box still downloads in torlink; use `A` to send it to qBittorrent.

### Without the TUI

```sh
qtorlink qbit "magnet:?xt=urn:btih:..."             # one or more magnets, then exit
qtorlink --QBIT_SAVEPATH=E:/Games qbit "magnet:?xt=..."
```

It exits 0 on success and 1 with an error message otherwise, so it works in scripts.

### Testing

- `npm test` runs the unit tests (`src/util/qbit.test.ts` covers this feature).
- For a live check, run `qtorlink qbit "<magnet>"` and the torrent should appear in qBittorrent under your `QBIT_SAVEPATH`.

## What it searches

A short, hand-picked list of trusted sources:

| Category | Sources |
| --- | --- |
| Games | FitGirl |
| Movies | YTS, The Pirate Bay, 1337x, BitTorrented |
| TV | EZTV, The Pirate Bay, 1337x, BitTorrented |
| Anime | Nyaa, SubsPlease |

Games are the only category that can run code, so they come from FitGirl alone, a repacker with a long, trusted track record; everything else is plain video and subtitles. If a source is down, the search carries on without it, and torlink tells you which one is offline.

## Headless

torlink also runs without the TUI, for servers and seedboxes:

    qtorlink search "<query>" [--category games|movies|tv|anime]
                            print one JSON document of merged search results
    qtorlink seed <path>    share files you already have
    qtorlink watch <dir>    download anything dropped into a folder
    qtorlink serve          take magnets over HTTP
    qtorlink files          stream finished downloads over HTTP
    qtorlink attach         keep the TUI alive across ssh sessions

Add `--daemon` to keep seed, watch, serve, or files running after you log out; `qtorlink --help` has the full list of modes and flags.

### Sharing something of your own

Everything else starts with a torrent someone else made. `seed` goes the other way:

    qtorlink seed ./album

It turns the folder into a torrent, saves `album.torrent` next to it, prints the magnet, and starts sharing right away. Send anyone the magnet and they pull the files from you.

`serve` takes a `.torrent` as well as a magnet, so you can hand it one you already have:

    POST /add {"magnet":"magnet:?xt=..."}
    POST /add {"torrent":"<base64>"}

Either can carry a `seedTime` for that one torrent, in the same grammar as `--seed-time` (`"30d"`, `"2h"`; `0` means never stop). It wins over the daemon-wide flag, so a box that normally drops seeds after a couple of hours can keep one release alive for a month. Change it later, or on something already downloading, through the control endpoint:

    POST /control {"id":"<info hash>","action":"seed-time","seedTime":"30d"}

`GET /downloads` reports the limit and when it falls due (`seedUntil`) on every torrent that has one.

## Contributing

To run or work on torlink locally:

1. Clone the repository and open the folder.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Run the development version:
   ```sh
   npm run dev
   ```
   Or build it and run the bundled version:
   ```sh
   npm run build
   node dist/cli.cjs
   ```

Before opening a PR, skim [CONTRIBUTING.md](CONTRIBUTING.md); it lays out the bar with examples from real merged PRs.

## Privacy

Your files stay on your disk, and nothing routes through a central server; torlink only talks to the torrent network directly. Once a download finishes it keeps seeding by default, sharing it back so the next person can find it just as easily. The network only works because people pass things along, and even a few minutes makes a real difference. If you'd rather not, opt out anytime: open the Seeding tab, press `p` to pause or stop any item, and press it again to pick it back up. Always your call.
