import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Linking, Platform, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { OnboardingPreview } from '../../OnboardingPreview';
import { NativeGlassTabs, type MenoCompassPrimaryRoute } from '../../NativeGlassTabs.native';
import { webViewDiagnosticsScript } from '../../webview-diagnostics';
import { CAPTURE_NOW, captureFixture } from './fixture';
import { PrivacyCapture } from './PrivacyCapture';

const appAsset = require('../../assets/menlopass.html');
type CaptureRoute = MenoCompassPrimaryRoute | 'report' | 'setup' | 'privacy';
const routes = new Set<string>(['today', 'journey', 'care', 'report', 'guide', 'setup', 'privacy']);
const primary = new Set<string>(['today', 'journey', 'care', 'guide']);
const serializedFixture = JSON.stringify(captureFixture());

function parseLink(url: string | null): { route: CaptureRoute; step: number } | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const route = parsed.hostname || parsed.pathname.replace(/^\//, '');
    if (parsed.protocol !== 'peri-capture:' || !routes.has(route) || parsed.username || parsed.password) return null;
    const requestedStep = Number(parsed.searchParams.get('step') ?? 3);
    return { route: route as CaptureRoute, step: Number.isInteger(requestedStep) && requestedStep >= 0 && requestedStep <= 3 ? requestedStep : 3 };
  } catch { return null; }
}

function CaptureContent() {
  const [screen, setScreen] = useState<{ route: CaptureRoute; step: number; revision: number }>({ route: 'today', step: 3, revision: 0 });
  const [html, setHtml] = useState<string>();
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [navigation, setNavigation] = useState({ route: 'today', onboarded: true, sheetOpen: false });
  const webView = useRef<WebView>(null);

  const open = (route: CaptureRoute, step = 3) => {
    setReady(false); setError('');
    setScreen(previous => ({ route, step, revision: previous.revision + 1 }));
    setNavigation({ route: route === 'report' ? 'appointment-report' : route, onboarded: true, sheetOpen: false });
  };

  useEffect(() => {
    let active = true;
    void Asset.fromModule(appAsset).downloadAsync()
      .then(asset => new File(asset.localUri || asset.uri).text())
      .then(source => { if (active) setHtml(source); })
      .catch(reason => { if (active) setError(String(reason)); });
    const handle = (url: string | null) => { const target = parseLink(url); if (active && target) open(target.route, target.step); };
    void Linking.getInitialURL().then(handle);
    const links = Linking.addEventListener('url', event => handle(event.url));
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { active = false; links.remove(); show.remove(); hide.remove(); };
  }, []);

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'webview-ready') setReady(true);
      if (message.type === 'navigation-state' && typeof message.route === 'string') {
        setNavigation({ route: message.route, onboarded: message.onboarded === true, sheetOpen: message.sheetOpen === true });
      }
      if (message.type === 'webview-error') setError(`Embedded app error: ${message.errorType || 'Error'}`);
      // Persistence, purchases, external links, analytics, exports, HealthKit,
      // notifications and all other native actions deliberately have no handler.
    } catch { /* Ignore non-JSON bridge messages. */ }
  };

  if (screen.route === 'setup') return <OnboardingPreview
    key={screen.revision}
    initialDraft={{ step: screen.step, symptoms: ['sleepq', 'energy', 'hf'], intent: 'treatment' }}
    busy={false} restoreReady={true} onChange={() => {}} onFinish={async () => {}}
    onRestore={() => {}} onEvent={() => {}}
  />;
  if (screen.route === 'privacy') return <PrivacyCapture onChoose={() => open('setup')} />;
  if (!html || error) return <SafeAreaView style={styles.container}><StatusBar style="dark" />
    {error ? <Text selectable>{error}</Text> : <ActivityIndicator color="#244b43" />}
  </SafeAreaView>;

  const route = screen.route === 'report' ? 'appointment-report' : screen.route;
  const injection = `
    ${webViewDiagnosticsScript}
    window.__MENO_NATIVE__ = true;
    window.__MENO_NATIVE_TABS__ = ${Platform.OS === 'ios' ? 'true' : 'false'};
    window.__MENO_PRO_ACTIVE__ = true;
    window.__MENO_PERSISTED_STATE__ = ${JSON.stringify(serializedFixture)};
    (function setCaptureClock() {
      var NativeDate = Date, now = ${JSON.stringify(new Date(CAPTURE_NOW).getTime())};
      function CaptureDate() {
        var args = Array.prototype.slice.call(arguments);
        if (!(this instanceof CaptureDate)) return new NativeDate(now).toString();
        return new (Function.prototype.bind.apply(NativeDate, [null].concat(args.length ? args : [now])))();
      }
      CaptureDate.prototype = NativeDate.prototype;
      Object.setPrototypeOf(CaptureDate, NativeDate);
      CaptureDate.now = function () { return now; };
      window.Date = CaptureDate;
    })();
    window.location.hash = ${JSON.stringify(route)};
    (function prepareNativeViewport() {
      var apply = function () {
        if (!document.head) return;
        var viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) { viewport = document.createElement('meta'); viewport.name = 'viewport'; document.head.appendChild(viewport); }
        viewport.content = 'width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover';
        document.documentElement.classList.add('native-app');
        if (window.__MENO_NATIVE_TABS__ === true) document.documentElement.classList.add('native-ios-tabs');
      };
      apply(); document.addEventListener('DOMContentLoaded', apply, { once: true });
    })(); true;
  `;

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
    <StatusBar style="dark" />
    <WebView key={screen.revision} ref={webView} originWhitelist={['*']} source={{ html }}
      injectedJavaScriptBeforeContentLoaded={injection}
      javaScriptEnabled domStorageEnabled textInteractionEnabled directionalLockEnabled
      bounces={false} showsHorizontalScrollIndicator={false} allowFileAccess
      allowUniversalAccessFromFileURLs={false} mixedContentMode="never" setSupportMultipleWindows={false}
      onLoadStart={() => setReady(false)} onError={() => setError('Embedded content failed to load.')}
      onContentProcessDidTerminate={() => { setReady(false); webView.current?.reload(); }}
      onLoadEnd={() => webView.current?.injectJavaScript(`window.dispatchEvent(new Event('menocompass-native-navigation-request')); true;`)}
      onMessage={onMessage} onOpenWindow={() => {}}
      onShouldStartLoadWithRequest={({ url }) => url === 'about:blank' || url.startsWith('about:blank#') || url.startsWith('data:') || url.startsWith('file:')}
      style={styles.webview}
    />
    {Platform.OS === 'ios' && ready && navigation.onboarded && !navigation.sheetOpen && !keyboardVisible && primary.has(navigation.route)
      ? <NativeGlassTabs activeRoute={navigation.route as MenoCompassPrimaryRoute} onSelect={selected => {
        setNavigation(current => ({ ...current, route: selected, sheetOpen: false }));
        webView.current?.injectJavaScript(`if (location.hash === '#${selected}') window.scrollTo(0, 0); else location.hash = ${JSON.stringify(selected)}; true;`);
      }} /> : null}
  </SafeAreaView>;
}

/** Capture-only Metro entry; production App.native.tsx does not import this. */
export default function CaptureApp() {
  return <SafeAreaProvider><CaptureContent /></SafeAreaProvider>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f5ef' },
  webview: { flex: 1, backgroundColor: '#f7f5ef' },
});
