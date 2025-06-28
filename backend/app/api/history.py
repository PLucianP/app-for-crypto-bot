from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from app.models.trading import TradeExecutionResponse, PerformanceMetrics
from app.models.settings import APIUsageResponse
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/trades", response_model=List[TradeExecutionResponse])
async def get_trade_history(
    trading_pair: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get trade execution history
    """
    try:
        trades = await supabase_service.get_trade_history(
            trading_pair=trading_pair,
            status=status,
            limit=limit,
            offset=offset
        )
        
        # Convert to response model
        response_trades = []
        for trade in trades:
            # Extract nested decision data if present
            if 'trading_decisions' in trade and trade['trading_decisions']:
                trade.update(trade['trading_decisions'])
            
            response_trades.append(TradeExecutionResponse(**trade))
        
        return response_trades
        
    except Exception as e:
        logger.error(f"Error fetching trade history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance", response_model=List[PerformanceMetrics])
async def get_performance_metrics(
    trading_pair: Optional[str] = Query(None),
    period: Optional[str] = Query(None, description="Period: daily, weekly, monthly, all_time")
):
    """
    Get performance metrics
    """
    try:
        metrics = await supabase_service.get_performance_metrics(
            trading_pair=trading_pair,
            period=period
        )
        
        return [PerformanceMetrics(**m) for m in metrics]
        
    except Exception as e:
        logger.error(f"Error fetching performance metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api-usage", response_model=List[APIUsageResponse])
async def get_api_usage(
    service: Optional[str] = Query(None, description="Service: openrouter, serper"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get API usage and costs
    """
    try:
        query = supabase_service.client.table('api_usage').select("*")
        
        if service:
            query = query.eq('service', service)
        
        result = query.order('created_at', desc=True)\
            .range(offset, offset + limit - 1).execute()
        
        return [APIUsageResponse(**usage) for usage in result.data]
        
    except Exception as e:
        logger.error(f"Error fetching API usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/performance/calculate")
async def calculate_performance_metrics(
    trading_pair: str = Query(...),
    period: str = Query(..., description="Period: daily, weekly, monthly, all_time")
):
    """
    Calculate and store performance metrics for a trading pair and period
    """
    try:
        # Get trades for the period
        trades = await supabase_service.get_trade_history(
            trading_pair=trading_pair,
            status="filled"
        )
        
        if not trades:
            raise HTTPException(status_code=404, detail="No trades found for calculation")
        
        # Calculate metrics
        total_trades = len(trades)
        winning_trades = 0
        total_pnl = 0.0
        best_trade = 0.0
        worst_trade = 0.0
        
        # This is a simplified calculation
        # In reality, we'd need to track entry/exit prices properly
        for i, trade in enumerate(trades):
            # Simple P&L calculation (would need more sophisticated logic)
            if i > 0:
                prev_trade = trades[i-1]
                if trade['side'] == 'sell' and prev_trade['side'] == 'buy':
                    pnl = (float(trade['price']) - float(prev_trade['price'])) * float(trade['quantity'])
                    total_pnl += pnl
                    if pnl > 0:
                        winning_trades += 1
                    best_trade = max(best_trade, pnl)
                    worst_trade = min(worst_trade, pnl)
        
        win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        # Store metrics
        metrics_data = {
            "trading_pair": trading_pair,
            "period": period,
            "total_trades": total_trades,
            "winning_trades": winning_trades,
            "total_pnl": total_pnl,
            "win_rate": win_rate,
            "best_trade": best_trade,
            "worst_trade": worst_trade
        }
        
        result = await supabase_service.create_performance_metric(metrics_data)
        
        return {"message": "Performance metrics calculated", "metrics": result}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating performance metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
