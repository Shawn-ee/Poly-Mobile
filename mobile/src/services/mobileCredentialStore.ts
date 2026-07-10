import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const MOBILE_AUTH_API_KEY_STORAGE_KEY = "holiwyn.mobileAuthApiKey.v1";

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainService: "holiwyn.mobileAuth",
};

const isSecureStoreAvailable = async () => {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const loadMobileAuthApiKey = async () => {
  if (await isSecureStoreAvailable()) {
    const secureKey = await SecureStore.getItemAsync(MOBILE_AUTH_API_KEY_STORAGE_KEY, secureStoreOptions);
    if (secureKey) return secureKey;
  }

  const legacyKey = await AsyncStorage.getItem(MOBILE_AUTH_API_KEY_STORAGE_KEY);
  if (legacyKey) {
    await storeMobileAuthApiKey(legacyKey);
    await AsyncStorage.removeItem(MOBILE_AUTH_API_KEY_STORAGE_KEY);
  }
  return legacyKey;
};

export const storeMobileAuthApiKey = async (apiKey: string) => {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(MOBILE_AUTH_API_KEY_STORAGE_KEY, apiKey, secureStoreOptions);
    await AsyncStorage.removeItem(MOBILE_AUTH_API_KEY_STORAGE_KEY);
    return;
  }

  await AsyncStorage.setItem(MOBILE_AUTH_API_KEY_STORAGE_KEY, apiKey);
};

export const clearMobileAuthApiKey = async () => {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(MOBILE_AUTH_API_KEY_STORAGE_KEY, secureStoreOptions);
  }
  await AsyncStorage.removeItem(MOBILE_AUTH_API_KEY_STORAGE_KEY);
};
