// Database types that match the SQL schema exactly
import { z } from 'zod'

// Enums matching database types
export const CampaignStatus = z.enum(['draft', 'scheduled', 'sending', 'sent', 'failed'])
export const ConsentType = z.enum(['email', 'sms'])
export const ConsentSource = z.enum(['shopify', 'manual', 'campaign', 'api'])
export const CampaignSendStatus = z.enum(['pending', 'delivered', 'opened', 'clicked', 'bounced', 'failed'])
export const UserRole = z.enum(['merchant', 'admin'])

export type CampaignStatus = z.infer<typeof CampaignStatus>
export type ConsentType = z.infer<typeof ConsentType>
export type ConsentSource = z.infer<typeof ConsentSource>
export type CampaignSendStatus = z.infer<typeof CampaignSendStatus>
export type UserRole = z.infer<typeof UserRole>

// Store schema
export const StoreSchema = z.object({
  id: z.string().uuid(),
  shop_domain: z.string().min(1).max(255),
  access_token: z.string().min(1),
  scopes: z.array(z.string()),
  user_id: z.string().uuid(),
  installed_at: z.date(),
  is_active: z.boolean().default(true),
  settings: z.record(z.string(), z.any()).default({}),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateStoreSchema = StoreSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateStoreSchema = CreateStoreSchema.partial()

export type Store = z.infer<typeof StoreSchema>
export type CreateStore = z.infer<typeof CreateStoreSchema>
export type UpdateStore = z.infer<typeof UpdateStoreSchema>

// Contact schema
export const ContactSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  email: z.string().email().max(255),
  phone: z.string().max(20).nullable(),
  first_name: z.string().max(100).nullable(),
  last_name: z.string().max(100).nullable(),
  shopify_customer_id: z.string().max(50).nullable(),
  tags: z.array(z.string()).default([]),
  segments: z.array(z.string()).default([]),
  email_consent: z.boolean().default(false),
  sms_consent: z.boolean().default(false),
  total_spent: z.number().min(0).default(0),
  order_count: z.number().int().min(0).default(0),
  last_order_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateContactSchema = ContactSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateContactSchema = CreateContactSchema.partial().omit({
  store_id: true,
})

export type Contact = z.infer<typeof ContactSchema>
export type CreateContact = z.infer<typeof CreateContactSchema>
export type UpdateContact = z.infer<typeof UpdateContactSchema>

// Email campaign schema
export const EmailCampaignSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  subject: z.string().min(1).max(255),
  html_content: z.string().min(1),
  text_content: z.string().nullable(),
  from_email: z.string().email().max(255),
  from_name: z.string().min(1).max(100),
  status: CampaignStatus.default('draft'),
  scheduled_at: z.date().nullable(),
  sent_at: z.date().nullable(),
  recipient_count: z.number().int().min(0).default(0),
  delivered_count: z.number().int().min(0).default(0),
  opened_count: z.number().int().min(0).default(0),
  clicked_count: z.number().int().min(0).default(0),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateEmailCampaignSchema = EmailCampaignSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateEmailCampaignSchema = CreateEmailCampaignSchema.partial().omit({
  store_id: true,
})

export type EmailCampaign = z.infer<typeof EmailCampaignSchema>
export type CreateEmailCampaign = z.infer<typeof CreateEmailCampaignSchema>
export type UpdateEmailCampaign = z.infer<typeof UpdateEmailCampaignSchema>

// SMS campaign schema
export const SMSCampaignSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  message: z.string().min(1),
  from_number: z.string().min(1).max(20),
  status: CampaignStatus.default('draft'),
  scheduled_at: z.date().nullable(),
  sent_at: z.date().nullable(),
  recipient_count: z.number().int().min(0).default(0),
  delivered_count: z.number().int().min(0).default(0),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateSMSCampaignSchema = SMSCampaignSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateSMSCampaignSchema = CreateSMSCampaignSchema.partial().omit({
  store_id: true,
})

export type SMSCampaign = z.infer<typeof SMSCampaignSchema>
export type CreateSMSCampaign = z.infer<typeof CreateSMSCampaignSchema>
export type UpdateSMSCampaign = z.infer<typeof UpdateSMSCampaignSchema>

// Campaign template schema
export const CampaignTemplateSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: z.enum(['email', 'sms']),
  content: z.string().min(1),
  variables: z.array(z.record(z.string(), z.any())).default([]),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCampaignTemplateSchema = CampaignTemplateSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateCampaignTemplateSchema = CreateCampaignTemplateSchema.partial().omit({
  store_id: true,
})

export type CampaignTemplate = z.infer<typeof CampaignTemplateSchema>
export type CreateCampaignTemplate = z.infer<typeof CreateCampaignTemplateSchema>
export type UpdateCampaignTemplate = z.infer<typeof UpdateCampaignTemplateSchema>

// Automation workflow schema
export const AutomationWorkflowSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  trigger_type: z.string().min(1).max(50),
  trigger_config: z.record(z.string(), z.any()),
  actions: z.array(z.record(z.string(), z.any())),
  conditions: z.array(z.record(z.string(), z.any())).default([]),
  is_active: z.boolean().default(true),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateAutomationWorkflowSchema = AutomationWorkflowSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateAutomationWorkflowSchema = CreateAutomationWorkflowSchema.partial().omit({
  store_id: true,
})

export type AutomationWorkflow = z.infer<typeof AutomationWorkflowSchema>
export type CreateAutomationWorkflow = z.infer<typeof CreateAutomationWorkflowSchema>
export type UpdateAutomationWorkflow = z.infer<typeof UpdateAutomationWorkflowSchema>

// Consent record schema
export const ConsentRecordSchema = z.object({
  id: z.string().uuid(),
  contact_id: z.string().uuid(),
  type: ConsentType,
  consented: z.boolean(),
  source: ConsentSource,
  ip_address: z.string().nullable(),
  recorded_at: z.date(),
})

export const CreateConsentRecordSchema = ConsentRecordSchema.omit({
  id: true,
  recorded_at: true,
})

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>
export type CreateConsentRecord = z.infer<typeof CreateConsentRecordSchema>

// Campaign send schema
export const CampaignSendSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  campaign_type: z.enum(['email', 'sms']),
  contact_id: z.string().uuid(),
  external_message_id: z.string().max(255).nullable(),
  status: CampaignSendStatus.default('pending'),
  delivered_at: z.date().nullable(),
  opened_at: z.date().nullable(),
  clicked_at: z.date().nullable(),
  bounced_at: z.date().nullable(),
  error_message: z.string().nullable(),
  created_at: z.date(),
})

export const CreateCampaignSendSchema = CampaignSendSchema.omit({
  id: true,
  created_at: true,
})

export const UpdateCampaignSendSchema = CreateCampaignSendSchema.partial().omit({
  campaign_id: true,
  campaign_type: true,
  contact_id: true,
})

export type CampaignSend = z.infer<typeof CampaignSendSchema>
export type CreateCampaignSend = z.infer<typeof CreateCampaignSendSchema>
export type UpdateCampaignSend = z.infer<typeof UpdateCampaignSendSchema>

// Shopify order schema
export const ShopifyOrderSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  shopify_order_id: z.string().min(1).max(50),
  contact_id: z.string().uuid().nullable(),
  order_number: z.string().max(50).nullable(),
  total_price: z.number().min(0).nullable(),
  currency: z.string().length(3).nullable(),
  financial_status: z.string().max(50).nullable(),
  fulfillment_status: z.string().max(50).nullable(),
  created_at_shopify: z.date().nullable(),
  updated_at_shopify: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateShopifyOrderSchema = ShopifyOrderSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateShopifyOrderSchema = CreateShopifyOrderSchema.partial().omit({
  store_id: true,
  shopify_order_id: true,
})

export type ShopifyOrder = z.infer<typeof ShopifyOrderSchema>
export type CreateShopifyOrder = z.infer<typeof CreateShopifyOrderSchema>
export type UpdateShopifyOrder = z.infer<typeof UpdateShopifyOrderSchema>

// Shopify product schema
export const ShopifyProductSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  shopify_product_id: z.string().min(1).max(50),
  title: z.string().max(255).nullable(),
  handle: z.string().max(255).nullable(),
  product_type: z.string().max(100).nullable(),
  vendor: z.string().max(100).nullable(),
  tags: z.array(z.string()).default([]),
  status: z.string().max(20).nullable(),
  created_at_shopify: z.date().nullable(),
  updated_at_shopify: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateShopifyProductSchema = ShopifyProductSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})

export const UpdateShopifyProductSchema = CreateShopifyProductSchema.partial().omit({
  store_id: true,
  shopify_product_id: true,
})

export type ShopifyProduct = z.infer<typeof ShopifyProductSchema>
export type CreateShopifyProduct = z.infer<typeof CreateShopifyProductSchema>
export type UpdateShopifyProduct = z.infer<typeof UpdateShopifyProductSchema>

// Webhook event schema
export const WebhookEventSchema = z.object({
  id: z.string().uuid(),
  store_id: z.string().uuid(),
  webhook_id: z.string().min(1).max(255),
  topic: z.string().min(1).max(100),
  payload: z.record(z.string(), z.any()),
  processed: z.boolean().default(false),
  processed_at: z.date().nullable(),
  error_message: z.string().nullable(),
  created_at: z.date(),
})

export const CreateWebhookEventSchema = WebhookEventSchema.omit({
  id: true,
  created_at: true,
})

export const UpdateWebhookEventSchema = CreateWebhookEventSchema.partial().omit({
  store_id: true,
  webhook_id: true,
})

export type WebhookEvent = z.infer<typeof WebhookEventSchema>
export type CreateWebhookEvent = z.infer<typeof CreateWebhookEventSchema>
export type UpdateWebhookEvent = z.infer<typeof UpdateWebhookEventSchema>