import { TFile, Notice, Menu, MarkdownRenderChild } from "obsidian";
import RealCalendarPlugin, { EmbedOptions, ViewMode, EventItem } from "../main";

// -------------------- RealCalendarEmbedRenderer --------------------
export class RealCalendarEmbedRenderer extends MarkdownRenderChild {
  container: HTMLElement;
  plugin: RealCalendarPlugin;
  options: EmbedOptions;
  viewMode: ViewMode;
  currentDate: Date;
  currentMonth: number;
  currentYear: number;

  constructor(container: HTMLElement, plugin: RealCalendarPlugin, options: EmbedOptions) {
    super(container);
    this.container = container;
    this.plugin = plugin;
    this.options = options;
    this.viewMode = options.view || 'month';
    const now = new Date();
    this.currentDate = now;
    this.currentMonth = now.getMonth();
    this.currentYear = now.getFullYear();
  }

  render() {
    this.container.empty();
    const calendarEl = this.container.createEl("div");
    calendarEl.addClass("real-calendar");

    const controls = calendarEl.createEl("div", { cls: "calendar-controls" });
    const header = controls.createEl("div", { cls: "calendar-header" });

    const prev = header.createEl("button", { text: "◀" });
    const title = header.createEl("span");
    const next = header.createEl("button", { text: "▶" });

    const todayBtn = header.createEl("button", { text: "Today" });
    todayBtn.onclick = () => {
      const now = new Date();
      this.currentDate = now;
      this.currentMonth = now.getMonth();
      this.currentYear = now.getFullYear();
      this.render();
    };

    const viewToggle = controls.createEl("div", { cls: "view-toggle" });
    const monthBtn = viewToggle.createEl("button", { text: "Month" });
    const weekBtn = viewToggle.createEl("button", { text: "Week" });
    const dayBtn = viewToggle.createEl("button", { text: "Day" });

    [monthBtn, weekBtn, dayBtn].forEach(btn => btn.removeClass('active'));
    if (this.viewMode === 'month') monthBtn.addClass('active');
    else if (this.viewMode === 'week') weekBtn.addClass('active');
    else dayBtn.addClass('active');

    monthBtn.onclick = () => { this.viewMode = 'month'; this.render(); };
    weekBtn.onclick = () => { this.viewMode = 'week'; this.render(); };
    dayBtn.onclick = () => { this.viewMode = 'day'; this.render(); };

    if (this.viewMode === 'month') {
      title.setText(`${this.plugin.getMonthName(this.currentMonth)} ${this.currentYear}`);
      prev.onclick = () => {
        this.currentMonth--;
        if (this.currentMonth < 0) { this.currentMonth = 11; this.currentYear--; }
        this.currentDate = new Date(this.currentYear, this.currentMonth, 1);
        this.render();
      };
      next.onclick = () => {
        this.currentMonth++;
        if (this.currentMonth > 11) { this.currentMonth = 0; this.currentYear++; }
        this.currentDate = new Date(this.currentYear, this.currentMonth, 1);
        this.render();
      };
      this.renderMonthView(calendarEl);

    } else if (this.viewMode === 'week') {
      const weekStart = this.plugin.getWeekStart(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      title.setText(`${this.plugin.getMonthName(weekStart.getMonth())} ${weekStart.getDate()} - ${this.plugin.getMonthName(weekEnd.getMonth())} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`);

      prev.onclick = () => {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.render();
      };
      next.onclick = () => {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.render();
      };
      this.renderWeekView(calendarEl);

    } else {
      title.setText(`${this.plugin.getDayName(this.currentDate.getDay())}, ${this.plugin.getMonthName(this.currentDate.getMonth())} ${this.currentDate.getDate()}, ${this.currentDate.getFullYear()}`);
      prev.onclick = () => {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.render();
      };
      next.onclick = () => {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
        this.currentMonth = this.currentDate.getMonth();
        this.currentYear = this.currentDate.getFullYear();
        this.render();
      };
      this.renderDayView(calendarEl);
    }
  }

  refresh() {
    this.render();
  }

  onunload() {
    // remove this renderer from the plugin's tracking array

    const index = this.plugin.embedRenderers.indexOf(this);
    if (index > -1) {
      this.plugin.embedRenderers.splice(index, 1);
    }

  }

  getFilteredEvents(dateStr: string): EventItem[] {
    let events = this.plugin.events.filter(e => e.date === dateStr);

    if (this.options.folder) {
      events = events.filter(e => e.file.path.startsWith(this.options.folder!));
    }

    if (this.options.showCompleted === false) {
      events = events.filter(e => !e.done);
    }

    return events.sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  }

  private addDeleteContextMenu(el: HTMLElement, file: TFile) {
    el.oncontextmenu = async (evt: MouseEvent) => {
      evt.preventDefault();

      const menu = new Menu();
      menu.addItem(item => item
        .setTitle("Move to Trash")
        .setIcon("trash")
        .onClick(async () => {
          try {
            await this.plugin.app.vault.trash(file, true);
            new Notice(`Moved "${file.basename}" to trash`);
          } catch (err) {
            new Notice("Failed to move file to trash.");
          }
        })
      );
      menu.showAtMouseEvent(evt);
    };
  }

  renderMonthView(container: HTMLElement) {
    const weekdays = this.plugin.settings.weekStartDay === 1
      ? ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const weekRow = container.createEl("div", { cls: "calendar-weekdays" });
    weekdays.forEach(day => weekRow.createEl("div", { cls: "calendar-weekday", text: day }));

    const grid = container.createEl("div", { cls: "calendar-grid" });
    const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    let startOffset = this.plugin.settings.weekStartDay === 1 ? (firstDay === 0 ? 6 : firstDay - 1) : firstDay;
    for (let i = 0; i < startOffset; i++) grid.createEl("div", { cls: "calendar-day empty" });

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${this.currentYear}-${(this.currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayEl = grid.createEl("div", { cls: "calendar-day" });
      if (dateStr === todayStr) dayEl.addClass("today");
      const label = dayEl.createEl("div", { cls: "day-label", text: day.toString() });

      const dayEvents = this.getFilteredEvents(dateStr);
      dayEvents.forEach(e => {
        const eventText = e.startTime ? `${e.startTime} ${e.title}` : e.title;
        const eventEl = dayEl.createEl("div", { cls: "calendar-event", text: eventText });
        eventEl.setAttribute("title", e.title);
        eventEl.onclick = () => this.plugin.app.workspace.openLinkText(e.file.path, "", false);
        if (e.done) eventEl.addClass("event-done");
        else if (e.date < todayStr) eventEl.addClass("event-overdue");
        else eventEl.addClass("event-upcoming");
        this.addDeleteContextMenu(eventEl, e.file);
      });
    }
  }

  renderWeekView(container: HTMLElement) {
    const weekView = container.createEl("div", { cls: "week-view" });
    const weekStart = this.plugin.getWeekStart(this.currentDate);
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

      const dayEvents = this.getFilteredEvents(dateStr);

      if (dayEvents.length === 0) {
        const emptyEl = eventsContainer.createEl("div", { text: "No events", cls: "calendar-event empty-event" });
      } else {
        dayEvents.forEach(e => {
          const eventText = e.startTime ? `${e.startTime} ${e.title}` : e.title;
          const eventEl = eventsContainer.createEl("div", { cls: "calendar-event", text: eventText });
          eventEl.setAttribute("title", e.title);
          eventEl.onclick = () => this.plugin.app.workspace.openLinkText(e.file.path, "", false);
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
    const dateStr = `${this.currentDate.getFullYear()}-${(this.currentDate.getMonth() + 1).toString().padStart(2, "0")}-${this.currentDate.getDate().toString().padStart(2, "0")}`;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

    const eventList = dayView.createEl("div", { cls: "day-event-list" });

    const dayEvents = this.getFilteredEvents(dateStr);

    if (dayEvents.length === 0) {
      eventList.createEl("div", { cls: "day-no-events", text: "No events for this day" });
    } else {
      dayEvents.forEach(e => {
        const eventItem = eventList.createEl("div", { cls: "day-event-item" });
        eventItem.onclick = () => this.plugin.app.workspace.openLinkText(e.file.path, "", false);

        eventItem.createEl("div", { cls: "day-event-title", text: e.title });

        if (e.startTime || e.endTime) {
          const timeEl = eventItem.createEl("div", { cls: "day-event-time" });
          if (e.startTime && e.endTime) timeEl.setText(`${e.startTime} - ${e.endTime}`);
          else if (e.startTime) timeEl.setText(`${e.startTime}`);
          else if (e.endTime) timeEl.setText(`Until ${e.endTime}`);
        }

        const statusEl = eventItem.createEl("div", { cls: "day-event-status" });
        if (e.done) {
          statusEl.setText("✓ Completed");
          statusEl.addClass("event-done");
        } else if (e.date < todayStr) {
          statusEl.setText("⚠ Overdue");
          statusEl.addClass("event-overdue");
        }

        this.addDeleteContextMenu(eventItem, e.file);
      });
    }
  }
}
