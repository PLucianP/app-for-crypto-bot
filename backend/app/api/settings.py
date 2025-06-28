from fastapi import APIRouter, HTTPException, Depends
from typing import List
import logging

from app.models.settings import (
    APIKeyCreate,
    APIKeyUpdate,
    APIKeyResponse,
    AIModelConfigCreate,
    AIModelConfigUpdate,
    AIModelConfigResponse,
    APIKeyType,
    AgentName
)
from app.models.trading import (
    TradingConfig,
    TradingConfigCreate,
    TradingConfigUpdate
)
from app.services.supabase_service import supabase_service
from app.utils.security import encrypt_api_key, mask_api_key

logger = logging.getLogger(__name__)

router = APIRouter()

# API Keys endpoints
@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys():
    """
    List configured API keys (masked)
    """
    try:
        # Get all API keys
        keys = []
        for key_type in APIKeyType:
            key_data = await supabase_service.get_api_key(key_type.value)
            if key_data:
                # Decrypt to get the last 4 chars for masking
                try:
                    from app.utils.security import decrypt_api_key
                    decrypted = decrypt_api_key(key_data['encrypted_key'])
                    masked = mask_api_key(decrypted.split(':')[0] if ':' in decrypted else decrypted)
                except:
                    masked = "****"
                
                keys.append(APIKeyResponse(
                    id=key_data['id'],
                    key_type=key_data['key_type'],
                    key_name=key_data['key_name'],
                    is_testnet=key_data.get('is_testnet', False),
                    created_at=key_data['created_at'],
                    updated_at=key_data['updated_at'],
                    masked_key=masked
                ))
        
        return keys
        
    except Exception as e:
        logger.error(f"Error listing API keys: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/api-keys/{key_type}", response_model=APIKeyResponse)
async def update_api_key(key_type: APIKeyType, key_data: APIKeyCreate):
    """
    Update or create an API key
    """
    try:
        # Encrypt the API key
        encrypted_key = encrypt_api_key(key_data.api_key)
        
        # Check if key exists
        existing = await supabase_service.get_api_key(key_type.value)
        
        db_data = {
            "key_type": key_type.value,
            "key_name": key_data.key_name,
            "encrypted_key": encrypted_key,
            "is_testnet": key_data.is_testnet
        }
        
        if existing:
            # Update existing
            db_data['updated_at'] = 'now()'
            result = await supabase_service.update_api_key(key_type.value, db_data)
        else:
            # Create new
            result = await supabase_service.create_api_key(db_data)
        
        # Return masked response
        masked = mask_api_key(key_data.api_key.split(':')[0] if ':' in key_data.api_key else key_data.api_key)
        
        return APIKeyResponse(
            id=result['id'],
            key_type=result['key_type'],
            key_name=result['key_name'],
            is_testnet=result.get('is_testnet', False),
            created_at=result['created_at'],
            updated_at=result['updated_at'],
            masked_key=masked
        )
        
    except Exception as e:
        logger.error(f"Error updating API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# AI Model Configuration endpoints
@router.get("/models", response_model=List[AIModelConfigResponse])
async def list_ai_models():
    """
    List AI model configurations
    """
    try:
        # Get all model configs
        result = await supabase_service.client.table('ai_models').select("*").execute()
        return [AIModelConfigResponse(**model) for model in result.data]
        
    except Exception as e:
        logger.error(f"Error listing AI models: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/models/{agent_name}", response_model=AIModelConfigResponse)
async def update_ai_model(agent_name: AgentName, config: AIModelConfigCreate):
    """
    Update model configuration for an agent
    """
    try:
        # Check if config exists
        existing = await supabase_service.client.table('ai_models')\
            .select("*").eq('agent_name', agent_name.value).single().execute()
        
        db_data = config.model_dump()
        
        if existing.data:
            # Update existing
            result = await supabase_service.client.table('ai_models')\
                .update(db_data).eq('agent_name', agent_name.value).execute()
        else:
            # Create new
            result = await supabase_service.client.table('ai_models')\
                .insert(db_data).execute()
        
        return AIModelConfigResponse(**result.data[0])
        
    except Exception as e:
        logger.error(f"Error updating AI model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Trading Configuration endpoints
@router.get("/trading-config", response_model=TradingConfig)
async def get_trading_config():
    """
    Get current trading configuration
    """
    try:
        config = await supabase_service.get_trading_config()
        if not config:
            raise HTTPException(status_code=404, detail="No trading configuration found")
        
        return TradingConfig(**config)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching trading config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/trading-config", response_model=TradingConfig)
async def update_trading_config(config: TradingConfigUpdate):
    """
    Update trading parameters
    """
    try:
        # Get current config
        current = await supabase_service.get_trading_config()
        
        if not current:
            # Create new config if none exists
            new_config = TradingConfigCreate(
                trading_pair=config.trading_pair or "BTCUSDC",
                analysis_interval=config.analysis_interval or "1h",
                max_position_size=config.max_position_size or 100,
                stop_loss_percentage=config.stop_loss_percentage or 5,
                take_profit_percentage=config.take_profit_percentage or 10,
                is_active=config.is_active if config.is_active is not None else True
            )
            result = await supabase_service.client.table('trading_config')\
                .insert(new_config.model_dump()).execute()
            updated = result.data[0]
        else:
            # Update existing
            update_data = config.model_dump(exclude_unset=True)
            updated = await supabase_service.update_trading_config(
                current['id'],
                update_data
            )
        
        # If interval or pair changed, reschedule the analysis job
        if updated and (
            config.trading_pair is not None or 
            config.analysis_interval is not None
        ):
            from app.services.scheduler_service import scheduler_service
            await scheduler_service.schedule_analysis(
                updated['trading_pair'],
                updated['analysis_interval']
            )
        
        return TradingConfig(**updated)
        
    except Exception as e:
        logger.error(f"Error updating trading config: {e}")
        raise HTTPException(status_code=500, detail=str(e))
