-- Error logging and monitoring system
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('authentication', 'authorization', 'validation', 'database', 'external_api', 'business_logic', 'system', 'network', 'performance')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context JSONB DEFAULT '{}',
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  request_id TEXT,
  ip_address INET,
  user_agent TEXT,
  endpoint TEXT,
  method TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_store_id ON error_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

-- Add RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Only system can insert error logs
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Users can only view their own error logs
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = error_logs.store_id
      AND us.role = 'admin'
    )
  );

-- Add function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
  p_store_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_errors BIGINT,
  critical_errors BIGINT,
  high_errors BIGINT,
  medium_errors BIGINT,
  low_errors BIGINT,
  resolved_errors BIGINT,
  unresolved_errors BIGINT,
  most_common_category TEXT,
  most_common_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH error_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical,
      COUNT(*) FILTER (WHERE severity = 'high') as high,
      COUNT(*) FILTER (WHERE severity = 'medium') as medium,
      COUNT(*) FILTER (WHERE severity = 'low') as low,
      COUNT(*) FILTER (WHERE resolved = true) as resolved,
      COUNT(*) FILTER (WHERE resolved = false) as unresolved
    FROM error_logs
    WHERE 
      (p_store_id IS NULL OR store_id = p_store_id)
      AND created_at::date BETWEEN p_start_date AND p_end_date
  ),
  category_stats AS (
    SELECT category, COUNT(*) as count
    FROM error_logs
    WHERE 
      (p_store_id IS NULL OR store_id = p_store_id)
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY category
    ORDER BY count DESC
    LIMIT 1
  ),
  code_stats AS (
    SELECT code, COUNT(*) as count
    FROM error_logs
    WHERE 
      (p_store_id IS NULL OR store_id = p_store_id)
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY code
    ORDER BY count DESC
    LIMIT 1
  )
  SELECT 
    es.total,
    es.critical,
    es.high,
    es.medium,
    es.low,
    es.resolved,
    es.unresolved,
    cs.category,
    cds.code
  FROM error_stats es
  CROSS JOIN category_stats cs
  CROSS JOIN code_stats cds;
END;
$$;

-- Add function to clean up old error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER;
BEGIN
  -- Get retention period from environment or default to 90 days
  retention_days := COALESCE(
    (SELECT value::integer FROM app_settings WHERE key = 'error_log_retention_days'),
    90
  );
  
  DELETE FROM error_logs 
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
  AND resolved = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Create app_settings table for configuration
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO app_settings (key, value, description) VALUES
('error_log_retention_days', '90', 'Number of days to retain resolved error logs'),
('max_error_logs_per_day', '10000', 'Maximum number of error logs per day per store'),
('critical_error_notification_enabled', 'true', 'Enable notifications for critical errors'),
('error_rate_limit_threshold', '100', 'Error rate limit threshold per hour')
ON CONFLICT (key) DO NOTHING;

-- Add RLS for app_settings
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage app settings" ON app_settings
  FOR ALL USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON app_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();