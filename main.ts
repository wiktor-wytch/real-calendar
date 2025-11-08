import { Plugin, WorkspaceLeaf, TFile, parseYaml } from "obsidian";
import { RealCalendarEmbedRenderer } from "./src/RealCalendarEmbedRenderer";
import { RealCalendarView } from "./src/RealCalendarView";
import { RealCalendarSettingTab } from "./src/RealCalendarSettingTab";
import { CreateEventModal } from "./src/CreateEventModal";
import { formatDateString, parseDateString } from "./src/utils/dateUtils";

export interface EventItem {
  date: string; // YYYY-MM-DD
  title: string;
  file: TFile;
  done: boolean;
  startTime?: string;
  endTime?: string;
}

interface RealCalendarSettings {
  eventFolder: string;
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  frontmatterFields: {
    tags: boolean;
    date: boolean;
    startTime: boolean;
    endTime: boolean;
    done: boolean;
  };
  fieldOrder: string[];
}

export interface EmbedOptions {
  view?: ViewMode;
  showCompleted?: boolean;
  folder?: string;
}

const DEFAULT_SETTINGS: RealCalendarSettings = {
  eventFolder: "",
  weekStartDay: 0, // Sunday by default
  frontmatterFields: {
    tags: true,
    date: true,
    startTime: true,
    endTime: true,
    done: true
  },
  fieldOrder: ["tags", "date", "startTime", "endTime", "done"]
}

export type ViewMode = 'month' | 'week' | 'day';
export const VIEW_TYPE_REAL_CALENDAR = "real-calendar-view";

export default class RealCalendarPlugin extends Plugin {
  settings!: RealCalendarSettings;
  events: EventItem[] = [];
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  currentDate: Date = new Date();
  viewMode: ViewMode = 'month';
  private refreshTimeout: number | null = null;
  private isInitialized: boolean = false;
  private loadPromise: Promise<void> | null = null;
  embedRenderers: RealCalendarEmbedRenderer[] = [];

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_REAL_CALENDAR, (leaf: WorkspaceLeaf) => new RealCalendarView(leaf, this));

    this.addRibbonIcon("calendar-with-checkmark", "Open calendar", async () => {
      await this.ensureInitialized();
      this.currentDate = new Date(this.currentYear, this.currentMonth, new Date().getDate());
      this.openCalendarView();
    });

    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (this.isInitialized && file instanceof TFile && file.extension === "md") {
        void this.updateSingleFile(file);
      }
    }));

    this.registerEvent(this.app.vault.on("create", (file) => {
      if (this.isInitialized && file instanceof TFile && file.extension === "md") {
        void this.updateSingleFile(file);
      }
    }));

    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (this.isInitialized && file instanceof TFile && file.extension === "md") {
        this.removeFileEvent(file);
      }
    }));

    this.registerEvent(this.app.vault.on("rename", () => {
      if (this.isInitialized) this.debouncedRefresh();
    }));

    this.addCommand({
      id: "create-event",
      name: "Create new event",
      callback: () => {
        new CreateEventModal(this.app, this).open();
      }
    });

    this.addSettingTab(new RealCalendarSettingTab(this.app, this));

    // Register markdown code block processor for embeds
    this.registerMarkdownCodeBlockProcessor("real-calendar", async (source, el, ctx) => {
      await this.ensureInitialized();
      const options = this.parseEmbedOptions(source);
      const calendarEl = el.createDiv({ cls: "real-calendar-embed" });
      const renderer = new RealCalendarEmbedRenderer(calendarEl, this, options);
      this.embedRenderers.push(renderer);

      // Register component for automatic cleanup
      ctx.addChild(renderer);

      renderer.render();
    });

    this.app.workspace.onLayoutReady(() => {
      void this.backgroundInit();
    });
  }

  private parseEmbedOptions(source: string): EmbedOptions {
    const options: EmbedOptions = {};
    try {
      const parsed = parseYaml(source);
      if (parsed) {
        if (parsed.view === 'month' || parsed.view === 'week' || parsed.view === 'day') {
          options.view = parsed.view;
        }
        if (typeof parsed.showCompleted === 'boolean') {
          options.showCompleted = parsed.showCompleted;
        }
        if (parsed.folder) {
          options.folder = parsed.folder;
        }
      }
    } catch {
      // Silently fail on invalid embed options
    }
    return options;
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    if (!this.settings.fieldOrder || this.settings.fieldOrder.length === 0) {
      this.settings.fieldOrder = ["tags", "date", "startTime", "endTime", "done"];
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async backgroundInit() {
    try {
      await this.loadEvents();
      this.isInitialized = true;
      this.refreshCalendarView();
    } catch {
      // Background initialization failed, will retry on next access
    }
  }

  async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    if (this.loadPromise) {
      await this.loadPromise;
      return;
    }
    this.loadPromise = this.loadEvents().then(() => {
      this.isInitialized = true;
      this.loadPromise = null;
    }).catch(() => {
      this.isInitialized = false;
      this.loadPromise = null;
    });
    await this.loadPromise;
  }

  private debouncedRefresh() {
    if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
    this.refreshTimeout = window.setTimeout(() => {
      void this.rescanVault().then(() => {
        this.refreshCalendarView();
      });
    }, 10000) as unknown as number;
  }

  private isInEventFolder(filePath: string): boolean {
    if (!this.settings.eventFolder) return true;
    return filePath.startsWith(this.settings.eventFolder);
  }

  async loadEvents(force = false) {
    if (!force && this.events.length > 0) return;

    try {
      const cached = await this.loadData();
      if (cached?.events && Array.isArray(cached.events)) {
        const validEvents: EventItem[] = [];
        for (const e of cached.events) {
          const file = this.app.vault.getAbstractFileByPath(e.file?.path);
          if (file instanceof TFile && this.isInEventFolder(file.path)) {
            validEvents.push({ ...e, file });
          }
        }
        this.events = validEvents;
        if (this.events.length > 0) this.validateCacheInBackground();
        else await this.rescanVault();
        return;
      }
    } catch {
      // No cached data, will rescan vault
    }
    await this.rescanVault();
  }

  private validateCacheInBackground() {
    window.setTimeout(() => {
      void (async () => {
        const hasChanges = this.checkForStaleCache();
        if (hasChanges) {
          await this.rescanVault();
          this.refreshCalendarView();
        }
      })();
    }, 3000);
  }

  private checkForStaleCache(): boolean {
    const allFiles = this.app.vault.getMarkdownFiles().filter(f => this.isInEventFolder(f.path));
    const currentPaths = new Set(allFiles.map(f => f.path));
    const cachedPaths = new Set(this.events.map(e => e.file.path));
    if (currentPaths.size !== cachedPaths.size) return true;
    for (const path of currentPaths) {
      if (!cachedPaths.has(path)) return true;
    }
    return false;
  }

  async rescanVault() {
    const allFiles = this.app.vault.getMarkdownFiles().filter(f => this.isInEventFolder(f.path));
    const events: EventItem[] = [];
    const chunkSize = 20;
    for (let i = 0; i < allFiles.length; i += chunkSize) {
      const batch = allFiles.slice(i, i + chunkSize);
      const results = await Promise.all(batch.map(f => this.extractEventFromFile(f)));
      for (const e of results) if (e) events.push(e);
    }
    this.events = events;
    await this.saveData({ ...this.settings, events: this.events });
  }

  async updateSingleFile(file: TFile) {
    if (!(file instanceof TFile) || !file.path.endsWith(".md")) return;
    if (!this.isInEventFolder(file.path)) return;
    try {
      const newEvent = await this.extractEventFromFile(file);
      const existingIndex = this.events.findIndex(e => e.file.path === file.path);
      if (newEvent) {
        if (existingIndex >= 0) this.events[existingIndex] = newEvent;
        else this.events.push(newEvent);
      } else if (existingIndex >= 0) {
        this.events.splice(existingIndex, 1);
      }
      await this.saveData({ ...this.settings, events: this.events });
      this.refreshCalendarView();
    } catch {
      // Failed to update event, will be picked up on next rescan
    }
  }

  removeFileEvent(file: TFile) {
    if (!(file instanceof TFile)) return;
    const before = this.events.length;
    this.events = this.events.filter(e => e.file.path !== file.path);
    if (this.events.length !== before) {
      void this.saveData({ ...this.settings, events: this.events });
      this.refreshCalendarView();
    }
  }

  async extractEventFromFile(file: TFile): Promise<EventItem | null> {
    try {
      const content = await this.app.vault.read(file);
      const yamlMatch = content.match(/^-{3}\s*([\s\S]+?)\s*-{3}/);
      if (!yamlMatch) return null;
      const yaml = parseYaml(yamlMatch[1]);
      if (!yaml?.tags?.includes("event")) return null;
      if (!yaml.date) return null;

      let dateStr: string;
      if (yaml.date instanceof Date) {
        dateStr = formatDateString(yaml.date);
      } else if (typeof yaml.date === "string") {
        dateStr = yaml.date.trim();
      } else return null;

      // Validate the date is actually valid
      const parsed = parseDateString(dateStr);
      if (!parsed) return null;

      return {
        date: dateStr,
        title: file.basename,
        file,
        done: !!yaml.done,
        startTime: yaml.startTime ? String(yaml.startTime).trim() : undefined,
        endTime: yaml.endTime ? String(yaml.endTime).trim() : undefined
      };
    } catch {
      return null;
    }
  }

  async openCalendarView() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_REAL_CALENDAR);
    if (existing.length > 0) {
      this.app.workspace.revealLeaf(existing[0]);
      return;
    }
    const leaf = this.app.workspace.getLeaf('tab');
    await leaf.setViewState({ type: VIEW_TYPE_REAL_CALENDAR, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  refreshCalendarView() {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_REAL_CALENDAR);
    leaves.forEach(leaf => {
      try {
        (leaf.view as RealCalendarView).renderCalendar();
      } catch {
        // Failed to refresh view
      }
    });

    // Refresh all embeds
    this.embedRenderers.forEach(renderer => {
      try {
        renderer.refresh();
      } catch {
        // Failed to refresh embed
      }
    });
  }

  getMonthName(month: number): string {
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month];
  }

  getDayName(day: number): string {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
  }


  getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = this.settings.weekStartDay === 1
      ? d.getDate() - (day === 0 ? 6 : day - 1)
      : d.getDate() - day;
    return new Date(d.setDate(diff));
  }

  onunload() {
    if (this.refreshTimeout) clearTimeout(this.refreshTimeout);
    this.embedRenderers = [];
  }
}


