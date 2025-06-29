class APIClient {
    constructor() {
        this.baseURL = '/api';
        this.token = localStorage.getItem('auth_token');
        this.wsConnection = null;
        this.reconnectInterval = 5000;
        this.maxReconnectAttempts = 10;
        this.reconnectAttempts = 0;
    }
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`,
                ...options.headers
            }
        };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `API Error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            this.handleAPIError(error);
            throw error;
        }
    }
    
    handleAPIError(error) {
        // Show notification for API errors
        if (window.animationController) {
            window.animationController.showNotification({
                type: 'error',
                message: error.message || 'An unexpected error occurred'
            });
        }
    }
    
    // Trading endpoints
    async executeAnalysis(pair, timeframe = '1h') {
        return this.request('/trading/execute-analysis', {
            method: 'POST',
            body: JSON.stringify({ trading_pair: pair, timeframe })
        });
    }
    
    async getPositions() {
        return this.request('/trading/positions');
    }
    
    async getBalance() {
        return this.request('/trading/balance');
    }
    
    async placeOrder(orderData) {
        return this.request('/trading/place-order', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }
    
    // Dashboard endpoints
    async getDashboardSummary() {
        return this.request('/dashboard/summary');
    }
    
    async getPerformanceData(period = '7d', trading_pair = null) {
        const params = new URLSearchParams({ period });
        if (trading_pair) params.append('trading_pair', trading_pair);
        return this.request(`/dashboard/charts/pnl?${params}`);
    }
    
    async getWinRateData(period = '30d', trading_pair = null) {
        const params = new URLSearchParams({ period });
        if (trading_pair) params.append('trading_pair', trading_pair);
        return this.request(`/dashboard/charts/win-rate?${params}`);
    }
    
    async getActiveAssets() {
        return this.request('/dashboard/active-assets');
    }
    
    // Analysis endpoints
    async getLatestDecision(trading_pair = null) {
        const params = trading_pair ? `?trading_pair=${trading_pair}` : '';
        return this.request(`/analysis/latest-decision${params}`);
    }
    
    async getDecisionHistory(options = {}) {
        const params = new URLSearchParams();
        if (options.trading_pair) params.append('trading_pair', options.trading_pair);
        if (options.limit) params.append('limit', options.limit);
        if (options.offset) params.append('offset', options.offset);
        
        return this.request(`/analysis/decision-history?${params}`);
    }
    
    // History endpoints
    async getTradeHistory(options = {}) {
        const params = new URLSearchParams();
        if (options.trading_pair) params.append('trading_pair', options.trading_pair);
        if (options.status) params.append('status', options.status);
        if (options.limit) params.append('limit', options.limit);
        if (options.offset) params.append('offset', options.offset);
        
        return this.request(`/history/trades?${params}`);
    }
    
    async getPerformanceMetrics(options = {}) {
        const params = new URLSearchParams();
        if (options.trading_pair) params.append('trading_pair', options.trading_pair);
        if (options.period) params.append('period', options.period);
        
        return this.request(`/history/performance?${params}`);
    }
    
    async getAPIUsage(options = {}) {
        const params = new URLSearchParams();
        if (options.service) params.append('service', options.service);
        if (options.limit) params.append('limit', options.limit);
        if (options.offset) params.append('offset', options.offset);
        
        return this.request(`/history/api-usage?${params}`);
    }
    
    // Settings endpoints
    async getAPIKeys() {
        return this.request('/settings/api-keys');
    }
    
    async updateAPIKey(keyType, keyData) {
        return this.request(`/settings/api-keys/${keyType}`, {
            method: 'PUT',
            body: JSON.stringify(keyData)
        });
    }
    
    async getTradingConfig() {
        return this.request('/settings/trading-config');
    }
    
    async updateTradingConfig(config) {
        return this.request('/settings/trading-config', {
            method: 'PUT',
            body: JSON.stringify(config)
        });
    }
    
    async getAIModels() {
        return this.request('/settings/models');
    }
    
    async updateAIModel(agentName, config) {
        return this.request(`/settings/models/${agentName}`, {
            method: 'PUT',
            body: JSON.stringify(config)
        });
    }
    
    // WebSocket connection for real-time updates
    connectWebSocket() {
        if (this.wsConnection?.readyState === WebSocket.OPEN) {
            return this.wsConnection;
        }
        
        const wsURL = `ws://${window.location.host}/ws`;
        this.wsConnection = new WebSocket(wsURL);
        
        this.wsConnection.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            
            // Update connection status
            this.updateConnectionStatus('connected');
        };
        
        this.wsConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleRealtimeUpdate(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        
        this.wsConnection.onclose = () => {
            console.log('WebSocket disconnected');
            this.updateConnectionStatus('disconnected');
            this.scheduleReconnect();
        };
        
        this.wsConnection.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.updateConnectionStatus('error');
        };
        
        return this.wsConnection;
    }
    
    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connectWebSocket();
            }, this.reconnectInterval);
        }
    }
    
    updateConnectionStatus(status) {
        const statusElement = document.querySelector('.connection-status');
        const statusText = document.querySelector('.status-text');
        const statusIndicator = document.querySelector('.status-indicator');
        
        if (statusElement) {
            statusElement.dataset.status = status;
            
            switch (status) {
                case 'connected':
                    statusText.textContent = 'Connected';
                    statusIndicator.style.background = 'var(--success)';
                    break;
                case 'disconnected':
                    statusText.textContent = 'Disconnected';
                    statusIndicator.style.background = 'var(--warning)';
                    break;
                case 'error':
                    statusText.textContent = 'Error';
                    statusIndicator.style.background = 'var(--danger)';
                    break;
            }
        }
    }
    
    handleRealtimeUpdate(data) {
        const { type, payload } = data;
        
        switch(type) {
            case 'price_update':
                this.updatePriceDisplay(payload);
                break;
            case 'trade_executed':
                this.showTradeNotification(payload);
                this.refreshTradeHistory();
                break;
            case 'analysis_complete':
                this.updateAnalysisResults(payload);
                break;
            case 'balance_update':
                this.updateBalanceDisplay(payload);
                break;
            default:
                console.log('Unknown realtime update:', data);
        }
    }
    
    updatePriceDisplay(priceData) {
        // Update price displays throughout the app
        document.querySelectorAll(`[data-symbol="${priceData.symbol}"]`).forEach(element => {
            const priceElement = element.querySelector('.current-price');
            const changeElement = element.querySelector('.price-change');
            
            if (priceElement) {
                priceElement.textContent = `$${priceData.price.toLocaleString()}`;
            }
            
            if (changeElement && priceData.change) {
                changeElement.textContent = `${priceData.change >= 0 ? '+' : ''}${priceData.change}%`;
                changeElement.className = `price-change ${priceData.change >= 0 ? 'positive' : 'negative'}`;
            }
        });
    }
    
    showTradeNotification(tradeData) {
        if (window.animationController) {
            const message = `${tradeData.side.toUpperCase()} order executed: ${tradeData.quantity} ${tradeData.symbol} at $${tradeData.price}`;
            window.animationController.showNotification({
                type: 'success',
                message
            });
        }
    }
    
    updateAnalysisResults(analysisData) {
        // Trigger a refresh of the dashboard and analysis displays
        if (window.currentPage === 'dashboard') {
            window.dashboard?.refreshData();
        }
        
        // Show notification
        if (window.animationController) {
            window.animationController.showNotification({
                type: 'success',
                message: `Analysis complete for ${analysisData.trading_pair}: ${analysisData.decision.toUpperCase()}`
            });
        }
    }
    
    updateBalanceDisplay(balanceData) {
        // Update balance displays
        document.querySelectorAll('.balance-display').forEach(element => {
            if (balanceData.total_balance_usd !== undefined) {
                element.textContent = `$${balanceData.total_balance_usd.toLocaleString()}`;
            }
        });
    }
    
    refreshTradeHistory() {
        // Trigger refresh of trade history if on trades page
        if (window.currentPage === 'trades' && window.tradesPage) {
            window.tradesPage.refreshTrades();
        }
    }
    
    disconnect() {
        if (this.wsConnection) {
            this.wsConnection.close();
            this.wsConnection = null;
        }
    }
}

// Create global API client instance
window.apiClient = new APIClient();

export default APIClient; 