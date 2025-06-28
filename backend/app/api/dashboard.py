from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging

from app.services.supabase_service import supabase_service
from app.services.binance_service import binance_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/summary")
async def get_dashboard_summary():
    """
    Get overall performance summary
    """
    try:
        # Get all-time metrics
        all_time_metrics = await supabase_service.get_performance_metrics(period="all_time")
        
        # Get recent trades
        recent_trades = await supabase_service.get_trade_history(limit=10)
        
        # Get latest decision
        latest_decision = await supabase_service.get_latest_decision()
        
        # Get current balance (if API key is configured)
        total_balance_usd = 0
        try:
            if not binance_service._api_key:
                await binance_service.initialize()
            
            balances = await binance_service.get_account_balance()
            
            # Calculate total USD value
            for balance in balances:
                if balance.asset == 'USDT':
                    total_balance_usd += balance.total
                else:
                    # Get current price and calculate USD value
                    try:
                        price = await binance_service.get_current_price(f"{balance.asset}USDT")
                        total_balance_usd += balance.total * price
                    except:
                        pass
        except:
            logger.warning("Could not fetch balance information")
        
        # Calculate summary stats
        total_trades = sum(m['total_trades'] for m in all_time_metrics)
        total_pnl = sum(m['total_pnl'] for m in all_time_metrics)
        avg_win_rate = sum(m['win_rate'] for m in all_time_metrics) / len(all_time_metrics) if all_time_metrics else 0
        
        return {
            "total_balance_usd": total_balance_usd,
            "total_trades": total_trades,
            "total_pnl": total_pnl,
            "average_win_rate": avg_win_rate,
            "recent_trades": recent_trades[:5],  # Last 5 trades
            "latest_decision": latest_decision,
            "active_pairs": list(set(m['trading_pair'] for m in all_time_metrics))
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/charts/pnl")
async def get_pnl_chart_data(
    period: str = Query("7d", description="Period: 1d, 7d, 30d, all"),
    trading_pair: Optional[str] = Query(None)
):
    """
    Get P&L chart data over time
    """
    try:
        # Calculate date range
        now = datetime.utcnow()
        if period == "1d":
            start_date = now - timedelta(days=1)
        elif period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        else:
            start_date = None
        
        # Get trades
        trades = await supabase_service.get_trade_history(
            trading_pair=trading_pair,
            status="filled"
        )
        
        # Filter by date if needed
        if start_date:
            trades = [t for t in trades if datetime.fromisoformat(t['created_at']) >= start_date]
        
        # Calculate cumulative P&L
        chart_data = []
        cumulative_pnl = 0
        
        for i, trade in enumerate(trades):
            if i > 0:
                prev_trade = trades[i-1]
                if trade['side'] == 'sell' and prev_trade['side'] == 'buy':
                    pnl = (float(trade['price']) - float(prev_trade['price'])) * float(trade['quantity'])
                    cumulative_pnl += pnl
            
            chart_data.append({
                "timestamp": trade['created_at'],
                "cumulative_pnl": cumulative_pnl,
                "trade_id": trade['id']
            })
        
        return chart_data
        
    except Exception as e:
        logger.error(f"Error getting P&L chart data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/charts/win-rate")
async def get_win_rate_chart_data(
    period: str = Query("30d", description="Period: 7d, 30d, 90d"),
    trading_pair: Optional[str] = Query(None)
):
    """
    Get win rate over time
    """
    try:
        # Get performance metrics
        metrics = await supabase_service.get_performance_metrics(
            trading_pair=trading_pair,
            period="daily"  # Get daily metrics
        )
        
        # Filter by date range
        now = datetime.utcnow()
        if period == "7d":
            start_date = now - timedelta(days=7)
        elif period == "30d":
            start_date = now - timedelta(days=30)
        else:  # 90d
            start_date = now - timedelta(days=90)
        
        filtered_metrics = [
            m for m in metrics 
            if datetime.fromisoformat(m['calculated_at']) >= start_date
        ]
        
        # Format for chart
        chart_data = [
            {
                "date": m['calculated_at'],
                "win_rate": m['win_rate'],
                "total_trades": m['total_trades'],
                "winning_trades": m['winning_trades']
            }
            for m in filtered_metrics
        ]
        
        return chart_data
        
    except Exception as e:
        logger.error(f"Error getting win rate chart data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active-assets")
async def get_active_assets():
    """
    List of traded assets with current status
    """
    try:
        # Get unique trading pairs from recent decisions
        decisions = await supabase_service.get_decision_history(limit=100)
        
        # Group by trading pair
        assets = {}
        for decision in decisions:
            pair = decision['trading_pair']
            if pair not in assets:
                assets[pair] = {
                    "trading_pair": pair,
                    "last_decision": decision['decision'],
                    "last_confidence": decision['confidence'],
                    "last_analysis": decision['created_at'],
                    "total_decisions": 0,
                    "buy_decisions": 0,
                    "sell_decisions": 0,
                    "hold_decisions": 0
                }
            
            assets[pair]['total_decisions'] += 1
            assets[pair][f"{decision['decision']}_decisions"] += 1
            
            # Update if more recent
            if decision['created_at'] > assets[pair]['last_analysis']:
                assets[pair]['last_decision'] = decision['decision']
                assets[pair]['last_confidence'] = decision['confidence']
                assets[pair]['last_analysis'] = decision['created_at']
        
        return list(assets.values())
        
    except Exception as e:
        logger.error(f"Error getting active assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheduler-status")
async def get_scheduler_status():
    """
    Get scheduler jobs status
    """
    try:
        from app.services.scheduler_service import scheduler_service
        
        jobs = scheduler_service.get_jobs()
        
        return {
            "scheduler_running": scheduler_service.scheduler.running,
            "jobs": jobs
        }
        
    except Exception as e:
        logger.error(f"Error getting scheduler status: {e}")
        raise HTTPException(status_code=500, detail=str(e))
