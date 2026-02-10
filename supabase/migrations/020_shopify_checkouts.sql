-- Migration: Add shopify_checkouts table for cart abandonment tracking

CREATE TABLE IF NOT EXISTS shopify_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  shopify_checkout_token TEXT NOT NULL,
  email TEXT,
  cart_token TEXT,
  total_price DECIMAL(10, 2),
  currency TEXT,
  line_items_count INTEGER DEFAULT 0,
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  abandoned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, shopify_checkout_token)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_checkouts_store 
  ON shopify_checkouts(store_id);

CREATE INDEX IF NOT EXISTS idx_shopify_checkouts_abandoned 
  ON shopify_checkouts(abandoned, created_at_shopify) 
  WHERE abandoned = TRUE;

CREATE INDEX IF NOT EXISTS idx_shopify_checkouts_email 
  ON shopify_checkouts(email) 
  WHERE email IS NOT NULL;

-- Add comments
COMMENT ON TABLE shopify_checkouts IS 'Tracks Shopify checkouts for cart abandonment automation triggers';
COMMENT ON COLUMN shopify_checkouts.shopify_checkout_token IS 'Unique token from Shopify checkout';
COMMENT ON COLUMN shopify_checkouts.abandoned IS 'TRUE if checkout was abandoned (not completed after threshold time)';
COMMENT ON COLUMN shopify_checkouts.completed_at IS 'Timestamp when checkout was completed (converted to order)';
