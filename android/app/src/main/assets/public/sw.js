/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-ca84f546'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-512x512.png",
    "revision": "9c2b4ff3d6bc07877929e2ff87db1eed"
  }, {
    "url": "pwa-192x192.png",
    "revision": "18de02cc2ead46fa4c706819c552f49d"
  }, {
    "url": "index.html",
    "revision": "c2fb09e95ae1bbdf59ceb629f3548c14"
  }, {
    "url": "assets/workbox-window.prod.es5-BIl4cyR9.js",
    "revision": null
  }, {
    "url": "assets/vendor-utils-BOW9zgAS.js",
    "revision": null
  }, {
    "url": "assets/vendor-react-BJmn5NnW.js",
    "revision": null
  }, {
    "url": "assets/vendor-firebase-BpCinMTr.js",
    "revision": null
  }, {
    "url": "assets/stats-CbNd6Zuu.js",
    "revision": null
  }, {
    "url": "assets/purify.es-BA-bta5a.js",
    "revision": null
  }, {
    "url": "assets/index.es-TyxWpdxA.js",
    "revision": null
  }, {
    "url": "assets/index-DJW6SIB2.js",
    "revision": null
  }, {
    "url": "assets/index-DE_NcN4Z.css",
    "revision": null
  }, {
    "url": "pwa-192x192.png",
    "revision": "18de02cc2ead46fa4c706819c552f49d"
  }, {
    "url": "pwa-512x512.png",
    "revision": "9c2b4ff3d6bc07877929e2ff87db1eed"
  }, {
    "url": "manifest.webmanifest",
    "revision": "8c58c680413bc9a74e03aa80960e6e56"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/res\.cloudinary\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "cloudinary-images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 100,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/storage\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-storage-images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/images\.unsplash\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "external-images",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
