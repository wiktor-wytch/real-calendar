import { App, Setting, Modal, Notice, normalizePath } from "obsidian";
import RealCalendarPlugin from "../main";
import { formatDateString, isValidDateString, isValidTimeString, isValidTimeRange } from "./utils/dateUtils";

// -------------------- CreateEventModal --------------------
export class CreateEventModal extends Modal {
  plugin: RealCalendarPlugin;
  eventName: string = "";
  eventDate: string = "";
  startTime: string = "";
  endTime: string = "";

  constructor(app: App, plugin: RealCalendarPlugin) {
    super(app);
    this.plugin = plugin;

    this.eventDate = formatDateString(new Date());
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: "Create New Event" });

    new Setting(contentEl)
      .setName("Event name")
      .setDesc("Name of the event")
      .addText(text => {
        text
          .setPlaceholder("Team meeting")
          .setValue(this.eventName)
          .onChange(value => {
            this.eventName = value;
          });
        setTimeout(() => text.inputEl.focus(), 10);
      });

    new Setting(contentEl)
      .setName("Date")
      .setDesc("Date of the event")
      .addText(text => {
        text
          .setPlaceholder("YYYY-MM-DD")
          .setValue(this.eventDate)
          .onChange(value => {
            this.eventDate = value;
          });
        text.inputEl.type = "date";
      });

    new Setting(contentEl)
      .setName("Start time (optional)")
      .setDesc("Leave empty for all-day event")
      .addText(text => {
        text
          .setPlaceholder("HH:MM")
          .setValue(this.startTime)
          .onChange(value => {
            this.startTime = value;
          });
        text.inputEl.type = "time";
      });

    new Setting(contentEl)
      .setName("End time (optional)")
      .setDesc("Leave empty for all-day event")
      .addText(text => {
        text
          .setPlaceholder("HH:MM")
          .setValue(this.endTime)
          .onChange(value => {
            this.endTime = value;
          });
        text.inputEl.type = "time";
      });

    const buttonContainer = contentEl.createDiv({ cls: "modal-button-container" });

    const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
    cancelButton.onclick = () => this.close();

    const createButton = buttonContainer.createEl("button", {
      text: "Create Event",
      cls: "mod-cta"
    });
    createButton.onclick = async () => {
      await this.createEvent();
    };

    contentEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.createEvent();
      }
    });
  }

  async createEvent() {
    if (!this.eventName.trim()) {
      new Notice("Please enter an event name");
      return;
    }

    if (!this.eventDate.trim()) {
      new Notice("Please enter a date");
      return;
    }

    if (!isValidDateString(this.eventDate)) {
      new Notice("Invalid date. Please check month and day values.");
      return;
    }

    if (this.startTime && !isValidTimeString(this.startTime)) {
      new Notice("Invalid start time. Use HH:MM (00:00 - 23:59)");
      return;
    }
    if (this.endTime && !isValidTimeString(this.endTime)) {
      new Notice("Invalid end time. Use HH:MM (00:00 - 23:59)");
      return;
    }
    if (this.startTime && this.endTime && !isValidTimeRange(this.startTime, this.endTime)) {
      new Notice("End time must be after start time");
      return;
    }

    try {
      let frontmatter = "---\n";
      for (const field of this.plugin.settings.fieldOrder) {
        if (!this.plugin.settings.frontmatterFields[field as keyof typeof this.plugin.settings.frontmatterFields]) {
          continue;
        }
        switch (field) {
          case "tags":
            frontmatter += "tags: event\n";
            break;
          case "date":
            frontmatter += `date: ${this.eventDate}\n`;
            break;
          case "startTime":
            if (this.startTime) {
              frontmatter += `startTime: \"${this.startTime}\"\n`;
            }
            break;
          case "endTime":
            if (this.endTime) {
              frontmatter += `endTime: \"${this.endTime}\"\n`;
            }
            break;
          case "done":
            frontmatter += "done: false\n";
            break;
        }
      }
      frontmatter += "---\n";

      const folderPath = normalizePath(this.plugin.settings.eventFolder || "");
      let fileName = this.eventName.trim().replace(/[\\/:*?"<>|]/g, "-");
      let filePath = folderPath
        ? normalizePath(`${folderPath}/${fileName}.md`)
        : `${fileName}.md`;

      // Check for duplicate files and append number if needed
      let counter = 1;
      while (this.app.vault.getAbstractFileByPath(filePath)) {
        const newFileName = `${fileName}-${counter}`;
        filePath = folderPath
          ? normalizePath(`${folderPath}/${newFileName}.md`)
          : `${newFileName}.md`;
        counter++;
      }

      if (folderPath) {
        const folder = this.app.vault.getAbstractFileByPath(folderPath);
        if (!folder) {
          await this.app.vault.createFolder(folderPath);
        }
      }

      const file = await this.app.vault.create(filePath, frontmatter);

      // Show which file was created (helpful if renamed due to duplicate)
      const createdFileName = file.basename;
      if (createdFileName !== this.eventName) {
        new Notice(`Event created as "${createdFileName}" (original name already existed)`);
      } else {
        new Notice(`Event "${this.eventName}" created!`);
      }
      this.close();

    } catch (error) {
      new Notice("Error creating event. The file might already exist.");
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}
