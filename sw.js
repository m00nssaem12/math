// 반달수학 서비스 워커
// - 앱을 "설치 가능"하게 만드는 데 필요한 최소 요건(활성 서비스워커)을 충족시킨다.
// - 핵심 파일(HTML/아이콘)을 캐시해 오프라인에서도 앱 셸이 열리게 한다.
// - 실시간 대결(Firestore) 등 온라인 기능은 네트워크가 있을 때만 정상 동작한다.
const CACHE_NAME = 'bandalmath-v1';
const CORE_ASSETS = [
  './bandalmath.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 네트워크 우선, 실패 시 캐시로 대체 (오프라인 대비). Firebase API 요청 등 외부 도메인은 건드리지 않는다.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // 외부(Firestore 등) 요청은 그대로 통과
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
