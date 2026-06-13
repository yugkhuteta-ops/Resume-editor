# Local-First Resume Editor

A professional resume editor that works entirely in your browser with local storage.

## Features

- **Local-First Storage**: Resume saved in IndexedDB on your device (no server)
- **View/Edit Mode**: Toggle between editing and preview modes via top nav
- **AI Assistant**: Context-aware help via OpenAI API (enter key in sidebar)
- **PDF Export**: Clean, ATS-friendly PDF via browser print (Ctrl+P)
- **Version History**: Auto-saved before PDF export, up to 50 versions
- **Backup/Import**: JSON export/import for portability between devices
- **ATS Analysis**: Real-time health score in footer

## Setup & Run

```bash
cd resume-editor
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. **Edit Mode** (default): Click any text to edit inline
2. **View Mode**: Click "View Mode" to preview final resume
3. **PDF Export**: Click "Export PDF" or press Ctrl+P to save as PDF
4. **Backup**: Click "Backup" to export JSON, "Import" to restore
5. **AI Assistant**: Click "AI" and enter OpenAI API key for help

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+P | Export PDF |
| Ctrl+S      | Save version |
| Ctrl+Z      | Undo |
| Ctrl+Shift+Z | Redo |

## Project Structure

```
src/
├── components/
│   ├── ResumeTemplate.tsx     # Main resume layout with section controls
│   ├── EditableText.tsx       # Inline editable text component
│   ├── AIChatSidebar.tsx      # OpenAI chat interface
│   ├── ATSAnalyzer.tsx        # Resume health & ATS analysis
│   ├── VersionHistory.tsx     # Version history panel
│   └── sections/
│       ├── ContactSection.tsx
│       ├── SummarySection.tsx
│       ├── SkillsSection.tsx
│       ├── ExperienceSection.tsx
│       ├── ProjectsSection.tsx
│       ├── EducationSection.tsx
│       └── AchievementsSection.tsx
├── hooks/
│   └── useStorage.ts          # IndexedDB storage with autosave
└── types.ts                   # TypeScript interfaces & sample data
```

## AI Assistant Capabilities

- Rewrite bullets for impact
- Shorten/expand content
- Improve tone and clarity
- Suggest stronger action verbs
- Improve ATS friendliness
- Tailor resume for roles
- Identify missing metrics