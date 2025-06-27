
### Implementation Tasks

#### 1. Project Setup & Configuration

**Task**: Initialize FastAPI project with proper structure
```
app-for-crypto-bot/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── database.py
│   │   │   ├── trading.py
│   │   │   └── settings.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── trading.py
│   │   │   ├── analysis.py
│   │   │   ├── settings.py
│   │   │   ├── history.py
│   │   │   └── dashboard.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── binance_service.py
│   │   │   ├── crewai_service.py
│   │   │   ├── scheduler_service.py
│   │   │   └── supabase_service.py
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── security.py
│   │       └── validators.py
│   ├── requirements.txt
│   ├── .env.example
│   └── docker-compose.yml
```

**Expected Output**: 
- Fully structured FastAPI project
- Environment configuration with Supabase credentials
- Docker setup for local development

#### 2. Database Schema Design

**Task**: Design and implement PostgreSQL schema on Supabase

```sql
-- API Keys Management
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_type VARCHAR(50) NOT NULL, -- 'binance', 'openrouter', 'serper'
    key_name VARCHAR(100) NOT NULL,
    encrypted_key TEXT NOT NULL,
    is_testnet BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Models Configuration
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100) NOT NULL, -- 'web_automation_agent', 'crypto_news_analyst', etc.
    model_provider VARCHAR(50) NOT NULL, -- 'openrouter'
    model_name VARCHAR(100) NOT NULL, -- 'gpt-4', 'claude-3', etc.
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading Configuration
CREATE TABLE trading_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_pair VARCHAR(20) NOT NULL, -- 'BTCUSDC'
    analysis_interval VARCHAR(10) NOT NULL, -- '1h', '4h', '1d'
    max_position_size DECIMAL(20,8),
    stop_loss_percentage DECIMAL(5,2),
    take_profit_percentage DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading Decisions History
CREATE TABLE trading_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_pair VARCHAR(20) NOT NULL,
    decision VARCHAR(10) NOT NULL, -- 'buy', 'sell', 'hold'
    confidence INTEGER CHECK (confidence >= 1 AND confidence <= 10),
    reasoning TEXT NOT NULL,
    technical_signals JSONB,
    news_impact JSONB,
    entry_point DECIMAL(20,8),
    risk_assessment VARCHAR(20),
    key_levels JSONB,
    catalysts JSONB,
    raw_analysis JSONB, -- Full CrewAI response
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trade Executions
CREATE TABLE trade_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES trading_decisions(id),
    order_id VARCHAR(100), -- Binance order ID
    trading_pair VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'buy', 'sell'
    quantity DECIMAL(20,8) NOT NULL,
    price DECIMAL(20,8) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'pending', 'filled', 'cancelled', 'failed'
    execution_time TIMESTAMP,
    fees DECIMAL(20,8),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trading_pair VARCHAR(20) NOT NULL,
    period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'all_time'
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(20,8) DEFAULT 0,
    win_rate DECIMAL(5,2),
    best_trade DECIMAL(20,8),
    worst_trade DECIMAL(20,8),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Tracking
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service VARCHAR(50) NOT NULL, -- 'openrouter', 'serper'
    endpoint VARCHAR(200),
    tokens_used INTEGER,
    cost DECIMAL(10,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Expected Output**: 
- All tables created in Supabase
- Row Level Security (RLS) policies configured
- Indexes optimized for query performance

#### 3. Core Services Implementation

**Task**: Implement service modules for each integration

**3.1 Config Service** (`config.py`):
```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    
    # API Settings
    api_prefix: str = "/api"
    api_version: str = "v1"
    
    # Security
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Scheduler
    scheduler_timezone: str = "UTC"
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
```

**3.2 CrewAI Integration Service**:
- Adapt existing CrewAI crypto analysis crew
- Create async wrapper for crew.kickoff()
- Handle timeouts and error scenarios
- Parse and validate JSON responses

**3.3 Binance Service**:
- Implement testnet/production switching
- Order placement with proper error handling
- Balance checking and position management
- WebSocket integration for real-time price updates

**3.4 Scheduler Service**:
- APScheduler setup with PostgreSQL job store
- Configurable analysis intervals
- Job management (create, pause, resume, delete)
- Execution history tracking

#### 4. API Endpoints Implementation

**Task**: Create RESTful API endpoints with proper validation

**4.1 Trading Endpoints** (`/api/trading`):
- `POST /execute-analysis`: Trigger CrewAI analysis
- `POST /place-order`: Execute trade based on decision
- `GET /positions`: Current open positions
- `GET /balance`: Account balance

**4.2 Analysis Endpoints** (`/api/analysis`):
- `GET /latest-decision`: Most recent trading decision
- `GET /decision-history`: Historical decisions with filtering
- `POST /manual-analysis`: Trigger analysis on-demand

**4.3 Settings Endpoints** (`/api/settings`):
- `GET /api-keys`: List configured API keys (masked)
- `PUT /api-keys/{key_type}`: Update API key
- `GET /models`: List AI model configurations
- `PUT /models/{agent_name}`: Update model for agent
- `GET /trading-config`: Current trading configuration
- `PUT /trading-config`: Update trading parameters

**4.4 History Endpoints** (`/api/history`):
- `GET /trades`: Trade execution history
- `GET /performance`: Performance metrics
- `GET /api-usage`: API usage and costs

**4.5 Dashboard Endpoints** (`/api/dashboard`):
- `GET /summary`: Overall performance summary
- `GET /charts/pnl`: P&L chart data
- `GET /charts/win-rate`: Win rate over time
- `GET /active-assets`: List of traded assets

#### 5. Security Implementation

**Task**: Implement comprehensive security measures

- JWT authentication for API access
- Encryption for sensitive data (API keys)
- Rate limiting per endpoint
- Input validation and sanitization
- CORS configuration
- API key rotation mechanism

#### 6. Error Handling & Monitoring

**Task**: Implement robust error handling and monitoring

- Custom exception classes
- Structured logging with context
- Sentry integration for error tracking
- Health check endpoints
- Prometheus metrics export

#### 7. Testing Strategy

**Task**: Comprehensive test coverage

- Unit tests for all services
- Integration tests for API endpoints
- Mock Binance API for testing
- Load testing for scheduler
- Database migration tests

### Deployment Configuration

**Task**: Production-ready deployment setup

- Docker containerization
- Environment-specific configurations
- CI/CD pipeline with GitHub Actions
- Automatic database migrations
- Rolling update strategy

### Performance Requirements

- API response time < 200ms for read operations
- Analysis execution < 30 seconds
- Support for 100+ concurrent analysis jobs
- 99.9% uptime for critical endpoints

### Integration Notes

1. **CrewAI Integration**: The existing crew should be imported as a module, with the kickoff method wrapped in an async function for non-blocking execution.

2. **Binance Integration**: Use python-binance library with proper connection pooling and retry logic.

3. **Supabase Integration**: Utilize Supabase Python client for database operations and real-time subscriptions.

4. **Error Recovery**: Implement circuit breakers for external services and graceful degradation strategies.

### Success Criteria

- All endpoints return proper JSON responses
- Authentication works across all protected routes
- Scheduler reliably executes analysis at configured intervals
- Trade execution happens within 1 second of decision
- All API keys are securely encrypted in database
- Performance metrics accurately track P&L
- System handles network failures gracefully 