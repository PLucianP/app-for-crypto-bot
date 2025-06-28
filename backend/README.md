# Crypto Trading Bot Backend

A FastAPI-based backend system that integrates CrewAI trading analysis with automated Binance trading execution.

## Features

- **CrewAI Integration**: AI-powered trading analysis using multiple specialized agents
- **Binance Trading**: Automated trade execution on Binance (testnet/production)
- **Scheduled Analysis**: Configurable periodic market analysis
- **Secure API Management**: Encrypted storage of API keys
- **Performance Tracking**: Comprehensive trade history and metrics
- **Real-time Dashboard**: Analytics and performance visualization

## Architecture

```
FastAPI Backend
├── API Endpoints
│   ├── Trading Operations
│   ├── Analysis Management
│   ├── Settings Configuration
│   ├── History & Performance
│   └── Dashboard Analytics
├── Services
│   ├── CrewAI Service
│   ├── Binance Service
│   ├── Scheduler Service
│   └── Supabase Service
└── Database (Supabase PostgreSQL)
```

## Setup

### Prerequisites

- Python 3.11+
- Supabase account with a project
- Binance account (testnet for testing)
- OpenRouter API key for AI models

### Installation

1. **Clone the repository**
   ```bash
   cd app-for-crypto-bot/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SECRET_KEY=your_secret_key_for_jwt
   ```

5. **Set up database tables**
   
   Run the SQL migrations in your Supabase SQL editor to create the required tables.

### Running the Application

**Development mode:**
```bash
uvicorn app.main:app --reload
```

**Production mode:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Using Docker:**
```bash
docker-compose up
```

## API Endpoints

### Trading Operations
- `POST /api/trading/execute-analysis` - Trigger trading analysis
- `POST /api/trading/place-order` - Execute a trade
- `GET /api/trading/positions` - Get open positions
- `GET /api/trading/balance` - Get account balance

### Analysis Management
- `GET /api/analysis/latest-decision` - Get most recent decision
- `GET /api/analysis/decision-history` - Get historical decisions
- `POST /api/analysis/manual-analysis` - Trigger manual analysis

### Settings Configuration
- `GET /api/settings/api-keys` - List API keys (masked)
- `PUT /api/settings/api-keys/{key_type}` - Update API key
- `GET /api/settings/trading-config` - Get trading configuration
- `PUT /api/settings/trading-config` - Update trading parameters

### History & Performance
- `GET /api/history/trades` - Get trade execution history
- `GET /api/history/performance` - Get performance metrics
- `GET /api/history/api-usage` - Get API usage and costs

### Dashboard
- `GET /api/dashboard/summary` - Overall performance summary
- `GET /api/dashboard/charts/pnl` - P&L chart data
- `GET /api/dashboard/charts/win-rate` - Win rate over time
- `GET /api/dashboard/active-assets` - List of traded assets

## Configuration

### API Keys Setup

1. **Binance API Key**
   - Format: `api_key:api_secret`
   - Use testnet keys for testing
   - Production keys for live trading

2. **OpenRouter API Key**
   - Used for AI model access
   - Configure per-agent models

3. **Serper API Key**
   - Used for web search capabilities

### Trading Configuration

Configure trading parameters via the API:
- Trading pair (e.g., BTCUSDC)
- Analysis interval (1h, 4h, 1d)
- Maximum position size
- Stop loss percentage
- Take profit percentage

## Security

- All API keys are encrypted before storage
- JWT authentication for API access
- Row-level security in Supabase
- Rate limiting on endpoints

## Monitoring

- Health check endpoint: `/health`
- Prometheus metrics: `/metrics`
- Structured logging for debugging
- Sentry integration (optional)

## Development

### Project Structure
```
app/
├── api/          # API endpoints
├── models/       # Pydantic models
├── services/     # Business logic
├── utils/        # Utilities
├── config.py     # Configuration
└── main.py       # Application entry
```

### Testing

Run tests:
```bash
pytest
```

### Contributing

1. Create a feature branch
2. Make your changes
3. Add tests
4. Submit a pull request

## License

[Add your license here] 