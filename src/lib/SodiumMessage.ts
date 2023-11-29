export type SodiumMessageRequest = 'initEncryption';
export type SodiumMessageResponse = 'initEncryptionComplete';

export interface SodiumMessage {
  msg: SodiumMessageRequest | SodiumMessageResponse;
  data?: object;
}
