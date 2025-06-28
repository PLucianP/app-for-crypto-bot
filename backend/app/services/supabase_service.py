from supabase import create_client, Client
from app.config import get_settings
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)

class SupabaseService:
    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key
        )
    
    async def create_tables(self):
        """Create all required tables in Supabase"""
        # This would typically be done via migrations, but included here for reference
        sql_statements = [
            """
            CREATE TABLE IF NOT EXISTS api_keys (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                key_type VARCHAR(50) NOT NULL,
                key_name VARCHAR(100) NOT NULL,
                encrypted_key TEXT NOT NULL,
                is_testnet BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS ai_models (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                agent_name VARCHAR(100) NOT NULL,
                model_provider VARCHAR(50) NOT NULL,
                model_name VARCHAR(100) NOT NULL,
                temperature DECIMAL(3,2) DEFAULT 0.7,
                max_tokens INTEGER DEFAULT 2000,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS trading_config (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                trading_pair VARCHAR(20) NOT NULL,
                analysis_interval VARCHAR(10) NOT NULL,
                max_position_size DECIMAL(20,8),
                stop_loss_percentage DECIMAL(5,2),
                take_profit_percentage DECIMAL(5,2),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS trading_decisions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                trading_pair VARCHAR(20) NOT NULL,
                decision VARCHAR(10) NOT NULL,
                confidence INTEGER CHECK (confidence >= 1 AND confidence <= 10),
                reasoning TEXT NOT NULL,
                technical_signals JSONB,
                news_impact JSONB,
                entry_point DECIMAL(20,8),
                risk_assessment VARCHAR(20),
                key_levels JSONB,
                catalysts JSONB,
                raw_analysis JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS trade_executions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                decision_id UUID REFERENCES trading_decisions(id),
                order_id VARCHAR(100),
                trading_pair VARCHAR(20) NOT NULL,
                side VARCHAR(10) NOT NULL,
                quantity DECIMAL(20,8) NOT NULL,
                price DECIMAL(20,8) NOT NULL,
                status VARCHAR(20) NOT NULL,
                execution_time TIMESTAMP,
                fees DECIMAL(20,8),
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                trading_pair VARCHAR(20) NOT NULL,
                period VARCHAR(20) NOT NULL,
                total_trades INTEGER DEFAULT 0,
                winning_trades INTEGER DEFAULT 0,
                total_pnl DECIMAL(20,8) DEFAULT 0,
                win_rate DECIMAL(5,2),
                best_trade DECIMAL(20,8),
                worst_trade DECIMAL(20,8),
                calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """,
            """
            CREATE TABLE IF NOT EXISTS api_usage (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                service VARCHAR(50) NOT NULL,
                endpoint VARCHAR(200),
                tokens_used INTEGER,
                cost DECIMAL(10,6),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """
        ]
        
        for sql in sql_statements:
            try:
                await self.execute_sql(sql)
            except Exception as e:
                logger.error(f"Error creating table: {e}")
    
    async def execute_sql(self, query: str, params: Optional[Dict[str, Any]] = None):
        """Execute raw SQL query"""
        try:
            result = self.client.rpc('execute_sql', {'query': query, 'params': params or {}}).execute()
            return result.data
        except Exception as e:
            logger.error(f"SQL execution error: {e}")
            raise
    
    # API Keys methods
    async def create_api_key(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self.client.table('api_keys').insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating API key: {e}")
            raise
    
    async def get_api_key(self, key_type: str) -> Optional[Dict[str, Any]]:
        try:
            result = self.client.table('api_keys').select("*").eq('key_type', key_type).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching API key: {e}")
            return None
    
    async def update_api_key(self, key_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self.client.table('api_keys').update(data).eq('key_type', key_type).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating API key: {e}")
            raise
    
    # Trading Config methods
    async def get_trading_config(self) -> Optional[Dict[str, Any]]:
        try:
            result = self.client.table('trading_config').select("*").eq('is_active', True).single().execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching trading config: {e}")
            return None
    
    async def update_trading_config(self, config_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            data['updated_at'] = 'now()'
            result = self.client.table('trading_config').update(data).eq('id', config_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating trading config: {e}")
            raise
    
    # Trading Decisions methods
    async def create_trading_decision(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self.client.table('trading_decisions').insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating trading decision: {e}")
            raise
    
    async def get_latest_decision(self, trading_pair: Optional[str] = None) -> Optional[Dict[str, Any]]:
        try:
            query = self.client.table('trading_decisions').select("*")
            if trading_pair:
                query = query.eq('trading_pair', trading_pair)
            result = query.order('created_at', desc=True).limit(1).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error fetching latest decision: {e}")
            return None
    
    async def get_decision_history(
        self, 
        trading_pair: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        try:
            query = self.client.table('trading_decisions').select("*")
            if trading_pair:
                query = query.eq('trading_pair', trading_pair)
            result = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching decision history: {e}")
            return []
    
    # Trade Executions methods
    async def create_trade_execution(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self.client.table('trade_executions').insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating trade execution: {e}")
            raise
    
    async def update_trade_execution(self, execution_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self.client.table('trade_executions').update(data).eq('id', execution_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating trade execution: {e}")
            raise
    
    async def get_trade_history(
        self,
        trading_pair: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        try:
            query = self.client.table('trade_executions').select("*, trading_decisions(*)")
            if trading_pair:
                query = query.eq('trading_pair', trading_pair)
            if status:
                query = query.eq('status', status)
            result = query.order('created_at', desc=True).range(offset, offset + limit - 1).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching trade history: {e}")
            return []
    
    # Performance metrics methods
    async def get_performance_metrics(
        self,
        trading_pair: Optional[str] = None,
        period: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        try:
            query = self.client.table('performance_metrics').select("*")
            if trading_pair:
                query = query.eq('trading_pair', trading_pair)
            if period:
                query = query.eq('period', period)
            result = query.order('calculated_at', desc=True).execute()
            return result.data
        except Exception as e:
            logger.error(f"Error fetching performance metrics: {e}")
            return []
    
    async def create_performance_metric(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            result = self.client.table('performance_metrics').insert(data).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error creating performance metric: {e}")
            raise
    
    # API Usage tracking
    async def track_api_usage(self, data: Dict[str, Any]) -> None:
        try:
            self.client.table('api_usage').insert(data).execute()
        except Exception as e:
            logger.error(f"Error tracking API usage: {e}")

# Singleton instance
supabase_service = SupabaseService()
