# MarketingPro - Premium Shopify Email & SMS Marketing Platform

A production-ready, premium email and SMS marketing platform built specifically for Shopify stores. Features a sleek black theme, advanced automation, analytics, and full compliance with GDPR and CAN-SPAM regulations.

## 🚀 Features

### Core Functionality
- **Shopify Integration**: OAuth connection with 5-minute setup
- **Email Marketing**: Professional campaigns with custom domain support via Resend
- **SMS Marketing**: Cost-effective messaging through Telnyx ($0.002-$0.004 per message)
- **Marketing Automation**: Drag-and-drop workflow builder
- **Advanced Analytics**: Revenue attribution and ROI tracking
- **Contact Management**: Customer segmentation and data encryption
- **Compliance**: GDPR, CAN-SPAM, and consent management

### Premium UI/UX
- **Black Theme**: Professional dark interface with premium styling
- **Responsive Design**: Works perfectly on all devices
- **Drag & Drop**: Visual campaign and automation builders
- **Real-time Analytics**: Live performance dashboards
- **Premium Components**: Custom-designed UI components

### Technical Stack
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Email Provider**: Resend
- **SMS Provider**: Telnyx
- **Styling**: Tailwind CSS with custom premium theme
- **Icons**: Lucide React
- **Hosting**: Vercel (Serverless)

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Supabase account
- Resend account
- Telnyx account
- Shopify Partner account (for app development)

### 1. Clone and Install

```bash
git clone <repository-url>
cd shopify-marketing-platform
npm install
```

### 2. Environment Configuration

Copy `.env.local.example` to `.env.local` and configure:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Shopify OAuth Configuration
SHOPIFY_CLIENT_ID=your_shopify_client_id
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret
SHOPIFY_WEBHOOK_SECRET=your_shopify_webhook_secret

# Email Provider Configuration (Resend)
RESEND_API_KEY=re_your_resend_api_key

# SMS Provider Configuration (Telnyx)
TELNYX_API_KEY=your_telnyx_api_key
TELNYX_PHONE_NUMBER=+1234567890

# Application Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-key-32-chars-minimum
DATA_ENCRYPTION_KEY=your-data-encryption-key-32-chars-minimum
```

### 3. Database Setup

1. Create a new Supabase project
2. Run the database migrations:

```sql
-- Run the SQL commands from supabase/migrations/
-- This will create all necessary tables and policies
```

### 4. External Service Setup

#### Resend Setup
1. Create account at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your domain for custom email sending

#### Telnyx Setup
1. Create account at [telnyx.com](https://telnyx.com)
2. Purchase a phone number
3. Get your API key from the dashboard

#### Shopify App Setup
1. Create a Shopify Partner account
2. Create a new app in Partner Dashboard
3. Configure OAuth scopes: `read_customers,read_orders,read_products,write_customers`
4. Set redirect URL: `https://yourdomain.com/api/auth/shopify/callback`

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── analytics/         # Analytics dashboard
│   ├── auth/             # Authentication pages
│   ├── automations/      # Marketing automation
│   ├── campaigns/        # Email/SMS campaigns
│   ├── contacts/         # Contact management
│   ├── dashboard/        # Main dashboard
│   └── settings/         # Platform settings
├── components/           # Reusable UI components
│   ├── navigation.tsx    # Main navigation
│   └── ui/              # UI components
├── lib/                 # Core business logic
│   ├── auth/           # Authentication
│   ├── campaigns/      # Campaign management
│   ├── contacts/       # Contact management
│   ├── database/       # Database utilities
│   ├── email/          # Email services
│   ├── shopify/        # Shopify integration
│   └── sms/           # SMS services
└── types/              # TypeScript definitions
```

## 🎨 Premium Theme

The application features a professional black theme with:

- **Dark Background**: Pure black (#000000) with gray accents
- **Premium Typography**: Clean, modern fonts with proper hierarchy
- **Gradient Accents**: Blue to purple gradients for CTAs and highlights
- **Smooth Animations**: Subtle transitions and hover effects
- **Premium Cards**: Elevated cards with subtle shadows and borders
- **Professional Forms**: Custom-styled inputs and buttons

## 🔧 Key Components

### Dashboard
- Revenue overview with charts
- Campaign performance metrics
- Quick action buttons
- Recent activity feed

### Campaign Builder
- Step-by-step wizard
- Visual email editor
- SMS message composer
- Recipient targeting
- Scheduling options

### Automation Builder
- Drag-and-drop workflow designer
- Trigger configuration
- Action setup
- Performance tracking

### Analytics
- Revenue attribution
- Campaign performance
- Customer insights
- Export capabilities

## 🚀 Deployment

### Vercel Deployment

1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

Ensure all environment variables are set in your production environment:
- Database URLs and keys
- API keys for external services
- Authentication secrets
- Encryption keys

## 📊 Performance Features

- **Serverless Architecture**: Scales automatically with Vercel
- **Database Optimization**: Efficient queries with proper indexing
- **Caching**: Strategic caching for better performance
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting for faster loads

## 🔒 Security Features

- **Data Encryption**: Customer data encrypted at rest
- **OAuth Security**: Secure Shopify authentication
- **CSRF Protection**: Built-in CSRF protection
- **Input Validation**: Comprehensive input validation
- **Rate Limiting**: API rate limiting for abuse prevention

## 🧪 Testing

```bash
# Run all tests
npm test

# Run property-based tests
npm test -- --testPathPatterns="property.test"

# Run specific test file
npm test -- campaigns.test.ts
```

## 📝 API Documentation

### Shopify Webhooks
- `POST /api/webhooks/shopify` - Handle Shopify webhooks
- Supports: order creation, payment, customer updates

### Campaign API
- `POST /api/campaigns/email` - Create email campaign
- `POST /api/campaigns/sms` - Create SMS campaign
- `GET /api/campaigns` - List campaigns

### Analytics API
- `GET /api/analytics/overview` - Get overview metrics
- `GET /api/analytics/campaigns` - Get campaign performance
- `GET /api/analytics/revenue` - Get revenue data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Create an issue in the repository

## 🎯 Roadmap

- [ ] Advanced segmentation features
- [ ] A/B testing for campaigns
- [ ] Advanced automation triggers
- [ ] Multi-language support
- [ ] White-label options
- [ ] Advanced reporting features

---

Built with ❤️ for Shopify merchants who want to grow their business with professional marketing automation.