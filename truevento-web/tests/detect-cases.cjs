// Real user agents and what each place should detect.
// web: the App card on truevento.com · ins: /instalar picker (iPhone only) · app: the coach in the students app
const I = (os, rest) => `Mozilla/5.0 (iPhone; CPU iPhone OS ${os} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) ${rest}`
const IPAD = (rest) => `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) ${rest}`
module.exports = [
  // Safari, by iOS version (iOS 26 reports a frozen "OS 18_6"; Safari says the real version)
  { name: 'iOS 26.0 Safari', ua: I('18_6', 'Version/26.0 Mobile/15E148 Safari/604.1'), web: 'ios26', ins: 'ios26', app: 'ios26' },
  { name: 'iOS 26.1 Safari', ua: I('18_6', 'Version/26.1 Mobile/15E148 Safari/604.1'), web: 'ios26', ins: 'ios26', app: 'ios26' },
  { name: 'iOS 26.2 Safari', ua: I('18_7', 'Version/26.2 Mobile/15E148 Safari/604.1'), web: 'ios26', ins: 'ios26', app: 'ios26' },
  { name: 'iOS 18.6 Safari', ua: I('18_6', 'Version/18.6 Mobile/15E148 Safari/604.1'), web: 'ios18', ins: 'ios18', app: 'ios18' },
  { name: 'iOS 18.0 Safari', ua: I('18_0', 'Version/18.0 Mobile/15E148 Safari/604.1'), web: 'ios18', ins: 'ios18', app: 'ios18' },
  { name: 'iOS 17.5 Safari', ua: I('17_5', 'Version/17.5 Mobile/15E148 Safari/604.1'), web: 'ios18', ins: 'ios18', app: 'ios18' },
  { name: 'iOS 16.7 Safari', ua: I('16_7', 'Version/16.6 Mobile/15E148 Safari/604.1'), web: 'ios18', ins: 'ios18', app: 'ios18' },
  { name: 'iOS 15.8 Safari', ua: I('15_8', 'Version/15.6 Mobile/15E148 Safari/604.1'), web: 'ios18', ins: 'ios18', app: 'ios18' },
  // other browsers on iPhone
  { name: 'iPhone Chrome', ua: I('18_6', 'CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1'), web: 'chrome', ins: 'chrome', app: 'ios-chrome' },
  { name: 'iPhone Firefox', ua: I('18_6', 'FxiOS/132.0 Mobile/15E148 Safari/605.1.15'), web: 'chrome', ins: 'chrome', app: 'ios-chrome' },
  { name: 'iPhone Edge', ua: I('18_6', 'EdgiOS/131.0.2903.68 Version/18.0 Mobile/15E148 Safari/604.1'), web: 'chrome', ins: 'chrome', app: 'ios-chrome' },
  // inside other apps (no "Safari/" or an app's own mark)
  { name: 'iPhone Instagram', ua: I('18_6', 'Mobile/15E148 Instagram 350.0.0.29.106 (iPhone15,3; iOS 18_6; es_AR)'), web: 'inapp', ins: 'inapp', app: 'in-app' },
  { name: 'iPhone Facebook', ua: I('18_6', 'Mobile/15E148 [FBAN/FBIOS;FBAV/490.0.0.30.106;FBBV/1;FBDV/iPhone15,3]'), web: 'inapp', ins: 'inapp', app: 'in-app' },
  { name: 'iPhone WhatsApp / Claude (app browser)', ua: I('18_6', 'Mobile/15E148'), web: 'inapp', ins: 'inapp', app: 'in-app' },
  // iPad (says it is a Mac; known by its touch screen)
  { name: 'iPad iOS 26 Safari', ua: IPAD('Version/26.0 Safari/605.1.15'), ipad: true, web: 'ios26', ins: 'ios26', app: 'ipad' },
  { name: 'iPad iOS 17 Safari', ua: IPAD('Version/17.5 Safari/605.1.15'), ipad: true, web: 'ios18', ins: 'ios18', app: 'ipad' },
  // Android
  { name: 'Android Chrome', ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36', android: true, web: 'android', ins: null, app: 'android' },
  { name: 'Android Samsung', ua: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36', android: true, web: 'android', ins: null, app: 'android' },
  { name: 'Android Instagram', ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0', android: true, web: 'inapp', ins: null, app: 'in-app' },
  // computers
  { name: 'Mac Safari', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15', desktop: true, web: 'desktop', ins: null, app: 'desktop' },
  { name: 'Windows Chrome', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', desktop: true, web: 'desktop', ins: null, app: 'desktop' },
]
