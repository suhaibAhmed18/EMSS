# Saved Templates - Campaign Integration

## Overview
The Saved Templates section in Settings now displays templates from multiple sources:
- Custom imported templates
- Email campaigns (automatically shown as templates)
- SMS campaigns (automatically shown as templates)

This allows users to view all their campaign content in one centralized location and reuse them as templates.

## Features

### 1. Unified Template View
All templates are displayed together in the Saved Templates section, regardless of their source:
- **Custom Templates**: Imported by users through the Import feature
- **Email Campaigns**: Automatically pulled from `email_campaigns` table
- **SMS Campaigns**: Automatically pulled from `sms_campaigns` table

### 2. Source Identification
Templates from campaigns are marked with a "Campaign" badge to distinguish them from custom templates.

### 3. Template Filtering
Users can filter templates by type:
- All Types
- Email
- SMS

### 4. Search Functionality
Search across all templates by name, regardless of source.

## Implementation Details

### API Endpoint: GET /api/settings/templates

The endpoint now fetches templates from three sources:

1. **Custom Templates** (from `templates` table)
   ```sql
   SELECT * FROM templates 
   WHERE user_id = ? 
   AND is_custom = true
   ```

2. **Email Campaigns** (from `email_campaigns` table)
   ```sql
   SELECT id, name, subject, html_content, text_content, created_at, updated_at
   FROM email_campaigns
   WHERE store_id IN (user's store IDs)
   ```

3. **SMS Campaigns** (from `sms_campaigns` table)
   ```sql
   SELECT id, name, message, created_at, updated_at
   FROM sms_campaigns
   WHERE store_id IN (user's store IDs)
   ```

### Data Transformation

Campaign data is transformed into a unified template format:

**Email Campaign → Template:**
```typescript
{
  id: campaign.id,
  name: campaign.name,
  type: 'email',
  subject: campaign.subject,
  html: campaign.html_content,
  message: campaign.text_content,
  source: 'campaign',
  createdAt: campaign.created_at,
  updatedAt: campaign.updated_at
}
```

**SMS Campaign → Template:**
```typescript
{
  id: campaign.id,
  name: campaign.name,
  type: 'sms',
  message: campaign.message,
  source: 'campaign',
  createdAt: campaign.created_at,
  updatedAt: campaign.updated_at
}
```

### Response Format

```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Welcome Email",
      "type": "email",
      "subject": "Welcome to our store!",
      "html": "<html>...</html>",
      "message": "Plain text version",
      "source": "campaign",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Flash Sale SMS",
      "type": "sms",
      "message": "Flash sale! 50% off today only.",
      "source": "campaign",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z"
    },
    {
      "id": "custom-123",
      "name": "Custom Newsletter",
      "type": "email",
      "source": "custom",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

## Frontend Component Updates

### SavedTemplates.tsx

**New Features:**
1. **Campaign Badge**: Templates from campaigns show a "Campaign" badge
2. **Action Button**: 
   - "Edit" for custom templates
   - "View" for campaign templates
3. **Date Handling**: Supports both `updatedAt` and `updated_at` field names

**Visual Indicators:**
```tsx
{template.source === 'campaign' && (
  <span className="text-xs px-2 py-0.5 bg-[#16a085]/20 text-[#16a085] rounded-full">
    Campaign
  </span>
)}
```

## User Experience

### Viewing Templates

1. Navigate to **Settings > Saved Templates**
2. See all templates from:
   - Custom imports
   - Email campaigns
   - SMS campaigns
3. Filter by type (All/Email/SMS)
4. Search by name
5. Click to view/edit

### Template Sources

**Custom Templates:**
- Imported by user
- Fully editable
- Show "Edit" button

**Campaign Templates:**
- Automatically synced from campaigns
- Show "Campaign" badge
- Show "View" button
- Reflect latest campaign content

## Benefits

1. **Centralized View**: All marketing content in one place
2. **Reusability**: Easy access to past campaign content
3. **Organization**: Filter and search across all templates
4. **Efficiency**: No need to recreate similar campaigns
5. **Consistency**: Maintain brand consistency by reusing proven templates

## Database Schema

No schema changes required. The implementation uses existing tables:

- `templates` - Custom templates
- `email_campaigns` - Email campaign data
- `sms_campaigns` - SMS campaign data
- `user_stores` - User-store relationships

## Security

- Templates are filtered by user's store access
- Only campaigns from user's stores are shown
- Authentication required for all endpoints
- Row-level security policies enforced

## Future Enhancements

Potential improvements:
1. Save campaign as custom template (copy functionality)
2. Template preview modal
3. Template usage statistics
4. Template categories/tags
5. Duplicate template functionality
6. Template sharing between team members
7. Template versioning
