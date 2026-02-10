# Saved Templates Implementation Guide

## Overview

This implementation adds the ability to save campaign templates (both SMS and Email) to the database and reuse them across campaigns. Templates are accessible from:
1. **Campaign Builder** - Load and save templates while creating/editing campaigns
2. **Settings/Templates Page** - View and manage all saved templates

## Features

### 1. Save Template from Campaign
- Users can save their current campaign content as a reusable template
- Works for both Email and SMS campaigns
- Automatically extracts variables (e.g., `{{first_name}}`, `{{store_name}}`)
- Templates are stored per store

### 2. Load Template in Campaign
- Browse saved templates while editing a campaign
- Search templates by name
- Preview template content before loading
- One-click template application

### 3. Template Management
- View all saved templates in Settings
- Edit template names and content
- Delete unused templates
- Filter by type (Email/SMS)

## Database Schema

### campaign_templates Table

```sql
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Fields:**
- `id` - Unique template identifier
- `store_id` - Links template to a specific store
- `name` - User-friendly template name
- `type` - Either 'email' or 'sms'
- `content` - Template content (JSON for email, text for SMS)
- `variables` - Array of variable names used in template (e.g., ["first_name", "store_name"])
- `created_at` - Creation timestamp
- `updated_at` - Last modification timestamp

## Setup Instructions

### 1. Run Database Migration

Execute the SQL script to create the templates table:

```bash
# Using Supabase CLI
supabase db push scripts/create-campaign-templates-table.sql

# Or run directly in Supabase SQL Editor
```

The script creates:
- `campaign_templates` table
- Indexes for performance
- Row Level Security (RLS) policies
- Auto-update trigger for `updated_at`

### 2. Verify Table Creation

Check that the table exists:

```sql
SELECT * FROM campaign_templates LIMIT 1;
```

### 3. Test the Implementation

1. **Create a Campaign**
   - Go to Campaigns → Create New Campaign
   - Design your email or compose your SMS
   - Click "Save as Template"
   - Enter a template name
   - Template is saved to database

2. **Load a Template**
   - Edit any campaign
   - Click "Load Template"
   - Select a saved template
   - Template content is applied to campaign

3. **View Templates in Settings**
   - Go to Settings → Templates (or Campaigns → Templates)
   - See all saved templates
   - Search, filter, edit, or delete templates

## API Endpoints

### GET /api/campaigns/templates
Get all templates for the current user's stores

**Query Parameters:**
- `type` (optional) - Filter by 'email' or 'sms'

**Response:**
```json
{
  "templates": [
    {
      "id": "uuid",
      "store_id": "uuid",
      "name": "Welcome Email",
      "type": "email",
      "content": "[...]",
      "variables": ["first_name", "store_name"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/campaigns/templates
Create a new template

**Request Body:**
```json
{
  "name": "Flash Sale SMS",
  "type": "sms",
  "content": "🔥 FLASH SALE: {{discount_percent}}% off! Use code {{code}}",
  "variables": ["discount_percent", "code"],
  "store_id": "uuid"
}
```

**Response:**
```json
{
  "template": {
    "id": "uuid",
    "store_id": "uuid",
    "name": "Flash Sale SMS",
    "type": "sms",
    "content": "🔥 FLASH SALE: {{discount_percent}}% off! Use code {{code}}",
    "variables": ["discount_percent", "code"],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### GET /api/campaigns/templates/[id]
Get a specific template

### PUT /api/campaigns/templates/[id]
Update a template

**Request Body:**
```json
{
  "name": "Updated Template Name",
  "content": "Updated content",
  "variables": ["var1", "var2"]
}
```

### DELETE /api/campaigns/templates/[id]
Delete a template

## Components

### SaveTemplateModal
Modal dialog for saving current campaign as a template

**Props:**
- `isOpen: boolean` - Show/hide modal
- `onClose: () => void` - Close handler
- `onSave: (name: string) => Promise<void>` - Save handler
- `type: 'email' | 'sms'` - Campaign type

**Usage:**
```tsx
<SaveTemplateModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onSave={handleSaveTemplate}
  type="email"
/>
```

### TemplateSelector
Modal dialog for browsing and selecting templates

**Props:**
- `isOpen: boolean` - Show/hide modal
- `onClose: () => void` - Close handler
- `onSelect: (template: Template) => void` - Selection handler
- `type: 'email' | 'sms'` - Filter templates by type

**Usage:**
```tsx
<TemplateSelector
  isOpen={showSelector}
  onClose={() => setShowSelector(false)}
  onSelect={handleLoadTemplate}
  type="sms"
/>
```

## Variable Extraction

Templates automatically extract variables using regex pattern: `/\{\{(\w+)\}\}/g`

**Examples:**
- `{{first_name}}` → extracts "first_name"
- `{{store_name}}` → extracts "store_name"
- `{{discount_percent}}` → extracts "discount_percent"

Variables are stored in the `variables` JSONB field for easy reference.

## Email Template Content Structure

Email templates store content as JSON array of elements:

```json
[
  {
    "id": "element_123",
    "type": "text",
    "content": {
      "text": "Hello {{first_name}}!",
      "tag": "h1",
      "alignment": "center"
    },
    "styles": {
      "fontSize": "32px",
      "color": "#10b981"
    }
  },
  {
    "id": "element_456",
    "type": "button",
    "content": {
      "text": "Shop Now",
      "link": "{{shop_url}}",
      "alignment": "center"
    },
    "styles": {
      "backgroundColor": "#10b981",
      "color": "#ffffff"
    }
  }
]
```

## SMS Template Content Structure

SMS templates store content as plain text:

```
🔥 FLASH SALE: {{discount_percent}}% off everything! 
Use code {{discount_code}} at checkout. 
Shop now: {{shop_url}}
```

## Security

### Row Level Security (RLS)
Templates are protected by RLS policies:

1. **SELECT** - Users can only view templates from their stores
2. **INSERT** - Users can only create templates for their stores
3. **UPDATE** - Users can only update templates from their stores
4. **DELETE** - Users can only delete templates from their stores

### Validation
- Template names are required
- Type must be 'email' or 'sms'
- Content is required
- Store ID must belong to the authenticated user

## Best Practices

### 1. Template Naming
- Use descriptive names: "Welcome Email - New Customers"
- Include purpose: "Flash Sale SMS - 50% Off"
- Avoid generic names: "Template 1", "Test"

### 2. Variable Usage
- Use consistent variable names across templates
- Document required variables
- Provide default values when possible
- Common variables: `first_name`, `last_name`, `email`, `phone`, `store_name`, `shop_url`

### 3. Template Organization
- Create templates for common scenarios
- Keep templates updated
- Delete unused templates
- Use search to find templates quickly

### 4. Content Guidelines
- **Email**: Keep designs responsive and mobile-friendly
- **SMS**: Stay under 160 characters when possible
- **Both**: Test variables before saving
- **Both**: Include opt-out instructions for SMS

## Troubleshooting

### Templates Not Showing
1. Check if `campaign_templates` table exists
2. Verify RLS policies are enabled
3. Ensure user has access to stores
4. Check browser console for errors

### Save Template Fails
1. Verify store_id is provided
2. Check template name is not empty
3. Ensure content is valid
4. Check API endpoint is accessible

### Load Template Fails
1. Verify template content format
2. Check for JSON parsing errors (email)
3. Ensure template type matches campaign type
4. Verify template still exists in database

## Future Enhancements

Potential improvements:
1. **Template Categories** - Organize templates by category (welcome, promotional, etc.)
2. **Template Sharing** - Share templates between stores
3. **Template Versioning** - Track template changes over time
4. **Template Preview** - Preview templates before loading
5. **Template Analytics** - Track template usage and performance
6. **Template Marketplace** - Browse and install community templates
7. **Template Duplication** - Clone existing templates
8. **Bulk Operations** - Import/export multiple templates

## Testing Checklist

- [ ] Create email template from campaign
- [ ] Create SMS template from campaign
- [ ] Load email template into campaign
- [ ] Load SMS template into campaign
- [ ] View templates in settings
- [ ] Search templates
- [ ] Filter templates by type
- [ ] Edit template name
- [ ] Delete template
- [ ] Verify RLS policies work
- [ ] Test with multiple stores
- [ ] Test variable extraction
- [ ] Test with special characters
- [ ] Test with long content
- [ ] Test error handling

## Support

For issues or questions:
1. Check database logs in Supabase
2. Review browser console errors
3. Verify API responses
4. Check RLS policies
5. Review this documentation
