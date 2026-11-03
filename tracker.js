/**
 * DeepLink Behavior Tracker
 * Sends user interaction data to custom statistics backend.
 */
(function () {
    const API_ENDPOINT = 'https://deeplinkgame.com/gameapi/api/track';
    // const API_ENDPOINT = 'http://localhost:9999/api/track';

    // 1. Visitor ID (Persistent in LocalStorage)
    let visitorId = localStorage.getItem('dl_visitor_id');
    if (!visitorId) {
        visitorId = 'v_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        localStorage.setItem('dl_visitor_id', visitorId);
    }

    // 2. Session ID (Persists during tab session)
    let sessionId = sessionStorage.getItem('dl_session_id');
    if (!sessionId) {
        sessionId = 's_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        sessionStorage.setItem('dl_session_id', sessionId);
    }

    // 3. View ID (Unique per page load - for duration tracking)
    const viewId = 'w_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    /**
     * Send tracking data to backend
     * @param {string} eventName 
     * @param {object} details 
     */
    function trackEvent(eventName, details = {}) {
        // Enforce inclusion of key identifiers within the details object as requested
        const enrichedDetails = {
            ...details,
            visitorId: visitorId,
            sessionId: sessionId,
            viewId: viewId
        };

        const data = {
            visitorId: visitorId,
            sessionId: sessionId,
            viewId: viewId,
            event: eventName,
            url: window.location.href,
            referrer: document.referrer || 'direct',
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            details: enrichedDetails
        };

        console.log(`[Tracker] Tracking Event: ${eventName}`, data);

        // Use sendBeacon for more reliability on navigation/closing, otherwise fetch
        try {
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                navigator.sendBeacon(API_ENDPOINT, blob);
            } else {
                fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                    keepalive: true
                });
            }
        } catch (e) {
            console.error('[Tracker] Failed to send tracking data', e);
        }
    }

    // 1. Track Page View on Load
    window.addEventListener('load', () => {
        trackEvent('page_view', {
            title: document.title
        });
    });

    // 2. Automatic Click Tracking for Key Elements
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a, button');
        if (!target) return;

        let eventName = null;
        let details = {
            text: target.innerText.trim(),
            id: target.id,
            className: target.className
        };

        // Determine event type based on content or class
        const href = target.getAttribute('href') || '';
        const text = target.innerText.toLowerCase();

        if (href.includes('.exe') || href.includes('.apk') || text.includes('다운로드') || text.includes('download')) {
            eventName = 'download_click';
            details = {
                text: target.innerText.trim(),
                file: href.split('/').pop()
            };
        } else if (text.includes('play') || target.querySelector('.fa-gamepad')) {
            eventName = 'play_click';
            details = { text: target.innerText.trim() }; // Override to exclude id/className
        } else if (text.includes('구매') || text.includes('buy') || target.onclick?.toString().includes('payWithCreem')) {
            eventName = 'payment_start';

            // Re-define details for payment to exclude className/id
            details = {
                text: target.innerText.trim(),
                usd_price: 'unknown'
            };

            // Capture KRW and USD price if available
            const krwEl = target.closest('div')?.parentElement?.querySelector('.krw-price');
            if (krwEl) {
                const usdValue = krwEl.getAttribute('data-usd');
                if (usdValue) details.usd_price = '$' + usdValue;

                const krwText = krwEl.innerText; // e.g., "(약 13,500원)"
                const cleanedKrw = krwText.replace(/[^0-9]/g, '');
                if (cleanedKrw) details.krw_price = parseInt(cleanedKrw, 10);
            }
        } else if (text.includes('문의') || text.includes('inquiry') || target.onclick?.toString().includes('toggleInquiryModal')) {
            eventName = 'contact_click';
            details = { text: target.innerText.trim() }; // Override to only include text
        }

        if (eventName) {
            trackEvent(eventName, details);
        }
    });

    // 3. Page Stay Time Tracking (Active Time Only)
    let totalActiveTime = 0;
    let lastActiveStart = Date.now();
    let isVisible = document.visibilityState === 'visible';

    function updateActiveTime() {
        if (isVisible) {
            const now = Date.now();
            totalActiveTime += Math.round((now - lastActiveStart) / 1000);
            lastActiveStart = now;
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            lastActiveStart = Date.now();
            isVisible = true;
        } else {
            updateActiveTime();
            isVisible = false;
        }
    });

    // Heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
        updateActiveTime();
        trackEvent('heartbeat', { duration_seconds: totalActiveTime });
    }, 30000);

    // Track Exit
    window.addEventListener('beforeunload', () => {
        updateActiveTime();
        trackEvent('page_exit', { duration_seconds: totalActiveTime });
        clearInterval(heartbeatInterval);
    });

    // Expose trackEvent to window for manual tracking if needed
    window.DeepLinkTracker = { trackEvent };
})();
