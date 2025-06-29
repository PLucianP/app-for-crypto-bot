class Settings {
    constructor() {
        this.currentSection = 'api-keys';
        this.apiKeys = {};
        this.tradingConfig = {};
        this.aiModels = {};
        this.unsavedChanges = false;
    }
    
    async render() {
        try {
            window.animationController.showLoader('Loading settings...');
            
            await this.loadData();
            
            const html = `
                <div class="settings-container">
                    <div class="settings-header">
                        <h2 class="page-title">Settings & Configuration</h2>
                        <div class="settings-actions">
                            <button class="save-btn btn btn-primary" ${!this.unsavedChanges ? 'disabled' : ''}>
                                <span class="icon">💾</span>
                                <span class="text">Save Changes</span>
                            </button>
                            <button class="reset-btn btn btn-secondary">
                                <span class="icon">🔄</span>
                                <span class="text">Reset</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="settings-content">
                        <div class="settings-sidebar">
                            <nav class="settings-nav">
                                <button class="nav-item active" data-section="api-keys">
                                    <span class="icon">🔑</span>
                                    <span class="text">API Keys</span>
                                </button>
                                <button class="nav-item" data-section="trading">
                                    <span class="icon">⚙️</span>
                                    <span class="text">Trading Config</span>
                                </button>
                                <button class="nav-item" data-section="ai-models">
                                    <span class="icon">🤖</span>
                                    <span class="text">AI Models</span>
                                </button>
                                <button class="nav-item" data-section="notifications">
                                    <span class="icon">🔔</span>
                                    <span class="text">Notifications</span>
                                </button>
                                <button class="nav-item" data-section="security">
                                    <span class="icon">🛡️</span>
                                    <span class="text">Security</span>
                                </button>
                            </nav>
                        </div>
                        
                        <div class="settings-main">
                            <div class="settings-section active" data-section="api-keys">
                                ${this.renderAPIKeysSection()}
                            </div>
                            
                            <div class="settings-section" data-section="trading">
                                ${this.renderTradingConfigSection()}
                            </div>
                            
                            <div class="settings-section" data-section="ai-models">
                                ${this.renderAIModelsSection()}
                            </div>
                            
                            <div class="settings-section" data-section="notifications">
                                ${this.renderNotificationsSection()}
                            </div>
                            
                            <div class="settings-section" data-section="security">
                                ${this.renderSecuritySection()}
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            window.animationController.hideLoader();
            return html;
            
        } catch (error) {
            window.animationController.hideLoader();
            window.animationController.showNotification({
                type: 'error',
                message: 'Failed to load settings: ' + error.message
            });
            return '<div class="error-state">Failed to load settings</div>';
        }
    }
    
    async loadData() {
        try {
            const [apiKeys, tradingConfig, aiModels] = await Promise.all([
                window.apiClient.getAPIKeys(),
                window.apiClient.getTradingConfig(),
                window.apiClient.getAIModels()
            ]);
            
            this.apiKeys = apiKeys;
            this.tradingConfig = tradingConfig;
            this.aiModels = aiModels;
            
        } catch (error) {
            console.error('Failed to load settings data:', error);
            // Use mock data for demo
            this.apiKeys = {
                binance: { configured: false, api_key: '', secret_key: '' },
                openai: { configured: false, api_key: '' }
            };
            this.tradingConfig = {
                max_position_size: 1000,
                stop_loss_percentage: 5,
                take_profit_percentage: 10,
                max_daily_trades: 10,
                risk_per_trade: 2
            };
            this.aiModels = {
                analyst: { model: 'gpt-4', temperature: 0.7 },
                trader: { model: 'gpt-3.5-turbo', temperature: 0.3 },
                risk_manager: { model: 'gpt-4', temperature: 0.2 }
            };
        }
    }
    
    renderAPIKeysSection() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h3>API Keys Configuration</h3>
                    <p>Configure your exchange and AI service API keys</p>
                </div>
                
                <div class="settings-cards">
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Binance Exchange</h4>
                            <div class="status-indicator ${this.apiKeys.binance?.configured ? 'connected' : 'disconnected'}">
                                ${this.apiKeys.binance?.configured ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="binance-api-key">API Key</label>
                                <div class="input-with-icon">
                                    <input 
                                        type="password" 
                                        id="binance-api-key"
                                        class="form-input"
                                        placeholder="Enter your Binance API Key"
                                        value="${this.apiKeys.binance?.api_key || ''}"
                                        data-service="binance"
                                        data-field="api_key"
                                    >
                                    <button class="toggle-visibility" type="button">👁️</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="binance-secret-key">Secret Key</label>
                                <div class="input-with-icon">
                                    <input 
                                        type="password" 
                                        id="binance-secret-key"
                                        class="form-input"
                                        placeholder="Enter your Binance Secret Key"
                                        value="${this.apiKeys.binance?.secret_key || ''}"
                                        data-service="binance"
                                        data-field="secret_key"
                                    >
                                    <button class="toggle-visibility" type="button">👁️</button>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button class="test-connection-btn btn btn-secondary" data-service="binance">
                                    Test Connection
                                </button>
                                <button class="save-key-btn btn btn-primary" data-service="binance">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>OpenAI API</h4>
                            <div class="status-indicator ${this.apiKeys.openai?.configured ? 'connected' : 'disconnected'}">
                                ${this.apiKeys.openai?.configured ? 'Connected' : 'Not Connected'}
                            </div>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="openai-api-key">API Key</label>
                                <div class="input-with-icon">
                                    <input 
                                        type="password" 
                                        id="openai-api-key"
                                        class="form-input"
                                        placeholder="Enter your OpenAI API Key"
                                        value="${this.apiKeys.openai?.api_key || ''}"
                                        data-service="openai"
                                        data-field="api_key"
                                    >
                                    <button class="toggle-visibility" type="button">👁️</button>
                                </div>
                            </div>
                            <div class="form-actions">
                                <button class="test-connection-btn btn btn-secondary" data-service="openai">
                                    Test Connection
                                </button>
                                <button class="save-key-btn btn btn-primary" data-service="openai">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="section-footer">
                    <div class="security-notice">
                        <span class="icon">🛡️</span>
                        <div class="notice-content">
                            <strong>Security Notice:</strong>
                            <p>Your API keys are encrypted and stored securely. Never share your API keys with anyone.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderTradingConfigSection() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h3>Trading Configuration</h3>
                    <p>Configure risk management and trading parameters</p>
                </div>
                
                <div class="settings-cards">
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Risk Management</h4>
                        </div>
                        <div class="card-body">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="max-position-size">Maximum Position Size</label>
                                    <div class="input-with-unit">
                                        <input 
                                            type="number" 
                                            id="max-position-size"
                                            class="form-input"
                                            value="${this.tradingConfig.max_position_size || 1000}"
                                            data-field="max_position_size"
                                            min="0"
                                            step="100"
                                        >
                                        <span class="unit">USDT</span>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="risk-per-trade">Risk Per Trade</label>
                                    <div class="input-with-unit">
                                        <input 
                                            type="number" 
                                            id="risk-per-trade"
                                            class="form-input"
                                            value="${this.tradingConfig.risk_per_trade || 2}"
                                            data-field="risk_per_trade"
                                            min="0.1"
                                            max="10"
                                            step="0.1"
                                        >
                                        <span class="unit">%</span>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="stop-loss">Stop Loss</label>
                                    <div class="input-with-unit">
                                        <input 
                                            type="number" 
                                            id="stop-loss"
                                            class="form-input"
                                            value="${this.tradingConfig.stop_loss_percentage || 5}"
                                            data-field="stop_loss_percentage"
                                            min="1"
                                            max="20"
                                            step="0.5"
                                        >
                                        <span class="unit">%</span>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="take-profit">Take Profit</label>
                                    <div class="input-with-unit">
                                        <input 
                                            type="number" 
                                            id="take-profit"
                                            class="form-input"
                                            value="${this.tradingConfig.take_profit_percentage || 10}"
                                            data-field="take_profit_percentage"
                                            min="2"
                                            max="50"
                                            step="0.5"
                                        >
                                        <span class="unit">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Trading Limits</h4>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="max-daily-trades">Maximum Daily Trades</label>
                                <input 
                                    type="number" 
                                    id="max-daily-trades"
                                    class="form-input"
                                    value="${this.tradingConfig.max_daily_trades || 10}"
                                    data-field="max_daily_trades"
                                    min="1"
                                    max="100"
                                >
                            </div>
                            
                            <div class="form-group">
                                <label>Trading Hours (UTC)</label>
                                <div class="time-range">
                                    <input 
                                        type="time" 
                                        class="form-input"
                                        value="${this.tradingConfig.trading_start_time || '00:00'}"
                                        data-field="trading_start_time"
                                    >
                                    <span class="separator">to</span>
                                    <input 
                                        type="time" 
                                        class="form-input"
                                        value="${this.tradingConfig.trading_end_time || '23:59'}"
                                        data-field="trading_end_time"
                                    >
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Emergency Stop</label>
                                <div class="toggle-switch">
                                    <input 
                                        type="checkbox" 
                                        id="emergency-stop"
                                        ${this.tradingConfig.emergency_stop_enabled ? 'checked' : ''}
                                        data-field="emergency_stop_enabled"
                                    >
                                    <label for="emergency-stop" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                    <span class="toggle-text">Stop all trading in case of emergency</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAIModelsSection() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h3>AI Models Configuration</h3>
                    <p>Configure AI agents and their parameters</p>
                </div>
                
                <div class="settings-cards">
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Market Analyst</h4>
                            <div class="role-description">Analyzes market trends and technical indicators</div>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="analyst-model">Model</label>
                                <select id="analyst-model" class="form-select" data-agent="analyst" data-field="model">
                                    <option value="gpt-4" ${this.aiModels.analyst?.model === 'gpt-4' ? 'selected' : ''}>GPT-4 (Recommended)</option>
                                    <option value="gpt-3.5-turbo" ${this.aiModels.analyst?.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="analyst-temperature">Temperature (Creativity)</label>
                                <div class="slider-container">
                                    <input 
                                        type="range" 
                                        id="analyst-temperature"
                                        class="form-slider"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value="${this.aiModels.analyst?.temperature || 0.7}"
                                        data-agent="analyst"
                                        data-field="temperature"
                                    >
                                    <span class="slider-value">${this.aiModels.analyst?.temperature || 0.7}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Trader</h4>
                            <div class="role-description">Makes trading decisions based on analysis</div>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="trader-model">Model</label>
                                <select id="trader-model" class="form-select" data-agent="trader" data-field="model">
                                    <option value="gpt-4" ${this.aiModels.trader?.model === 'gpt-4' ? 'selected' : ''}>GPT-4</option>
                                    <option value="gpt-3.5-turbo" ${this.aiModels.trader?.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo (Recommended)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="trader-temperature">Temperature (Creativity)</label>
                                <div class="slider-container">
                                    <input 
                                        type="range" 
                                        id="trader-temperature"
                                        class="form-slider"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value="${this.aiModels.trader?.temperature || 0.3}"
                                        data-agent="trader"
                                        data-field="temperature"
                                    >
                                    <span class="slider-value">${this.aiModels.trader?.temperature || 0.3}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Risk Manager</h4>
                            <div class="role-description">Validates trades and manages risk</div>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="risk-manager-model">Model</label>
                                <select id="risk-manager-model" class="form-select" data-agent="risk_manager" data-field="model">
                                    <option value="gpt-4" ${this.aiModels.risk_manager?.model === 'gpt-4' ? 'selected' : ''}>GPT-4 (Recommended)</option>
                                    <option value="gpt-3.5-turbo" ${this.aiModels.risk_manager?.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="risk-manager-temperature">Temperature (Creativity)</label>
                                <div class="slider-container">
                                    <input 
                                        type="range" 
                                        id="risk-manager-temperature"
                                        class="form-slider"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value="${this.aiModels.risk_manager?.temperature || 0.2}"
                                        data-agent="risk_manager"
                                        data-field="temperature"
                                    >
                                    <span class="slider-value">${this.aiModels.risk_manager?.temperature || 0.2}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderNotificationsSection() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h3>Notification Settings</h3>
                    <p>Configure when and how you receive notifications</p>
                </div>
                
                <div class="settings-cards">
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Trading Notifications</h4>
                        </div>
                        <div class="card-body">
                            <div class="notification-option">
                                <div class="toggle-switch">
                                    <input type="checkbox" id="trade-executed" checked>
                                    <label for="trade-executed" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="option-content">
                                    <div class="option-title">Trade Executed</div>
                                    <div class="option-description">Notify when trades are executed</div>
                                </div>
                            </div>
                            
                            <div class="notification-option">
                                <div class="toggle-switch">
                                    <input type="checkbox" id="ai-decision" checked>
                                    <label for="ai-decision" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="option-content">
                                    <div class="option-title">AI Decisions</div>
                                    <div class="option-description">Notify when AI makes trading decisions</div>
                                </div>
                            </div>
                            
                            <div class="notification-option">
                                <div class="toggle-switch">
                                    <input type="checkbox" id="profit-loss">
                                    <label for="profit-loss" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="option-content">
                                    <div class="option-title">Significant P&L Changes</div>
                                    <div class="option-description">Notify on major profit or loss events</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>System Notifications</h4>
                        </div>
                        <div class="card-body">
                            <div class="notification-option">
                                <div class="toggle-switch">
                                    <input type="checkbox" id="api-errors" checked>
                                    <label for="api-errors" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="option-content">
                                    <div class="option-title">API Errors</div>
                                    <div class="option-description">Notify when API calls fail</div>
                                </div>
                            </div>
                            
                            <div class="notification-option">
                                <div class="toggle-switch">
                                    <input type="checkbox" id="connection-status">
                                    <label for="connection-status" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <div class="option-content">
                                    <div class="option-title">Connection Status</div>
                                    <div class="option-description">Notify on connection changes</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSecuritySection() {
        return `
            <div class="section-content">
                <div class="section-header">
                    <h3>Security Settings</h3>
                    <p>Manage your account security and access controls</p>
                </div>
                
                <div class="settings-cards">
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Session Management</h4>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label>Session Timeout</label>
                                <select class="form-select">
                                    <option value="30">30 minutes</option>
                                    <option value="60" selected>1 hour</option>
                                    <option value="240">4 hours</option>
                                    <option value="480">8 hours</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Auto-logout on inactivity</label>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="auto-logout" checked>
                                    <label for="auto-logout" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button class="btn btn-danger">Clear All Sessions</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-card">
                        <div class="card-header">
                            <h4>Data Protection</h4>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <label>Encrypt sensitive data</label>
                                <div class="toggle-switch">
                                    <input type="checkbox" id="encrypt-data" checked disabled>
                                    <label for="encrypt-data" class="toggle-label">
                                        <span class="toggle-slider"></span>
                                    </label>
                                </div>
                                <small class="form-hint">Always enabled for security</small>
                            </div>
                            
                            <div class="form-group">
                                <label>Data retention period</label>
                                <select class="form-select">
                                    <option value="30">30 days</option>
                                    <option value="90" selected>90 days</option>
                                    <option value="365">1 year</option>
                                    <option value="0">Keep forever</option>
                                </select>
                            </div>
                            
                            <div class="form-actions">
                                <button class="btn btn-secondary">Export Data</button>
                                <button class="btn btn-danger">Delete All Data</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    async animateIn() {
        const elements = document.querySelectorAll('.settings-card, .nav-item');
        
        gsap.from(elements, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power3.out'
        });
    }
    
    setupEventListeners() {
        // Section navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });
        
        // Form inputs
        document.addEventListener('input', (e) => {
            if (e.target.matches('.form-input, .form-select, .form-slider')) {
                this.markAsChanged();
                this.updateSliderValue(e.target);
            }
        });
        
        document.addEventListener('change', (e) => {
            if (e.target.matches('input[type="checkbox"]')) {
                this.markAsChanged();
            }
        });
        
        // Password visibility toggles
        document.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const input = e.target.previousElementSibling;
                if (input.type === 'password') {
                    input.type = 'text';
                    e.target.textContent = '🙈';
                } else {
                    input.type = 'password';
                    e.target.textContent = '👁️';
                }
            });
        });
        
        // Test connection buttons
        document.querySelectorAll('.test-connection-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                this.testConnection(service);
            });
        });
        
        // Save key buttons
        document.querySelectorAll('.save-key-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.target.dataset.service;
                this.saveAPIKey(service);
            });
        });
        
        // Save and reset buttons
        document.querySelector('.save-btn')?.addEventListener('click', () => {
            this.saveAllSettings();
        });
        
        document.querySelector('.reset-btn')?.addEventListener('click', () => {
            this.resetSettings();
        });
    }
    
    switchSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionName) {
                item.classList.add('active');
            }
        });
        
        // Update sections
        document.querySelectorAll('.settings-section').forEach(section => {
            section.classList.remove('active');
            if (section.dataset.section === sectionName) {
                section.classList.add('active');
            }
        });
        
        // Animate in new section
        gsap.from(`.settings-section[data-section="${sectionName}"]`, {
            opacity: 0,
            x: 20,
            duration: 0.4,
            ease: 'power2.out'
        });
        
        this.currentSection = sectionName;
    }
    
    markAsChanged() {
        this.unsavedChanges = true;
        const saveBtn = document.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.classList.add('has-changes');
        }
    }
    
    updateSliderValue(slider) {
        if (slider.classList.contains('form-slider')) {
            const valueDisplay = slider.parentElement.querySelector('.slider-value');
            if (valueDisplay) {
                valueDisplay.textContent = slider.value;
            }
        }
    }
    
    async testConnection(service) {
        const btn = document.querySelector(`[data-service="${service}"].test-connection-btn`);
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<span class="icon">⏳</span><span class="text">Testing...</span>';
        btn.disabled = true;
        
        try {
            // Simulate API test
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            window.animationController.showNotification({
                type: 'success',
                message: `${service} connection successful!`
            });
            
        } catch (error) {
            window.animationController.showNotification({
                type: 'error',
                message: `${service} connection failed: ${error.message}`
            });
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
    
    async saveAPIKey(service) {
        const apiKeyInput = document.querySelector(`[data-service="${service}"][data-field="api_key"]`);
        const secretKeyInput = document.querySelector(`[data-service="${service}"][data-field="secret_key"]`);
        
        const keyData = {
            api_key: apiKeyInput?.value || '',
            secret_key: secretKeyInput?.value || ''
        };
        
        try {
            await window.apiClient.updateAPIKey(service, keyData);
            
            window.animationController.showNotification({
                type: 'success',
                message: `${service} API key saved successfully`
            });
            
            // Update status indicator
            const statusIndicator = document.querySelector(`.settings-card .status-indicator`);
            if (statusIndicator && keyData.api_key) {
                statusIndicator.className = 'status-indicator connected';
                statusIndicator.textContent = 'Connected';
            }
            
        } catch (error) {
            window.animationController.showNotification({
                type: 'error',
                message: `Failed to save ${service} API key`
            });
        }
    }
    
    async saveAllSettings() {
        try {
            window.animationController.showLoader('Saving settings...');
            
            // Collect all form data
            const tradingConfigData = this.collectTradingConfig();
            const aiModelsData = this.collectAIModelsConfig();
            
            // Save to backend
            await Promise.all([
                window.apiClient.updateTradingConfig(tradingConfigData),
                this.saveAIModelsConfig(aiModelsData)
            ]);
            
            this.unsavedChanges = false;
            const saveBtn = document.querySelector('.save-btn');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.classList.remove('has-changes');
            }
            
            window.animationController.hideLoader();
            window.animationController.showNotification({
                type: 'success',
                message: 'Settings saved successfully'
            });
            
        } catch (error) {
            window.animationController.hideLoader();
            window.animationController.showNotification({
                type: 'error',
                message: 'Failed to save settings'
            });
        }
    }
    
    collectTradingConfig() {
        const config = {};
        document.querySelectorAll('[data-field]').forEach(input => {
            const field = input.dataset.field;
            if (input.type === 'checkbox') {
                config[field] = input.checked;
            } else if (input.type === 'number' || input.type === 'range') {
                config[field] = parseFloat(input.value);
            } else {
                config[field] = input.value;
            }
        });
        return config;
    }
    
    collectAIModelsConfig() {
        const models = {};
        document.querySelectorAll('[data-agent]').forEach(input => {
            const agent = input.dataset.agent;
            const field = input.dataset.field;
            
            if (!models[agent]) {
                models[agent] = {};
            }
            
            if (input.type === 'range') {
                models[agent][field] = parseFloat(input.value);
            } else {
                models[agent][field] = input.value;
            }
        });
        return models;
    }
    
    async saveAIModelsConfig(modelsData) {
        const promises = Object.entries(modelsData).map(([agent, config]) =>
            window.apiClient.updateAIModel(agent, config)
        );
        await Promise.all(promises);
    }
    
    async resetSettings() {
        const confirmed = confirm('Are you sure you want to reset all settings to default values?');
        if (!confirmed) return;
        
        try {
            await this.loadData();
            this.refreshAllSections();
            this.unsavedChanges = false;
            
            window.animationController.showNotification({
                type: 'success',
                message: 'Settings reset to defaults'
            });
            
        } catch (error) {
            window.animationController.showNotification({
                type: 'error',
                message: 'Failed to reset settings'
            });
        }
    }
    
    refreshAllSections() {
        // Re-render all sections with updated data
        const sections = {
            'api-keys': this.renderAPIKeysSection(),
            'trading': this.renderTradingConfigSection(),
            'ai-models': this.renderAIModelsSection(),
            'notifications': this.renderNotificationsSection(),
            'security': this.renderSecuritySection()
        };
        
        Object.entries(sections).forEach(([sectionName, html]) => {
            const section = document.querySelector(`[data-section="${sectionName}"]`);
            if (section) {
                section.innerHTML = html;
            }
        });
        
        this.setupEventListeners();
    }
    
    destroy() {
        // Cleanup if needed
    }
}

export default Settings; 