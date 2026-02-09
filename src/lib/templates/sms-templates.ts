export interface SMSTemplate {
  id: string
  name: string
  description: string
  category: 'welcome' | 'promotional' | 'transactional' | 'reminder'
  message: string
  variables: string[]
  characterCount: number
}

export const smsTemplates: SMSTemplate[] = [
  {
    id: 'sms-welcome-1',
    name: 'Welcome Message',
    description: 'Welcome new customers',
    category: 'welcome',
    message: 'Welcome to {{store_name}}! Thanks for joining us. Reply STOP to unsubscribe.',
    variables: ['store_name'],
    characterCount: 70
  },
  {
    id: 'sms-promo-1',
    name: 'Discount Code',
    description: 'Send promotional discount',
    category: 'promotional',
    message: '🎉 {{discount_percent}}% OFF! Use code {{discount_code}} at checkout. Shop now: {{shop_url}}',
    variables: ['discount_percent', 'discount_code', 'shop_url'],
    characterCount: 85
  },
  {
    id: 'sms-cart-1',
    name: 'Cart Reminder',
    description: 'Abandoned cart reminder',
    category: 'transactional',
    message: 'Hi {{customer_name}}, you left items in your cart! Complete your order: {{cart_url}}',
    variables: ['customer_name', 'cart_url'],
    characterCount: 75
  },
  {
    id: 'sms-shipping-1',
    name: 'Shipping Update',
    description: 'Order shipped notification',
    category: 'transactional',
    message: 'Your order #{{order_number}} has shipped! Track it here: {{tracking_url}}',
    variables: ['order_number', 'tracking_url'],
    characterCount: 70
  },
  {
    id: 'sms-reminder-1',
    name: 'Flash Sale Reminder',
    description: 'Limited time sale alert',
    category: 'reminder',
    message: '⚡ FLASH SALE! {{discount_percent}}% off ends in {{hours}} hours. Shop: {{shop_url}}',
    variables: ['discount_percent', 'hours', 'shop_url'],
    characterCount: 75
  }
]

export const getTemplatesByCategory = (category: string) => {
  return smsTemplates.filter(t => t.category === category)
}

export const getTemplateById = (id: string) => {
  return smsTemplates.find(t => t.id === id)
}
