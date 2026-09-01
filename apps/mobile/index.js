/**
 * @format
 */

// Must be the very first import: tweetnacl (used by src/mesh/*) needs a
// secure crypto.getRandomValues, which Hermes doesn't provide on its own —
// without this, every nacl.box.keyPair() call throws "no PRNG" and identity
// generation (and therefore the entire encrypted mesh layer) silently never
// resolves.
import 'react-native-get-random-values';

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Benign Metro module-resolution fallback warning (an internal RN path not
// listed in package "exports" yet) — harmless, but its LogBox banner sits
// pinned to the bottom of every screen in dev builds, covering real UI
// underneath it (e.g. the tab bar). Silence just this known warning rather
// than all logs.
LogBox.ignoreLogs(['Attempted to import the module']);

AppRegistry.registerComponent(appName, () => App);
