'use strict';
// Offline cache for the installed web app. Bump VERSION whenever a cached file changes,
// so devices fetch the new files on their next start.
const VERSION = 'sternenpuzzle-v13-demo';
const FILES = [
  './',
  './index.html',
  './datenschutz.html',
  './style.css',
  './sprachen.js',
  './app.js',
  './manifest.webmanifest',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './medien/start.mp4',
  './medien/start-poster.jpg',
  './bilder/01_raketenstart.png',
  './bilder/02_mondhaeschen.png',
  './bilder/03_ringplanet.png',
  './bilder/04_weltraumfreunde.png',
  './bilder/05_raketenrennen.png',
  './bilder/06_sternenpost.png',
  './bilder/37_riesenrakete.png',
  './bilder/38_sternenflitzer.png',
  './bilder/39_wuestenplanet.png',
  './stimme/de/buchstabe-a.mp3',
  './stimme/de/buchstabe-b.mp3',
  './stimme/de/buchstabe-c.mp3',
  './stimme/de/buchstabe-d.mp3',
  './stimme/de/buchstabe-e.mp3',
  './stimme/de/buchstabe-f.mp3',
  './stimme/de/buchstabe-g.mp3',
  './stimme/de/buchstabe-h.mp3',
  './stimme/de/buchstabe-i.mp3',
  './stimme/de/buchstabe-j.mp3',
  './stimme/de/buchstabe-k.mp3',
  './stimme/de/buchstabe-l.mp3',
  './stimme/de/buchstabe-m.mp3',
  './stimme/de/buchstabe-n.mp3',
  './stimme/de/buchstabe-o.mp3',
  './stimme/de/buchstabe-p.mp3',
  './stimme/de/buchstabe-q.mp3',
  './stimme/de/buchstabe-r.mp3',
  './stimme/de/buchstabe-s.mp3',
  './stimme/de/buchstabe-t.mp3',
  './stimme/de/buchstabe-u.mp3',
  './stimme/de/buchstabe-v.mp3',
  './stimme/de/buchstabe-w.mp3',
  './stimme/de/buchstabe-x.mp3',
  './stimme/de/buchstabe-y.mp3',
  './stimme/de/schatz.mp3',
  './stimme/de/zahl-01.mp3',
  './stimme/de/zahl-02.mp3',
  './stimme/de/zahl-03.mp3',
  './stimme/de/zahl-04.mp3',
  './stimme/de/zahl-05.mp3',
  './stimme/de/zahl-06.mp3',
  './stimme/de/zahl-07.mp3',
  './stimme/de/zahl-08.mp3',
  './stimme/de/zahl-09.mp3',
  './stimme/de/zahl-10.mp3',
  './stimme/de/zahl-11.mp3',
  './stimme/de/zahl-12.mp3',
  './stimme/de/zahl-13.mp3',
  './stimme/de/zahl-14.mp3',
  './stimme/de/zahl-15.mp3',
  './stimme/de/zahl-16.mp3',
  './stimme/de/zahl-17.mp3',
  './stimme/de/zahl-18.mp3',
  './stimme/de/zahl-19.mp3',
  './stimme/de/zahl-20.mp3',
  './stimme/de/zahl-21.mp3',
  './stimme/de/zahl-22.mp3',
  './stimme/de/zahl-23.mp3',
  './stimme/de/zahl-24.mp3',
  './stimme/de/zahl-25.mp3',
  './stimme/en/buchstabe-a.mp3',
  './stimme/en/buchstabe-b.mp3',
  './stimme/en/buchstabe-c.mp3',
  './stimme/en/buchstabe-d.mp3',
  './stimme/en/buchstabe-e.mp3',
  './stimme/en/buchstabe-f.mp3',
  './stimme/en/buchstabe-g.mp3',
  './stimme/en/buchstabe-h.mp3',
  './stimme/en/buchstabe-i.mp3',
  './stimme/en/buchstabe-j.mp3',
  './stimme/en/buchstabe-k.mp3',
  './stimme/en/buchstabe-l.mp3',
  './stimme/en/buchstabe-m.mp3',
  './stimme/en/buchstabe-n.mp3',
  './stimme/en/buchstabe-o.mp3',
  './stimme/en/buchstabe-p.mp3',
  './stimme/en/buchstabe-q.mp3',
  './stimme/en/buchstabe-r.mp3',
  './stimme/en/buchstabe-s.mp3',
  './stimme/en/buchstabe-t.mp3',
  './stimme/en/buchstabe-u.mp3',
  './stimme/en/buchstabe-v.mp3',
  './stimme/en/buchstabe-w.mp3',
  './stimme/en/buchstabe-x.mp3',
  './stimme/en/buchstabe-y.mp3',
  './stimme/en/schatz.mp3',
  './stimme/en/zahl-01.mp3',
  './stimme/en/zahl-02.mp3',
  './stimme/en/zahl-03.mp3',
  './stimme/en/zahl-04.mp3',
  './stimme/en/zahl-05.mp3',
  './stimme/en/zahl-06.mp3',
  './stimme/en/zahl-07.mp3',
  './stimme/en/zahl-08.mp3',
  './stimme/en/zahl-09.mp3',
  './stimme/en/zahl-10.mp3',
  './stimme/en/zahl-11.mp3',
  './stimme/en/zahl-12.mp3',
  './stimme/en/zahl-13.mp3',
  './stimme/en/zahl-14.mp3',
  './stimme/en/zahl-15.mp3',
  './stimme/en/zahl-16.mp3',
  './stimme/en/zahl-17.mp3',
  './stimme/en/zahl-18.mp3',
  './stimme/en/zahl-19.mp3',
  './stimme/en/zahl-20.mp3',
  './stimme/en/zahl-21.mp3',
  './stimme/en/zahl-22.mp3',
  './stimme/en/zahl-23.mp3',
  './stimme/en/zahl-24.mp3',
  './stimme/en/zahl-25.mp3'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(FILES.map(url => new Request(url, {cache: 'reload'})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

// Cache first: the game works without internet once it has been opened.
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request, {ignoreSearch: true}).then(hit => {
      if (hit) return request.headers.has('range') ? partial(request, hit) : hit;
      if (request.mode === 'navigate') return caches.match('./index.html').then(page => page || fetch(request));
      return fetch(request);
    })
  );
});

// Safari loads videos in byte ranges; answer them from the cached full file.
async function partial(request, response) {
  const body = await response.arrayBuffer(), total = body.byteLength;
  const match = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range'));
  let start = match && match[1] ? Number(match[1]) : 0, end = match && match[2] ? Number(match[2]) : total - 1;
  if (match && !match[1] && match[2]) { start = Math.max(0, total - Number(match[2])); end = total - 1; }
  end = Math.min(end, total - 1);
  if (!match || start > end) return new Response(null, {status: 416, headers: {'Content-Range': `bytes */${total}`}});
  return new Response(body.slice(start, end + 1), {status: 206, headers: {
    'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
    'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes'}});
}
