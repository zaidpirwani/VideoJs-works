// PSL player - custom controls on a native <video>. No library.
// Usage: <div class="psl-player psl--bar" data-layout="bar"><video src="..."></video></div>
//        PslPlayer.initAll();

(function () {
  const svg = (cls, d) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const ICON = {
    play: svg('ico-play', 'M8 5v14l11-7z'),
    pause: svg('ico-pause', 'M6 5h4v14H6zm8 0h4v14h-4z'),
    replay: svg('ico-replay', 'M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z'),
    vol: svg('ico-vol', 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23z'),
    muted: svg('ico-muted', 'M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45c.03-.2.05-.41.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 0 0 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z'),
    fsEnter: svg('ico-fs-enter', 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'),
    fsExit: svg('ico-fs-exit', 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z'),
    pip: svg('', 'M19 11h-8v6h8v-6zm4 8V5a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2zm-2 0H3V5h18v14z'),
    loop: svg('', 'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'),
    mirror: svg('', 'M11 2h2v20h-2zM3 6l6 6-6 6zm18 0v12l-6-6z'),
    back: svg('', 'M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z'),
    restart: svg('', 'M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z'),
    framePrev: svg('', 'M6 6h2v12H6zm3.5 6 8.5 6V6z'),
    frameNext: svg('', 'M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z'),
    download: svg('', 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'),
    cc: svg('', 'M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1z'),
  };

  // Rows of control tokens per layout
  const LAYOUTS = {
    bar: [['play', 'time', 'seek', 'duration', 'mute', 'volume', 'speed', 'loop', 'pip', 'fs']],
    stacked: [['seek'], ['play', 'back', 'mute', 'volume', 'timeboth', 'spacer', 'speed', 'loop', 'mirror', 'cc', 'fs']],
    seam: [['seek', 'play', 'timeboth', 'spacer', 'mute', 'volume', 'speed', 'fs']],
    overlay: [['seek'], ['play', 'mute', 'volume', 'timeboth', 'spacer', 'speed', 'pip', 'fs']],
    learn: [['seek'], ['play', 'back', 'timeboth', 'spacer', 'mute', 'cc', 'fs'], ['speeds', 'spacer', 'loop', 'mirror']],
  };

  const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];
  const RATE_KEY = 'psl-rate';
  const store = {
    get() { try { return parseFloat(localStorage.getItem(RATE_KEY)); } catch (e) { return NaN; } },
    set(v) { try { localStorage.setItem(RATE_KEY, String(v)); } catch (e) { /* storage blocked */ } },
  };

  const fmt = (t) => {
    if (!isFinite(t)) t = 0;
    const s = Math.floor(t % 60), m = Math.floor(t / 60) % 60, h = Math.floor(t / 3600);
    const ss = String(s).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
  };

  const btn = (cls, label, inner, extra = '') =>
    `<button type="button" class="psl-btn ${cls}" aria-label="${label}" title="${label}" ${extra}>${inner}</button>`;

  const slider = (cls, label) =>
    `<div class="psl-slider ${cls}" role="slider" tabindex="0" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="psl-slider-track"><div class="psl-slider-buffer"></div><div class="psl-slider-fill"></div></div>
      <div class="psl-slider-thumb"></div>${cls === 'psl-seek' ? '<div class="psl-tip">0:00</div>' : ''}
    </div>`;

  const TOKENS = {
    play: () => btn('psl-play', 'Play (k)', ICON.play + ICON.pause + ICON.replay),
    back: () => btn('psl-back', 'Back 2 seconds (j)', ICON.back),
    mute: () => btn('psl-mute', 'Mute (m)', ICON.vol + ICON.muted),
    volume: () => slider('psl-volume', 'Volume'),
    seek: () => slider('psl-seek', 'Seek'),
    time: () => '<span class="psl-time"><b class="psl-cur">0:00</b></span>',
    duration: () => '<span class="psl-time psl-dur">0:00</span>',
    timeboth: () => '<span class="psl-time"><b class="psl-cur">0:00</b> / <span class="psl-dur">0:00</span></span>',
    speed: () => btn('psl-btn--text psl-speed', 'Playback speed', '1x'),
    speeds: (o) => `<div class="psl-chips" role="group" aria-label="Speed">${o.chips.map((s) =>
      `<button type="button" class="psl-chip" data-rate="${s}" aria-pressed="${s === 1}">${s}x</button>`).join('')}</div>`,
    replay: () => btn('psl-restart', 'Replay from start', ICON.restart),
    frameprev: () => btn('psl-fprev', 'Previous frame (,)', ICON.framePrev),
    framenext: () => btn('psl-fnext', 'Next frame (.)', ICON.frameNext),
    download: () => '<a class="psl-btn psl-download" aria-label="Download video" title="Download video" download>' + ICON.download + '</a>',
    loop: () => btn('psl-loop', 'Loop (l)', ICON.loop, 'aria-pressed="false"'),
    mirror: () => btn('psl-mirror', 'Mirror video (r)', ICON.mirror, 'aria-pressed="false"'),
    cc: () => btn('psl-cc', 'Captions (c)', ICON.cc, 'aria-pressed="false"'),
    pip: () => btn('psl-pip', 'Picture in picture', ICON.pip),
    fs: () => btn('psl-fs', 'Fullscreen (f)', ICON.fsEnter + ICON.fsExit),
    spacer: () => '<span class="psl-spacer"></span>',
  };

  function init(root) {
    if (root._psl) return root._psl;
    const video = root.querySelector('video');
    // data-controls="seek|play,replay,spacer,fs" overrides the preset layout
    const layout = root.dataset.controls
      ? root.dataset.controls.split('|').map((r) => r.split(',').map((t) => t.trim()))
      : LAYOUTS[root.dataset.layout] || LAYOUTS.bar;
    const opts = { chips: (root.dataset.speeds || '0.25,0.5,0.75,1').split(',').map(Number) };
    const persist = root.hasAttribute('data-persist-speed');
    video.removeAttribute('controls');
    video.setAttribute('playsinline', '');
    if (video.autoplay && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.autoplay = false;
      video.pause();
    }

    const stage = document.createElement('div');
    stage.className = 'psl-stage';
    video.replaceWith(stage);
    stage.append(video);
    stage.insertAdjacentHTML('beforeend', btn('psl-bigplay', 'Play', ICON.play).replace('psl-btn ', '') +
      '<div class="psl-badge" aria-live="polite"></div>');

    const controls = document.createElement('div');
    controls.className = 'psl-controls';
    controls.innerHTML = layout.map((row) => `<div class="psl-row">${row.map((t) => TOKENS[t](opts)).join('')}</div>`).join('');
    // overlay keeps controls inside the stage area
    (root.dataset.layout === 'overlay' ? stage : root).append(controls);
    root.tabIndex = 0;

    const $ = (s) => root.querySelector(s);
    const $$ = (s) => root.querySelectorAll(s);
    const seek = $('.psl-seek'), vol = $('.psl-volume'), tip = $('.psl-tip');
    const set = (cls, on) => root.classList.toggle(cls, !!on);

    // Visual confirmation for every state change (no reliance on sound)
    const badgeEl = $('.psl-badge');
    let badgeTimer;
    const badge = (text) => {
      badgeEl.textContent = text;
      badgeEl.classList.add('is-on');
      clearTimeout(badgeTimer);
      badgeTimer = setTimeout(() => badgeEl.classList.remove('is-on'), 900);
    };

    const togglePlay = () => (video.paused || video.ended ? video.play() : video.pause());
    const setRate = (r, quiet) => {
      video.defaultPlaybackRate = r; // survives src changes
      video.playbackRate = r;
      $$('.psl-speed').forEach((b) => (b.textContent = r + 'x'));
      $$('.psl-chip').forEach((c) => c.setAttribute('aria-pressed', String(+c.dataset.rate === r)));
      if (persist) store.set(r);
      if (!quiet) badge(`Speed ${r}x`);
      root.dispatchEvent(new CustomEvent('psl:rate', { detail: r }));
    };
    const press = (sel, on) => $$(sel).forEach((b) => b.setAttribute('aria-pressed', String(on)));
    const toggleLoop = () => { video.loop = !video.loop; press('.psl-loop', video.loop); badge(video.loop ? 'Loop on' : 'Loop off'); };
    const toggleMirror = () => {
      const on = !root.classList.contains('is-mirror');
      set('is-mirror', on);
      press('.psl-mirror', on);
      badge(on ? 'Mirror on' : 'Mirror off');
    };
    // Cycles: off -> track 1 -> track 2 -> ... -> off
    const toggleCC = () => {
      const tracks = [...video.textTracks];
      if (!tracks.length) return;
      const cur = tracks.findIndex((t) => t.mode === 'showing');
      tracks.forEach((t) => (t.mode = 'disabled'));
      const next = cur + 1 < tracks.length ? tracks[cur + 1] : null;
      if (next) next.mode = 'showing';
      press('.psl-cc', !!next);
      badge(next ? `Captions: ${next.label || next.language}` : 'Captions off');
    };
    const frame = (dir) => { video.pause(); video.currentTime = Math.max(0, video.currentTime + dir / 30); };
    const restart = () => { video.currentTime = 0; video.play(); };
    const stepBack = () => { video.currentTime = Math.max(0, video.currentTime - 2); };
    const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
    const toggleFs = () => {
      if (fsEl()) return (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      if (root.requestFullscreen) return root.requestFullscreen();
      if (root.webkitRequestFullscreen) return root.webkitRequestFullscreen();
      if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iOS Safari
    };

    // Generic pointer-driven slider; onSet gets ratio 0..1
    function bindSlider(el, onSet, onHover, step) {
      if (!el) return;
      const ratio = (e) => {
        const r = el.getBoundingClientRect();
        return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      };
      el.addEventListener('pointerdown', (e) => {
        el.setPointerCapture(e.pointerId);
        el.classList.add('is-drag');
        onSet(ratio(e));
      });
      el.addEventListener('pointermove', (e) => {
        if (onHover) onHover(ratio(e), e);
        if (el.classList.contains('is-drag')) onSet(ratio(e));
      });
      const end = () => el.classList.remove('is-drag');
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
      el.addEventListener('keydown', (e) => {
        const cur = +el.getAttribute('aria-valuenow') / 100;
        const d = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step }[e.key];
        if (d === undefined) return;
        e.preventDefault();
        e.stopPropagation();
        onSet(Math.min(1, Math.max(0, cur + d)));
      });
    }

    const paint = (el, p, b) => {
      if (!el) return;
      el.style.setProperty('--p', p * 100 + '%');
      if (b !== undefined) el.style.setProperty('--b', b * 100 + '%');
      el.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    };

    bindSlider(seek, (r) => { if (video.duration) video.currentTime = r * video.duration; }, (r, e) => {
      if (!tip || !video.duration) return;
      tip.textContent = fmt(r * video.duration);
      tip.style.left = e.clientX - seek.getBoundingClientRect().left + 'px';
    }, 0.02);
    bindSlider(vol, (r) => { video.volume = r; video.muted = r === 0; }, null, 0.1);

    const onTime = () => {
      const d = video.duration || 0;
      $$('.psl-cur').forEach((n) => (n.textContent = fmt(video.currentTime)));
      let b = 0;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= video.currentTime) b = video.buffered.end(i);
      }
      paint(seek, d ? video.currentTime / d : 0, d ? b / d : 0);
      if (seek) seek.setAttribute('aria-valuetext', `${fmt(video.currentTime)} of ${fmt(d)}`);
    };
    const onVol = () => {
      set('is-muted', video.muted || video.volume === 0);
      paint(vol, video.muted ? 0 : video.volume);
    };
    const onState = () => {
      set('is-playing', !video.paused && !video.ended);
      set('is-ended', video.ended);
      if (!video.paused) set('is-started', true);
    };

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('progress', onTime);
    video.addEventListener('loadedmetadata', () => {
      $$('.psl-dur').forEach((n) => (n.textContent = fmt(video.duration)));
      $$('.psl-download').forEach((a) => (a.href = video.currentSrc));
      onTime();
    });
    video.addEventListener('volumechange', onVol);
    ['play', 'pause', 'ended', 'playing'].forEach((ev) => video.addEventListener(ev, onState));
    document.addEventListener('fullscreenchange', () => set('is-fullscreen', fsEl() === root));
    document.addEventListener('webkitfullscreenchange', () => set('is-fullscreen', fsEl() === root));

    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) {
        if (e.target === video) togglePlay();
        return;
      }
      if (b.matches('.psl-play, .psl-bigplay')) togglePlay();
      else if (b.matches('.psl-mute')) video.muted = !video.muted;
      else if (b.matches('.psl-speed')) setRate(SPEEDS[(SPEEDS.indexOf(video.playbackRate) + 1) % SPEEDS.length]);
      else if (b.matches('.psl-chip')) setRate(+b.dataset.rate);
      else if (b.matches('.psl-loop')) toggleLoop();
      else if (b.matches('.psl-mirror')) toggleMirror();
      else if (b.matches('.psl-cc')) toggleCC();
      else if (b.matches('.psl-back')) stepBack();
      else if (b.matches('.psl-restart')) restart();
      else if (b.matches('.psl-fprev')) frame(-1);
      else if (b.matches('.psl-fnext')) frame(1);
      else if (b.matches('.psl-pip')) {
        if (document.pictureInPictureElement) document.exitPictureInPicture();
        else if (video.requestPictureInPicture) video.requestPictureInPicture();
      } else if (b.matches('.psl-fs')) toggleFs();
    });
    video.addEventListener('dblclick', toggleFs);

    root.addEventListener('keydown', (e) => {
      if (e.target.closest('button') && (e.key === ' ' || e.key === 'Enter')) return;
      const k = e.key.toLowerCase();
      const map = {
        ' ': togglePlay, k: togglePlay, m: () => (video.muted = !video.muted), f: toggleFs,
        l: toggleLoop, r: toggleMirror, c: toggleCC, j: stepBack,
        arrowleft: () => (video.currentTime -= 5), arrowright: () => (video.currentTime += 5),
        ',': () => frame(-1), '.': () => frame(1),
        home: () => (video.currentTime = 0), end: () => (video.currentTime = video.duration || 0),
        '<': () => setRate(SPEEDS[Math.max(0, SPEEDS.indexOf(video.playbackRate) - 1)]),
        '>': () => setRate(SPEEDS[Math.min(SPEEDS.length - 1, SPEEDS.indexOf(video.playbackRate) + 1)]),
      };
      if (map[k]) { e.preventDefault(); map[k](); }
    });

    // Idle state for auto-hiding overlay controls
    let idleTimer;
    const wake = () => {
      set('is-idle', false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => set('is-idle', true), 2500);
    };
    root.addEventListener('pointermove', wake);
    root.addEventListener('keydown', wake);
    root.addEventListener('pointerleave', () => set('is-idle', true));

    if (!document.pictureInPictureEnabled) $$('.psl-pip').forEach((b) => b.remove());
    if (!video.textTracks.length) $$('.psl-cc').forEach((b) => b.remove());
    const saved = persist ? store.get() : NaN;
    setRate(SPEEDS.includes(saved) ? saved : 1, true);
    press('.psl-loop', video.loop);
    onVol();
    onState();
    if (video.readyState >= 1) video.dispatchEvent(new Event('loadedmetadata'));

    return (root._psl = { video, setRate, toggleLoop, toggleMirror, badge });
  }

  window.PslPlayer = { init, initAll: (sel = '.psl-player') => document.querySelectorAll(sel).forEach(init) };
})();
