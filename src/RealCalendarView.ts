import { ItemView, WorkspaceLeaf, TFile, Notice, Menu } from "obsidian";
import RealCalendarPlugin, { VIEW_TYPE_REAL_CALENDAR } from "../main";

// -------------------- RealCalendarView --------------------
export class RealCalendarView extends ItemView {
  plugin: RealCalendarPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: RealCalendarPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string { return VIEW_TYPE_REAL_CALENDAR; }
  getDisplayText(): string { return "Real calendar"; }
  getIcon(): string { return "calendar-with-checkmark"; }

  async onOpen() {
    this.renderLoadingState();
    await this.plugin.ensureInitialized();
    this.renderCalendar();
  }

  renderLoadingState() {
    const container = this.contentEl;
    container.empty();
    container.createEl("div", { cls: "real-calendar-loading", text: "Loading calendar events..." });
  }

// Context menu that moves files to Obsidian trash
  private addDeleteContextMenu(el: HTMLElement, file: TFile) {
    el.oncontextmenu = async (evt: MouseEvent) => {
      evt.preventDefault();

      const menu = new Menu();
      menu.addItem(item => item
        .setTitle("Move to trash")
        .setIcon("trash")
        .onClick(async () => {
          try {
            await this.plugin.app.vault.trash(file, true);
            new Notice(`Moved "${file.basename}" to trash`);
          } catch {
            new Notice("Failed to move file to trash.");
          }
        })
      );
      menu.showAtMouseEvent(evt);
    };
  }

  renderCalendar() {
    const container = this.contentEl;
    container.empty();
    const calendarEl = container.createEl("div");
    calendarEl.addClass("real-calendar");

    const controls = calendarEl.createEl("div", { cls: "calendar-controls" });
    const header = controls.createEl("div", { cls: "calendar-header" });

    const prev = header.createEl("button", { text: "◀" });
    const title = header.createEl("span");
    const next = header.createEl("button", { text: "▶" });

    const todayBtn = header.createEl("button", { text: "Today" });
    todayBtn.onclick = () => {
      const now = new Date();
      this.plugin.currentDate = now;
      this.plugin.currentMonth = now.getMonth();
      this.plugin.currentYear = now.getFullYear();
      this.renderCalendar();
    };

    const viewToggle = controls.createEl("div", { cls: "view-toggle" });
    const monthBtn = viewToggle.createEl("button", { text: "Month" });
    const weekBtn = viewToggle.createEl("button", { text: "Week" });
    const dayBtn = viewToggle.createEl("button", { text: "Day" });

    [monthBtn, weekBtn, dayBtn].forEach(btn => btn.removeClass('active'));
    if (this.plugin.viewMode === 'month') monthBtn.addClass('active');
    else if (this.plugin.viewMode === 'week') weekBtn.addClass('active');
    else dayBtn.addClass('active');

    monthBtn.onclick = () => { this.plugin.viewMode = 'month'; this.renderCalendar(); };
    weekBtn.onclick = () => { this.plugin.viewMode = 'week'; this.renderCalendar(); };
    dayBtn.onclick = () => { this.plugin.viewMode = 'day'; this.renderCalendar(); };

    if (this.plugin.viewMode === 'month') {
      title.setText(`${this.plugin.getMonthName(this.plugin.currentMonth)} ${this.plugin.currentYear}`);
      prev.onclick = () => {
        this.plugin.currentMonth--;
        if (this.plugin.currentMonth < 0) { this.plugin.currentMonth = 11; this.plugin.currentYear--; }
        this.plugin.currentDate = new Date(this.plugin.currentYear, this.plugin.currentMonth, 1);
        this.renderCalendar();
      };
      next.onclick = () => {
        this.plugin.currentMonth++;
        if (this.plugin.currentMonth > 11) { this.plugin.currentMonth = 0; this.plugin.currentYear++; }
        this.plugin.currentDate = new Date(this.plugin.currentYear, this.plugin.currentMonth, 1);
        this.renderCalendar();
      };
      this.renderMonthView(calendarEl);

    } else if (this.plugin.viewMode === 'week') {
      const weekStart = this.plugin.getWeekStart(this.plugin.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      title.setText(`${this.plugin.getMonthName(weekStart.getMonth())} ${weekStart.getDate()} - ${this.plugin.getMonthName(weekEnd.getMonth())} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`);

      prev.onclick = () => {
        this.plugin.currentDate.setDate(this.plugin.currentDate.getDate() - 7);
        this.plugin.currentMonth = this.plugin.currentDate.getMonth();
        this.plugin.currentYear = this.plugin.currentDate.getFullYear();
        this.renderCalendar();
      };
      next.onclick = () => {
        this.plugin.currentDate.setDate(this.plugin.currentDate.getDate() + 7);
        this.plugin.currentMonth = this.plugin.currentDate.getMonth();
        this.plugin.currentYear = this.plugin.currentDate.getFullYear();
        this.renderCalendar();
      };
      this.renderWeekView(calendarEl);

    } else {
      title.setText(`${this.plugin.getDayName(this.plugin.currentDate.getDay())}, ${this.plugin.getMonthName(this.plugin.currentDate.getMonth())} ${this.plugin.currentDate.getDate()}, ${this.plugin.currentDate.getFullYear()}`);
      prev.onclick = () => {
        this.plugin.currentDate.setDate(this.plugin.currentDate.getDate() - 1);
        this.plugin.currentMonth = this.plugin.currentDate.getMonth();
        this.plugin.currentYear = this.plugin.currentDate.getFullYear();
        this.renderCalendar();
      };
      next.onclick = () => {
        this.plugin.currentDate.setDate(this.plugin.currentDate.getDate() + 1);
        this.plugin.currentMonth = this.plugin.currentDate.getMonth();
        this.plugin.currentYear = this.plugin.currentDate.getFullYear();
        this.renderCalendar();
      };
      this.renderDayView(calendarEl);
    }
  }

  renderMonthView(container: HTMLElement) {
    const weekdays = this.plugin.settings.weekStartDay === 1
      ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const weekRow = container.createEl("div", { cls: "calendar-weekdays" });
    weekdays.forEach(day => weekRow.createEl("div", { cls: "calendar-weekday", text: day }));

    const grid = container.createEl("div", { cls: "calendar-grid" });
    const firstDay = new Date(this.plugin.currentYear, this.plugin.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.plugin.currentYear, this.plugin.currentMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    const startOffset = this.plugin.settings.weekStartDay === 1 ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;
    for (let i = 0; i < startOffset; i++) grid.createEl("div", { cls: "calendar-day empty" });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.plugin.currentYear}-${(this.plugin.currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayEl = grid.createEl("div", { cls: "calendar-day" });
      if (dateStr === todayStr) dayEl.addClass("today");
      dayEl.createEl("div", { cls: "day-label", text: day.toString() });

      const dayEvents = this.plugin.events.filter(e => e.date === dateStr).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
      dayEvents.forEach(e => {
        const eventText = e.startTime ? `${e.startTime} ${e.title}` : e.title;
        const eventEl = dayEl.createEl("div", { cls: "calendar-event", text: eventText });
        eventEl.setAttribute("title", e.title);
        eventEl.onclick = () => this.app.workspace.openLinkText(e.file.path, "", false);
        if (e.done) eventEl.addClass("event-done");
        else if (e.date < todayStr) eventEl.addClass("event-overdue");
        else eventEl.addClass("event-upcoming");
        this.addDeleteContextMenu(eventEl, e.file);
      });
    }
  }

  renderWeekView(container: HTMLElement) {
    const weekView = container.createEl("div", { cls: "week-view" });
    const weekStart = this.plugin.getWeekStart(this.plugin.currentDate);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

      const dayEl = weekView.createEl("div", { cls: "week-day" });
      const header = dayEl.createEl("div", { cls: "week-day-header" });
      header.setText(`${this.plugin.getDayName(date.getDay())}, ${this.plugin.getMonthName(date.getMonth())} ${date.getDate()}`);
      if (dateStr === todayStr) dayEl.addClass('today');

      const eventsContainer = dayEl.createEl("div", { cls: "week-day-events" });

      const dayEvents = this.plugin.events
        .filter(e => e.date === dateStr)
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

      if (dayEvents.length === 0) {
        eventsContainer.createEl("div", { text: "No events", cls: "calendar-event empty-event" });
      } else {
        dayEvents.forEach(e => {
          const eventText = e.startTime ? `${e.startTime} ${e.title}` : e.title;
          const eventEl = eventsContainer.createEl("div", { cls: "calendar-event", text: eventText });
          eventEl.setAttribute("title", e.title);
          eventEl.onclick = () => this.app.workspace.openLinkText(e.file.path, "", false);
          if (e.done) eventEl.addClass("event-done");
          else if (e.date < todayStr) eventEl.addClass("event-overdue");
          else eventEl.addClass("event-upcoming");
          this.addDeleteContextMenu(eventEl, e.file);
        });
      }
    }
  }

  renderDayView(container: HTMLElement) {
    const dayView = container.createEl("div", { cls: "day-view" });
    const dateStr = `${this.plugin.currentDate.getFullYear()}-${(this.plugin.currentDate.getMonth() + 1).toString().padStart(2, "0")}-${this.plugin.currentDate.getDate().toString().padStart(2, "0")}`;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    const eventList = dayView.createEl("div", { cls: "day-event-list" });

    const dayEvents = this.plugin.events
      .filter(e => e.date === dateStr)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

    if (dayEvents.length === 0) {
      eventList.createEl("div", { cls: "day-no-events", text: "No events for this day" });
    } else {
      dayEvents.forEach(e => {
        const eventItem = eventList.createEl("div", { cls: "day-event-item" });
        eventItem.onclick = () => this.app.workspace.openLinkText(e.file.path, "", false);

        eventItem.createEl("div", { cls: "day-event-title", text: e.title });

        if (e.startTime || e.endTime) {
          const timeEl = eventItem.createEl("div", { cls: "day-event-time" });
          if (e.startTime && e.endTime) timeEl.setText(`${e.startTime} - ${e.endTime}`);
          else if (e.startTime) timeEl.setText(`${e.startTime}`);
          else if (e.endTime) timeEl.setText(`Until ${e.endTime}`);
        }

        const statusEl = eventItem.createEl("div", { cls: "day-event-status" });
        if (e.done) {
          // eslint-disable-next-line obsidianmd/ui/sentence-case
          statusEl.setText("✓ Completed");
          statusEl.addClass("event-done");
        } else if (e.date < todayStr) {
          // eslint-disable-next-line obsidianmd/ui/sentence-case
          statusEl.setText("⚠ Overdue");
          statusEl.addClass("event-overdue");
        }

        this.addDeleteContextMenu(eventItem, e.file);
      });
    }
  }
}
