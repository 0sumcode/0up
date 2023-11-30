import _sodium from 'libsodium-wrappers-sumo';
import { SIGNATURE } from '$lib';

// Init Sodium
let sodium: typeof _sodium;
(async () => {
  await _sodium.ready;
  sodium = _sodium;
})();

export class UppyDecrypt {
  private salt: Uint8Array;
  private header: Uint8Array;
  private key: Uint8Array;

  constructor(password: string, hash: string, salt: string, header: string) {
    this.salt = sodium.from_base64(salt, sodium.base64_variants.URLSAFE_NO_PADDING);
    this.header = sodium.from_base64(header, sodium.base64_variants.URLSAFE_NO_PADDING);

    this.key = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      this.salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    // Check valid pass or throw exception
    if (!sodium.crypto_pwhash_str_verify(hash, password)) throw new Error('Invalid password.');
  }
}
