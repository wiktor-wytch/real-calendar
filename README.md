# Real Calendar

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Obsidian](https://img.shields.io/badge/Obsidian-1.0.0+-purple.svg)

A powerful calendar plugin for Obsidian that displays events from markdown files with frontmatter. View your events in month, week, or day views, create events easily, and embed calendars anywhere in your notes.

![Calendar Preview](https://via.placeholder.com/800x400/4a90e2/ffffff?text=Calendar+Month+View)
*Add a screenshot of the month view here*

## Features

- 📅 **Multiple View Modes**: Switch between month, week, and day views
- ➕ **Easy Event Creation**: Create events via command or modal dialog
- 📝 **Event Management**: Track event completion, times, and dates
- 🎨 **Embedded Calendars**: Embed calendars in any note using code blocks
- ⚙️ **Customizable**: Configure event folders, week start day, and frontmatter fields
- 🔄 **Real-time Updates**: Automatically syncs with file changes
- 📱 **Mobile Compatible**: Works on desktop and mobile Obsidian apps
- ⌨️ **Keyboard Navigation**: Navigate with arrow keys and keyboard shortcuts

![Week View](https://via.placeholder.com/800x400/50c878/ffffff?text=Calendar+Week+View)
*Add a screenshot of the week view here*

![Day View](https://via.placeholder.com/800x400/ff6b6b/ffffff?text=Calendar+Day+View)
*Add a screenshot of the day view here*

## Installation

### From Obsidian Community Plugins

1. Open Obsidian Settings
2. Go to **Community plugins**
3. Search for "Real Calendar"
4. Click **Install** and then **Enable**

### Manual Installation

1. Download the latest release from [GitHub Releases](https://github.com/wiktor-wytch/real-calendar/releases)
2. Extract the files to your vault's `.obsidian/plugins/real-calendar/` directory
3. Reload Obsidian or restart the app

## Quick Start

### Creating Your First Event

1. Open the command palette (`Ctrl/Cmd + P`)
2. Run **"Real Calendar: Create new event"**
3. Fill in the event details:
   - Event name
   - Date (YYYY-MM-DD)
   - Start time (optional, HH:MM format)
   - End time (optional, HH:MM format)
4. Click **Create Event**

![Create Event Modal](https://via.placeholder.com/600x400/9b59b6/ffffff?text=Create+Event+Modal)
*Add a screenshot of the create event modal here*

### Opening the Calendar View

- Click the calendar icon in the ribbon
- Or open the command palette and search for "Real Calendar"

## Usage

### Event File Format

Events are markdown files with frontmatter. Create a file with the following structure:

```markdown
---
tags: event
date: 2025-12-25
startTime: "14:00"
endTime: "15:30"
done: false
---

# Your Event Title

Your event description goes here.
```

#### Required Fields

- **`tags: event`** - Must include the `event` tag
- **`date`** - Date in YYYY-MM-DD format

#### Optional Fields

- **`startTime`** - Start time in HH:MM format (use quotes: `"14:00"`)
- **`endTime`** - End time in HH:MM format (use quotes: `"15:30"`)
- **`done`** - Set to `true` to mark as completed

### Embedding Calendars

Embed calendars in any note using a code block:

````markdown
```real-calendar
view: month
showCompleted: false
folder: projects/events
```
````

#### Embed Options

- **`view`** - Calendar view mode: `month`, `week`, or `day` (default: `month`)
- **`showCompleted`** - Show completed events: `true` or `false` (default: uses plugin setting)
- **`folder`** - Filter events to a specific folder path (default: all folders)

![Embedded Calendar](https://via.placeholder.com/800x300/34495e/ffffff?text=Embedded+Calendar+Example)
*Add a screenshot showing an embedded calendar in a note here*

## Settings

Access settings via **Settings → Real Calendar**.

### General Settings

- **Event folder**: Specify a folder to scan for events (leave empty to scan all folders)
- **Week starts on**: Choose Sunday or Monday as the first day of the week
- **Show completed events**: Toggle to show/hide completed events globally
- **Default view**: Set the default view mode when opening the calendar

### Frontmatter Customization

- **Include 'done' field**: Toggle whether to include the `done` field in new events
- **Field order**: Drag and drop to reorder frontmatter fields

![Settings Panel](https://via.placeholder.com/600x500/e74c3c/ffffff?text=Settings+Panel)
*Add a screenshot of the settings panel here*

## View Modes

### Month View

See all events for the current month in a traditional calendar grid layout.

- Click events to open the corresponding file
- Right-click events to move to trash
- Navigate with arrow buttons or arrow keys
- Press `T` to jump to today

### Week View

View events for the current week in a horizontal layout.

- See all 7 days side-by-side
- Easy to spot time conflicts
- Perfect for weekly planning

### Day View

Focus on a single day with a detailed event list.

- See all events for the selected day
- Displays event times and status
- Clean, focused interface

## Keyboard Shortcuts

- **Arrow Left/Right**: Navigate to previous/next period
- **T**: Jump to today
- **Enter/Space**: Open event file (when focused on an event)

## Event Status Indicators

Events are color-coded for quick visual reference:

- 🟢 **Upcoming**: Events in the future
- 🔴 **Overdue**: Events that have passed (not completed)
- ✅ **Completed**: Events marked as done

![Event Status Colors](https://via.placeholder.com/400x200/27ae60/ffffff?text=Event+Status+Colors)
*Add a screenshot showing different event status colors here*

## Workflow Tips

### Organizing Events

1. **Use folders**: Set an event folder in settings to organize your events
2. **Naming convention**: Use descriptive names for easy identification
3. **Completion tracking**: Mark events as done by setting `done: true` in frontmatter

### Daily Workflow

1. Open the calendar view in the morning
2. Review the day view for today's events
3. Check week view for upcoming events
4. Mark events as complete when finished

### Embedding Workflows

- Embed a calendar in your daily note template
- Create project-specific calendars using folder filtering
- Use different views for different purposes (month for overview, day for focus)

![Workflow Example](https://via.placeholder.com/800x400/3498db/ffffff?text=Workflow+Example)
*Add a GIF showing a typical workflow here*

## Troubleshooting

### Events Not Showing

1. Check that your files have the `tags: event` in frontmatter
2. Verify the date format is YYYY-MM-DD
3. Ensure files are in the configured event folder (if set)
4. Use the "Rescan vault" button in settings

### Calendar Not Updating

- Events update automatically when files change
- If needed, manually refresh by clicking the calendar icon again
- Use "Rescan vault" in settings for a full refresh

### Build Issues

If you're building from source:

```bash
npm install
npm run build
```

## Development

### Building from Source

```bash
git clone https://github.com/wiktor-wytch/real-calendar.git
cd real-calendar
npm install
npm run build
```

### Development Mode

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/wiktor-wytch/real-calendar/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/wiktor-wytch/real-calendar/discussions)
- 📧 **Contact**: [GitHub Profile](https://github.com/wiktor-wytch)

## License

This project is licensed under the ISC License.

## Acknowledgments

- Built for the Obsidian community
- Inspired by the need for a simple, file-based calendar system

---

**Made with ❤️ for Obsidian users**

*Star this repo if you find it useful!*

