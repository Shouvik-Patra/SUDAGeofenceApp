import { SafeAreaView, StatusBar } from 'react-native';
import StackNavigation from './src/navigation/StackNavigation';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar
        translucent
        backgroundColor={'#FFFFFF'}
        barStyle={'dark-content'}
      />
      <StackNavigation />
    </SafeAreaView>
  );
};

export default App;
