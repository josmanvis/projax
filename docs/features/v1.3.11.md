# New Features - v1.3.11

## 🏷️ Tags Feature

Add custom tags to projects for better organization and context.

### Features

- ✅ **Add Tags**: Click "+ Add Tag" in project details
- ✅ **Remove Tags**: Click × on any tag to remove it
- ✅ **Tag Suggestions**: Auto-suggests existing tags as you type
- ✅ **Tag Display**: Tags shown in project list and details
- ✅ **Search by Tags**: Search includes tag matching
- ✅ **Persistent**: Tags stored in database

### UI Improvements

**Project List**:
- Removed "Last Scanned" time display
- Added tag pills below project description
- Cleaner, more focused view

**Project Details**:
- New "Tags" section after stats
- Add/remove tags inline
- Auto-complete suggestions from existing tags
- Tags shown as cyan pills with remove button

### Usage

1. **Open a project** in the desktop app
2. **Scroll to Tags section** (below project stats)
3. **Click "+ Add Tag"** button
4. **Type a tag name** (e.g., "frontend", "api", "production")
5. **Press Enter** to add
6. **Click ×** on a tag to remove it

**Tag Suggestions**:
- As you type, existing tags appear as suggestions
- Click a suggestion to use it
- Helps maintain consistent tagging across projects

## 🔍 Enhanced Search & Sort

### Sort Icon Menu

**New sort icon** inside search input (aligned right):
- Click to open sort menu
- 6 sorting options available
- Active sort highlighted with checkmark

### Sort Options

1. **Name (A-Z)** - Alphabetical ascending
2. **Name (Z-A)** - Alphabetical descending  
3. **Recently Scanned** - Most recently scanned first
4. **Oldest First** - By creation date
5. **Most Tests** - Projects with most test files first
6. **Running First** - Projects with running processes first

### Search Enhancement

Search now includes:
- Project names
- Project paths
- **Tags** - Find projects by tag

Example: Search for "api" finds projects with "api" tag

## UI/UX Improvements

### Visual Changes

**Project List Cards**:
- ✅ Removed last scanned timestamp (cleaner)
- ✅ Added tag display
- ✅ Running indicator persists

**Search Bar**:
- ✅ Sort icon inside input (right-aligned)
- ✅ Dropdown sort menu
- ✅ Active state indication

**Tags Section**:
- ✅ Tag pills with hover effects
- ✅ Inline tag editor
- ✅ Auto-complete suggestions
- ✅ Clean, modern design

### Interaction Patterns

**Adding Tags**:
1. Click "+ Add Tag"
2. Type tag name
3. See suggestions (if any)
4. Press Enter or blur to save
5. Press Escape to cancel

**Removing Tags**:
1. Hover over a tag
2. Click × button
3. Tag removed immediately

**Sorting**:
1. Click sort icon in search
2. Select sort option
3. List updates instantly
4. Checkmark shows active sort

## Database Schema Updates

**Projects now include**:
```typescript
interface Project {
  id: number;
  name: string;
  path: string;
  description: string | null;
  framework: string | null;
  last_scanned: number | null;
  created_at: number;
  tags?: string[];  // NEW!
}
```

**New API Endpoint**:
- `GET /api/projects/tags` - Returns all unique tags

**Migration**:
- Existing projects automatically get empty tags array
- No data loss, backward compatible

## Use Cases

### Organize Projects by Type
```
Tags: frontend, backend, api, database, mobile
```

### Mark Environment
```
Tags: dev, staging, production, local
```

### Technology Stack
```
Tags: react, node, python, typescript
```

### Status/Priority
```
Tags: active, archived, wip, urgent
```

### Team/Ownership
```
Tags: team-a, team-b, personal, client
```

## Technical Details

### Implementation

- **Database**: Tags stored as JSON array in project record
- **API**: New `/api/projects/tags` endpoint returns all unique tags
- **Migration**: Auto-adds `tags: []` to existing projects
- **Search**: Tags included in fuzzy search
- **Sort**: Maintains separate sort state
- **Suggestions**: Computed from all project tags, filtered by input

### Performance

- Tag suggestions limited to 5 results
- Tags sorted alphabetically
- Efficient set-based deduplication
- No impact on existing features

---

**Ready for testing in `prx ui`!**

