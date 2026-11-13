// The service worker (sw.js) precaches the whole app, the question bank and its pictures, so the
// app works with no connection at all. A new build is picked up on the next launch: the open page
// never reloads by itself, which would lose a session or a running exam.

export function registerServiceWorker(onUpdate: (apply: () => void) => void) {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const sw = navigator.serviceWorker;
  sw.register("./sw.js").then(
    (registration) => {
      const offer = (worker: ServiceWorker) => onUpdate(() => worker.postMessage("skip-waiting"));
      if (registration.waiting && sw.controller) offer(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && sw.controller) offer(worker);
        });
      });
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) void registration.update().catch(() => {});
      });
    },
    (error: unknown) => console.warn("[koroad] service worker not registered", error),
  );
  let reloaded = false;
  sw.addEventListener("controllerchange", () => {
    if (!reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  void navigator.storage?.persist?.().catch(() => false);
}
