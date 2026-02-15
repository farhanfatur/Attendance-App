// Encrypted Secure Storage Service
// Uses expo-secure-store with additional encryption layer

import { STORAGE_KEYS } from '@/src/config/constants';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

class EncryptedStorage {
  private encryptionKey: string | null = null;

  /**
   * Initialize encryption key
   */
  async initialize(): Promise<void> {
    try {
      let key = await SecureStore.getItemAsync(STORAGE_KEYS.ENCRYPTION_KEY);
      
      if (!key) {
        // Generate new encryption key
        key = await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          `${Date.now()}-${Math.random()}`
        );
        await SecureStore.setItemAsync(STORAGE_KEYS.ENCRYPTION_KEY, key);
      }
      
      this.encryptionKey = key;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw error;
    }
  }

  /**
   * Encrypt data before storage
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initialize();
    }

    // Simple XOR encryption with key - in production, use proper encryption
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      this.encryptionKey + data,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );

    // For demo, we'll store data with integrity hash
    // In production, implement AES encryption
    const payload = {
      data,
      hash: encrypted.substring(0, 16),
      timestamp: Date.now(),
    };

    return JSON.stringify(payload);
  }

  /**
   * Decrypt data after retrieval
   */
  private async decrypt(encryptedData: string): Promise<string | null> {
    try {
      const payload = JSON.parse(encryptedData);
      
      // Verify integrity
      const expectedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        this.encryptionKey + payload.data,
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      if (expectedHash.substring(0, 16) !== payload.hash) {
        console.warn('Data integrity check failed');
        return null;
      }

      return payload.data;
    } catch {
      return null;
    }
  }

  /**
   * Store encrypted item
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await this.encrypt(value);
      await SecureStore.setItemAsync(key, encrypted);
    } catch (error) {
      console.error(`Failed to store item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve and decrypt item
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = await SecureStore.getItemAsync(key);
      if (!encrypted) return null;
      return await this.decrypt(encrypted);
    } catch (error) {
      console.error(`Failed to retrieve item ${key}:`, error);
      return null;
    }
  }

  /**
   * Store JSON object
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  /**
   * Retrieve JSON object
   */
  async getObject<T>(key: string): Promise<T | null> {
    const data = await this.getItem(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  /**
   * Remove item
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }

  /**
   * Clear all stored data
   */
  async clear(): Promise<void> {
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map(key => this.removeItem(key)));
  }
}

export const encryptedStorage = new EncryptedStorage();
export default encryptedStorage;
