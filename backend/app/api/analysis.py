from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import logging

from app.models.trading import TradingDecisionResponse
from app.services.supabase_service import supabase_service
from app.services.crewai_service import crewai_service

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/latest-decision", response_model=Optional[TradingDecisionResponse])
async def get_latest_decision(trading_pair: Optional[str] = Query(None)):
    """
    Get the most recent trading decision
    """
    try:
        decision = await supabase_service.get_latest_decision(trading_pair)
        if decision:
            return TradingDecisionResponse(**decision)
        return None
        
    except Exception as e:
        logger.error(f"Error fetching latest decision: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/decision-history", response_model=List[TradingDecisionResponse])
async def get_decision_history(
    trading_pair: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get historical trading decisions with filtering
    """
    try:
        decisions = await supabase_service.get_decision_history(
            trading_pair=trading_pair,
            limit=limit,
            offset=offset
        )
        return [TradingDecisionResponse(**d) for d in decisions]
        
    except Exception as e:
        logger.error(f"Error fetching decision history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/manual-analysis", response_model=TradingDecisionResponse)
async def trigger_manual_analysis(
    trading_pair: str = Query(..., description="Trading pair to analyze (e.g., BTCUSDC)")
):
    """
    Trigger analysis on-demand
    """
    try:
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
        logger.error(f"Error in manual analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
