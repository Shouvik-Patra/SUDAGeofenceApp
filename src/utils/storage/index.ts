import { MMKV } from 'react-native-mmkv';
import { name } from '../../../app.json';

const storage = new MMKV({
  id: `${name}-storage`,
  encryptionKey: 'encryption-key',
});

type Keys = 'token' | 'refresh-token'; // add more key

const Storage = {
  setItem: (key: Keys, value: string): Promise<void> => {
    return new Promise(resolve => {
      storage.set(key, value);
      resolve();
    });
  },

  getItem: (key: Keys): Promise<string | null> => {
    return new Promise(resolve => {
      const value = storage.getString(key);
      resolve(value || null);
    });
  },

  getNumber: (key: Keys): Promise<number | null> => {
    return new Promise(resolve => {
      const value = storage.getNumber(key);
      resolve(value || null);
    });
  },

  getBoolean: (key: Keys): Promise<boolean | null> => {
    return new Promise(resolve => {
      const value = storage.getBoolean(key);
      resolve(value || null);
    });
  },

  containsKey: (key: Keys): Promise<boolean | null> => {
    return new Promise(resolve => {
      const value = storage.contains(key);
      resolve(value || null);
    });
  },

  removeItem: (key: Keys): Promise<void> => {
    return new Promise(resolve => {
      storage.delete(key);
      resolve();
    });
  },

  clearAll: (): Promise<void> => {
    return new Promise(resolve => {
      storage.clearAll();
      resolve();
    });
  },
};

export default Storage;
