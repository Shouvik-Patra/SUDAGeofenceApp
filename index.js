import App from './App';
import { name as appName } from './app.json';
import { Provider } from 'react-redux';
import { store } from './src/store/index';
import { AppRegistry, LogBox } from 'react-native';

LogBox.ignoreAllLogs();
const createApp = () => (
  <Provider store={store}>
    <App />
  </Provider>
);

AppRegistry.registerComponent(appName, () => createApp);
