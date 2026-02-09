-- Performance and Security Enhancement Tables
-- Migration: 004_performance_security_tables.sql

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric VARCHAR(100) NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_time ON performance_metrics(metric, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);

-- Performance alerts table
CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric VARCHAR(100) NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  threshold DECIMAL(15,4) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance alerts
CREATE INDEX IF NOT EXISTS idx_performance_alerts_severity_time ON performance_alerts(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_alerts_acknowledged ON performance_alerts(acknowledged, created_at DESC);

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  identifier VARCHAR(255) NOT NULL, -- IP address, user ID, etc.
  details JSONB DEFAULT '{}'::jsonb,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_events_type_time ON security_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_identifier ON security_events(identifier, created_at DESC);

-- IP blocks table for abuse prevention
CREATE TABLE IF NOT EXISTS ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for IP blocks
CREATE INDEX IF NOT EXISTS idx_ip_blocks_ip_expires ON ip_blocks(ip_address, expires_at);
CREATE INDEX IF NOT EXISTS idx_ip_blocks_expires_at ON ip_blocks(expires_at);

-- Request logs table for monitoring and analytics
CREATE TABLE IF NOT EXISTS request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}'::jsonb,
  response_status INTEGER,
  response_time INTEGER, -- in milliseconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for request logs
CREATE INDEX IF NOT EXISTS idx_request_logs_ip_time ON request_logs(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_endpoint_time ON request_logs(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at DESC);

-- Webhook events table for tracking and debugging
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  topic VARCHAR(100) NOT NULL,
  shopify_webhook_id VARCHAR(100),
  payload JSONB NOT NULL,
  headers JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for webhook events
CREATE INDEX IF NOT EXISTS idx_webhook_events_store_topic ON webhook_events(store_id, topic, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_shopify_id ON webhook_events(shopify_webhook_id);

-- Campaign performance tracking table
CREATE TABLE IF NOT EXISTS campaign_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  campaign_type VARCHAR(10) NOT NULL CHECK (campaign_type IN ('email', 'sms')),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  metric_name VARCHAR(50) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for campaign performance
CREATE INDEX IF NOT EXISTS idx_campaign_performance_campaign ON campaign_performance(campaign_id, campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaign_performance_store_metric ON campaign_performance(store_id, metric_name, calculated_at DESC);

-- System health checks table
CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  response_time INTEGER, -- in milliseconds
  details JSONB DEFAULT '{}'::jsonb,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for system health checks
CREATE INDEX IF NOT EXISTS idx_system_health_checks_name_time ON system_health_checks(check_name, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(status, checked_at DESC);

-- Add RLS policies for security

-- Performance metrics - only accessible by service role and authenticated users
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage performance metrics" ON performance_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- Performance alerts - only accessible by service role and authenticated users
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage performance alerts" ON performance_alerts
  FOR ALL USING (auth.role() = 'service_role');

-- Security events - only accessible by service role
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage security events" ON security_events
  FOR ALL USING (auth.role() = 'service_role');

-- IP blocks - only accessible by service role
ALTER TABLE ip_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage IP blocks" ON ip_blocks
  FOR ALL USING (auth.role() = 'service_role');

-- Request logs - only accessible by service role
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage request logs" ON request_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Webhook events - accessible by service role and store owners
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage webhook events" ON webhook_events
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Store owners can view their webhook events" ON webhook_events
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Campaign performance - accessible by service role and store owners
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage campaign performance" ON campaign_performance
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Store owners can view their campaign performance" ON campaign_performance
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- System health checks - only accessible by service role
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage system health checks" ON system_health_checks
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to clean up old logs and metrics
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Clean up performance metrics older than 90 days
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Clean up request logs older than 30 days
  DELETE FROM request_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up resolved security events older than 180 days
  DELETE FROM security_events 
  WHERE resolved = true AND created_at < NOW() - INTERVAL '180 days';
  
  -- Clean up expired IP blocks
  DELETE FROM ip_blocks 
  WHERE expires_at < NOW();
  
  -- Clean up old webhook events (keep for 30 days)
  DELETE FROM webhook_events 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Clean up old system health checks (keep for 7 days)
  DELETE FROM system_health_checks 
  WHERE checked_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create function to execute raw SQL (for index creation)
CREATE OR REPLACE FUNCTION execute_sql(sql TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION execute_sql(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_monitoring_data() TO service_role;

-- Create a scheduled job to clean up old data (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('cleanup-monitoring-data', '0 2 * * *', 'SELECT cleanup_old_monitoring_data();');

-- Add comments for documentation
COMMENT ON TABLE performance_metrics IS 'Stores performance metrics for monitoring and alerting';
COMMENT ON TABLE performance_alerts IS 'Stores performance alerts triggered by monitoring thresholds';
COMMENT ON TABLE security_events IS 'Logs security-related events for audit and monitoring';
COMMENT ON TABLE ip_blocks IS 'Temporarily blocked IP addresses for abuse prevention';
COMMENT ON TABLE request_logs IS 'HTTP request logs for analytics and monitoring';
COMMENT ON TABLE webhook_events IS 'Shopify webhook events for processing and debugging';
COMMENT ON TABLE campaign_performance IS 'Campaign performance metrics and analytics';
COMMENT ON TABLE system_health_checks IS 'System health check results and status';

COMMENT ON FUNCTION cleanup_old_monitoring_data() IS 'Cleans up old monitoring data to maintain database performance';
COMMENT ON FUNCTION execute_sql(TEXT) IS 'Executes raw SQL statements for database maintenance';