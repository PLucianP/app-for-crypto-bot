import asyncio
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.models.trading import TradingDecisionCreate, TradingDecision, RiskLevel
from app.services.supabase_service import supabase_service

# Direct imports from the installed package
from crypto import run_crypto_analysis, Config, CryptoCrew

logger = logging.getLogger(__name__)

class CrewAIService:
    def __init__(self):
        logger.info("Initializing CrewAI service with direct package imports")
    
    async def run_analysis(self, trading_pair: str = "BTCUSDC") -> Optional[TradingDecisionCreate]:
        """
        Run CrewAI analysis asynchronously
        
        Args:
            trading_pair: The trading pair to analyze (e.g., "BTCUSDC")
            
        Returns:
            TradingDecisionCreate object or None if analysis fails
        """
        try:
            # Convert trading pair format (BTCUSDC -> BTC/USDC)
            formatted_pair = self._format_trading_pair(trading_pair)
            
            # Run crew analysis in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                None,
                self._run_crew_analysis,
                formatted_pair
            )
            
            if result and result.get("success"):
                # Parse the crew output and create trading decision
                decision = self._parse_crew_output(result, trading_pair)
                
                # Track API usage (estimate based on typical usage)
                await supabase_service.track_api_usage({
                    "service": "openrouter",
                    "endpoint": "crewai_analysis", 
                    "tokens_used": 5000,  # Estimate
                    "cost": 0.01  # Estimate
                })
                
                return decision
            else:
                logger.error(f"CrewAI analysis failed: {result.get('error', 'Unknown error')}")
            
        except Exception as e:
            logger.error(f"Error running CrewAI analysis: {e}")
        
        return None
    
    def _run_crew_analysis(self, trading_pair: str) -> Dict[str, Any]:
        """Run the actual crew analysis using direct import"""
        try:
            logger.info(f"Starting CrewAI analysis for {trading_pair}")
            
            # Call the run_crypto_analysis function directly
            result = run_crypto_analysis(trading_pair)
            
            logger.info(f"CrewAI analysis completed for {trading_pair}")
            return result
            
        except Exception as e:
            logger.error(f"Error in crew analysis: {e}")
            return {
                "success": False,
                "error": str(e),
                "trading_pair": trading_pair,
                "timestamp": datetime.now().isoformat()
            }
    
    def _format_trading_pair(self, trading_pair: str) -> str:
        """Convert trading pair to the format expected by crypto_crewai (BTC/USDC)"""
        if "/" not in trading_pair:
            # Convert BTCUSDC to BTC/USDC
            if trading_pair.endswith(('USDT', 'USDC', 'BUSD')):
                base = trading_pair[:-4]
                quote = trading_pair[-4:]
            elif trading_pair.endswith(('USD', 'EUR', 'GBP', 'JPY', 'BTC', 'ETH')):
                base = trading_pair[:-3] 
                quote = trading_pair[-3:]
            else:
                # Default split in half
                mid = len(trading_pair) // 2
                base = trading_pair[:mid]
                quote = trading_pair[mid:]
            
            return f"{base}/{quote}"
        
        return trading_pair
    
    def _parse_crew_output(self, crew_output: Dict[str, Any], trading_pair: str) -> TradingDecisionCreate:
        """Parse CrewAI output into TradingDecisionCreate model"""
        
        # Default values
        decision = TradingDecision.HOLD
        confidence = 5
        reasoning = "Analysis complete"
        technical_signals = {}
        news_impact = {}
        entry_point = 0.0
        risk_assessment = RiskLevel.MEDIUM
        key_levels = {}
        catalysts = []
        
        try:
            # Check if the analysis was successful
            if not crew_output.get("success", False):
                reasoning = f"Analysis failed: {crew_output.get('error', 'Unknown error')}"
                logger.warning(reasoning)
            else:
                # Extract the actual result from the CrewAI response
                result_str = crew_output.get("result", "")
                
                # Try to parse JSON from the result string
                try:
                    # The result might be a JSON string, try to parse it
                    if isinstance(result_str, str):
                        # Look for JSON in the result string
                        lines = result_str.split('\n')
                        json_data = None
                        
                        for line in lines:
                            line = line.strip()
                            if line.startswith('{') and line.endswith('}'):
                                try:
                                    json_data = json.loads(line)
                                    break
                                except json.JSONDecodeError:
                                    continue
                        
                        if json_data:
                            result_data = json_data
                        else:
                            # If no JSON found, create default response
                            result_data = {
                                "decision": "hold",
                                "reasoning": result_str[:500] if result_str else "No detailed analysis available",
                                "confidence": 5
                            }
                    else:
                        result_data = result_str
                    
                    # Extract decision
                    decision_str = result_data.get("decision", "hold").lower()
                    if decision_str in ["buy", "sell", "hold"]:
                        decision = TradingDecision(decision_str)
                    
                    # Extract other fields
                    confidence = min(10, max(1, int(result_data.get("confidence", 5))))
                    reasoning = result_data.get("reasoning", "No specific reasoning provided")
                    technical_signals = result_data.get("technical_signals", {})
                    news_impact = result_data.get("news_impact", {})
                    entry_point = float(result_data.get("entry_point", 0))
                    
                    # Map risk assessment
                    risk_map = {
                        "low": RiskLevel.LOW,
                        "medium": RiskLevel.MEDIUM,
                        "high": RiskLevel.HIGH,
                        "extreme": RiskLevel.EXTREME
                    }
                    risk_str = result_data.get("risk_assessment", "medium").lower()
                    risk_assessment = risk_map.get(risk_str, RiskLevel.MEDIUM)
                    
                    key_levels = result_data.get("key_levels", {})
                    catalysts = result_data.get("catalysts", [])
                    
                except (json.JSONDecodeError, ValueError, TypeError) as e:
                    logger.warning(f"Could not parse result as JSON: {e}")
                    reasoning = result_str[:500] if result_str else "Analysis completed but no structured data available"
        
        except Exception as e:
            logger.error(f"Error parsing crew output: {e}")
            reasoning = f"Error in analysis parsing: {str(e)}"
        
        return TradingDecisionCreate(
            trading_pair=trading_pair,
            decision=decision,
            confidence=confidence,
            reasoning=reasoning,
            technical_signals=technical_signals,
            news_impact=news_impact,
            entry_point=entry_point,
            risk_assessment=risk_assessment,
            key_levels=key_levels,
            catalysts=catalysts,
            raw_analysis=crew_output
        )
    
    async def update_agent_models(self, agent_configs: List[Dict[str, Any]]):
        """Update AI model configurations for agents"""
        try:
            # Access the Config class to update model settings
            for config in agent_configs:
                if "model_type" in config and "model_name" in config:
                    model_type = config["model_type"]
                    model_name = config["model_name"]
                    
                    if model_type in ["main_model", "vision_model"]:
                        Config.SELECTED_MODELS[model_type] = model_name
                        logger.info(f"Updated {model_type} to {model_name}")
            
        except Exception as e:
            logger.error(f"Error updating agent models: {e}")

# Singleton instance
crewai_service = CrewAIService()
