from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging

from app.models.trading import (
    TradingDecisionResponse,
    TradeExecutionCreate,
    TradeExecutionResponse,
    BalanceInfo,
    PositionInfo
)
from app.services.crewai_service import crewai_service
from app.services.binance_service import binance_service
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/execute-analysis", response_model=TradingDecisionResponse)
async def execute_analysis(trading_pair: str = "BTCUSDC"):
    """
    Trigger CrewAI analysis for a trading pair
    """
    try:
        # Ensure Binance service is initialized
        if not binance_service._api_key:
            await binance_service.initialize()
        
        # Run analysis
        decision_data = await crewai_service.run_analysis(trading_pair)
        
        if not decision_data:
            raise HTTPException(status_code=500, detail="Analysis failed to produce a decision")
        
        # Save to database
        saved_decision = await supabase_service.create_trading_decision(
            decision_data.model_dump()
        )
        
        return TradingDecisionResponse(**saved_decision)
        
    except Exception as e:
        logger.error(f"Error executing analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/place-order", response_model=TradeExecutionResponse)
async def place_order(execution: TradeExecutionCreate):
    """
    Execute trade based on decision
    """
    try:
        # Ensure Binance service is initialized
        if not binance_service._api_key:
            await binance_service.initialize()
        
        # Create execution record
        execution_data = execution.model_dump()
        execution_data['status'] = 'pending'
        saved_execution = await supabase_service.create_trade_execution(execution_data)
        
        # Execute on Binance
        result = await binance_service.execute_trade(
            trading_pair=execution.trading_pair,
            side=execution.side,
            quantity=execution.quantity,
            price=execution.price
        )
        
        # Update execution status
        update_data = {
            "order_id": result.get('order_id'),
            "status": result.get('status', 'failed'),
            "fees": result.get('fees', 0),
            "error_message": result.get('error')
        }
        
        updated = await supabase_service.update_trade_execution(
            saved_execution['id'],
            update_data
        )
        
        return TradeExecutionResponse(**updated)
        
    except Exception as e:
        logger.error(f"Error placing order: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/positions", response_model=List[PositionInfo])
async def get_positions():
    """
    Get current open positions
    """
    try:
        # Ensure Binance service is initialized
        if not binance_service._api_key:
            await binance_service.initialize()
        
        positions = await binance_service.get_open_positions()
        return positions
        
    except Exception as e:
        logger.error(f"Error fetching positions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/balance", response_model=List[BalanceInfo])
async def get_balance():
    """
    Get account balance
    """
    try:
        # Ensure Binance service is initialized
        if not binance_service._api_key:
            await binance_service.initialize()
        
        balances = await binance_service.get_account_balance()
        return balances
        
    except Exception as e:
        logger.error(f"Error fetching balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))
