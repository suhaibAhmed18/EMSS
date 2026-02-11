# Template Save Feature

## Overview
This feature allows users to save customized email and SMS templates to the database for reuse across campaigns. Templates are stored in the `campaign_templates` table and can be accessed from:
- SMS Campaign Builder
- Email Campaign Builder  
- Settings > Saved Templates page

## Database Setup

### 1. Run the Migration
Execute the SQL script to create the `campaign_templates` table:

**Windows:**
```bash
scripts\setup-campaign-templates.bat
```

Or manually run the SQL in Supabase SQL Editor:
```bash
scripts/create-campaign-templates-table.sql
```

### 2. Table Schema
```sql
campaign_templates (
  id UUID PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('email', 'sms')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## Features

### 1. Save Template from SMS Campaign
**Location:** `/campaigns/sms/new` - Step 3 (Customize Message)

- Click "Save as Template" button above the message editor
- Enter a template name in the modal
- Template is saved to database with:
  - Store ID (from current user's store)
  - Template name
  - Type: 'sms'
  - Content: customized message
  - Variables: extracted from template

### 2. Save Template from Email Campaign
**Location:** `/campaigns/email/new` - Step 3 (Customize Template)

- Use the EmailBuilder component's "Save as Template" feature
- Enter a template name
- Template is saved to database with:
  - Store ID (from current user's store)
  - Template name
  - Type: 'email'
  - Content: HTML content
  - Variables: extracted from template

### 3. View Saved Templates in Campaign Builder
**SMS Campaign:** `/campaigns/sms/new` - Step 2 (Choose Template)
- Toggle between "Templates" and "My Templates" tabs
- "My Templates" shows all saved SMS templates from database
- Click any saved template to use it

**Email Campaign:** `/campaigns/email/new` - Step 2 (Choose Template)
- Toggle between "Templates" and "My Templates" tabs
- "My Templates" shows all saved email templates from database
- Click any saved template to use it

### 4. View All Saved Templates in Settings
**Location:** `/settings` - Saved Templates section

- View all saved templates (both email and SMS)
- Filter by type (All, Email, SMS)
- Search templates by name
- Delete templates
- See template preview and metadata

## API Endpoints

### GET `/api/campaigns/templates`
Fetch all templates for the current user's stores.

**Query Parameters:**
- `type` (optional): 'email' or 'sms' to filter by type

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "store_id": "uuid",
      "name": "Flash Sale SMS",
      "type": "sms",
      "content": "🔥 FLASH SALE: 50% off!",
      "variables": ["store_name", "discount_code"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/campaigns/templates`
Create a new template.

**Request Body:**
```json
{
  "store_id": "uuid",
  "name": "Template Name",
  "type": "email" | "sms",
  "content": "Template content (HTML for email, text for SMS)",
  "variables": ["var1", "var2"]
}
```

**Response:**
```json
{
  "template": { /* created template object */ }
}
```

### GET `/api/campaigns/templates/:id`
Fetch a specific template.

### PUT `/api/campaigns/templates/:id`
Update a template.

**Request Body:**
```json
{
  "name": "Updated Name",
  "content": "Updated content",
  "variables": ["updated", "vars"]
}
```

### DELETE `/api/campaigns/templates/:id`
Delete a template.

## Security

### Row Level Security (RLS)
All templates are protected by RLS policies:
- Users can only view templates from their stores
- Users can only create templates for their stores
- Users can only update/delete templates from their stores

### Policies
```sql
-- View: Users can see templates from stores they have access to
-- Create: Users can create templates for stores they have access to
-- Update: Users can update templates from stores they have access to
-- Delete: Users can delete templates from stores they have access to
```

## User Flow

### Saving a Template

1. **Create/Customize Campaign**
   - User creates a new SMS or email campaign
   - User customizes the template content

2. **Save Template**
   - User clicks "Save as Template" button
   - Modal appears asking for template name
   - User enters name and clicks "Save"
   - Template is saved to database
   - Success message appears

3. **Reuse Template**
   - User creates another campaign
   - User navigates to "My Templates" tab
   - User sees their saved template
   - User clicks to select it
   - Template content is loaded into editor

### Managing Templates

1. **View Templates**
   - Navigate to Settings > Saved Templates
   - See all saved templates in grid view
   - Filter by type or search by name

2. **Delete Template**
   - Click delete icon on template card
   - Confirm deletion
   - Template is removed from database

## Technical Implementation

### Components Modified

1. **`src/app/campaigns/sms/new/page.tsx`**
   - Added state for saved templates and save modal
   - Added `loadSavedTemplates()` function
   - Added `handleSaveTemplate()` function
   - Added "My Templates" tab in template selection
   - Added "Save as Template" button in customization step
   - Added save template modal

2. **`src/app/campaigns/email/new/page.tsx`**
   - Updated `loadSavedTemplates()` to use new API endpoint
   - Updated `onSaveAsTemplate` callback to save to database
   - Added "My Templates" tab support
   - Updated template selection logic for saved templates

3. **`src/components/settings/SavedTemplates.tsx`**
   - Updated to fetch from `/api/campaigns/templates`
   - Added delete functionality
   - Updated template display to show content preview
   - Improved UI for template cards

### API Routes

1. **`src/app/api/campaigns/templates/route.ts`**
   - GET: Fetch templates with store filtering
   - POST: Create new template with validation

2. **`src/app/api/campaigns/templates/[id]/route.ts`**
   - GET: Fetch single template
   - PUT: Update template
   - DELETE: Delete template

## Testing

### Manual Testing Steps

1. **Test SMS Template Save**
   - Go to `/campaigns/sms/new`
   - Select a template or start from scratch
   - Customize the message
   - Click "Save as Template"
   - Enter name and save
   - Verify success message
   - Go to "My Templates" tab
   - Verify template appears

2. **Test Email Template Save**
   - Go to `/campaigns/email/new`
   - Select a template
   - Customize in EmailBuilder
   - Click "Save as Template"
   - Enter name and save
   - Verify success message
   - Go to "My Templates" tab
   - Verify template appears

3. **Test Template Reuse**
   - Create new campaign
   - Go to "My Templates" tab
   - Select saved template
   - Verify content loads correctly
   - Customize and save campaign

4. **Test Settings Page**
   - Go to `/settings`
   - Navigate to "Saved Templates"
   - Verify all templates appear
   - Test filter by type
   - Test search
   - Test delete

## Benefits

1. **No Local Storage** - Templates are stored in database, accessible across devices
2. **Multi-Store Support** - Templates are scoped to stores with proper RLS
3. **Centralized Management** - View and manage all templates in one place
4. **Reusability** - Easily reuse successful templates across campaigns
5. **Consistency** - Maintain brand consistency with saved templates

## Future Enhancements

- Template categories/tags
- Template sharing between team members
- Template analytics (usage tracking)
- Template versioning
- Template preview before selection
- Bulk template operations
- Template import/export
