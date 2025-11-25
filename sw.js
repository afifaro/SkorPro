/**
 * SKORPRO - Service Worker
 * Untuk offline capability (Progressive Web App)
 */

const CACHE_NAME = 'skorpro-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/database.js',
    '/js/utils.js',
    '/js/statistics.js',
    '/js/data-siswa.js',
    '/js/generator.js',
    '/js/scanner.js',
    '/js/analisis.js',
    '/js/rapor.js',
    '/libs/xlsx.full.min.js',
    '/libs/qrcode.min.js',
    '/libs/jspdf.umd.min.js',
    '/libs/jsBarcode.all.min.js',
    '/libs/html2canvas.min.js',
    '/libs/chart.umd.min.js'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Activate event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});