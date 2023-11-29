import _sodium from 'libsodium-wrappers-sumo';
import type { SodiumMessage } from '$lib';

export {};

let salt, key, state, header;

(async () => {
  await _sodium.ready;
  const sodium = _sodium;

  onmessage = ({ data: { msg, data } }) => {
    switch (msg) {
      case 'initEncryption':
        initEncryption(data.password);
        break;
    }
  };

  const initEncryption = (password: string) => {
    salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    key = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(key);
    state = res.state;
    header = res.header;

    postMessage({ msg: 'initEncryptionComplete' });
  };
})();
