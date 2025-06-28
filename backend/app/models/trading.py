from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum

class TradingDecision(str, Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"

class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(str, Enum):
    PENDING = "pending"
    FILLED = "filled"
    CANCELLED = "cancelled"
    FAILED = "failed"

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    EXTREME = "extreme"

class TradingConfigBase(BaseModel):
    trading_pair: str = Field(..., example="BTCUSDC")
    analysis_interval: str = Field(..., example="1h")
    max_position_size: float = Field(..., gt=0)
    stop_loss_percentage: float = Field(..., gt=0, le=100)
    take_profit_percentage: float = Field(..., gt=0, le=100)
    is_active: bool = True

class TradingConfigCreate(TradingConfigBase):
    pass

class TradingConfigUpdate(BaseModel):
    trading_pair: Optional[str] = None
    analysis_interval: Optional[str] = None
    max_position_size: Optional[float] = None
    stop_loss_percentage: Optional[float] = None
    take_profit_percentage: Optional[float] = None
    is_active: Optional[bool] = None

class TradingConfig(TradingConfigBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
    updated_at: datetime

class TradingDecisionCreate(BaseModel):
    trading_pair: str
    decision: TradingDecision
    confidence: int = Field(..., ge=1, le=10)
    reasoning: str
    technical_signals: Dict[str, Any]
    news_impact: Dict[str, Any]
    entry_point: float
    risk_assessment: RiskLevel
    key_levels: Dict[str, float]
    catalysts: List[str]
    raw_analysis: Dict[str, Any]

class TradingDecisionResponse(TradingDecisionCreate):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime

class TradeExecutionCreate(BaseModel):
    decision_id: UUID
    trading_pair: str
    side: OrderSide
    quantity: float
    price: float

class TradeExecutionUpdate(BaseModel):
    order_id: Optional[str] = None
    status: Optional[OrderStatus] = None
    execution_time: Optional[datetime] = None
    fees: Optional[float] = None
    error_message: Optional[str] = None

class TradeExecutionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    decision_id: UUID
    order_id: Optional[str]
    trading_pair: str
    side: OrderSide
    quantity: float
    price: float
    status: OrderStatus
    execution_time: Optional[datetime]
    fees: Optional[float]
    error_message: Optional[str]
    created_at: datetime

class PerformanceMetrics(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    trading_pair: str
    period: str
    total_trades: int
    winning_trades: int
    total_pnl: float
    win_rate: float
    best_trade: float
    worst_trade: float
    calculated_at: datetime

class BalanceInfo(BaseModel):
    asset: str
    free: float
    locked: float
    total: float

class PositionInfo(BaseModel):
    symbol: str
    side: str
    quantity: float
    entry_price: float
    current_price: float
    pnl: float
    pnl_percentage: float
