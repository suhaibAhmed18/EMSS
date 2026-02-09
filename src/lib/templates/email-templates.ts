export interface EmailTemplate {
  id: string
  name: string
  description: string
  category: 'welcome' | 'promotional' | 'transactional' | 'newsletter' | 'seasonal'
  thumbnail: string
  subject: string
  preheader: string
  html: string
  variables: string[]
}

export const emailTemplates: EmailTemplate[] = [
  {
    id: 'welcome-1',
    name: 'Welcome New Customer',
    description: 'Warm welcome message for new subscribers',
    category: 'welcome',
    thumbnail: '/templates/welcome-1.png',
    subject: 'Welcome to {{store_name}}!',
    preheader: 'We\'re excited to have you here',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #10b981; font-size: 32px; margin-bottom: 20px; text-align: center;">Welcome to {{store_name}}!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi {{customer_name}},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We're thrilled to have you join our community! Get ready to discover amazing products and exclusive offers.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{shop_url}}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Start Shopping
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Best regards,<br>
            The {{store_name}} Team
          </p>
        </div>
      </div>
    `,
    variables: ['store_name', 'customer_name', 'shop_url']
  },
  {
    id: 'promo-1',
    name: 'Special Discount Offer',
    description: 'Promotional email with discount code',
    category: 'promotional',
    thumbnail: '/templates/promo-1.png',
    subject: '{{discount_percent}}% OFF - Limited Time Only!',
    preheader: 'Don\'t miss out on this exclusive offer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
        <div style="background-color: white; padding: 40px; border-radius: 8px; text-align: center;">
          <h1 style="color: #667eea; font-size: 48px; margin-bottom: 10px;">{{discount_percent}}% OFF</h1>
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Limited Time Offer!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Use code <strong style="color: #667eea; font-size: 20px;">{{discount_code}}</strong> at checkout
          </p>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #667eea; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
              Shop Now
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Offer expires {{expiry_date}}
          </p>
        </div>
      </div>
    `,
    variables: ['discount_percent', 'discount_code', 'shop_url', 'expiry_date']
  },
  {
    id: 'cart-abandoned',
    name: 'Abandoned Cart Recovery',
    description: 'Remind customers about items left in cart',
    category: 'transactional',
    thumbnail: '/templates/cart-abandoned.png',
    subject: 'You left something behind...',
    preheader: 'Complete your purchase today',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #f59e0b; font-size: 28px; margin-bottom: 20px; text-align: center;">Don't forget your items!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi {{customer_name}},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You left some great items in your cart. Complete your purchase now before they're gone!
          </p>
          <div style="margin: 30px 0; padding: 20px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; font-weight: bold; margin: 0;">{{cart_items}}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{cart_url}}" style="background-color: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Complete Your Purchase
            </a>
          </div>
        </div>
      </div>
    `,
    variables: ['customer_name', 'cart_items', 'cart_url']
  },
  {
    id: 'newsletter-1',
    name: 'Monthly Newsletter',
    description: 'Keep customers updated with latest news',
    category: 'newsletter',
    thumbnail: '/templates/newsletter-1.png',
    subject: '{{month}} Newsletter - What\'s New at {{store_name}}',
    preheader: 'Your monthly update is here',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #333; font-size: 28px; margin-bottom: 20px;">{{month}} Newsletter</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi {{customer_name}},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Here's what's new this month at {{store_name}}:
          </p>
          <div style="margin: 30px 0;">
            {{newsletter_content}}
          </div>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Visit Our Store
            </a>
          </div>
        </div>
      </div>
    `,
    variables: ['month', 'store_name', 'customer_name', 'newsletter_content', 'shop_url']
  },

  {
    id: 'new-year-2024',
    name: 'New Year Sale',
    description: 'Ring in the new year with special offers',
    category: 'seasonal',
    thumbnail: '/templates/new-year.png',
    subject: '🎉 New Year, New Deals - Up to {{discount_percent}}% OFF',
    preheader: 'Start the year with amazing savings',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);">
        <div style="background-color: white; padding: 40px; border-radius: 8px; text-align: center;">
          <h1 style="color: #3b82f6; font-size: 42px; margin-bottom: 10px;">🎉 Happy New Year!</h1>
          <h2 style="color: #333; font-size: 28px; margin-bottom: 20px;">Start Fresh with New Deals</h2>
          <p style="color: #666; font-size: 18px; line-height: 1.6; margin-bottom: 20px; font-weight: bold;">
            Up to {{discount_percent}}% OFF Everything
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            New year, new you, new savings! Shop our biggest sale of the year.
          </p>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
              Shop New Year Sale
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Sale ends {{expiry_date}}
          </p>
        </div>
      </div>
    `,
    variables: ['discount_percent', 'shop_url', 'expiry_date']
  },
  {
    id: 'black-friday',
    name: 'Black Friday Mega Sale',
    description: 'Black Friday exclusive deals',
    category: 'seasonal',
    thumbnail: '/templates/black-friday.png',
    subject: '🔥 BLACK FRIDAY: {{discount_percent}}% OFF Everything!',
    preheader: 'Our biggest sale of the year is here',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000;">
        <div style="background: linear-gradient(135deg, #1f1f1f 0%, #2d2d2d 100%); padding: 40px; border-radius: 8px; text-align: center; border: 2px solid #fbbf24;">
          <h1 style="color: #fbbf24; font-size: 48px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">Black Friday</h1>
          <h2 style="color: #ffffff; font-size: 32px; margin-bottom: 20px;">{{discount_percent}}% OFF EVERYTHING</h2>
          <p style="color: #d1d5db; font-size: 18px; line-height: 1.6; margin-bottom: 30px;">
            The biggest sale of the year is here! Don't miss out on incredible savings.
          </p>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #fbbf24; color: #000000; padding: 18px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 20px; text-transform: uppercase;">
              Shop Now
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
            ⏰ Limited time only - Sale ends {{expiry_date}}
          </p>
        </div>
      </div>
    `,
    variables: ['discount_percent', 'shop_url', 'expiry_date']
  },

  {
    id: 'mothers-day',
    name: 'Mother\'s Day Special',
    description: 'Celebrate Mom with special offers',
    category: 'seasonal',
    thumbnail: '/templates/mothers-day.png',
    subject: '💐 Mother\'s Day - Show Mom You Care',
    preheader: 'Perfect gifts for the special mom in your life',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);">
        <div style="background-color: white; padding: 40px; border-radius: 8px; text-align: center;">
          <h1 style="color: #db2777; font-size: 38px; margin-bottom: 10px;">💐 Happy Mother's Day</h1>
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Celebrate the Amazing Moms</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Show your appreciation with the perfect gift. Special offers on items mom will love!
          </p>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #db2777; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
              Shop Mother's Day Gifts
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Order by {{deadline}} for Mother's Day delivery
          </p>
        </div>
      </div>
    `,
    variables: ['shop_url', 'deadline']
  },
  {
    id: 'summer-sale',
    name: 'Summer Clearance Sale',
    description: 'Hot summer deals and clearance',
    category: 'seasonal',
    thumbnail: '/templates/summer.png',
    subject: '☀️ Summer Sale - Up to {{discount_percent}}% OFF',
    preheader: 'Beat the heat with hot deals',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
        <div style="background-color: white; padding: 40px; border-radius: 8px; text-align: center;">
          <h1 style="color: #f59e0b; font-size: 42px; margin-bottom: 10px;">☀️ Summer Sale</h1>
          <h2 style="color: #333; font-size: 28px; margin-bottom: 20px;">Hot Deals, Cool Prices</h2>
          <p style="color: #666; font-size: 18px; line-height: 1.6; margin-bottom: 20px; font-weight: bold;">
            Up to {{discount_percent}}% OFF
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Beat the heat with our sizzling summer savings. Limited time only!
          </p>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
              Shop Summer Sale
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Sale ends {{expiry_date}}
          </p>
        </div>
      </div>
    `,
    variables: ['discount_percent', 'shop_url', 'expiry_date']
  },
  {
    id: 'back-to-school',
    name: 'Back to School Sale',
    description: 'Get ready for the new school year',
    category: 'seasonal',
    thumbnail: '/templates/back-to-school.png',
    subject: '📚 Back to School - Save {{discount_percent}}%',
    preheader: 'Get ready for the new school year',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);">
        <div style="background-color: white; padding: 40px; border-radius: 8px; text-align: center;">
          <h1 style="color: #2563eb; font-size: 38px; margin-bottom: 10px;">📚 Back to School</h1>
          <h2 style="color: #333; font-size: 26px; margin-bottom: 20px;">Get Ready for Success</h2>
          <p style="color: #666; font-size: 18px; line-height: 1.6; margin-bottom: 20px; font-weight: bold;">
            Save {{discount_percent}}% on School Essentials
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Everything you need for a successful school year at unbeatable prices!
          </p>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
              Shop School Supplies
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Sale ends {{expiry_date}}
          </p>
        </div>
      </div>
    `,
    variables: ['discount_percent', 'shop_url', 'expiry_date']
  },
  {
    id: 'birthday-special',
    name: 'Birthday Celebration',
    description: 'Special birthday discount for customers',
    category: 'promotional',
    thumbnail: '/templates/birthday.png',
    subject: '🎂 Happy Birthday {{customer_name}}! Here\'s a Gift',
    preheader: 'Celebrate your special day with us',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);">
        <div style="background-color: white; padding: 40px; border-radius: 8px; text-align: center;">
          <h1 style="color: #f59e0b; font-size: 42px; margin-bottom: 10px;">🎂 Happy Birthday!</h1>
          <h2 style="color: #333; font-size: 28px; margin-bottom: 20px;">{{customer_name}}</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We hope your special day is filled with joy and happiness!
          </p>
          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #92400e; font-size: 18px; font-weight: bold; margin: 0;">
              Here's {{discount_percent}}% OFF as our gift to you!
            </p>
            <p style="color: #92400e; font-size: 16px; margin: 10px 0 0 0;">
              Use code: <strong style="font-size: 20px;">{{discount_code}}</strong>
            </p>
          </div>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #f59e0b; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
              Claim Your Gift
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Valid until {{expiry_date}}
          </p>
        </div>
      </div>
    `,
    variables: ['customer_name', 'discount_percent', 'discount_code', 'shop_url', 'expiry_date']
  },
  {
    id: 'flash-sale',
    name: 'Flash Sale Alert',
    description: 'Urgent flash sale notification',
    category: 'promotional',
    thumbnail: '/templates/flash-sale.png',
    subject: '⚡ FLASH SALE: {{discount_percent}}% OFF for {{hours}} Hours Only!',
    preheader: 'Hurry! This deal won\'t last long',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #000000;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; border-radius: 8px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 48px; margin-bottom: 10px; text-transform: uppercase;">⚡ FLASH SALE</h1>
          <h2 style="color: #fef2f2; font-size: 32px; margin-bottom: 20px;">{{discount_percent}}% OFF Everything</h2>
          <div style="background-color: rgba(255,255,255,0.2); padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0;">
              ⏰ Only {{hours}} Hours Left!
            </p>
          </div>
          <p style="color: #fef2f2; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            Don't miss out on this incredible deal. Shop now before it's gone!
          </p>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #ffffff; color: #dc2626; padding: 18px 36px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 20px; text-transform: uppercase;">
              Shop Now
            </a>
          </div>
        </div>
      </div>
    `,
    variables: ['discount_percent', 'hours', 'shop_url']
  },
  {
    id: 'vip-exclusive',
    name: 'VIP Exclusive Offer',
    description: 'Special offer for VIP customers',
    category: 'promotional',
    thumbnail: '/templates/vip.png',
    subject: '👑 VIP Exclusive: {{discount_percent}}% OFF Just for You',
    preheader: 'You\'re special to us - here\'s an exclusive offer',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);">
        <div style="background-color: white; padding: 40px; border-radius: 8px; text-align: center;">
          <h1 style="color: #6366f1; font-size: 38px; margin-bottom: 10px;">👑 VIP Exclusive</h1>
          <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">You're Part of Our Elite Circle</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Dear {{customer_name}}, as one of our valued VIP customers, you get early access to our best deals.
          </p>
          <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 25px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #ffffff; font-size: 22px; font-weight: bold; margin: 0;">
              {{discount_percent}}% OFF Everything
            </p>
            <p style="color: #e0e7ff; font-size: 14px; margin: 10px 0 0 0;">
              Exclusive VIP Access
            </p>
          </div>
          <div style="margin: 30px 0;">
            <a href="{{shop_url}}" style="background-color: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 18px;">
              Shop VIP Sale
            </a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            VIP offer expires {{expiry_date}}
          </p>
        </div>
      </div>
    `,
    variables: ['customer_name', 'discount_percent', 'shop_url', 'expiry_date']
  },
  {
    id: 'order-confirmation',
    name: 'Order Confirmation',
    description: 'Confirm customer order details',
    category: 'transactional',
    thumbnail: '/templates/order-confirmation.png',
    subject: 'Order Confirmed - #{{order_number}}',
    preheader: 'Thank you for your order',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #10b981; font-size: 32px; margin-bottom: 20px; text-align: center;">✓ Order Confirmed!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi {{customer_name}},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for your order! We're getting it ready for shipment.
          </p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #10b981;">
            <p style="color: #166534; font-weight: bold; margin: 0 0 10px 0;">Order #{{order_number}}</p>
            <p style="color: #166534; margin: 0;">Total: {{order_total}}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{order_url}}" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              View Order Details
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            We'll send you another email when your order ships.
          </p>
        </div>
      </div>
    `,
    variables: ['customer_name', 'order_number', 'order_total', 'order_url']
  },
  {
    id: 'shipping-notification',
    name: 'Shipping Notification',
    description: 'Notify customer that order has shipped',
    category: 'transactional',
    thumbnail: '/templates/shipping.png',
    subject: 'Your Order Has Shipped! - #{{order_number}}',
    preheader: 'Track your package',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 40px; border-radius: 8px;">
          <h1 style="color: #3b82f6; font-size: 32px; margin-bottom: 20px; text-align: center;">📦 Your Order is On Its Way!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi {{customer_name}},</p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! Your order has been shipped and is on its way to you.
          </p>
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #3b82f6;">
            <p style="color: #1e40af; font-weight: bold; margin: 0 0 10px 0;">Order #{{order_number}}</p>
            <p style="color: #1e40af; margin: 0;">Tracking: {{tracking_number}}</p>
          </div>
          <div style="margin: 30px 0; text-align: center;">
            <a href="{{tracking_url}}" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Track Your Package
            </a>
          </div>
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            Estimated delivery: {{delivery_date}}
          </p>
        </div>
      </div>
    `,
    variables: ['customer_name', 'order_number', 'tracking_number', 'tracking_url', 'delivery_date']
  }
]

export const getTemplatesByCategory = (category: string) => {
  return emailTemplates.filter(t => t.category === category)
}

export const getTemplateById = (id: string) => {
  return emailTemplates.find(t => t.id === id)
}
