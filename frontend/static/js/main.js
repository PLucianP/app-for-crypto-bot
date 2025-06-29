import Dashboard from './dashboard.js';
import Trades from './trades.js';
import Settings from './settings.js';
import APIClient from './api.js';
import AnimationController from './animations.js';

class App {
    constructor() {
        this.currentPage = null; // Allow initial navigation
        this.pages = {
            dashboard: null,
            trades: null,
            settings: null
        };
        this.container = document.getElementById('main-content');
        
        // Will be initialized manually
    }
    
    async init() {
        console.log('🤖 Initializing CryptoAI Bot Frontend...');
        
        // Initialize global API client and animation controller
        console.log('📦 Creating API client and animation controller...');
        window.apiClient = new APIClient();
        window.animationController = new AnimationController();
        console.log('✅ Global instances created');
        
        // Setup navigation
        console.log('🧭 Setting up navigation...');
        this.setupNavigation();
        
        // Setup theme toggle
        console.log('🎨 Setting up theme toggle...');
        this.setupThemeToggle();
        
        // Connect WebSocket
        console.log('🔌 Connecting WebSocket...');
        this.connectWebSocket();
        
        // Load initial page
        console.log('📄 Loading initial page...');
        await this.navigateToPage('dashboard');
        
        // Setup global event listeners
        console.log('👂 Setting up global event listeners...');
        this.setupGlobalEventListeners();
        
        console.log('✅ Frontend initialization complete');
    }
    
    setupNavigation() {
        console.log('🔧 Setting up navigation...');
        const navLinks = document.querySelectorAll('.nav-link');
        console.log('📍 Found nav links:', navLinks.length);
        
        navLinks.forEach((link, index) => {
            console.log(`📍 Setting up link ${index}:`, link.dataset.page);
            link.addEventListener('click', (e) => {
                console.log('🖱️ Navigation link clicked:', e.target.dataset.page);
                e.preventDefault();
                const page = e.target.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                } else {
                    console.warn('⚠️ No page data found for link:', e.target);
                }
            });
        });
        console.log('✅ Navigation setup complete');
    }
    
    setupThemeToggle() {
        const themeToggle = document.querySelector('.theme-toggle');
        const currentTheme = localStorage.getItem('theme') || 'dark';
        
        // Set initial theme
        document.documentElement.setAttribute('data-theme', currentTheme);
        
        themeToggle?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            const newTheme = current === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Animate theme change
            gsap.to('body', {
                duration: 0.3,
                ease: 'power2.inOut'
            });
            
            window.animationController.showNotification({
                type: 'success',
                message: `Switched to ${newTheme} theme`,
                duration: 2
            });
        });
    }
    
    connectWebSocket() {
        try {
            window.apiClient.connectWebSocket();
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            window.animationController.showNotification({
                type: 'warning',
                message: 'Real-time updates unavailable'
            });
        }
    }
    
    async navigateToPage(pageName) {
        if (this.currentPage === pageName) return;
        
        console.log(`🔄 Navigating to ${pageName}`);
        
        // Clean up current page first
        if (this.currentPage && this.pages[this.currentPage]) {
            console.log(`🧹 Cleaning up ${this.currentPage} page`);
            if (typeof this.pages[this.currentPage].destroy === 'function') {
                this.pages[this.currentPage].destroy();
            }
        }
        
        // Clear container completely
        this.container.innerHTML = '';
        
        // Update navigation state
        this.updateNavigationState(pageName);
        
        try {
            // Load page content
            const pageContent = await this.loadPage(pageName);
            
            // Create new page element
            const newPageElement = document.createElement('div');
            newPageElement.className = `page-container ${pageName}-page`;
            newPageElement.innerHTML = pageContent;
            
            // Add new page to cleared container
            this.container.appendChild(newPageElement);
            
            // Initial page load animation
            gsap.from(newPageElement, {
                opacity: 0,
                y: 50,
                duration: 0.8,
                ease: 'power3.out'
            });
            
            // Setup page-specific functionality
            this.setupPageFunctionality(pageName);
            
            // Update current page
            this.currentPage = pageName;
            window.currentPage = pageName; // Global reference
            
            console.log(`✅ Navigation to ${pageName} complete`);
            
        } catch (error) {
            console.error(`Failed to navigate to ${pageName}:`, error);
            window.animationController.showNotification({
                type: 'error',
                message: `Failed to load ${pageName} page`
            });
        }
    }
    
    updateNavigationState(pageName) {
        // Update nav link states
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === pageName) {
                link.classList.add('active');
            }
        });
        
        // Update page title
        const titles = {
            dashboard: 'Trading Dashboard',
            trades: 'Trade History',
            settings: 'Settings'
        };
        document.title = `CryptoAI Bot - ${titles[pageName] || pageName}`;
    }
    
    async loadPage(pageName) {
        switch (pageName) {
            case 'dashboard':
                if (!this.pages.dashboard) {
                    this.pages.dashboard = new Dashboard();
                }
                return await this.pages.dashboard.render();
                
            case 'trades':
                if (!this.pages.trades) {
                    this.pages.trades = new Trades();
                }
                return await this.pages.trades.render();
                
            case 'settings':
                if (!this.pages.settings) {
                    this.pages.settings = new Settings();
                }
                return await this.pages.settings.render();
                
            default:
                throw new Error(`Unknown page: ${pageName}`);
        }
    }
    
    setupPageFunctionality(pageName) {
        switch (pageName) {
            case 'dashboard':
                if (this.pages.dashboard) {
                    this.pages.dashboard.setupEventListeners();
                    this.pages.dashboard.animateIn();
                    this.pages.dashboard.startAutoRefresh();
                }
                break;
                
            case 'trades':
                if (this.pages.trades) {
                    this.pages.trades.setupEventListeners();
                    this.pages.trades.animateIn();
                    this.pages.trades.startAutoRefresh();
                }
                break;
                
            case 'settings':
                if (this.pages.settings) {
                    this.pages.settings.setupEventListeners();
                    this.pages.settings.animateIn();
                }
                break;
        }
    }
    
    setupGlobalEventListeners() {
        // Handle escape key for modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModals();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
        
        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            window.animationController.showNotification({
                type: 'success',
                message: 'Connection restored'
            });
            this.connectWebSocket();
        });
        
        window.addEventListener('offline', () => {
            window.animationController.showNotification({
                type: 'warning',
                message: 'Connection lost - working offline'
            });
        });
    }
    
    closeModals() {
        // Close any open modals
        document.querySelectorAll('.modal.open').forEach(modal => {
            modal.classList.remove('open');
        });
    }
    
    handleResize() {
        // Refresh charts and layouts on resize
        if (this.pages.dashboard && this.currentPage === 'dashboard') {
            // Debounce resize handling
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.pages.dashboard.handleResize?.();
            }, 250);
        }
    }
    
    pauseUpdates() {
        // Pause auto-refresh when tab is not visible
        if (this.pages.dashboard) {
            this.pages.dashboard.stopAutoRefresh();
        }
        if (this.pages.trades) {
            this.pages.trades.stopAutoRefresh();
        }
    }
    
    resumeUpdates() {
        // Resume auto-refresh when tab becomes visible
        if (this.pages.dashboard && this.currentPage === 'dashboard') {
            this.pages.dashboard.startAutoRefresh();
        }
        if (this.pages.trades && this.currentPage === 'trades') {
            this.pages.trades.startAutoRefresh();
        }
    }
    
    // Global utility methods
    showModal(modalContent, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-backdrop"></div>
            <div class="modal-content">
                <button class="modal-close">×</button>
                ${modalContent}
            </div>
        `;
        
        document.getElementById('modal-container').appendChild(modal);
        
        // Animate modal
        gsap.timeline()
            .from(modal.querySelector('.modal-backdrop'), {
                opacity: 0,
                duration: 0.3
            })
            .from(modal.querySelector('.modal-content'), {
                scale: 0.8,
                opacity: 0,
                duration: 0.4,
                ease: 'back.out(1.7)'
            }, '-=0.2');
        
        // Setup close functionality
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.querySelector('.modal-backdrop').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.classList.add('open');
        return modal;
    }
    
    closeModal(modal) {
        gsap.timeline()
            .to(modal.querySelector('.modal-content'), {
                scale: 0.8,
                opacity: 0,
                duration: 0.3,
                ease: 'power2.in'
            })
            .to(modal.querySelector('.modal-backdrop'), {
                opacity: 0,
                duration: 0.2
            }, '-=0.1')
            .call(() => {
                modal.remove();
            });
    }
    
    // Cleanup when page unloads
    destroy() {
        // Cleanup page instances
        Object.values(this.pages).forEach(page => {
            if (page && page.destroy) {
                page.destroy();
            }
        });
        
        // Disconnect WebSocket
        if (window.apiClient) {
            window.apiClient.disconnect();
        }
        
        // Cleanup animations
        if (window.animationController) {
            window.animationController.cleanup();
        }
    }
}

// Add coming soon styles
const comingSoonStyles = `
    .coming-soon {
        text-align: center;
        padding: var(--spacing-xl);
        max-width: 600px;
        margin: 0 auto;
    }
    
    .coming-soon-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
    }
    
    .coming-soon h3 {
        font-size: 2rem;
        margin-bottom: var(--spacing-md);
        color: var(--text-primary);
    }
    
    .coming-soon p {
        font-size: 1.125rem;
        color: var(--text-secondary);
        margin-bottom: var(--spacing-xl);
    }
    
    .feature-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--spacing-md);
        margin-top: var(--spacing-lg);
    }
    
    .feature-item {
        background: var(--bg-card);
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: var(--spacing-md);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = comingSoonStyles;
document.head.appendChild(styleSheet);

// Initialize app
const app = new App();
app.init();

// Global app instance
window.app = app;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    app.destroy();
});

export default App; 