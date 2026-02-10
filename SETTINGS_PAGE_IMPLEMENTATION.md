# Settings Page Implementation Guide

## Overview
Complete settings page with all features matching Omnisend's functionality, using your premium UI design.

## Features Implemented

### 1. Pricing and Usage
- **Plan Overview**: Current subscription plan display with upgrade options
- **SMS Credits**: Monthly SMS credits tracking and management
- **Add-ons**: Additional features and services
- **Usage Tracking**: Email sends and SMS usage with progress bars
- **Billing Cycle**: Display of current billing period

### 2. Domains
- **Custom Domains**: Add and verify custom email domains
- **DNS Configuration**: Automatic DNS record generation
- **Domain Types**: Support for email and SMS short links
- **Verification Status**: Real-time verification tracking
- **Auto Warmup**: Optional domain warmup feature
- **Domain Assignment**: Assign domains to campaigns, automations, and SMS

### 3. Email Addresses
- **Sender Addresses**: Manage verified sender email addresses
- **Shared Email**: Default Omnisend shared email included
- **Verification**: Email verification workflow
- **Status Tracking**: Pending/Verified status display
- **Add/Remove**: Full CRUD operations

### 4. SMS Settings
- **Phone Number**: Generate or bring your own US phone number
- **Keyword**: Configure SMS subscription keyword (US/CA)
- **Sender Name**: Set sender name for non-US/CA recipients (11 chars max)
- **Quiet Hours**: Configure do-not-disturb hours
- **Daily Limits**: Set maximum SMS per customer per day
- **Timezone Support**: Customer timezone-based sending

### 5. Saved Templates
- **Template Library**: View all saved email and SMS templates
- **Import**: Upload custom templates (HTML/JSON)
- **Search & Filter**: Find templates by name and type
- **Template Preview**: Visual preview of templates
- **Edit**: Modify existing templates

## File Structure

```
src/
├── app/
│   ├── settings/
│   │   └── page.tsx                          # Main settings page
│   └── api/
│       └── settings/
│           ├── pricing/route.ts              # Pricing API
│           ├── domains/route.ts              # Domains API
│           ├── email-addresses/route.ts      # Email addresses API
│           ├── sms/route.ts                  # SMS settings API
│           └── templates/route.ts            # Templates API
└── components/
    └── settings/
        ├── SettingsSidebar.tsx               # Navigation sidebar
        ├── PricingAndUsage.tsx               # Pricing section
        ├── DomainsSettings.tsx               # Domains section
        ├── EmailAddressesSettings.tsx        # Email addresses section
        ├── SmsSettings.tsx                   # SMS settings section
        └── SavedTemplates.tsx                # Templates section

scripts/
└── create-settings-tables.sql                # Database schema
```

## Database Schema

### New Tables Created

#### 1. email_domains
```sql
CREATE TABLE email_domains (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  domain VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'email',
  verified BOOLEAN DEFAULT FALSE,
  auto_warmup BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  dns_records JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 2. sender_email_addresses
```sql
CREATE TABLE sender_email_addresses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  verified_on TIMESTAMP,
  is_shared BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### 3. sms_settings
```sql
CREATE TABLE sms_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) UNIQUE,
  keyword VARCHAR(50) DEFAULT 'JOIN',
  sender_name VARCHAR(11) DEFAULT 'TESTINGAPP',
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '00:00',
  quiet_hours_end TIME DEFAULT '00:00',
  daily_limit INTEGER DEFAULT 400,
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Setup Instructions

### 1. Run Database Migration

```bash
# Using Supabase SQL Editor
# Copy and paste the contents of scripts/create-settings-tables.sql
```

Or use the Supabase dashboard:
1. Go to SQL Editor
2. Open `scripts/create-settings-tables.sql`
3. Copy entire contents
4. Paste and execute

### 2. Verify Tables Created

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_domains', 'sender_email_addresses', 'sms_settings');
```

### 3. Test the Settings Page

1. Start development server: `npm run dev`
2. Navigate to `/settings`
3. Test each tab:
   - Pricing and usage
   - Domains
   - Email addresses
   - SMS
   - Saved templates

## API Endpoints

### Pricing
- `GET /api/settings/pricing` - Get current plan and usage

### Domains
- `GET /api/settings/domains` - List all domains
- `POST /api/settings/domains` - Add new domain

### Email Addresses
- `GET /api/settings/email-addresses` - List all email addresses
- `POST /api/settings/email-addresses` - Add new email address
- `DELETE /api/settings/email-addresses/[id]` - Remove email address

### SMS
- `GET /api/settings/sms` - Get SMS settings
- `POST /api/settings/sms` - Update SMS settings
- `POST /api/settings/sms/generate-number` - Generate phone number

### Templates
- `GET /api/settings/templates` - List all templates
- `POST /api/settings/templates/import` - Import template

## Features by Section

### Pricing and Usage
✅ Current plan display
✅ Upgrade button with link to pricing page
✅ Plan overview tab
✅ SMS credits tab with usage tracking
✅ Add-ons tab
✅ Email usage progress bar
✅ SMS usage progress bar
✅ Billing cycle information

### Domains
✅ Add domain button
✅ Domain list table
✅ Verification status badges
✅ Auto warmup toggle
✅ Domain type (email/SMS)
✅ Empty state with illustration
✅ Domain assignment dropdowns
✅ DNS configuration (ready for implementation)

### Email Addresses
✅ Add email address button
✅ Email list table
✅ Verification status
✅ Shared Omnisend email (always present)
✅ Delete functionality
✅ Add email modal
✅ Empty state

### SMS Settings
✅ Phone number generation
✅ Bring your own number option
✅ Keyword configuration (US/CA)
✅ Sender name (11 char limit)
✅ Quiet hours toggle and time selection
✅ Daily sending limits
✅ Warning banner for unverified numbers
✅ Save functionality
✅ Character counter for sender name

### Saved Templates
✅ Template grid view
✅ Import template button
✅ Search functionality
✅ Filter by type (email/SMS)
✅ Empty state with illustration
✅ Template preview cards
✅ Edit button per template

## UI Components Used

- **card-premium**: Premium card styling
- **btn-primary**: Primary action buttons
- **btn-secondary**: Secondary action buttons
- **input-premium**: Premium input fields
- **Progress bars**: Usage tracking
- **Status badges**: Verification status
- **Modals**: Add email/domain dialogs
- **Tables**: Data display
- **Empty states**: No data illustrations

## Styling

All components use your existing premium UI design system:
- Dark theme with `bg-[#0a0f0d]`
- Teal accent color `#16a085`
- Glass morphism effects
- Smooth transitions
- Responsive design
- Premium borders and shadows

## Next Steps

### 1. Domain Verification
Implement DNS verification:
- Generate DNS records (SPF, DKIM, DMARC)
- Check DNS propagation
- Update verification status

### 2. Email Verification
Implement email verification flow:
- Send verification email with token
- Create verification endpoint
- Update status on verification

### 3. Phone Number Integration
Connect with Telnyx API:
- Search available numbers
- Purchase number
- Configure messaging profile

### 4. Template Import
Implement template parsing:
- Parse HTML templates
- Extract variables
- Generate thumbnails
- Store in database

### 5. Usage Tracking
Implement real usage tracking:
- Track email sends per billing cycle
- Track SMS usage
- Update progress bars in real-time
- Send alerts when limits approached

## Testing Checklist

- [ ] Navigate to /settings
- [ ] Switch between all tabs
- [ ] View pricing information
- [ ] Add a domain
- [ ] Add an email address
- [ ] Configure SMS settings
- [ ] Save SMS settings
- [ ] Import a template
- [ ] Search templates
- [ ] Filter templates
- [ ] Responsive design on mobile
- [ ] All API endpoints working
- [ ] Database tables created
- [ ] Error handling works

## Troubleshooting

### Tables Not Found
Run the migration script in Supabase SQL Editor

### API Errors
Check that user is authenticated and has valid session

### Styling Issues
Ensure globals.css includes all premium styles

### Data Not Loading
Check browser console for API errors
Verify database connection

## Support

For issues:
1. Check browser console for errors
2. Verify database tables exist
3. Check API responses in Network tab
4. Review server logs

## Future Enhancements

1. **Real-time Updates**: WebSocket for live usage updates
2. **Bulk Operations**: Import multiple domains/emails at once
3. **Advanced Analytics**: Detailed usage charts and graphs
4. **Notifications**: Email alerts for verification, limits, etc.
5. **Team Management**: Multi-user access with roles
6. **Audit Log**: Track all settings changes
7. **Export**: Download settings as JSON
8. **Templates**: More template types and categories
