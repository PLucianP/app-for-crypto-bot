# CryptoAI Bot Frontend

🤖 **A modern, animated frontend for the AI-powered cryptocurrency trading bot**

## Features

- **Stunning UI**: Modern, futuristic design with GSAP animations
- **Real-time Dashboard**: Live trading performance metrics and charts
- **Dark/Light Themes**: Beautiful theme switching with system preference support
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Performance Optimized**: 60fps animations with efficient rendering
- **WebSocket Integration**: Real-time updates for prices and trades

## Architecture

```
frontend/
├── index.html              # Main HTML file
├── static/
│   ├── css/
│   │   ├── main.css         # Core styles and theme system
│   │   ├── dashboard.css    # Dashboard-specific styles
│   │   ├── trades.css       # Trade history styles
│   │   ├── settings.css     # Settings page styles
│   │   └── themes.css       # Theme definitions and overrides
│   └── js/
│       ├── main.js          # Application controller and routing
│       ├── api.js           # Backend API client with WebSocket
│       ├── animations.js    # GSAP animation controller
│       ├── dashboard.js     # Dashboard page component
│       ├── trades.js        # Trades page component
│       └── settings.js      # Settings page component
└── README.md
```

## Getting Started

1. **Serve the files**: Use any static file server to serve the frontend
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node.js
   npx http-server -p 8080
   
   # Using PHP
   php -S localhost:8080
   ```

2. **Access the application**: Open `http://localhost:8080` in your browser

3. **Backend Connection**: Ensure the backend API is running on port 8000 for full functionality

## Features Overview

### Dashboard Page
- **Quick Stats**: Real-time overview of trading performance
- **Performance Charts**: Interactive P&L and win rate visualizations
- **Asset Cards**: Trading pair monitoring with mini charts
- **Animated Metrics**: Beautiful number counters and progress rings

### Trades Page
- **Trade History**: Complete trading history with filtering and sorting
- **AI Decision Timeline**: Visual timeline of AI trading decisions
- **Performance Analytics**: Detailed trade analytics and metrics
- **Real-time Updates**: Live trade status and notifications

### Settings Page
- **API Key Management**: Secure configuration of exchange and AI API keys
- **Trading Configuration**: Risk management and trading parameter settings
- **AI Model Settings**: Configuration of AI agents and their parameters
- **Security & Notifications**: Account security and notification preferences

### Theme System
- **Dark Mode**: Default elegant dark theme
- **Light Mode**: Clean, professional light theme  
- **Auto Mode**: Follows system preference
- **Smooth Transitions**: Animated theme switching

### Animation System
- **Page Transitions**: Smooth navigation between pages
- **Card Animations**: Staggered entrance effects
- **Chart Animations**: Data visualization with motion
- **Hover Effects**: Interactive feedback on all elements
- **Loading States**: Elegant loading animations

### Real-time Features
- **WebSocket Connection**: Live data updates
- **Price Updates**: Real-time price changes
- **Trade Notifications**: Instant trade execution alerts
- **Connection Status**: Visual connection state indicator

## Technology Stack

- **Vanilla JavaScript**: Modern ES6+ with modules
- **GSAP**: Professional-grade animations
- **Chart.js**: Beautiful, responsive charts
- **CSS Grid/Flexbox**: Modern layout system
- **CSS Custom Properties**: Dynamic theming
- **WebSocket API**: Real-time communication

## Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## Performance

- **60fps Animations**: GPU-accelerated transforms
- **Lazy Loading**: On-demand page loading
- **Debounced Events**: Optimized scroll and resize handlers
- **Efficient Rendering**: Minimal DOM manipulation

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Semantic HTML and ARIA labels
- **High Contrast**: Support for high contrast mode
- **Reduced Motion**: Respects user motion preferences
- **Focus Indicators**: Clear focus states

## Development

### Adding New Pages
1. Create page component in `static/js/`
2. Add CSS file in `static/css/`
3. Register page in `main.js` router
4. Add navigation link

### Customizing Themes
1. Modify CSS custom properties in `themes.css`
2. Add theme-specific overrides
3. Update theme toggle functionality

### Adding Animations
1. Use `window.animationController` methods
2. Follow GSAP best practices
3. Ensure 60fps performance

## API Integration

The frontend connects to the backend API for:
- Dashboard data (`/api/dashboard/summary`)
- Trading operations (`/api/trading/execute-analysis`)
- Settings management (`/api/settings/*`)
- Real-time updates via WebSocket

## Contributing

1. Follow the existing code style
2. Ensure responsive design
3. Test animations on all devices
4. Verify accessibility compliance
5. Update documentation

## License

This project is part of the CryptoAI Bot system. 