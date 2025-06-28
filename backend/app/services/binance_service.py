from binance import AsyncClient, BinanceSocketManager
from binance.exceptions import BinanceAPIException
import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal
import asyncio

from app.services.supabase_service import supabase_service
from app.utils.security import decrypt_api_key
from app.models.trading import BalanceInfo, PositionInfo

logger = logging.getLogger(__name__)

class BinanceService:
    def __init__(self):
        self.client: Optional[AsyncClient] = None
        self.testnet_client: Optional[AsyncClient] = None
        self.is_testnet = True  # Default to testnet for safety
        self._api_key = None
        self._api_secret = None
    
    async def initialize(self):
        """Initialize Binance clients with API keys from database"""
        try:
            # Get Binance API key from database
            api_key_data = await supabase_service.get_api_key("binance")
            if api_key_data:
                # Decrypt the API key
                encrypted_key = api_key_data['encrypted_key']
                # Assuming format: "api_key:api_secret"
                decrypted = decrypt_api_key(encrypted_key)
                self._api_key, self._api_secret = decrypted.split(':')
                self.is_testnet = api_key_data.get('is_testnet', True)
                
                # Initialize appropriate client
                if self.is_testnet:
                    self.testnet_client = await AsyncClient.create(
                        api_key=self._api_key,
                        api_secret=self._api_secret,
                        testnet=True
                    )
                    logger.info("Binance testnet client initialized")
                else:
                    self.client = await AsyncClient.create(
                        api_key=self._api_key,
                        api_secret=self._api_secret
                    )
                    logger.info("Binance production client initialized")
            else:
                logger.warning("No Binance API key found in database")
                
        except Exception as e:
            logger.error(f"Error initializing Binance client: {e}")
            raise
    
    def _get_client(self) -> AsyncClient:
        """Get the appropriate client based on testnet setting"""
        if self.is_testnet:
            if not self.testnet_client:
                raise Exception("Binance testnet client not initialized")
            return self.testnet_client
        else:
            if not self.client:
                raise Exception("Binance client not initialized")
            return self.client
    
    async def get_account_balance(self) -> List[BalanceInfo]:
        """Get account balance"""
        try:
            client = self._get_client()
            account = await client.get_account()
            
            balances = []
            for balance in account['balances']:
                free = float(balance['free'])
                locked = float(balance['locked'])
                total = free + locked
                
                # Only include non-zero balances
                if total > 0:
                    balances.append(BalanceInfo(
                        asset=balance['asset'],
                        free=free,
                        locked=locked,
                        total=total
                    ))
            
            return balances
            
        except BinanceAPIException as e:
            logger.error(f"Binance API error getting balance: {e}")
            raise
        except Exception as e:
            logger.error(f"Error getting account balance: {e}")
            raise
    
    async def get_current_price(self, symbol: str) -> float:
        """Get current price for a symbol"""
        try:
            client = self._get_client()
            ticker = await client.get_symbol_ticker(symbol=symbol)
            return float(ticker['price'])
        except Exception as e:
            logger.error(f"Error getting price for {symbol}: {e}")
            raise
    
    async def execute_trade(
        self,
        trading_pair: str,
        side: str,  # 'buy' or 'sell'
        quantity: float,
        price: Optional[float] = None
    ) -> Dict[str, Any]:
        """Execute a trade on Binance"""
        try:
            client = self._get_client()
            
            # Get symbol info for precision
            exchange_info = await client.get_exchange_info()
            symbol_info = next(
                (s for s in exchange_info['symbols'] if s['symbol'] == trading_pair),
                None
            )
            
            if not symbol_info:
                raise Exception(f"Symbol {trading_pair} not found")
            
            # Calculate quantity based on filters
            quantity = await self._calculate_valid_quantity(
                symbol_info, quantity, price or await self.get_current_price(trading_pair)
            )
            
            # Prepare order parameters
            order_params = {
                'symbol': trading_pair,
                'side': side.upper(),
                'quantity': quantity
            }
            
            # Use market order for immediate execution
            order_params['type'] = 'MARKET'
            
            # Place the order
            order = await client.create_order(**order_params)
            
            logger.info(f"Order placed successfully: {order}")
            
            return {
                'order_id': order['orderId'],
                'status': order['status'].lower(),
                'executed_qty': float(order.get('executedQty', 0)),
                'price': float(order.get('price', 0)) or await self._get_fill_price(order),
                'fees': await self._calculate_fees(order)
            }
            
        except BinanceAPIException as e:
            logger.error(f"Binance API error executing trade: {e}")
            return {
                'status': 'failed',
                'error': str(e)
            }
        except Exception as e:
            logger.error(f"Error executing trade: {e}")
            return {
                'status': 'failed',
                'error': str(e)
            }
    
    async def _calculate_valid_quantity(
        self,
        symbol_info: Dict[str, Any],
        desired_quantity: float,
        price: float
    ) -> float:
        """Calculate valid quantity based on symbol filters"""
        filters = {f['filterType']: f for f in symbol_info['filters']}
        
        # Get LOT_SIZE filter
        lot_size = filters.get('LOT_SIZE', {})
        min_qty = float(lot_size.get('minQty', 0))
        max_qty = float(lot_size.get('maxQty', 999999))
        step_size = float(lot_size.get('stepSize', 1))
        
        # Get MIN_NOTIONAL filter
        min_notional = filters.get('MIN_NOTIONAL', {})
        min_notional_value = float(min_notional.get('minNotional', 0))
        
        # Calculate quantity based on desired USD value or direct quantity
        if desired_quantity < 1:  # Assume it's a USD value
            quantity = desired_quantity / price
        else:
            quantity = desired_quantity
        
        # Apply lot size constraints
        quantity = max(min_qty, quantity)
        quantity = min(max_qty, quantity)
        
        # Round to step size
        if step_size > 0:
            quantity = round(quantity / step_size) * step_size
        
        # Check minimum notional
        if quantity * price < min_notional_value:
            quantity = min_notional_value / price
            quantity = round(quantity / step_size) * step_size
        
        # Format to appropriate decimal places
        precision = len(str(step_size).split('.')[-1]) if '.' in str(step_size) else 0
        return round(quantity, precision)
    
    async def _get_fill_price(self, order: Dict[str, Any]) -> float:
        """Calculate average fill price from order fills"""
        if 'fills' in order and order['fills']:
            total_qty = 0
            total_value = 0
            for fill in order['fills']:
                qty = float(fill['qty'])
                price = float(fill['price'])
                total_qty += qty
                total_value += qty * price
            return total_value / total_qty if total_qty > 0 else 0
        return 0
    
    async def _calculate_fees(self, order: Dict[str, Any]) -> float:
        """Calculate total fees from order"""
        if 'fills' in order and order['fills']:
            total_fees = 0
            for fill in order['fills']:
                commission = float(fill.get('commission', 0))
                # Assuming fees are in the commission asset (usually BNB)
                # This is a simplified calculation
                total_fees += commission
            return total_fees
        return 0
    
    async def get_open_positions(self) -> List[PositionInfo]:
        """Get current open positions"""
        try:
            balances = await self.get_account_balance()
            positions = []
            
            # For spot trading, positions are just non-zero balances
            for balance in balances:
                if balance.asset != 'USDT' and balance.total > 0:
                    # Get current price
                    symbol = f"{balance.asset}USDT"
                    try:
                        current_price = await self.get_current_price(symbol)
                        # This is simplified - in reality we'd track entry prices
                        positions.append(PositionInfo(
                            symbol=symbol,
                            side='long',  # Spot is always long
                            quantity=balance.total,
                            entry_price=current_price,  # Would need to track actual entry
                            current_price=current_price,
                            pnl=0,  # Would calculate from actual entry price
                            pnl_percentage=0
                        ))
                    except:
                        # Skip if we can't get price
                        pass
            
            return positions
            
        except Exception as e:
            logger.error(f"Error getting open positions: {e}")
            return []
    
    async def close(self):
        """Close client connections"""
        if self.client:
            await self.client.close_connection()
        if self.testnet_client:
            await self.testnet_client.close_connection()

# Singleton instance
binance_service = BinanceService()
