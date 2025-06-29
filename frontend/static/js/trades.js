class Trades {
    constructor() {
        this.currentFilter = 'all';
        this.currentSort = 'newest';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.trades = [];
        this.decisions = [];
        this.refreshInterval = null;
    }
    
    async render() {
        try {
            window.animationController.showLoader('Loading trades...');
            
            await this.loadData();
            
            const html = `
                <div class="trades-container">
                    <div class="trades-header">
                        <h2 class="page-title">Trade History & AI Decisions</h2>
                        <div class="trades-controls">
                            <div class="filter-group">
                                <select class="filter-select" data-filter="status">
                                    <option value="all">All Trades</option>
                                    <option value="filled">Filled</option>
                                    <option value="pending">Pending</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <select class="filter-select" data-filter="pair">
                                    <option value="all">All Pairs</option>
                                    ${this.getUniqueTradingPairs().map(pair => 
                                        `<option value="${pair}">${pair}</option>`
                                    ).join('')}
                                </select>
                                <select class="filter-select" data-filter="sort">
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="profit">Highest Profit</option>
                                    <option value="loss">Highest Loss</option>
                                </select>
                            </div>
                            <button class="refresh-btn btn btn-secondary">
                                <span class="icon">🔄</span>
                                <span class="text">Refresh</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="trades-content">
                        <div class="trades-tabs">
                            <button class="tab-btn active" data-tab="trades">Trade History</button>
                            <button class="tab-btn" data-tab="decisions">AI Decisions</button>
                            <button class="tab-btn" data-tab="analytics">Analytics</button>
                        </div>
                        
                        <div class="tab-content">
                            <div class="tab-panel active" data-panel="trades">
                                ${this.renderTradesTable()}
                            </div>
                            
                            <div class="tab-panel" data-panel="decisions">
                                ${this.renderDecisionsTimeline()}
                            </div>
                            
                            <div class="tab-panel" data-panel="analytics">
                                ${this.renderAnalytics()}
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
                message: 'Failed to load trades: ' + error.message
            });
            return '<div class="error-state">Failed to load trades</div>';
        }
    }
    
    async loadData() {
        try {
            const [trades, decisions] = await Promise.all([
                window.apiClient.getTradeHistory({ limit: 100 }),
                window.apiClient.getDecisionHistory({ limit: 100 })
            ]);
            
            this.trades = trades;
            this.decisions = decisions;
            
        } catch (error) {
            console.error('Failed to load trades data:', error);
            // Initialize empty arrays when API fails
            this.trades = [];
            this.decisions = [];
        }
    }
    
    renderTradesTable() {
        if (!this.trades || this.trades.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h4>No Trades Found</h4>
                    <p>Execute some trades to see them here</p>
                </div>
            `;
        }
        
        const filteredTrades = this.getFilteredTrades();
        const paginatedTrades = this.getPaginatedTrades(filteredTrades);
        
        return `
            <div class="trades-table-container">
                <div class="trades-summary">
                    <div class="summary-card">
                        <span class="label">Total Trades</span>
                        <span class="value">${filteredTrades.length}</span>
                    </div>
                    <div class="summary-card">
                        <span class="label">Total P&L</span>
                        <span class="value ${this.getTotalPnL(filteredTrades) >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(this.getTotalPnL(filteredTrades))}
                        </span>
                    </div>
                    <div class="summary-card">
                        <span class="label">Win Rate</span>
                        <span class="value">${this.getWinRate(filteredTrades).toFixed(1)}%</span>
                    </div>
                </div>
                
                <div class="table-wrapper">
                    <table class="trades-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Pair</th>
                                <th>Side</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                                <th>P&L</th>
                                <th>Status</th>
                                <th>AI Confidence</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${paginatedTrades.map(trade => this.renderTradeRow(trade)).join('')}
                        </tbody>
                    </table>
                </div>
                
                ${this.renderPagination(filteredTrades.length)}
            </div>
        `;
    }
    
    renderTradeRow(trade) {
        const decision = this.decisions.find(d => d.trading_pair === trade.trading_pair);
        const confidence = decision ? decision.confidence : 'N/A';
        
        return `
            <tr class="trade-row" data-trade-id="${trade.id}">
                <td class="trade-date">${this.formatDateTime(trade.created_at)}</td>
                <td class="trade-pair">
                    <span class="pair-symbol">${trade.trading_pair}</span>
                </td>
                <td class="trade-side">
                    <span class="side-badge ${trade.side}">${trade.side.toUpperCase()}</span>
                </td>
                <td class="trade-quantity">${this.formatNumber(trade.quantity)}</td>
                <td class="trade-price">${this.formatCurrency(trade.price)}</td>
                <td class="trade-total">${this.formatCurrency(trade.quantity * trade.price)}</td>
                <td class="trade-pnl ${trade.pnl >= 0 ? 'positive' : 'negative'}">
                    ${trade.pnl !== null ? this.formatCurrency(trade.pnl) : '-'}
                </td>
                <td class="trade-status">
                    <span class="status-badge ${trade.status}">${trade.status}</span>
                </td>
                <td class="ai-confidence">
                    ${confidence !== 'N/A' ? `
                        <div class="confidence-meter">
                            <div class="confidence-bar" style="width: ${confidence * 10}%"></div>
                            <span class="confidence-value">${confidence}/10</span>
                        </div>
                    ` : confidence}
                </td>
            </tr>
        `;
    }
    
    renderDecisionsTimeline() {
        if (!this.decisions || this.decisions.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🤖</div>
                    <h4>No AI Decisions Found</h4>
                    <p>Run analysis to see AI decisions</p>
                </div>
            `;
        }
        
        return `
            <div class="decisions-timeline">
                <div class="timeline-filters">
                    <select class="filter-select" data-filter="decision-type">
                        <option value="all">All Decisions</option>
                        <option value="buy">Buy Signals</option>
                        <option value="sell">Sell Signals</option>
                        <option value="hold">Hold Decisions</option>
                    </select>
                    <select class="filter-select" data-filter="confidence">
                        <option value="all">All Confidence Levels</option>
                        <option value="high">High (8-10)</option>
                        <option value="medium">Medium (5-7)</option>
                        <option value="low">Low (1-4)</option>
                    </select>
                </div>
                
                <div class="timeline-container">
                    ${this.decisions.map(decision => this.renderDecisionItem(decision)).join('')}
                </div>
            </div>
        `;
    }
    
    renderDecisionItem(decision) {
        const confidenceLevel = decision.confidence >= 8 ? 'high' : 
                               decision.confidence >= 5 ? 'medium' : 'low';
        
        return `
            <div class="timeline-item" data-decision="${decision.decision}" data-confidence="${confidenceLevel}">
                <div class="timeline-marker ${decision.decision}">
                    <span class="decision-icon">${this.getDecisionIcon(decision.decision)}</span>
                </div>
                <div class="timeline-content">
                    <div class="decision-header">
                        <h4 class="decision-title">${decision.decision.toUpperCase()} ${decision.trading_pair}</h4>
                        <div class="decision-meta">
                            <span class="decision-time">${this.formatDateTime(decision.created_at)}</span>
                            <div class="confidence-badge ${confidenceLevel}">
                                ${decision.confidence}/10
                            </div>
                        </div>
                    </div>
                    <div class="decision-details">
                        <p class="decision-reasoning">${decision.reasoning || 'No reasoning provided'}</p>
                        <div class="decision-metrics">
                            <div class="metric">
                                <span class="label">Target Price:</span>
                                <span class="value">${this.formatCurrency(decision.target_price || 0)}</span>
                            </div>
                            <div class="metric">
                                <span class="label">Stop Loss:</span>
                                <span class="value">${this.formatCurrency(decision.stop_loss || 0)}</span>
                            </div>
                            <div class="metric">
                                <span class="label">Market Sentiment:</span>
                                <span class="value sentiment-${decision.market_sentiment || 'neutral'}">
                                    ${(decision.market_sentiment || 'neutral').toUpperCase()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderAnalytics() {
        const stats = this.calculateAnalytics();
        
        return `
            <div class="analytics-container">
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h4>Performance Metrics</h4>
                        <div class="metrics-list">
                            <div class="metric-row">
                                <span class="label">Total Trades:</span>
                                <span class="value">${stats.totalTrades}</span>
                            </div>
                            <div class="metric-row">
                                <span class="label">Winning Trades:</span>
                                <span class="value positive">${stats.winningTrades}</span>
                            </div>
                            <div class="metric-row">
                                <span class="label">Losing Trades:</span>
                                <span class="value negative">${stats.losingTrades}</span>
                            </div>
                            <div class="metric-row">
                                <span class="label">Win Rate:</span>
                                <span class="value">${stats.winRate.toFixed(1)}%</span>
                            </div>
                            <div class="metric-row">
                                <span class="label">Average Trade:</span>
                                <span class="value ${stats.avgTrade >= 0 ? 'positive' : 'negative'}">
                                    ${this.formatCurrency(stats.avgTrade)}
                                </span>
                            </div>
                            <div class="metric-row">
                                <span class="label">Best Trade:</span>
                                <span class="value positive">${this.formatCurrency(stats.bestTrade)}</span>
                            </div>
                            <div class="metric-row">
                                <span class="label">Worst Trade:</span>
                                <span class="value negative">${this.formatCurrency(stats.worstTrade)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="analytics-card">
                        <h4>AI Decision Analytics</h4>
                        <div class="decision-stats">
                            <div class="decision-distribution">
                                <div class="distribution-item">
                                    <span class="label">Buy Decisions:</span>
                                    <span class="value buy">${stats.buyDecisions}</span>
                                    <div class="percentage">${stats.buyPercentage.toFixed(1)}%</div>
                                </div>
                                <div class="distribution-item">
                                    <span class="label">Sell Decisions:</span>
                                    <span class="value sell">${stats.sellDecisions}</span>
                                    <div class="percentage">${stats.sellPercentage.toFixed(1)}%</div>
                                </div>
                                <div class="distribution-item">
                                    <span class="label">Hold Decisions:</span>
                                    <span class="value hold">${stats.holdDecisions}</span>
                                    <div class="percentage">${stats.holdPercentage.toFixed(1)}%</div>
                                </div>
                            </div>
                            <div class="confidence-analysis">
                                <h5>Average Confidence by Decision</h5>
                                <div class="confidence-bars">
                                    <div class="confidence-bar-item">
                                        <span class="label">Buy:</span>
                                        <div class="confidence-bar">
                                            <div class="fill" style="width: ${stats.avgBuyConfidence * 10}%"></div>
                                        </div>
                                        <span class="value">${stats.avgBuyConfidence.toFixed(1)}/10</span>
                                    </div>
                                    <div class="confidence-bar-item">
                                        <span class="label">Sell:</span>
                                        <div class="confidence-bar">
                                            <div class="fill" style="width: ${stats.avgSellConfidence * 10}%"></div>
                                        </div>
                                        <span class="value">${stats.avgSellConfidence.toFixed(1)}/10</span>
                                    </div>
                                    <div class="confidence-bar-item">
                                        <span class="label">Hold:</span>
                                        <div class="confidence-bar">
                                            <div class="fill" style="width: ${stats.avgHoldConfidence * 10}%"></div>
                                        </div>
                                        <span class="value">${stats.avgHoldConfidence.toFixed(1)}/10</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.itemsPerPage);
        if (totalPages <= 1) return '';
        
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(`
                <button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `);
        }
        
        return `
            <div class="pagination">
                <button class="page-btn prev" ${this.currentPage === 1 ? 'disabled' : ''}>
                    Previous
                </button>
                ${pages.join('')}
                <button class="page-btn next" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Next
                </button>
            </div>
        `;
    }
    
    async animateIn() {
        const elements = document.querySelectorAll('.trade-row, .timeline-item, .analytics-card');
        
        gsap.from(elements, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            stagger: 0.05,
            ease: 'power3.out'
        });
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Filters
        document.querySelectorAll('.filter-select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.applyFilter(e.target.dataset.filter, e.target.value);
            });
        });
        
        // Pagination
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-btn')) {
                const page = e.target.dataset.page;
                if (page) {
                    this.currentPage = parseInt(page);
                    this.refreshTradesTable();
                } else if (e.target.classList.contains('prev') && this.currentPage > 1) {
                    this.currentPage--;
                    this.refreshTradesTable();
                } else if (e.target.classList.contains('next')) {
                    this.currentPage++;
                    this.refreshTradesTable();
                }
            }
        });
        
        // Refresh button
        document.querySelector('.refresh-btn')?.addEventListener('click', () => {
            this.refreshData();
        });
        
        // Trade row clicks
        document.querySelectorAll('.trade-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const tradeId = e.currentTarget.dataset.tradeId;
                this.showTradeDetails(tradeId);
            });
        });
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
            if (panel.dataset.panel === tabName) {
                panel.classList.add('active');
            }
        });
        
        // Animate in new content
        gsap.from(`.tab-panel[data-panel="${tabName}"]`, {
            opacity: 0,
            y: 20,
            duration: 0.4,
            ease: 'power2.out'
        });
    }
    
    applyFilter(filterType, value) {
        if (filterType === 'status') {
            this.currentFilter = value;
        } else if (filterType === 'sort') {
            this.currentSort = value;
        }
        this.currentPage = 1;
        this.refreshTradesTable();
    }
    
    getFilteredTrades() {
        let filtered = [...this.trades];
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(trade => trade.status === this.currentFilter);
        }
        
        // Sort trades
        filtered.sort((a, b) => {
            switch (this.currentSort) {
                case 'newest':
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'oldest':
                    return new Date(a.created_at) - new Date(b.created_at);
                case 'profit':
                    return (b.pnl || 0) - (a.pnl || 0);
                case 'loss':
                    return (a.pnl || 0) - (b.pnl || 0);
                default:
                    return 0;
            }
        });
        
        return filtered;
    }
    
    getPaginatedTrades(trades) {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        return trades.slice(startIndex, startIndex + this.itemsPerPage);
    }
    
    async refreshData() {
        try {
            window.animationController.showNotification({
                type: 'info',
                message: 'Refreshing trades...',
                duration: 1
            });
            
            await this.loadData();
            this.refreshTradesTable();
            
            window.animationController.showNotification({
                type: 'success',
                message: 'Trades refreshed',
                duration: 2
            });
        } catch (error) {
            window.animationController.showNotification({
                type: 'error',
                message: 'Failed to refresh trades'
            });
        }
    }
    
    refreshTradesTable() {
        const tableContainer = document.querySelector('.trades-table-container');
        if (tableContainer) {
            tableContainer.innerHTML = this.renderTradesTable();
            this.animateIn();
        }
    }
    
    // Utility methods
    getUniqueTradingPairs() {
        return [...new Set(this.trades.map(trade => trade.trading_pair))];
    }
    
    getTotalPnL(trades) {
        return trades.reduce((total, trade) => total + (trade.pnl || 0), 0);
    }
    
    getWinRate(trades) {
        const profitableTrades = trades.filter(trade => trade.pnl > 0).length;
        return trades.length > 0 ? (profitableTrades / trades.length) * 100 : 0;
    }
    
    calculateAnalytics() {
        const totalTrades = this.trades.length;
        const winningTrades = this.trades.filter(t => t.pnl > 0).length;
        const losingTrades = this.trades.filter(t => t.pnl < 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
        
        const avgTrade = totalTrades > 0 ? 
            this.trades.reduce((sum, t) => sum + (t.pnl || 0), 0) / totalTrades : 0;
        
        const bestTrade = Math.max(...this.trades.map(t => t.pnl || 0));
        const worstTrade = Math.min(...this.trades.map(t => t.pnl || 0));
        
        const buyDecisions = this.decisions.filter(d => d.decision === 'buy').length;
        const sellDecisions = this.decisions.filter(d => d.decision === 'sell').length;
        const holdDecisions = this.decisions.filter(d => d.decision === 'hold').length;
        const totalDecisions = this.decisions.length;
        
        const buyPercentage = totalDecisions > 0 ? (buyDecisions / totalDecisions) * 100 : 0;
        const sellPercentage = totalDecisions > 0 ? (sellDecisions / totalDecisions) * 100 : 0;
        const holdPercentage = totalDecisions > 0 ? (holdDecisions / totalDecisions) * 100 : 0;
        
        const avgBuyConfidence = this.getAverageConfidence('buy');
        const avgSellConfidence = this.getAverageConfidence('sell');
        const avgHoldConfidence = this.getAverageConfidence('hold');
        
        return {
            totalTrades, winningTrades, losingTrades, winRate, avgTrade, bestTrade, worstTrade,
            buyDecisions, sellDecisions, holdDecisions,
            buyPercentage, sellPercentage, holdPercentage,
            avgBuyConfidence, avgSellConfidence, avgHoldConfidence
        };
    }
    
    getAverageConfidence(decision) {
        const decisions = this.decisions.filter(d => d.decision === decision);
        if (decisions.length === 0) return 0;
        return decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
    }
    
    getDecisionIcon(decision) {
        const icons = {
            buy: '📈',
            sell: '📉',
            hold: '⏸️'
        };
        return icons[decision] || '❓';
    }
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    formatNumber(num) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(num);
    }
    
    formatDateTime(timestamp) {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    showTradeDetails(tradeId) {
        const trade = this.trades.find(t => t.id === tradeId);
        if (!trade) return;
        
        // Show modal with trade details
        window.app.showModal(`
            <div class="trade-details-modal">
                <h3>Trade Details</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <label>Trading Pair:</label>
                        <span>${trade.trading_pair}</span>
                    </div>
                    <div class="detail-item">
                        <label>Side:</label>
                        <span class="side-badge ${trade.side}">${trade.side.toUpperCase()}</span>
                    </div>
                    <div class="detail-item">
                        <label>Quantity:</label>
                        <span>${this.formatNumber(trade.quantity)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Price:</label>
                        <span>${this.formatCurrency(trade.price)}</span>
                    </div>
                    <div class="detail-item">
                        <label>Total Value:</label>
                        <span>${this.formatCurrency(trade.quantity * trade.price)}</span>
                    </div>
                    <div class="detail-item">
                        <label>P&L:</label>
                        <span class="${trade.pnl >= 0 ? 'positive' : 'negative'}">
                            ${trade.pnl !== null ? this.formatCurrency(trade.pnl) : 'N/A'}
                        </span>
                    </div>
                    <div class="detail-item">
                        <label>Status:</label>
                        <span class="status-badge ${trade.status}">${trade.status}</span>
                    </div>
                    <div class="detail-item">
                        <label>Order ID:</label>
                        <span>${trade.order_id || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Created:</label>
                        <span>${this.formatDateTime(trade.created_at)}</span>
                    </div>
                </div>
            </div>
        `, { className: 'trade-details' });
    }
    
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 300000); // Refresh every 5 minutes instead of 30 seconds
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    destroy() {
        this.stopAutoRefresh();
    }
}

export default Trades; 