'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"flutter_bootstrap.js": "aeac7b5d5116309530528b22007ae7af",
"version.json": "ea180333b41ef0bf11e3f8bc1efdcf2d",
"index.html": "a9c8e68fe09ee52fe8245fb39783c050",
"/": "a9c8e68fe09ee52fe8245fb39783c050",
"main.dart.js": "593e33cc2975b8bdc3d14bc275faba46",
"flutter.js": "4b2350e14c6650ba82871f60906437ea",
"favicon.png": "945b125636171c31cbf46bbee8a805f6",
"icons/Icon-192.png": "59c8897c2a8232c8e71d408def4cd4b6",
"icons/Icon-maskable-192.png": "59c8897c2a8232c8e71d408def4cd4b6",
"icons/Icon-maskable-512.png": "bdeaf4b1c7e3778d0b220739b044b541",
"icons/Icon-512.png": "bdeaf4b1c7e3778d0b220739b044b541",
"manifest.json": "03c77b8dad862092070113fa13493983",
"assets/AssetManifest.json": "cc66cd73111773a522fc07142d57334b",
"assets/NOTICES": "08054c5db39bdd8739af694a5ffb2ee3",
"assets/FontManifest.json": "3f682ee38cd4f54ca5918120503bc322",
"assets/AssetManifest.bin.json": "d70f6c6dbd4d43aaf00c630c14a4f6cf",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "e986ebe42ef785b27164c36a9abc7818",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"assets/AssetManifest.bin": "78385bdcfc91c1aaa44eb4fcd880a086",
"assets/fonts/MaterialIcons-Regular.otf": "1c26451afb9df8aac0239f60efee3d2b",
"assets/assets/rotate.png": "ba0c458769b30bf895bbc61a088558a9",
"assets/assets/navigation/0004.png": "29f9f17cd6b6fe040786418896ec5c7c",
"assets/assets/navigation/0000.png": "a1ae0edfcd11983ee00bfa53913c7f71",
"assets/assets/navigation/0001.png": "b1913ba52c6a414e044985b41af6accb",
"assets/assets/navigation/0003.png": "13e584ce87225d5a9d08b08137941b93",
"assets/assets/navigation/0002.png": "a8e6763b1bf2768bb3edc2428291b127",
"assets/assets/arduino/0004.png": "ba3520e2d1cb9dca326eae138212613c",
"assets/assets/arduino/0000.png": "ac98fd5ee68c6c79fe8a275a8563426b",
"assets/assets/arduino/0001.png": "e93f3aa8e93a50823b578b70f148d8bd",
"assets/assets/arduino/0003.png": "9f1189dc9a00776d9d5cc6e938367929",
"assets/assets/arduino/0002.png": "2a343ffc88231006f83d4f6ee183ccda",
"assets/assets/esp32c6/rounded/0006.png": "1cd9548182a79aa8481fe54742fdd62b",
"assets/assets/esp32c6/rounded/0005.png": "4f411bcb9d92e0515fd84912acb570a0",
"assets/assets/esp32c6/rounded/0004.png": "d1ed0dc2912a63d3b924671dae4366ea",
"assets/assets/esp32c6/rounded/0000.png": "e95c42f5d576e800b30cae77daf1b532",
"assets/assets/esp32c6/rounded/0001.png": "31037dd9149a4d3704d2357b316c67c5",
"assets/assets/esp32c6/rounded/0003.png": "d36c958542537718fd8e410c25845b32",
"assets/assets/esp32c6/rounded/0002.png": "b854a8d42acdcc0d54dd51ab60908270",
"assets/assets/esp32c6/0000.png": "6199a4607507663946a222ccf38f926b",
"assets/assets/esp32c6/0000.gif": "496582b41fb1d37dc1862d3a834061dd",
"assets/assets/fonts/GoogleSans-Italic.ttf": "af05b47de35fd5a5960ad1e440a4c0c7",
"assets/assets/fonts/GoogleSans-Bold.ttf": "a19a7b108b2e3961fc855c6ea5a6546f",
"assets/assets/fonts/GoogleSans-BoldItalic.ttf": "281acf49bbcece01beff18a4a59f9bfd",
"assets/assets/fonts/SpaceMono.ttf": "96985f7a507afce5ab786569d2b2368f",
"assets/assets/fonts/GoogleSans-Regular.ttf": "b61c0ab33a818a0162f3e868babcef4b",
"assets/assets/fonts/Monaco.ttf": "8dbba50b8796bd02e1061ca5e4c42f90",
"assets/assets/fonts/GoogleSans-MediumItalic.ttf": "b7efc2304b5103df6a75befa88d42d40",
"assets/assets/fonts/GoogleSans-Medium.ttf": "9c51beb79b8ab173abd924ce39178f0b",
"canvaskit/skwasm.js": "ac0f73826b925320a1e9b0d3fd7da61c",
"canvaskit/skwasm.js.symbols": "96263e00e3c9bd9cd878ead867c04f3c",
"canvaskit/canvaskit.js.symbols": "efc2cd87d1ff6c586b7d4c7083063a40",
"canvaskit/skwasm.wasm": "828c26a0b1cc8eb1adacbdd0c5e8bcfa",
"canvaskit/chromium/canvaskit.js.symbols": "e115ddcfad5f5b98a90e389433606502",
"canvaskit/chromium/canvaskit.js": "b7ba6d908089f706772b2007c37e6da4",
"canvaskit/chromium/canvaskit.wasm": "ea5ab288728f7200f398f60089048b48",
"canvaskit/canvaskit.js": "26eef3024dbc64886b7f48e1b6fb05cf",
"canvaskit/canvaskit.wasm": "e7602c687313cfac5f495c5eac2fb324",
"canvaskit/skwasm.worker.js": "89990e8c92bcb123999aa81f7e203b1c"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
