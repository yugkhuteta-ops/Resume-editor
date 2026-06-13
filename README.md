# Local-First Resume Editor

A professional resume editor that works entirely in your browser with local storage.

## Features

- **Local-First Storage**: Resume saved in IndexedDB on your device (no server)
- **5 Resume Templates**: ATS Classic, Harvard, Jake's Style, Modern Professional, Technical SWE
- **4 Export Types**: ATS PDF, Modern PDF, Compact PDF, One Page PDF
- **Print-Optimized CSS**: Professional document output with proper bullets, spacing, and page breaks
- **AI Assistant**: Context-aware help via OpenAI API (enter key in sidebar)
- **Version History**: Auto-saved before PDF export, up to 50 versions
- **Backup/Import**: JSON export/import for portability between devices
- **ATS Analysis**: Real-time health score, keyword matching, job description analysis
- **View/Edit Mode**: Toggle between editing and preview modes via top nav

## Setup & Run

```bash
cd resume-editor
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Usage

1. **Edit Mode** (default): Click any text to edit inline
2. **View Mode**: Click "View" to preview final resume with template styling
3. **PDF Export**: Click "PDF" to open export modal with style/template selection
4. **Templates**: Switch between 5 templates in view mode via the template selector
5. **ATS Analysis**: Expand "Resume Health" footer for scoring and job description matching
6. **Backup**: Click "Backup" to export JSON, "Import" to restore
7. **AI Assistant**: Click "AI" and enter OpenAI API key for help

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+P | Export PDF |
| Ctrl+S      | Save version |
| Ctrl+Z      | Undo |
| Ctrl+Shift+Z | Redo |

## Templates

| Template | Description |
|----------|-------------|
| ATS Classic | Clean, machine-readable format optimized for applicant tracking systems |
| Harvard | Traditional academic-style format with clear hierarchy |
| Jake's Style | Modern single-column layout with centered header |
| Modern Professional | Contemporary design with refined typography |
| Technical SWE | Engineer-optimized layout with skills prominence |

## Export Types

| Export | Use Case |
|--------|----------|
| ATS PDF | Online portals and applicant tracking systems |
| Modern PDF | Direct email submissions |
| Compact PDF | Space-efficient layout for experienced professionals |
| One Page PDF | Aggressively optimized to fit on a single page |

## Project Structure

```
src/
├── components/
│   ├── ResumeTemplate.tsx       # Main resume layout with template support
│   ├── EditableText.tsx         # Inline editable text component
│   ├── AIChatSidebar.tsx        # OpenAI chat interface
│   ├── ATSAnalyzer.tsx          # Resume health & ATS analysis with keyword matching
│   ├── ExportModal.tsx          # Export settings with template/type selection
│   ├── TemplateSelector.tsx     # Template picker for view mode
│   ├── VersionHistory.tsx       # Version history panel
│   └── sections/
│       ├── ContactSection.tsx
│       ├── SummarySection.tsx
│       ├── SkillsSection.tsx
│       ├── ExperienceSection.tsx
│       ├── ProjectsSection.tsx
│       ├── EducationSection.tsx
│       └── AchievementsSection.tsx
├── styles/
│   └── print.css               # Comprehensive print/PDF styles
├── hooks/
│   └── useStorage.ts           # IndexedDB storage with autosave
└── types.ts                    # TypeScript interfaces, templates & sample data
```

## AI Assistant Capabilities

- Rewrite bullets for impact
- Shorten/expand content
- Improve tone and clarity
- Suggest stronger action verbs
- Improve ATS friendliness
- Tailor resume for roles
- Identify missing metrics
