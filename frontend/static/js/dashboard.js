class Dashboard {
    constructor() {
        this.performanceCards = [];
        this.assetCards = [];
        this.charts = {};
        this.refreshInterval = null;
        this.data = {
            summary: null,
            assets: [],
            performanceData: [],
            winRateData: []
        };
    }
    
    async render() {
        try {
            // Show loader
            window.animationController.showLoader('Loading dashboard...');
            
            // Fetch dashboard data
            await this.loadData();
            
            const html = `
                <div class="dashboard-container">
                    <div class="dashboard-header">
                        <h2 class="page-title">Trading Dashboard</h2>
                        <div class="quick-stats">
                            <div class="stat-item" data-stat="active-trades">
                                <span class="stat-value" data-format="number">${this.data.summary?.active_trades || 0}</span>
                                <span class="stat-label">Active Trades</span>
                            </div>
                            <div class="stat-item" data-stat="total-pnl">
                                <span class="stat-value ${this.data.summary?.total_pnl >= 0 ? 'positive' : 'negative'}" data-format="currency">${this.formatCurrency(this.data.summary?.total_pnl || 0)}</span>
                                <span class="stat-label">Total P&L</span>
                            </div>
                            <div class="stat-item" data-stat="win-rate">
                                <span class="stat-value" data-format="percentage">${this.data.summary?.average_win_rate?.toFixed(1) || 0}%</span>
                                <span class="stat-label">Win Rate</span>
                            </div>
                            <div class="stat-item" data-stat="balance">
                                <span class="stat-value balance-display" data-format="currency">${this.formatCurrency(this.data.summary?.total_balance_usd || 0)}</span>
                                <span class="stat-label">Total Balance</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="dashboard-grid">
                        <section class="performance-section">
                            <h3 class="section-title">Performance Overview</h3>
                            <div class="performance-cards">
                                <!-- Historical Performance Card -->
                                <div class="card performance-card" data-card="historical">
                                    <div class="card-header">
                                        <h4>Historical Performance</h4>
                                        <div class="time-selector">
                                            <button class="time-btn active" data-period="24h">24H</button>
                                            <button class="time-btn" data-period="7d">7D</button>
                                            <button class="time-btn" data-period="30d">30D</button>
                                            <button class="time-btn" data-period="all">ALL</button>
                                        </div>
                                    </div>
                                    <div class="card-body">
                                        <div class="chart-container">
                                            <canvas id="pnl-chart"></canvas>
                                        </div>
                                        <div class="chart-stats">
                                            <div class="stat-group">
                                                <span class="label">Best Trade:</span>
                                                <span class="value positive">${this.formatCurrency(this.getBestTrade())}</span>
                                            </div>
                                            <div class="stat-group">
                                                <span class="label">Worst Trade:</span>
                                                <span class="value negative">${this.formatCurrency(this.getWorstTrade())}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Profit/Loss Summary Card -->
                                <div class="card performance-card" data-card="pnl-summary">
                                    <div class="card-header">
                                        <h4>Profit & Loss Summary</h4>
                                    </div>
                                    <div class="card-body">
                                        <div class="pnl-visualization">
                                            <div class="circular-progress" data-progress="${this.data.summary?.average_win_rate || 0}">
                                                <svg class="progress-ring" width="120" height="120">
                                                    <circle class="progress-ring-bg" cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="8"></circle>
                                                    <circle class="progress-ring-fill" cx="60" cy="60" r="50" fill="none" stroke="var(--accent-primary)" stroke-width="8" stroke-linecap="round" stroke-dasharray="314" stroke-dashoffset="314"></circle>
                                                </svg>
                                                <div class="progress-text">
                                                    <span class="percentage">${(this.data.summary?.average_win_rate || 0).toFixed(1)}%</span>
                                                    <span class="label">Win Rate</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="pnl-details">
                                            <div class="detail-row">
                                                <span>Total Trades:</span>
                                                <span class="value">${this.data.summary?.total_trades || 0}</span>
                                            </div>
                                            <div class="detail-row">
                                                <span>Winning Trades:</span>
                                                <span class="value positive">${this.getWinningTrades()}</span>
                                            </div>
                                            <div class="detail-row">
                                                <span>Losing Trades:</span>
                                                <span class="value negative">${this.getLosingTrades()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                        
                        <section class="assets-section">
                            <h3 class="section-title">Active Trading Pairs</h3>
                            <div class="assets-grid">
                                ${this.renderAssetCards()}
                            </div>
                            <button class="add-asset-btn btn btn-secondary">
                                <span class="icon">+</span>
                                <span class="text">Add Trading Pair</span>
                            </button>
                        </section>
                    </div>
                </div>
            `;
            
            // Hide loader
            window.animationController.hideLoader();
            
            return html;
            
        } catch (error) {
            window.animationController.hideLoader();
            window.animationController.showNotification({
                type: 'error',
                message: 'Failed to load dashboard data: ' + error.message
            });
            return '<div class="error-state">Failed to load dashboard</div>';
        }
    }
    
    async loadData() {
        try {
            const [summary, assets] = await Promise.all([
                window.apiClient.getDashboardSummary(),
                window.apiClient.getActiveAssets()
            ]);
            
            this.data.summary = summary;
            this.data.assets = assets;
            
            // Load performance data for default period
            this.data.performanceData = await window.apiClient.getPerformanceData('7d');
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Initialize empty data when API fails
            this.data.summary = {
                total_balance_usd: 0,
                total_trades: 0,
                total_pnl: 0,
                average_win_rate: 0,
                active_trades: 0
            };
            this.data.assets = [];
            this.data.performanceData = [];
        }
    }
    
    renderAssetCards() {
        if (!this.data.assets || this.data.assets.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📊</div>
                    <h4>No Trading Pairs</h4>
                    <p>Add trading pairs to start monitoring performance</p>
                </div>
            `;
        }
        
        return this.data.assets.map(asset => this.renderAssetCard(asset)).join('');
    }
    
    renderAssetCard(asset) {
        const priceChange = this.calculatePriceChange(asset);
        const changeClass = priceChange >= 0 ? 'positive' : 'negative';
        const nextAnalysis = this.calculateNextAnalysis(asset);
        
        return `
            <div class="asset-card" data-symbol="${asset.trading_pair}">
                <div class="asset-header">
                    <div class="asset-info">
                        <div class="asset-icon">${this.getAssetIcon(asset.trading_pair)}</div>
                        <h4 class="asset-symbol">${asset.trading_pair}</h4>
                    </div>
                    <div class="asset-actions">
                        <button class="action-btn analyze-now" title="Analyze Now" data-pair="${asset.trading_pair}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9.5 15.5L4 10l1.5-1.5L9.5 12.5 18 4 19.5 5.5 9.5 15.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn view-details" title="View Details" data-pair="${asset.trading_pair}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5zm0-8c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="asset-body">
                    <div class="price-display">
                        <span class="current-price">$${this.formatNumber(asset.current_price || 0)}</span>
                        <span class="price-change ${changeClass}">${priceChange >= 0 ? '+' : ''}${priceChange}%</span>
                    </div>
                    <div class="asset-status">
                        <div class="status-item">
                            <span class="label">Last Analysis:</span>
                            <span class="value">${this.formatTime(asset.last_analysis)}</span>
                        </div>
                        <div class="status-item">
                            <span class="label">Next Analysis:</span>
                            <span class="value">${nextAnalysis}</span>
                        </div>
                    </div>
                    <div class="mini-chart">
                        <canvas id="mini-chart-${asset.trading_pair}" width="200" height="60"></canvas>
                    </div>
                </div>
                <div class="asset-footer">
                    <div class="last-decision" data-decision="${asset.last_decision}">
                        <span class="decision-label">Last Decision:</span>
                        <span class="decision-value ${asset.last_decision}">${asset.last_decision?.toUpperCase() || 'NONE'}</span>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${(asset.last_confidence || 0) * 10}%"></div>
                        </div>
                        <span class="confidence">Confidence: ${asset.last_confidence || 0}/10</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    async animateIn() {
        // Animate dashboard header
        window.animationController.masterTimeline
            .from('.dashboard-header', {
                y: -50,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            })
            .from('.quick-stats .stat-item', {
                scale: 0.8,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'back.out(1.7)'
            }, '-=0.4')
            .from('.performance-card', {
                scale: 0.8,
                opacity: 0,
                duration: 0.6,
                stagger: 0.2,
                ease: 'back.out(1.7)'
            }, '-=0.4')
            .from('.assets-section', {
                x: 100,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out'
            }, '-=0.4');
        
        // Animate numbers
        this.animateStatNumbers();
        
        // Initialize charts
        setTimeout(() => {
            this.initializeCharts();
        }, 500);
    }
    
    animateStatNumbers() {
        document.querySelectorAll('.stat-value').forEach(element => {
            const format = element.dataset.format;
            let target = 0;
            
            if (format === 'currency') {
                target = parseFloat(element.textContent.replace(/[$,]/g, '')) || 0;
            } else if (format === 'percentage') {
                target = parseFloat(element.textContent.replace('%', '')) || 0;
            } else {
                target = parseInt(element.textContent.replace(/,/g, '')) || 0;
            }
            
            window.animationController.animateNumber(element, target);
        });
    }
    
    initializeCharts() {
        this.initializePnLChart();
        this.initializeProgressRing();
        this.initializeMiniCharts();
    }
    
    initializePnLChart() {
        const ctx = document.getElementById('pnl-chart');
        if (!ctx) return;
        
        const chartData = this.prepareChartData();
        
        this.charts.pnl = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: 'Cumulative P&L',
                    data: chartData.data,
                    borderColor: 'var(--accent-primary)',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'var(--text-secondary)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        // Animate chart
        window.animationController.animateChart(ctx);
    }
    
    initializeProgressRing() {
        const progressElement = document.querySelector('.circular-progress');
        if (!progressElement) return;
        
        const percentage = parseFloat(progressElement.dataset.progress) || 0;
        window.animationController.animateProgressBar(progressElement, percentage);
    }
    
    initializeMiniCharts() {
        this.data.assets.forEach(asset => {
            const canvas = document.getElementById(`mini-chart-${asset.trading_pair}`);
            if (canvas) {
                this.createMiniChart(canvas, asset);
            }
        });
    }
    
    createMiniChart(canvas, asset) {
        const ctx = canvas.getContext('2d');
        
        // Use empty data or basic flat line when no historical data available
        const emptyData = {
            labels: Array.from({length: 20}, (_, i) => i),
            data: Array.from({length: 20}, () => asset.current_price || 0),
            trend: 0
        };
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: emptyData.labels,
                datasets: [{
                    data: emptyData.data,
                    borderColor: 'var(--text-muted)',
                    borderWidth: 1,
                    pointRadius: 0,
                    tension: 0.4
                }]
            },
            options: {
                responsive: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                elements: {
                    point: { radius: 0 }
                }
            }
        });
    }
    
    setupEventListeners() {
        // Time period selector
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadPerformanceData(e.target.dataset.period);
            });
        });
        
        // Analyze now buttons
        document.querySelectorAll('.analyze-now').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pair = e.target.closest('.analyze-now').dataset.pair;
                this.triggerAnalysis(pair);
            });
        });
        
        // Add asset button
        const addAssetBtn = document.querySelector('.add-asset-btn');
        if (addAssetBtn) {
            addAssetBtn.addEventListener('click', () => {
                this.showAddAssetModal();
            });
        }
    }
    
    async triggerAnalysis(pair) {
        try {
            window.animationController.showLoader(`Analyzing ${pair}...`);
            
            const result = await window.apiClient.executeAnalysis(pair);
            
            window.animationController.hideLoader();
            window.animationController.showNotification({
                type: 'success',
                message: `Analysis completed for ${pair}: ${result.decision.toUpperCase()}`
            });
            
            // Refresh data
            await this.refreshData();
            
        } catch (error) {
            window.animationController.hideLoader();
            window.animationController.showNotification({
                type: 'error',
                message: `Analysis failed for ${pair}: ${error.message}`
            });
        }
    }
    
    async loadPerformanceData(period) {
        try {
            this.data.performanceData = await window.apiClient.getPerformanceData(period);
            this.updatePnLChart();
        } catch (error) {
            console.error('Failed to load performance data:', error);
        }
    }
    
    updatePnLChart() {
        if (this.charts.pnl) {
            const chartData = this.prepareChartData();
            this.charts.pnl.data.labels = chartData.labels;
            this.charts.pnl.data.datasets[0].data = chartData.data;
            this.charts.pnl.update();
        }
    }
    
    async refreshData() {
        await this.loadData();
        this.updateDashboard();
    }
    
    updateDashboard() {
        document.querySelector('[data-stat="active-trades"] .stat-value').textContent = this.data.summary?.active_trades || 0;
        document.querySelector('[data-stat="total-pnl"] .stat-value').textContent = this.formatCurrency(this.data.summary?.total_pnl || 0);
        document.querySelector('[data-stat="win-rate"] .stat-value').textContent = (this.data.summary?.average_win_rate || 0).toFixed(1) + '%';
        
        const assetsGrid = document.querySelector('.assets-grid');
        if (assetsGrid) {
            assetsGrid.innerHTML = this.renderAssetCards();
            this.initializeMiniCharts();
        }
    }
    
    // Utility methods

    
    prepareChartData() {
        if (!this.data.performanceData || this.data.performanceData.length === 0) {
            return {
                labels: ['Start'],
                data: [0]
            };
        }
        
        return {
            labels: this.data.performanceData.map(d => new Date(d.timestamp).toLocaleDateString()),
            data: this.data.performanceData.map(d => d.cumulative_pnl)
        };
    }
    

    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
    
    formatTime(timestamp) {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleString();
    }
    
    calculatePriceChange(asset) {
        return 0;
    }
    
    calculateNextAnalysis(asset) {
        const next = new Date();
        next.setHours(next.getHours() + 1);
        return next.toLocaleTimeString();
    }
    
    getAssetIcon(pair) {
        const base = pair.split('USDT')[0] || pair.split('USDC')[0] || pair;
        return base.charAt(0);
    }
    
    getBestTrade() {
        return 0;
    }
    
    getWorstTrade() {
        return 0;
    }
    
    getWinningTrades() {
        const total = this.data.summary?.total_trades || 0;
        const winRate = this.data.summary?.average_win_rate || 0;
        return Math.round(total * (winRate / 100));
    }
    
    getLosingTrades() {
        const total = this.data.summary?.total_trades || 0;
        const winning = this.getWinningTrades();
        return total - winning;
    }
    
    showAddAssetModal() {
        window.animationController.showNotification({
            type: 'info',
            message: 'Add Asset modal - feature coming soon'
        });
    }
    
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, 300000);
    }
    
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
    
    destroy() {
        this.stopAutoRefresh();
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

export default Dashboard; 