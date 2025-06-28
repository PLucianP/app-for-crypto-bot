from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import logging
from typing import Optional, Dict, Any
import pytz

from app.config import get_settings
from app.services.crewai_service import crewai_service
from app.services.supabase_service import supabase_service
from app.services.binance_service import binance_service

logger = logging.getLogger(__name__)
settings = get_settings()

class SchedulerService:
    def __init__(self):
        self.scheduler = None
        self._initialize_scheduler()
    
    def _initialize_scheduler(self):
        """Initialize the APScheduler"""
        jobstores = {
            'default': MemoryJobStore()
        }
        executors = {
            'default': AsyncIOExecutor()
        }
        job_defaults = {
            'coalesce': True,
            'max_instances': 1,
            'misfire_grace_time': 30
        }
        
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone=pytz.timezone(settings.scheduler_timezone)
        )
    
    def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("Scheduler started successfully")
            
            # Schedule default jobs
            self._schedule_default_jobs()
    
    def shutdown(self):
        """Shutdown the scheduler"""
        if self.scheduler and self.scheduler.running:
            self.scheduler.shutdown(wait=True)
            logger.info("Scheduler shutdown complete")
    
    def _schedule_default_jobs(self):
        """Schedule default recurring jobs"""
        # Load active trading configs and schedule analysis
        asyncio.create_task(self._load_and_schedule_configs())
    
    async def _load_and_schedule_configs(self):
        """Load trading configs from database and schedule jobs"""
        try:
            config = await supabase_service.get_trading_config()
            if config and config.get('is_active'):
                await self.schedule_analysis(
                    config['trading_pair'],
                    config['analysis_interval']
                )
        except Exception as e:
            logger.error(f"Error loading trading configs: {e}")
    
    async def schedule_analysis(self, trading_pair: str, interval: str):
        """Schedule periodic analysis for a trading pair"""
        job_id = f"analysis_{trading_pair}"
        
        # Convert interval to seconds
        interval_map = {
            '1m': 60,
            '5m': 300,
            '15m': 900,
            '30m': 1800,
            '1h': 3600,
            '4h': 14400,
            '1d': 86400
        }
        
        seconds = interval_map.get(interval, 3600)  # Default to 1 hour
        
        # Remove existing job if present
        if self.scheduler.get_job(job_id):
            self.scheduler.remove_job(job_id)
        
        # Add new job
        self.scheduler.add_job(
            func=self._run_trading_analysis,
            trigger=IntervalTrigger(seconds=seconds),
            id=job_id,
            args=[trading_pair],
            name=f"Trading analysis for {trading_pair}",
            replace_existing=True
        )
        
        logger.info(f"Scheduled analysis for {trading_pair} every {interval}")
    
    async def _run_trading_analysis(self, trading_pair: str):
        """Run trading analysis and execute trades if needed"""
        logger.info(f"Running scheduled analysis for {trading_pair}")
        
        try:
            # Run CrewAI analysis
            decision_data = await crewai_service.run_analysis(trading_pair)
            
            if decision_data:
                # Save decision to database
                saved_decision = await supabase_service.create_trading_decision(
                    decision_data.model_dump()
                )
                
                logger.info(f"Analysis complete for {trading_pair}: {decision_data.decision} "
                          f"(confidence: {decision_data.confidence}/10)")
                
                # Execute trade if decision is buy/sell with high confidence
                if decision_data.decision != "hold" and decision_data.confidence >= 7:
                    await self._execute_trade(saved_decision, decision_data)
            else:
                logger.warning(f"No decision data returned for {trading_pair}")
                
        except Exception as e:
            logger.error(f"Error in scheduled analysis for {trading_pair}: {e}")
    
    async def _execute_trade(self, decision: Dict[str, Any], decision_data):
        """Execute trade based on decision"""
        try:
            # Get trading config
            config = await supabase_service.get_trading_config()
            if not config:
                logger.error("No active trading configuration found")
                return
            
            # Check if we should execute (additional safety checks)
            if not config.get('is_active'):
                logger.info("Trading is not active, skipping execution")
                return
            
            # Create trade execution record
            execution_data = {
                "decision_id": decision['id'],
                "trading_pair": decision_data.trading_pair,
                "side": decision_data.decision,
                "quantity": 0,  # Will be calculated by binance service
                "price": decision_data.entry_point,
                "status": "pending"
            }
            
            execution = await supabase_service.create_trade_execution(execution_data)
            
            # Execute on Binance
            result = await binance_service.execute_trade(
                trading_pair=decision_data.trading_pair,
                side=decision_data.decision,
                quantity=config.get('max_position_size', 0),
                price=decision_data.entry_point
            )
            
            # Update execution status
            update_data = {
                "order_id": result.get('order_id'),
                "status": result.get('status', 'failed'),
                "execution_time": datetime.utcnow().isoformat(),
                "fees": result.get('fees', 0),
                "error_message": result.get('error')
            }
            
            await supabase_service.update_trade_execution(
                execution['id'],
                update_data
            )
            
            logger.info(f"Trade executed: {result}")
            
        except Exception as e:
            logger.error(f"Error executing trade: {e}")
    
    def get_jobs(self):
        """Get list of scheduled jobs"""
        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger)
            })
        return jobs
    
    def pause_job(self, job_id: str):
        """Pause a scheduled job"""
        self.scheduler.pause_job(job_id)
        logger.info(f"Job {job_id} paused")
    
    def resume_job(self, job_id: str):
        """Resume a paused job"""
        self.scheduler.resume_job(job_id)
        logger.info(f"Job {job_id} resumed")
    
    def remove_job(self, job_id: str):
        """Remove a scheduled job"""
        self.scheduler.remove_job(job_id)
        logger.info(f"Job {job_id} removed")

import asyncio
# Singleton instance
scheduler_service = SchedulerService()
