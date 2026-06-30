(() => {
  "use strict";

  const FALLBACK_DATA = {
    event: {
      title: "Conscious Man 2026",
      subtitle: "1-5 lipca 2026 | Przyłęk, gm. Paradyż",
      note: "Przykładowe dane lokalne. Podmień je przez window.SCHEDULE_DATA w data.js."
    },
    days: [
      {
        id: "day-1",
        label: "Środa",
        date: "2026-07-01",
        summary: "Przyjazd, wejście w przestrzeń i otwarcie festiwalu",
        sessions: [
          {
            id: "opening-arrival",
            start: "16:00",
            end: "18:00",
            title: "Rejestracja uczestników",
            speaker: "Zespół Conscious Man",
            zone: "Organizacja",
            location: "Recepcja",
            type: "Logistyka",
            description: "Fallbackowy przykład pokazujący układ tabeli. Docelowe dane powinny przyjść z data.js."
          },
          {
            id: "opening-circle",
            start: "19:00",
            end: "20:30",
            title: "Krąg otwarcia",
            subtitle: "Wezwanie do Obecności",
            speaker: "Prowadzący festiwalu",
            zone: "Strefa Inspiracji",
            location: "Scena Główna",
            type: "Ceremonia",
            description: "Kliknięcie sesji otwiera modal ze szczegółami, czasem, miejscem, strefą i opisem."
          }
        ]
      },
      {
        id: "day-2",
        label: "Czwartek",
        date: "2026-07-02",
        summary: "Pierwszy pełny dzień warsztatów",
        sessions: [
          {
            id: "morning-body",
            start: "08:30",
            end: "09:30",
            title: "Poranna praktyka ciała",
            speaker: "Gość festiwalu",
            zone: "Strefa Umiejętności",
            location: "Namiot Ruchu",
            type: "Praktyka",
            description: "Przykładowa praktyka ruchowa w siatce harmonogramu."
          },
          {
            id: "knowledge-talk",
            start: "10:00",
            end: "11:30",
            title: "Męska obecność w relacjach",
            speaker: "Prelegent",
            zone: "Strefa Wiedzy",
            location: "Scena Główna",
            type: "Wykład",
            description: "Przykładowy wykład do czasu podłączenia pełnego data.js."
          },
          {
            id: "transform-process",
            start: "12:00",
            end: "14:00",
            title: "Proces transformacyjny",
            speaker: "Facylitator",
            zone: "Strefa Transformacji",
            location: "Krąg",
            type: "Warsztat",
            description: "Przykładowy dłuższy warsztat."
          }
        ]
      }
    ]
  };

  const DEFAULT_TRACK_STYLE = { color: "#81745f", soft: "#ece4d5" };
  const FULL_WIDTH_ZONE_PATTERN = /^(wszyscy|scena główna|scena glowna)$/i;
  const YOUNG_BLOOD_ZONE = "młoda krew";
  const HOME_TAB_ID = "home";
  const OFFLINE_CACHE_NAME = "consciousman-2026-shell-v17";
  const OFFLINE_ASSETS = [
    "./",
    "./index.html",
    "./styles.min.css?v=17",
    "./app.min.js?v=17",
    "./data.min.js?v=17",
    "./manifest.webmanifest",
    "./icon.svg",
    "./assets/consciousman-logo.png",
    "./assets/festival-map-2026.webp"
  ];
  const OFFLINE_STORAGE_KEYS = {
    dataBackup: "cm2026.schedule.backup",
    savedAt: "cm2026.offline.savedAt",
    favorites: "cm2026.favoriteSessions.v1",
    persisted: "cm2026.offline.persisted",
    hideYoungBlood: "cm2026.hideYoungBlood.v2"
  };
  const appState = {
    days: [],
    details: {},
    sessions: new Map(),
    activeView: "day",
    activeDay: 0,
    lastFocus: null,
    sourceData: null,
    favoriteIds: new Set(),
    offlineSaveInFlight: null,
    hideYoungBlood: false
  };

  const el = {
    tabs: document.getElementById("day-tabs"),
    days: document.getElementById("schedule-days"),
    dialog: document.getElementById("session-dialog"),
    dialogTitle: document.getElementById("dialog-title"),
    dialogSubtitle: document.getElementById("dialog-subtitle"),
    dialogMeta: document.getElementById("dialog-meta"),
    dialogFacts: document.getElementById("dialog-facts"),
    dialogDescription: document.getElementById("dialog-description"),
    mapButton: document.getElementById("open-map"),
    mapDialog: document.getElementById("map-dialog")
  };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    loadFavoriteSessions();
    loadFilterState();
    const backupData = window.SCHEDULE_DATA ? null : readScheduleBackup();
    const sourceData = window.SCHEDULE_DATA || backupData || FALLBACK_DATA;
    const normalized = normalizeSchedule(sourceData);
    appState.sourceData = sourceData;
    appState.days = normalized.days;
    appState.details = normalized.details;

    renderTabs(appState.days);
    renderDays(appState.days);
    bindDialog();
    bindMapDialog();
    rememberScheduleData(sourceData);
    registerServiceWorker();
  }

  function normalizeSchedule(input) {
    const source = input && typeof input === "object" ? input : FALLBACK_DATA;
    const metaSource = source.event || source.meta || source.info || source;
    const meta = {
      title: text(metaSource.title || metaSource.name || FALLBACK_DATA.event.title),
      subtitle: text(metaSource.subtitle || metaSource.dates || metaSource.dateRange || FALLBACK_DATA.event.subtitle),
      note: text(metaSource.note || metaSource.updated || ""),
      sourceUrl: text(metaSource.sourceUrl || source.sourceUrl || "")
    };
    const details = source.details && typeof source.details === "object" ? source.details : {};

    const dayCandidates = Array.isArray(source)
      ? source
      : source.days || source.schedule || source.program || source.agenda || [];

    let days = [];
    if (Array.isArray(dayCandidates) && dayCandidates.some((item) => item && (item.sessions || item.events || item.items))) {
      days = dayCandidates.map(normalizeDay).filter(Boolean);
    } else {
      const flatSessions = Array.isArray(dayCandidates) && dayCandidates.length
        ? dayCandidates
        : source.sessions || source.events || source.items || [];
      days = groupFlatSessions(Array.isArray(flatSessions) ? flatSessions : []);
    }

    if (!days.length) {
      days = FALLBACK_DATA.days.map(normalizeDay);
      meta.note = FALLBACK_DATA.event.note;
    }

    days.forEach((day, dayIndex) => {
      day.sessions = day.sessions
        .map((session, index) => normalizeSession(session, day, `${day.id}-${index}`))
        .filter((session) => session.title)
        .sort((a, b) => timeValue(a.start) - timeValue(b.start) || a.title.localeCompare(b.title, "pl"));
      day.sessionCount = day.sessions.length;
      day.index = dayIndex;
    });

    return { meta, days, details };
  }

  function normalizeDay(day, index = 0) {
    if (!day || typeof day !== "object") return null;
    const sessions = day.sessions || day.events || day.items || [];
    const date = text(day.date || day.dayDate || day.isoDate || "");
    const label = text(day.label || day.name || day.day || formatDayLabel(date) || `Dzień ${index + 1}`);

    return {
      id: slug(day.id || day.key || `${label}-${date || index}`),
      label,
      date,
      summary: text(day.summary || day.subtitle || day.description || ""),
      columns: Array.isArray(day.columns) ? day.columns.map(text).filter(Boolean) : [],
      poster: text(day.poster || day.image || ""),
      sessions: Array.isArray(sessions) ? sessions : []
    };
  }

  function normalizeSession(session, day, fallbackId) {
    const source = session && typeof session === "object" ? session : {};
    const rawTime = text(source.time || source.hours || source.when || "");
    const split = splitTimeRange(rawTime);
    const start = normalizeTime(source.start || source.startTime || split.start || rawTime);
    const end = normalizeTime(source.end || source.endTime || split.end || "");
    const speakers = Array.isArray(source.speakers)
      ? source.speakers.map(text).filter(Boolean).join(", ")
      : text(source.speaker || source.presenter || source.host || source.facilitator || "");
    const zone = text(source.zone || source.track || source.stage || source.room || source.location || source.area || "Program");
    const anchors = Array.isArray(source.anchors)
      ? source.anchors.map(text).filter(Boolean)
      : text(source.anchor || source.detailAnchor).split(",").map(text).filter(Boolean);
    const kind = text(source.kind || source.type || source.category || source.format || "");

    return {
      id: slug(source.id || source.slug || fallbackId),
      dayId: day.id,
      dayLabel: day.label,
      date: day.date,
      start,
      end,
      time: formatTime(start, end) || rawTime || "Godzina do potwierdzenia",
      title: text(source.title || source.name || source.session || ""),
      subtitle: text(source.subtitle || source.topic || source.tagline || ""),
      speaker: speakers,
      zone,
      location: text(source.location || source.room || source.stage || source.place || zone),
      type: kind.toLowerCase() === "session" ? "" : kind,
      anchors,
      note: text(source.note || source.missingDescription || ""),
      description: text(source.description || source.details || source.summary || source.body || source.html || ""),
      raw: source
    };
  }

  function groupFlatSessions(sessions) {
    const groups = new Map();

    sessions.forEach((session, index) => {
      const dayKey = text(session.date || session.dayDate || session.day || session.label || "Program");
      const groupId = slug(dayKey || `day-${index}`);
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          id: groupId,
          label: text(session.dayLabel || session.day || formatDayLabel(session.date) || dayKey),
          date: text(session.date || ""),
          summary: "",
          sessions: []
        });
      }
      groups.get(groupId).sessions.push(session);
    });

    return Array.from(groups.values());
  }

  function renderTabs(days) {
    el.tabs.textContent = "";
    el.tabs.append(renderHomeTab());
    days.forEach((day, index) => {
      const tab = document.createElement("button");
      tab.className = "day-tab";
      tab.type = "button";
      tab.id = `tab-${day.id}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", `panel-${day.id}`);
      tab.setAttribute("aria-selected", String(appState.activeView === "day" && index === appState.activeDay));
      tab.tabIndex = appState.activeView === "day" && index === appState.activeDay ? 0 : -1;
      tab.innerHTML = `<strong></strong><span></span>`;
      tab.querySelector("strong").textContent = day.label;
      tab.querySelector("span").textContent = [formatDate(day.date), `${visibleSessionCount(day)} wydarzeń`]
        .filter(Boolean)
        .join(" | ");
      tab.addEventListener("click", () => activateDay(index));
      tab.addEventListener("keydown", onTabKeydown);
      el.tabs.append(tab);
    });
  }

  function renderHomeTab() {
    const tab = document.createElement("button");
    tab.className = "day-tab home-tab";
    tab.type = "button";
    tab.id = "tab-home";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "panel-home");
    tab.setAttribute("aria-selected", String(appState.activeView === HOME_TAB_ID));
    tab.setAttribute("aria-label", "Home");
    tab.title = "Home";
    tab.tabIndex = appState.activeView === HOME_TAB_ID ? 0 : -1;
    tab.innerHTML = "<span class=\"home-tab-icon\" aria-hidden=\"true\">⌂</span>";
    tab.addEventListener("click", activateHome);
    tab.addEventListener("keydown", onTabKeydown);
    return tab;
  }

  function renderDays(days) {
    el.days.textContent = "";
    appState.sessions.clear();
    el.days.append(renderHomePanel());

    days.forEach((day, index) => {
      const panel = document.createElement("section");
      panel.className = `day-panel${appState.activeView === "day" && index === appState.activeDay ? " is-active" : ""}`;
      panel.id = `panel-${day.id}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `tab-${day.id}`);
      panel.tabIndex = 0;
      const sessions = visibleSessions(day);

      if (!sessions.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = "Brak wydarzeń dla tego dnia.";
        panel.append(empty);
      } else {
        panel.append(renderMobileAgenda(day, sessions));
        panel.append(renderScheduleGrid(day, sessions));
      }

      el.days.append(panel);
    });
  }

  function renderHomePanel() {
    const panel = document.createElement("section");
    panel.className = `day-panel home-panel${appState.activeView === HOME_TAB_ID ? " is-active" : ""}`;
    panel.id = "panel-home";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "tab-home");
    panel.tabIndex = 0;

    const content = document.createElement("div");
    content.className = "home-panel-content";

    const logoLink = document.createElement("a");
    logoLink.className = "event-logo";
    logoLink.href = "https://consciousman.pl/";
    logoLink.target = "_blank";
    logoLink.rel = "noopener";
    logoLink.setAttribute("aria-label", "Conscious Man");
    logoLink.innerHTML = `
      <span class="event-logo-surface">
        <img src="./assets/consciousman-logo.png" alt="Conscious Man" loading="eager" decoding="async">
      </span>
      <span class="event-site-link">consciousman.pl</span>
    `;

    const controls = document.createElement("div");
    controls.className = "home-controls";

    const toggle = document.createElement("label");
    toggle.className = "filter-switch";
    const checked = !appState.hideYoungBlood;
    toggle.innerHTML = `
      <input type="checkbox" ${checked ? "checked" : ""}>
      <span class="switch-track" aria-hidden="true"></span>
      <span class="switch-copy">
        <strong>Młoda Krew</strong>
        <span>${checked ? "Widoczne" : "Ukryte"}</span>
      </span>
    `;
    const input = toggle.querySelector("input");
    input.addEventListener("change", () => {
      appState.hideYoungBlood = !input.checked;
      saveFilterState();
      renderTabs(appState.days);
      renderDays(appState.days);
    });

    controls.append(toggle);
    content.append(logoLink, controls);
    panel.append(content);
    return panel;
  }

  function renderScheduleGrid(day, sessions = day.sessions) {
    const sessionTracks = unique(sessions
      .filter((session) => !isFullWidthSession(session))
      .map((session) => session.zone || "Program"));
    const tracks = day.columns && day.columns.length
      ? day.columns.filter((column) => !shouldHideZone(column))
      : sessionTracks;
    const safeTracks = tracks.length ? tracks : ["Program"];
    const times = unique(sessions.map((session) => session.start || session.time || "TBA"))
      .sort((a, b) => timeValue(a) - timeValue(b) || a.localeCompare(b, "pl"));

    const wrap = document.createElement("div");
    wrap.className = "grid-wrap";
    wrap.setAttribute("aria-label", `Harmonogram: ${day.label}`);

    const grid = document.createElement("div");
    grid.className = "schedule-grid";
    grid.style.gridTemplateColumns = `var(--sticky-left) repeat(${safeTracks.length}, minmax(168px, 1fr))`;
    grid.setAttribute("role", "table");
    grid.setAttribute("aria-rowcount", String(times.length + 1));
    grid.setAttribute("aria-colcount", String(safeTracks.length + 1));

    const corner = document.createElement("div");
    corner.className = "grid-cell grid-head time-cell corner-cell";
    corner.setAttribute("role", "columnheader");
    corner.textContent = "Czas";
    grid.append(corner);

    safeTracks.forEach((track) => {
      const head = document.createElement("div");
      head.className = "grid-cell grid-head";
      head.setAttribute("role", "columnheader");
      head.textContent = track;
      grid.append(head);
    });

    times.forEach((time) => {
      const sessionsAtTime = sessions.filter((session) => (session.start || session.time || "TBA") === time);
      const globalSessions = sessionsAtTime.filter((session) => isFullWidthSession(session) || !safeTracks.includes(session.zone || "Program"));
      const trackSessions = sessionsAtTime.filter((session) => !globalSessions.includes(session));

      if (globalSessions.length) {
        const timeCell = document.createElement("div");
        timeCell.className = "grid-cell time-cell";
        timeCell.setAttribute("role", "rowheader");
        timeCell.textContent = timeLabel(time, globalSessions);
        grid.append(timeCell);

        const slot = document.createElement("div");
        slot.className = "grid-cell slot-cell slot-cell--global";
        slot.style.gridColumn = `span ${safeTracks.length}`;
        slot.setAttribute("role", "cell");
        globalSessions.forEach((session) => slot.append(renderSessionCard(session)));
        grid.append(slot);
      }

      if (!trackSessions.length) return;

      const timeCell = document.createElement("div");
      timeCell.className = "grid-cell time-cell";
      timeCell.setAttribute("role", "rowheader");
      timeCell.textContent = globalSessions.length ? "" : timeLabel(time, trackSessions);
      grid.append(timeCell);

      safeTracks.forEach((track) => {
        const slot = document.createElement("div");
        slot.className = "grid-cell slot-cell";
        slot.setAttribute("role", "cell");
        const matching = trackSessions.filter((session) => (session.zone || "Program") === track);

        if (matching.length) {
          matching.forEach((session) => slot.append(renderSessionCard(session)));
        } else {
          const empty = document.createElement("div");
          empty.className = "empty-cell";
          empty.setAttribute("aria-hidden", "true");
          slot.append(empty);
        }

        grid.append(slot);
      });
    });

    wrap.append(grid);
    return wrap;
  }

  function renderMobileAgenda(day, sessions = day.sessions) {
    const agenda = document.createElement("div");
    agenda.className = "mobile-agenda";
    agenda.setAttribute("aria-label", `Lista wydarzeń: ${day.label}`);

    const times = unique(sessions.map((session) => session.start || session.time || "TBA"))
      .sort((a, b) => timeValue(a) - timeValue(b) || a.localeCompare(b, "pl"));

    times.forEach((time) => {
      const group = document.createElement("section");
      group.className = "agenda-group";
      group.setAttribute("aria-labelledby", `${day.id}-${slug(time)}-label`);

      const label = document.createElement("h4");
      label.className = "agenda-time";
      label.id = `${day.id}-${slug(time)}-label`;
      label.textContent = timeLabel(time, sessions);
      group.append(label);

      sessions
        .filter((session) => (session.start || session.time || "TBA") === time)
        .forEach((session) => group.append(renderSessionCard(session, "mobile")));

      agenda.append(group);
    });

    return agenda;
  }

  function renderSessionCard(session, variant = "grid") {
    const card = document.createElement("article");
    const openButton = document.createElement("button");
    const favorite = isFavoriteSession(session);
    const canFavorite = canFavoriteSession(session);
    appState.sessions.set(session.id, session);

    card.className = sessionClassNames(session, variant, favorite, canFavorite).join(" ");
    card.dataset.sessionId = session.id;
    card.style.setProperty("--track-color", DEFAULT_TRACK_STYLE.color);
    card.style.setProperty("--track-soft", DEFAULT_TRACK_STYLE.soft);

    openButton.className = "session-open";
    openButton.type = "button";
    openButton.setAttribute("aria-label", `${session.title}, ${session.time}`);

    const time = document.createElement("span");
    time.className = "session-time";
    time.textContent = session.time;

    const title = document.createElement("span");
    title.className = "session-title";
    title.textContent = session.title;

    const speaker = document.createElement("span");
    speaker.className = "session-speaker";
    speaker.textContent = session.speaker || session.location || session.zone;

    openButton.append(time, title, speaker);

    if (session.type) {
      const type = document.createElement("span");
      type.className = "session-type";
      type.textContent = session.type;
      openButton.append(type);
    }

    if (variant === "mobile") {
      const details = document.createElement("span");
      details.className = "session-mobile-details";
      details.textContent = session.zone;
      openButton.append(details);
    }

    openButton.addEventListener("click", () => openSession(session.id, openButton));
    card.append(openButton);

    if (canFavorite) {
      const favoriteButton = document.createElement("button");
      favoriteButton.className = "favorite-toggle";
      favoriteButton.type = "button";
      setFavoriteButtonState(favoriteButton, favorite, session);
      favoriteButton.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleFavoriteSession(session.id);
      });
      card.append(favoriteButton);
    }

    return card;
  }

  function sessionClassNames(session, variant, favorite, canFavorite) {
    return [
      "session-card",
      `session-card--${variant}`,
      isFullWidthSession(session) ? "session-card--common" : "",
      isMealSession(session) ? "session-card--meal" : "",
      favorite ? "is-favorite" : "",
      canFavorite ? "has-favorite-toggle" : ""
    ].filter(Boolean);
  }

  function canFavoriteSession(session) {
    return !isMealSession(session);
  }

  function isFavoriteSession(session) {
    return appState.favoriteIds.has(session.id);
  }

  function toggleFavoriteSession(sessionId) {
    if (appState.favoriteIds.has(sessionId)) {
      appState.favoriteIds.delete(sessionId);
    } else {
      appState.favoriteIds.add(sessionId);
    }
    saveFavoriteSessions();
    updateFavoriteCards(sessionId);
  }

  function updateFavoriteCards(sessionId) {
    const session = appState.sessions.get(sessionId);
    if (!session) return;

    const favorite = appState.favoriteIds.has(sessionId);
    document.querySelectorAll(".session-card").forEach((card) => {
      if (card.dataset.sessionId !== sessionId) return;
      card.classList.toggle("is-favorite", favorite);
      const favoriteButton = card.querySelector(".favorite-toggle");
      if (favoriteButton) setFavoriteButtonState(favoriteButton, favorite, session);
    });
  }

  function setFavoriteButtonState(button, favorite, session) {
    button.setAttribute("aria-pressed", String(favorite));
    button.setAttribute("aria-label", `${favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych"}: ${session.title}`);
    button.title = favorite ? "Usuń z ulubionych" : "Dodaj do ulubionych";
    button.innerHTML = `<span aria-hidden="true">${favorite ? "★" : "☆"}</span>`;
  }

  function loadFavoriteSessions() {
    try {
      const raw = localStorage.getItem(OFFLINE_STORAGE_KEYS.favorites);
      const ids = raw ? JSON.parse(raw) : [];
      appState.favoriteIds = new Set(Array.isArray(ids) ? ids.map(text).filter(Boolean) : []);
    } catch {
      appState.favoriteIds = new Set();
    }
  }

  function saveFavoriteSessions() {
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEYS.favorites, JSON.stringify(Array.from(appState.favoriteIds)));
    } catch {
    }
  }

  function loadFilterState() {
    try {
      appState.hideYoungBlood = localStorage.getItem(OFFLINE_STORAGE_KEYS.hideYoungBlood) === "true";
    } catch {
      appState.hideYoungBlood = false;
    }
  }

  function saveFilterState() {
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEYS.hideYoungBlood, String(appState.hideYoungBlood));
    } catch {
    }
  }

  function visibleSessions(day) {
    return (day.sessions || []).filter((session) => !shouldHideSession(session));
  }

  function visibleSessionCount(day) {
    return visibleSessions(day).length;
  }

  function shouldHideSession(session) {
    return appState.hideYoungBlood && isYoungBloodZone(session.zone);
  }

  function shouldHideZone(zone) {
    return appState.hideYoungBlood && isYoungBloodZone(zone);
  }

  function isYoungBloodZone(zone) {
    return text(zone).toLowerCase() === YOUNG_BLOOD_ZONE;
  }

  function activateDay(index) {
    appState.activeView = "day";
    appState.activeDay = index;
    document.querySelectorAll(".day-tab").forEach((tab, tabIndex) => {
      const selected = tabIndex === index + 1;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll(".day-panel").forEach((panel, panelIndex) => {
      panel.classList.toggle("is-active", panelIndex === index + 1);
    });
  }

  function activateHome() {
    appState.activeView = HOME_TAB_ID;
    document.querySelectorAll(".day-tab").forEach((tab, tabIndex) => {
      const selected = tabIndex === 0;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    document.querySelectorAll(".day-panel").forEach((panel, panelIndex) => {
      panel.classList.toggle("is-active", panelIndex === 0);
    });
  }

  function onTabKeydown(event) {
    const lastIndex = appState.days.length;
    const currentIndex = appState.activeView === HOME_TAB_ID ? 0 : appState.activeDay + 1;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    if (event.key === "ArrowLeft") nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = lastIndex;
    if (nextIndex !== currentIndex) {
      event.preventDefault();
      if (nextIndex === 0) {
        activateHome();
        document.getElementById("tab-home")?.focus();
        return;
      }
      activateDay(nextIndex - 1);
      document.getElementById(`tab-${appState.days[nextIndex - 1].id}`)?.focus();
    }
  }

  function bindDialog() {
    el.dialog.addEventListener("close", () => {
      if (appState.lastFocus) appState.lastFocus.focus();
    });
    el.dialog.addEventListener("click", (event) => {
      const rect = el.dialog.getBoundingClientRect();
      const clickedBackdrop =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (clickedBackdrop) el.dialog.close();
    });
  }

  function bindMapDialog() {
    if (!el.mapButton || !el.mapDialog) return;

    el.mapButton.addEventListener("click", () => {
      appState.lastFocus = el.mapButton;
      if (typeof el.mapDialog.showModal === "function") {
        el.mapDialog.showModal();
      } else {
        el.mapDialog.setAttribute("open", "");
      }
    });

    el.mapDialog.addEventListener("close", () => {
      if (appState.lastFocus === el.mapButton) el.mapButton.focus();
    });

    el.mapDialog.addEventListener("click", (event) => {
      const rect = el.mapDialog.getBoundingClientRect();
      const clickedBackdrop =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (clickedBackdrop) el.mapDialog.close();
    });
  }

  function openSession(sessionId, trigger) {
    const session = appState.sessions.get(sessionId);
    if (!session) return;
    appState.lastFocus = trigger || document.activeElement;

    el.dialogTitle.textContent = session.title;
    el.dialogSubtitle.textContent = session.subtitle || session.speaker || session.zone;
    el.dialogMeta.textContent = "";
    [session.dayLabel, formatDate(session.date), session.time, session.type].filter(Boolean).forEach((item) => {
      const chip = document.createElement("span");
      chip.className = "dialog-chip";
      chip.textContent = item;
      el.dialogMeta.append(chip);
    });

    el.dialogFacts.textContent = "";
    [
      ["Prowadzący", session.speaker],
      ["Strefa", session.zone],
      ["Czas", session.time]
    ].filter(([, value]) => value).forEach(([label, value]) => {
      const item = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      item.append(dt, dd);
      el.dialogFacts.append(item);
    });

    renderDialogDescription(session);

    if (typeof el.dialog.showModal === "function") {
      el.dialog.showModal();
    } else {
      el.dialog.setAttribute("open", "");
    }
  }

  function renderDialogDescription(session) {
    el.dialogDescription.textContent = "";
    const details = detailSections(session);

    if (session.note) {
      const note = document.createElement("p");
      note.className = "dialog-note";
      note.textContent = session.note;
      el.dialogDescription.append(note);
    }

    if (session.description) {
      appendTextSection(el.dialogDescription, "Opis", session.description);
    }

    if (details.length) {
      details.forEach((detail) => {
        const title = [detail.speaker, detail.title].filter(Boolean).join(" | ");
        const article = document.createElement("article");
        article.className = "detail-section";
        if (title) {
          const heading = document.createElement("h3");
          heading.textContent = title;
          article.append(heading);
        }
        if (detail.description) appendTextSection(article, "Opis z programu", detail.description);
        if (detail.bio) appendTextSection(article, "BIO", detail.bio);
        el.dialogDescription.append(article);
      });
      return;
    }

    if (!session.description && !session.note) {
      const missing = document.createElement("p");
      missing.className = "dialog-note";
      missing.textContent = "Brak szczegółowego opisu tego wydarzenia w pobranym programie.";
      el.dialogDescription.append(missing);
    }
  }

  function appendTextSection(parent, label, body) {
    const section = document.createElement("section");
    section.className = "text-section";
    const heading = document.createElement("h4");
    heading.textContent = label;
    const paragraph = document.createElement("p");
    paragraph.textContent = body;
    section.append(heading, paragraph);
    parent.append(section);
  }

  function detailSections(session) {
    return (session.anchors || [])
      .map((anchor) => appState.details[anchor])
      .filter((detail) => detail && (detail.description || detail.bio || detail.title || detail.speaker));
  }

  async function registerServiceWorker() {
    if (!canUseServiceWorker()) return;

    try {
      await ensureServiceWorker();
      await saveOfflineBundle();
    } catch {
    }
  }

  function ensureServiceWorker() {
    return navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" });
  }

  function canUseServiceWorker() {
    return "serviceWorker" in navigator && ["http:", "https:"].includes(window.location.protocol);
  }

  async function saveOfflineBundle() {
    if (appState.offlineSaveInFlight) return appState.offlineSaveInFlight;

    appState.offlineSaveInFlight = (async () => {
      rememberScheduleData(appState.sourceData || window.SCHEDULE_DATA || FALLBACK_DATA);
      const persistent = await requestStoragePersistence();
      const cacheSaved = await cacheOfflineAssets().catch(() => false);
      const swSaved = await refreshServiceWorkerCache().catch(() => false);

      if (!cacheSaved && !swSaved) {
        throw new Error("Offline cache unavailable");
      }

      markOfflineSaved({ persistent, cacheSaved, swSaved });
      return { persistent, cacheSaved, swSaved };
    })();

    try {
      return await appState.offlineSaveInFlight;
    } finally {
      appState.offlineSaveInFlight = null;
    }
  }

  async function cacheOfflineAssets() {
    if (!("caches" in window)) return false;
    const cache = await caches.open(OFFLINE_CACHE_NAME);
    await cache.addAll(OFFLINE_ASSETS);
    return true;
  }

  async function refreshServiceWorkerCache() {
    if (!canUseServiceWorker()) return false;
    await ensureServiceWorker();
    const registration = await navigator.serviceWorker.ready;
    if (!registration?.active) return false;
    registration.active.postMessage({ type: "CACHE_NOW" });
    return true;
  }

  async function requestStoragePersistence() {
    if (!navigator.storage?.persist) return false;
    try {
      const alreadyPersistent = await navigator.storage.persisted?.();
      return alreadyPersistent || Boolean(await navigator.storage.persist());
    } catch {
      return false;
    }
  }

  function rememberScheduleData(data) {
    try {
      if (data && data !== FALLBACK_DATA) {
        localStorage.setItem(OFFLINE_STORAGE_KEYS.dataBackup, JSON.stringify(data));
      }
    } catch {
    }
  }

  function readScheduleBackup() {
    try {
      const raw = localStorage.getItem(OFFLINE_STORAGE_KEYS.dataBackup);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function markOfflineSaved({ persistent }) {
    const savedAt = new Date().toISOString();
    try {
      localStorage.setItem(OFFLINE_STORAGE_KEYS.savedAt, savedAt);
      localStorage.setItem(OFFLINE_STORAGE_KEYS.persisted, String(Boolean(persistent)));
    } catch {
    }
  }

  function isFullWidthSession(session) {
    return FULL_WIDTH_ZONE_PATTERN.test(text(session.zone));
  }

  function isMealSession(session) {
    return text(session.type).toLowerCase() === "meal";
  }

  function splitTimeRange(value) {
    const normalized = text(value).replace(/[–—]/g, "-");
    const match = normalized.match(/(\d{1,2}[:.]\d{2}|\d{1,2})\s*-\s*(\d{1,2}[:.]\d{2}|\d{1,2})/);
    return match ? { start: match[1], end: match[2] } : {};
  }

  function normalizeTime(value) {
    const raw = text(value);
    const match = raw.match(/(\d{1,2})(?:[:.](\d{2}))?/);
    if (!match) return "";
    const hour = match[1].padStart(2, "0");
    const minute = (match[2] || "00").padStart(2, "0");
    return `${hour}:${minute}`;
  }

  function formatTime(start, end) {
    if (start && end) return `${start} - ${end}`;
    return start || "";
  }

  function timeLabel(start, sessions) {
    const matches = sessions.filter((session) => (session.start || session.time || "TBA") === start);
    const endings = unique(matches.map((session) => session.end).filter(Boolean));
    return endings.length === 1 ? formatTime(start, endings[0]) : start;
  }

  function timeValue(value) {
    const normalized = normalizeTime(value);
    if (!normalized) return Number.MAX_SAFE_INTEGER;
    const [hour, minute] = normalized.split(":").map(Number);
    return hour * 60 + minute;
  }

  function formatDate(value) {
    const raw = text(value);
    if (!raw) return "";
    const date = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(date.getTime())) return raw;
    return new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long" }).format(date);
  }

  function formatDayLabel(value) {
    const raw = text(value);
    if (!raw) return "";
    const date = new Date(`${raw}T12:00:00`);
    if (Number.isNaN(date.getTime())) return raw;
    return new Intl.DateTimeFormat("pl-PL", { weekday: "long" }).format(date);
  }

  function slug(value) {
    return text(value)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `id-${Math.random().toString(36).slice(2)}`;
  }

  function unique(values) {
    return Array.from(new Set(values.map(text).filter(Boolean)));
  }

  function text(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/\s+/g, " ").trim();
  }
})();
