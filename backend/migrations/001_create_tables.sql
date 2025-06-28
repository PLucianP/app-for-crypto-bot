-- Crypto Trading Bot Database Schema
-- Run this in your Supabase SQL editor

-- API Keys Management
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_type VARCHAR(50) NOT NULL UNIQUE,
    key_name VARCHAR(100) NOT NULL,
    encrypted_key TEXT NOT NULL,
    is_testnet BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Models Configuration
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL UNIQUE,
    model_provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trading Configuration
CREATE TABLE IF NOT EXISTS trading_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_pair VARCHAR(20) NOT NULL,
    analysis_interval VARCHAR(10) NOT NULL,
    max_position_size DECIMAL(20,8),
    stop_loss_percentage DECIMAL(5,2),
    take_profit_percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trading Decisions History
CREATE TABLE IF NOT EXISTS trading_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_pair VARCHAR(20) NOT NULL,
    decision VARCHAR(10) NOT NULL CHECK (decision IN ('buy', 'sell', 'hold')),
    confidence INTEGER CHECK (confidence >= 1 AND confidence <= 10),
    reasoning TEXT NOT NULL,
    technical_signals JSONB,
    news_impact JSONB,
    entry_point DECIMAL(20,8),
    risk_assessment VARCHAR(20) CHECK (risk_assessment IN ('low', 'medium', 'high', 'extreme')),
    key_levels JSONB,
    catalysts JSONB,
    raw_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trade Executions
CREATE TABLE IF NOT EXISTS trade_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES trading_decisions(id) ON DELETE SET NULL,
    order_id VARCHAR(100),
    trading_pair VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
    execution_time TIMESTAMP WITH TIME ZONE,
    fees DECIMAL(20,8),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_pair VARCHAR(20) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(20,8) DEFAULT 0,
    win_rate DECIMAL(5,2),
    best_trade DECIMAL(20,8),
    worst_trade DECIMAL(20,8),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL,
    endpoint VARCHAR(200),
    tokens_used INTEGER,
    cost DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trading_decisions_pair_created 
    ON trading_decisions(trading_pair, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trade_executions_pair_created 
    ON trade_executions(trading_pair, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trade_executions_status 
    ON trade_executions(status);

CREATE INDEX IF NOT EXISTS idx_trade_executions_decision_id 
    ON trade_executions(decision_id);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_pair_period 
    ON performance_metrics(trading_pair, period);

CREATE INDEX IF NOT EXISTS idx_api_usage_service_created 
    ON api_usage(service, created_at DESC);

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to tables with updated_at
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_config_updated_at BEFORE UPDATE ON trading_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth strategy)
-- For now, we'll use service role key which bypasses RLS
-- In production, you'd want more granular policies

-- Insert default AI model configurations
INSERT INTO ai_models (agent_name, model_provider, model_name, temperature, max_tokens)
VALUES 
    ('web_automation_agent', 'openrouter', 'gpt-4', 0.7, 2000),
    ('crypto_news_analyst', 'openrouter', 'gpt-4', 0.7, 2000),
    ('technical_analyst', 'openrouter', 'gpt-4', 0.5, 2000),
    ('risk_manager', 'openrouter', 'gpt-4', 0.3, 2000),
    ('trading_strategist', 'openrouter', 'gpt-4', 0.7, 2000)
ON CONFLICT (agent_name) DO NOTHING; 