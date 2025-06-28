from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from enum import Enum

class APIKeyType(str, Enum):
    BINANCE = "binance"
    OPENROUTER = "openrouter"
    SERPER = "serper"

class ModelProvider(str, Enum):
    OPENROUTER = "openrouter"

class AgentName(str, Enum):
    WEB_AUTOMATION_AGENT = "web_automation_agent"
    CRYPTO_NEWS_ANALYST = "crypto_news_analyst"
    TECHNICAL_ANALYST = "technical_analyst"
    RISK_MANAGER = "risk_manager"
    TRADING_STRATEGIST = "trading_strategist"

class APIKeyBase(BaseModel):
    key_type: APIKeyType
    key_name: str
    is_testnet: bool = False

class APIKeyCreate(APIKeyBase):
    api_key: str  # Plain text, will be encrypted before storage

class APIKeyUpdate(BaseModel):
    key_name: Optional[str] = None
    api_key: Optional[str] = None
    is_testnet: Optional[bool] = None

class APIKeyResponse(APIKeyBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
    updated_at: datetime
    # API key is masked in response
    masked_key: str = Field(..., description="Last 4 characters of the key")

class AIModelConfigBase(BaseModel):
    agent_name: AgentName
    model_provider: ModelProvider
    model_name: str = Field(..., example="gpt-4")
    temperature: float = Field(0.7, ge=0, le=2)
    max_tokens: int = Field(2000, gt=0)

class AIModelConfigCreate(AIModelConfigBase):
    pass

class AIModelConfigUpdate(BaseModel):
    model_provider: Optional[ModelProvider] = None
    model_name: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None

class AIModelConfigResponse(AIModelConfigBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime

class APIUsageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    service: str
    endpoint: Optional[str]
    tokens_used: Optional[int]
    cost: Optional[float]
    created_at: datetime
