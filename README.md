# PSL video player - demo

A demo for developers, not production code. It shows player layout and UX options for the psl.org.pk video player (Pakistan Sign Language dictionary, stories and lessons).

The player uses the native `<video>` tag with about 300 lines of plain JS and CSS. It has no library, no build step and no gradient.

## Run

Open `index.html` in a browser. No build step is needed.

The camera practice demo (option 6 in `sign-ux.html`) needs a local server or HTTPS:

```sh
npx serve .
# or
python -m http.server 8000
```

## Files

| File | What it is |
|---|---|
| `index.html` | Layout options A-F: native controls without the gradient, bars below the video, overlay without gradient, learn mode |
| `sign-ux.html` | Sign-language UX options 1-6, a review summary of 14 sign-language sites, and a WCAG 2.2 checklist |
| `psl-player.js` | Player script. Exposes `PslPlayer.init(el)` and `PslPlayer.initAll()` |
| `psl-player.css` | Player styles and layout themes |

## Why controls below the video

An overlay control bar covers the lower part of the video, where the signer's hands are. Controls below the video keep the full sign visible. They also give stable contrast for icons, because the icons are on a solid bar and not on the video (WCAG 1.4.11).

## Usage

```html
<link rel="stylesheet" href="psl-player.css">

<div class="psl-player psl--learn" data-layout="learn" data-persist-speed>
  <video src="sign.mp4" poster="sign.jpg" muted autoplay loop preload="metadata">
    <track kind="captions" src="sign-en.vtt" srclang="en" label="English">
  </video>
</div>

<script src="psl-player.js"></script>
<script>PslPlayer.initAll();</script>
```

### Attributes on `.psl-player`

| Attribute | Effect |
|---|---|
| `data-layout` | Preset: `bar`, `stacked`, `seam`, `overlay`, `learn`. Add the matching `psl--<name>` class. |
| `data-controls` | Custom control order. Separate rows with `\|` and controls with `,`. Example: `seek\|play,replay,spacer,loop,mirror,fs\|speeds` |
| `data-speeds` | Values for the speed buttons. Default `0.25,0.5,0.75,1` |
| `data-persist-speed` | Saves the chosen speed in localStorage and uses it for every player that has this attribute |

### Control names

`play`, `replay`, `back` (back 2s), `frameprev`, `framenext`, `seek`, `time`, `duration`, `timeboth`, `mute`, `volume`, `speed` (cycle button), `speeds` (button group), `loop`, `mirror`, `cc`, `pip`, `fs`, `download`, `spacer`.

The player removes `pip` when the browser does not support picture-in-picture. It removes `cc` when the video has no `<track>`.

### Theming

Set CSS variables on `.psl-player`: `--psl-accent`, `--psl-bar-bg`, `--psl-fg`, `--psl-fg-muted`, `--psl-track`, `--psl-btn` (button size).

### JS API

`PslPlayer.init(el)` returns `{ video, setRate(rate, quiet), toggleLoop(), toggleMirror(), badge(text) }`. The same object is also available as `el._psl`. The player sends a `psl:rate` event when the speed changes.

### Keyboard (when the player has focus)

| Key | Action |
|---|---|
| `Space`, `K` | Play / pause |
| `Left`, `Right` | Seek 5s |
| `J` | Back 2s |
| `,` `.` | Previous / next frame (pauses) |
| `<` `>` | Slower / faster |
| `Home`, `End` | Start / end |
| `L` | Loop |
| `R` | Mirror |
| `C` | Captions (cycles through tracks) |
| `M` | Mute |
| `F` | Fullscreen |

## Behaviour notes

- **Autoplay** works only with `muted`. Without `muted`, as on the current psl.org.pk word page, browsers block it.
- **Reduced motion:** when the user's system has reduce motion set, the player turns off autoplay. The grid previews do not play.
- **Fullscreen** uses the wrapper element, so the control bar stays below the video. On iOS Safari it uses the native video fullscreen.
- **Speed** sets both `defaultPlaybackRate` and `playbackRate`, so the speed stays the same when `src` changes.
- **Badge:** each change to speed, loop, mirror or captions shows a short badge at the top of the video. It is visual feedback, with no sound.

## Mirror - use with caution

Mirror uses `transform: scaleX(-1)` on the video, so it also reverses any text burned into the video. PSL clips have burned-in text (the word label in English and Urdu, and the logo).

- Keep mirror off by default. The badge warns when it is on.
- Think about showing mirror only in a practice mode.
- For new recordings, export a version without text and show the label as HTML beside the video. Then only the signer is mirrored.

## Demo content

- Video clips link directly to the PSL CloudFront CDN.
- Some text is sample text written for the demo, not PSL content:
  - the Urdu and Roman Urdu titles for every colour except "black"
  - all caption and transcript lines
- The "signer" tabs in option 2 use other colour clips as stand-ins.
- The download button opens cross-origin files in a new page, because browsers ignore `download` across origins. To save the file directly, serve it from the same origin or send `Content-Disposition: attachment`.

## Video.js

- **Video.js 10** (current): the default skin renders in shadow DOM, so your own CSS cannot move its controls below the video. You must copy the skin into the page ("eject" it) and change it there.
- **Video.js 8** (legacy, maintained until October 2028): the control bar is flat and you can restyle it with CSS. The bar sits on the video by default.

This demo shows that plain JS on the native tag gives the same control without a library. Change to a library only if you need HLS or DASH streaming, ads or analytics plugins.
