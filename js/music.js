(() => {
  "use strict";

  const PREF_ENABLED = "bigear_music_enabled"; // "1" = enabled
  const PREF_VOLUME = "bigear_music_volume"; // "0.0~1.0"
  const PREF_ORDER = "bigear_music_order";
  const PREF_CURRENT = "bigear_music_current";

  const basePath = "/public/assest/";
  const manifestUrl = `${basePath}playlist.json`;

  const audio = new Audio();
  audio.preload = "auto";

  const state = {
    list: [],
    index: 0,
    enabled: true,
    volume: 0.6,
    ready: false,
    pendingPlay: false,
    listeners: []
  };

  function safeGet(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      if (v === null || v === undefined || v === "") return fallback;
      return v;
    } catch {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {}
  }

  function notify() {
    const snapshot = getState();
    state.listeners.forEach((fn) => {
      try { fn(snapshot); } catch {}
    });
  }

  function getState() {
    return {
      list: state.list.slice(),
      index: state.index,
      enabled: state.enabled,
      volume: state.volume,
      ready: state.ready,
      current: state.list[state.index] || null
    };
  }

  function isAudioFile(name) {
    const n = String(name || "").toLowerCase();
    return n.endsWith(".mp3") || n.endsWith(".ogg") || n.endsWith(".wav");
  }

  function defaultOrder(list) {
    return list.slice().sort((a, b) => {
      const aKey = a.toLowerCase().includes("songval") ? 0 : 1;
      const bKey = b.toLowerCase().includes("songval") ? 0 : 1;
      if (aKey !== bKey) return aKey - bKey;
      return a.localeCompare(b);
    });
  }

  function applySavedOrder(list) {
    let order = null;
    try {
      order = JSON.parse(safeGet(PREF_ORDER, "null"));
    } catch {
      order = null;
    }
    if (!Array.isArray(order) || order.length === 0) {
      return defaultOrder(list);
    }
    const set = new Set(list);
    const merged = order.filter((n) => set.has(n));
    list.forEach((n) => {
      if (!merged.includes(n)) merged.push(n);
    });
    return merged;
  }

  function saveOrder() {
    safeSet(PREF_ORDER, JSON.stringify(state.list));
  }

  function toUrl(name) {
    return `${basePath}${encodeURIComponent(name)}`;
  }

  function setTrack(idx, autoplay) {
    if (!state.list.length) return;
    const len = state.list.length;
    state.index = ((idx % len) + len) % len;
    const name = state.list[state.index];
    audio.src = toUrl(name);
    audio.volume = state.volume;
    safeSet(PREF_CURRENT, name);
    if (autoplay && state.enabled) {
      tryPlay();
    }
    notify();
  }

  function tryPlay() {
    if (!state.ready || !state.enabled || !state.list.length) return;
    audio.volume = state.volume;
    audio.play().then(() => {
      state.pendingPlay = false;
    }).catch(() => {
      state.pendingPlay = true;
    });
  }

  function next() {
    if (!state.list.length) return;
    setTrack(state.index + 1, true);
  }

  function prev() {
    if (!state.list.length) return;
    setTrack(state.index - 1, true);
  }

  function setEnabled(enabled) {
    state.enabled = !!enabled;
    safeSet(PREF_ENABLED, state.enabled ? "1" : "0");
    if (state.enabled) {
      tryPlay();
    } else {
      audio.pause();
    }
    notify();
  }

  function setVolume(v) {
    const vol = Math.max(0, Math.min(1, v));
    state.volume = vol;
    audio.volume = vol;
    safeSet(PREF_VOLUME, String(vol));
    notify();
  }

  function playIndex(idx) {
    setTrack(idx, true);
  }

  function moveTrack(from, to) {
    if (!state.list.length) return;
    if (from < 0 || from >= state.list.length) return;
    if (to < 0 || to >= state.list.length) return;
    if (from === to) return;

    const item = state.list.splice(from, 1)[0];
    state.list.splice(to, 0, item);

    if (state.index === from) {
      state.index = to;
    } else if (from < state.index && to >= state.index) {
      state.index -= 1;
    } else if (from > state.index && to <= state.index) {
      state.index += 1;
    }

    saveOrder();
    notify();
  }

  async function loadList() {
    let files = [];
    try {
      const res = await fetch(basePath, { cache: "no-store" });
      if (res.ok) {
        const html = await res.text();
        const re = /href=\"([^\"]+)\"/g;
        let match = null;
        const found = [];
        while ((match = re.exec(html))) {
          const raw = match[1];
          const name = raw.split("?")[0].split("/").pop();
          if (isAudioFile(name)) found.push(name);
        }
        files = found;
      }
    } catch {}

    if (!files.length) {
      try {
        const res = await fetch(manifestUrl, { cache: "no-store" });
        if (res.ok) files = await res.json();
      } catch {}
    }

    files = (files || []).filter(isAudioFile);
    state.list = applySavedOrder(files);
    state.ready = true;

    const savedCurrent = safeGet(PREF_CURRENT, "");
    if (savedCurrent && state.list.includes(savedCurrent)) {
      state.index = state.list.indexOf(savedCurrent);
    } else if (state.list.length) {
      state.index = 0;
    }

    setTrack(state.index, false);
    if (state.enabled) tryPlay();
    notify();
  }

  function init() {
    const enabledPref = safeGet(PREF_ENABLED, "1");
    state.enabled = enabledPref !== "0";
    const volumePref = parseFloat(safeGet(PREF_VOLUME, "0.6"));
    state.volume = Number.isFinite(volumePref) ? Math.max(0, Math.min(1, volumePref)) : 0.6;
    audio.volume = state.volume;
    loadList();
  }

  audio.addEventListener("ended", () => next());

  function unlockAutoPlay() {
    if (state.pendingPlay && state.enabled) {
      tryPlay();
    } else if (state.enabled) {
      tryPlay();
    }
  }

  window.addEventListener("pointerdown", unlockAutoPlay, { once: true, passive: true });
  window.addEventListener("keydown", unlockAutoPlay, { once: true });

  const api = {
    init,
    getState,
    getList: () => state.list.slice(),
    getIndex: () => state.index,
    getVolume: () => state.volume,
    isEnabled: () => state.enabled,
    play: () => { setEnabled(true); },
    pause: () => { setEnabled(false); },
    toggle: () => { setEnabled(!state.enabled); },
    setVolume,
    next,
    prev,
    playIndex,
    moveTrack,
    onUpdate(fn) {
      if (typeof fn === "function") state.listeners.push(fn);
    }
  };

  window.MusicPlayer = api;
  api.init();
})();
