class AnimationController {
    constructor() {
        this.masterTimeline = gsap.timeline();
        this.setupScrollTriggers();
        this.notificationContainer = document.getElementById('notification-container');
        this.loaderOverlay = document.getElementById('loader-overlay');
        
        // Register GSAP plugins
        gsap.registerPlugin(ScrollTrigger);
        
        // Setup hover effects after DOM is loaded
        this.setupHoverEffects();
    }
    
    // Page transition animations
    pageTransition(fromPage, toPage) {
        const tl = gsap.timeline();
        
        // Fade out current page
        if (fromPage) {
            tl.to(fromPage, {
                opacity: 0,
                x: -100,
                duration: 0.3,
                ease: 'power2.in',
                onComplete: () => {
                    fromPage.style.display = 'none';
                }
            });
        }
        
        // Fade in new page
        tl.set(toPage, { 
            display: 'block', 
            opacity: 0, 
            x: 100 
        })
        .to(toPage, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            ease: 'power2.out'
        });
        
        return tl;
    }
    
    // Card animations with stagger effect
    animateCards(cards, options = {}) {
        const config = {
            scale: 0.8,
            opacity: 0,
            duration: 0.6,
            stagger: {
                each: 0.1,
                from: 'start',
                ease: 'power2.inOut'
            },
            ease: 'back.out(1.7)',
            ...options
        };
        
        return gsap.from(cards, config);
    }
    
    // Chart animations
    animateChart(chartElement, data = {}) {
        const tl = gsap.timeline();
        
        // Scale chart container from bottom
        tl.from(chartElement, {
            scaleY: 0,
            transformOrigin: 'bottom',
            duration: 1,
            ease: 'power2.out'
        });
        
        // Animate data points if available
        if (data.points) {
            tl.from(data.points, {
                opacity: 0,
                y: 20,
                duration: 0.5,
                stagger: 0.05,
                ease: 'power2.out'
            }, '-=0.5');
        }
        
        return tl;
    }
    
    // Notification system
    showNotification(notification) {
        const notif = document.createElement('div');
        notif.className = `notification ${notification.type}`;
        notif.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${this.getNotificationIcon(notification.type)}
                </div>
                <div class="notification-message">${notification.message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        this.notificationContainer.appendChild(notif);
        
        // Animation timeline
        const tl = gsap.timeline();
        
        tl.from(notif, {
            x: 300,
            opacity: 0,
            duration: 0.5,
            ease: 'power3.out'
        })
        .to(notif, {
            x: 300,
            opacity: 0,
            duration: 0.5,
            ease: 'power3.in',
            delay: notification.duration || 4,
            onComplete: () => {
                if (notif.parentElement) {
                    notif.remove();
                }
            }
        });
        
        return notif;
    }
    
    getNotificationIcon(type) {
        const icons = {
            success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>`,
            error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>`,
            warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>`
        };
        return icons[type] || icons.success;
    }
    
    // Loading animations
    showLoader(text = 'Processing...') {
        const loader = this.loaderOverlay;
        const loaderText = loader.querySelector('.loader-text');
        
        if (loaderText) {
            loaderText.textContent = text;
        }
        
        loader.classList.remove('hidden');
        
        // Animate loader appearance
        gsap.timeline()
            .from(loader, {
                opacity: 0,
                duration: 0.3
            })
            .to('.crypto-spinner svg', {
                rotation: 360,
                duration: 1,
                repeat: -1,
                ease: 'none'
            });
        
        return loader;
    }
    
    hideLoader() {
        const loader = this.loaderOverlay;
        
        gsap.to(loader, {
            opacity: 0,
            duration: 0.3,
            onComplete: () => {
                loader.classList.add('hidden');
            }
        });
    }
    
    // Interactive hover effects
    setupHoverEffects() {
        // Card hover effects
        this.setupCardHovers();
        
        // Button hover effects
        this.setupButtonHovers();
        
        // Navigation hover effects
        this.setupNavHovers();
    }
    
    setupCardHovers() {
        const observer = new MutationObserver(() => {
            document.querySelectorAll('.card:not([data-hover-setup])').forEach(card => {
                card.dataset.hoverSetup = 'true';
                
                card.addEventListener('mouseenter', () => {
                    gsap.to(card, {
                        scale: 1.02,
                        boxShadow: '0 10px 30px rgba(0,255,255,0.3)',
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                });
                
                card.addEventListener('mouseleave', () => {
                    gsap.to(card, {
                        scale: 1,
                        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                        duration: 0.3,
                        ease: 'power2.out'
                    });
                });
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    setupButtonHovers() {
        document.addEventListener('mouseover', (e) => {
            if (e.target.matches('.btn, button') && !e.target.dataset.hoverSetup) {
                e.target.dataset.hoverSetup = 'true';
                
                e.target.addEventListener('mouseenter', () => {
                    gsap.to(e.target, {
                        scale: 1.05,
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                });
                
                e.target.addEventListener('mouseleave', () => {
                    gsap.to(e.target, {
                        scale: 1,
                        duration: 0.2,
                        ease: 'power2.out'
                    });
                });
            }
        });
    }
    
    setupNavHovers() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('mouseenter', () => {
                gsap.to(link, {
                    y: -2,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
            
            link.addEventListener('mouseleave', () => {
                gsap.to(link, {
                    y: 0,
                    duration: 0.2,
                    ease: 'power2.out'
                });
            });
        });
    }
    
    // Parallax effects with ScrollTrigger
    setupScrollTriggers() {
        // Parallax for section headers
        gsap.utils.toArray('.section-title').forEach(title => {
            gsap.to(title, {
                scrollTrigger: {
                    trigger: title,
                    start: 'top 80%',
                    end: 'bottom 20%',
                    scrub: 1
                },
                x: -20,
                opacity: 0.9
            });
        });
        
        // Fade in animations for cards
        gsap.utils.toArray('.card').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    once: true
                },
                y: 50,
                opacity: 0,
                duration: 0.6,
                ease: 'power2.out'
            });
        });
    }
    
    // Number counter animation
    animateNumber(element, target, duration = 2) {
        const obj = { value: 0 };
        const isNegative = target < 0;
        const absTarget = Math.abs(target);
        
        return gsap.to(obj, {
            value: absTarget,
            duration,
            ease: 'power2.out',
            onUpdate: () => {
                const currentValue = isNegative ? -obj.value : obj.value;
                
                if (element.dataset.format === 'currency') {
                    element.textContent = `$${Math.round(currentValue).toLocaleString()}`;
                } else if (element.dataset.format === 'percentage') {
                    element.textContent = `${Math.round(currentValue * 100) / 100}%`;
                } else {
                    element.textContent = Math.round(currentValue).toLocaleString();
                }
            }
        });
    }
    
    // Progress bar animation
    animateProgressBar(element, percentage, duration = 1.5) {
        const progressFill = element.querySelector('.progress-fill, .progress-ring-fill');
        
        if (progressFill) {
            if (progressFill.classList.contains('progress-ring-fill')) {
                // Circular progress
                const circumference = 2 * Math.PI * parseFloat(progressFill.getAttribute('r'));
                const offset = circumference - (percentage / 100) * circumference;
                
                gsap.fromTo(progressFill, {
                    strokeDashoffset: circumference
                }, {
                    strokeDashoffset: offset,
                    duration,
                    ease: 'power2.out'
                });
            } else {
                // Linear progress
                gsap.fromTo(progressFill, {
                    width: '0%'
                }, {
                    width: `${percentage}%`,
                    duration,
                    ease: 'power2.out'
                });
            }
        }
    }
    
    // Pulse animation for important elements
    pulseElement(element, options = {}) {
        const config = {
            scale: 1.1,
            duration: 0.6,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut',
            ...options
        };
        
        return gsap.to(element, config);
    }
    
    // Shake animation for errors
    shakeElement(element) {
        return gsap.to(element, {
            x: [-10, 10, -10, 10, 0],
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }
    
    // Cleanup method
    cleanup() {
        ScrollTrigger.killAll();
        gsap.killTweensOf('*');
    }
}

export default AnimationController; 