self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  // 🚫 LÅT FIRESTORE VARA IFRED
  if (event.request.url.includes("firestore.googleapis.com")) {
    return;
  }
});