import { PluginSettingTab, App, Setting, normalizePath } from "obsidian";
import RealCalendarPlugin from "../main";

// -------------------- Settings Tab --------------------
export class RealCalendarSettingTab extends PluginSettingTab {
  plugin: RealCalendarPlugin;

  constructor(app: App, plugin: RealCalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Real Calendar").setHeading();

    new Setting(containerEl)
      .setName("Event folder")
      .setDesc("Folder where event files are stored (e.g., 'Actions/Events' or 'Calendar'). Leave empty to scan all folders.")
      .addText(text => text
        .setPlaceholder("Actions/Events")
        .setValue(this.plugin.settings.eventFolder)
        .onChange(async (value) => {
          const normalizedValue = normalizePath(value.trim());
          this.plugin.settings.eventFolder = normalizedValue;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Week starts on")
      .setDesc("Choose which day starts the week in calendar views")
      .addDropdown(dropdown => dropdown
        .addOption("0", "Sunday")
        .addOption("1", "Monday")
        .setValue(this.plugin.settings.weekStartDay.toString())
        .onChange(async (value) => {
          this.plugin.settings.weekStartDay = parseInt(value) as 0 | 1;
          await this.plugin.saveSettings();
          this.plugin.refreshCalendarView();
        }));

    new Setting(containerEl)
      .setName("Rescan vault")
      .setDesc("Force a full rescan of the vault to reload all events.")
      .addButton(button => button
        .setButtonText("Rescan now")
        .setCta()
        .onClick(async () => {
          button.setButtonText("Scanning...");
          button.setDisabled(true);

          await this.plugin.rescanVault();
          this.plugin.refreshCalendarView();

          button.setButtonText("Done!");
          setTimeout(() => {
            button.setButtonText("Rescan now");
            button.setDisabled(false);
          }, 2000);
        }));

    new Setting(containerEl).setName("Frontmatter").setHeading();
    containerEl.createDiv({ cls: "setting-item-description" }).createEl("p", {
      text: "Customize which fields appear in the frontmatter of new events and their order."
    });

    new Setting(containerEl)
      .setName("Include 'done' field")
      .setDesc("Track completion status of events")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.frontmatterFields.done)
        .onChange(async (value) => {
          this.plugin.settings.frontmatterFields.done = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl).setName("Field order").setHeading();
    containerEl.createDiv({ cls: "setting-item-description" }).createEl("p", {
      text: "Drag to reorder how fields appear in the frontmatter."
    });

    const orderContainer = containerEl.createDiv({ cls: "real-calendar-field-order" });
    this.renderFieldOrder(orderContainer);

    new Setting(containerEl).setName("How to use").setHeading();
    containerEl.createEl("p", { text: "Create event files with the following frontmatter:" });

    const codeBlock = containerEl.createEl("pre", { cls: "real-calendar-example" });
    let exampleFrontmatter = "---\n";
    for (const field of this.plugin.settings.fieldOrder) {
      if (!this.plugin.settings.frontmatterFields[field as keyof typeof this.plugin.settings.frontmatterFields]) {
        continue;
      }
      switch (field) {
        case "tags":
          exampleFrontmatter += "tags: event\n";
          break;
        case "date":
          exampleFrontmatter += "date: 2025-10-24\n";
          break;
        case "startTime":
          exampleFrontmatter += 'startTime: "14:00"\n';
          break;
        case "endTime":
          exampleFrontmatter += 'endTime: "15:30"\n';
          break;
        case "done":
          exampleFrontmatter += "done: false\n";
          break;
      }
    }
    exampleFrontmatter += "---";
    codeBlock.textContent = exampleFrontmatter;

    containerEl.createEl("p", { text: 'Or use the command "Real Calendar: Create new event"' });

    containerEl.createEl("p", { text: "Fields:" });
    const list = containerEl.createEl("ul");
    const tagsItem = list.createEl("li");
    tagsItem.createEl("strong", { text: "tags: event" });
    tagsItem.appendText(" - Required. Must include 'event' tag.");
    const dateItem = list.createEl("li");
    dateItem.createEl("strong", { text: "date" });
    dateItem.appendText(" - Required. Format: YYYY-MM-DD");
    const startTimeItem = list.createEl("li");
    startTimeItem.createEl("strong", { text: "startTime" });
    startTimeItem.appendText(" - Optional. Format: HH:MM (in quotes)");
    const endTimeItem = list.createEl("li");
    endTimeItem.createEl("strong", { text: "endTime" });
    endTimeItem.appendText(" - Optional. Format: HH:MM (in quotes)");
    const doneItem = list.createEl("li");
    doneItem.createEl("strong", { text: "done" });
    doneItem.appendText(" - Optional. Set to true to mark as completed.");

    new Setting(containerEl).setName("Embedding calendars").setHeading();
    containerEl.createEl("p", { text: "You can embed the calendar in any note using a code block:" });

    const embedExample = containerEl.createEl("pre", { cls: "real-calendar-example" });
    embedExample.textContent = "```real-calendar\nview: month\nshowCompleted: false\nfolder: projects/events\n```";

    containerEl.createEl("p", { text: "Embed options:" });
    const embedList = containerEl.createEl("ul");
    const viewItem = embedList.createEl("li");
    viewItem.createEl("strong", { text: "view" });
    viewItem.appendText(" - month, week, or day");
    const completedItem = embedList.createEl("li");
    completedItem.createEl("strong", { text: "showCompleted" });
    completedItem.appendText(" - true or false (filters out completed events)");
    const folderItem = embedList.createEl("li");
    folderItem.createEl("strong", { text: "folder" });
    folderItem.appendText(" - Filter events to a specific folder");
  }

  renderFieldOrder(container: HTMLElement) {
    container.empty();

    const fieldNames: Record<string, string> = {
      tags: "Tags",
      date: "Date",
      startTime: "Start time",
      endTime: "End time",
      done: "Done"
    };

    this.plugin.settings.fieldOrder.forEach((field, index) => {
      const fieldEl = container.createDiv({ cls: "real-calendar-field-item" });
      const dragHandle = fieldEl.createSpan({ text: "⋮⋮", cls: "drag-handle" });
      const nameSpan = fieldEl.createSpan({ text: fieldNames[field] || field, cls: "field-name" });
      const buttonContainer = fieldEl.createDiv({ cls: "field-buttons" });

      if (index > 0) {
        const upBtn = buttonContainer.createEl("button", { text: "↑", cls: "field-move-button" });
        upBtn.onclick = async () => {
          const temp = this.plugin.settings.fieldOrder[index];
          this.plugin.settings.fieldOrder[index] = this.plugin.settings.fieldOrder[index - 1];
          this.plugin.settings.fieldOrder[index - 1] = temp;
          await this.plugin.saveSettings();
          this.renderFieldOrder(container);
        };
      }

      if (index < this.plugin.settings.fieldOrder.length - 1) {
        const downBtn = buttonContainer.createEl("button", { text: "↓", cls: "field-move-button" });
        downBtn.onclick = async () => {
          const temp = this.plugin.settings.fieldOrder[index];
          this.plugin.settings.fieldOrder[index] = this.plugin.settings.fieldOrder[index + 1];
          this.plugin.settings.fieldOrder[index + 1] = temp;
          await this.plugin.saveSettings();
          this.renderFieldOrder(container);
        };
      }

      fieldEl.draggable = true;
      fieldEl.ondragstart = (e) => {
        e.dataTransfer!.effectAllowed = "move";
        e.dataTransfer!.setData("text/plain", index.toString());
        fieldEl.addClass("dragging");
      };
      fieldEl.ondragend = () => {
        fieldEl.removeClass("dragging");
      };
      fieldEl.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer!.dropEffect = "move";
      };
      fieldEl.ondrop = async (e) => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer!.getData("text/plain"));
        const toIndex = index;
        if (fromIndex !== toIndex) {
          const item = this.plugin.settings.fieldOrder[fromIndex];
          this.plugin.settings.fieldOrder.splice(fromIndex, 1);
          this.plugin.settings.fieldOrder.splice(toIndex, 0, item);
          await this.plugin.saveSettings();
          this.renderFieldOrder(container);
        }
      };
    });
  }
}
