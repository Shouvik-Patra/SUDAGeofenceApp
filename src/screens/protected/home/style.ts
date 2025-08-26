import { normalize } from '@app/utils/orientation';
import {StyleSheet} from 'react-native';

 const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'white',
    },
    headerContainer: {
      backgroundColor: '#ffffff',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: normalize(15),
      height: normalize(45),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 6,
      zIndex: 1,
    },
    userIcon: {
      height: normalize(28),
      width: normalize(28),
    },
    headerText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      flex: 1,
      textAlign: 'center',
    },
    listContent: {
      padding: 16,
    },
    itemContainer: {
      backgroundColor: '#ffffff',
      padding: normalize(15),
      marginBottom: 8,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    itemText: {
      fontSize: normalize(12),
      color: '#333333',
    },
  });
  

export default styles