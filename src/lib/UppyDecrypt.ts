import _sodium from 'libsodium-wrappers-sumo';
import { CHUNK_SIZE, SIGNATURE } from '$lib';

interface DecryptedMetaData {
  name: string;
  type?: string;
}

// Init Sodium
let sodium: typeof _sodium;
(async () => {
  await _sodium.ready;
  sodium = _sodium;
})();

export class UppyDecrypt {
  private key: Uint8Array;
  private state: _sodium.StateAddress;
  private stream: ReadableStream;
  private streamController: ReadableStreamDefaultController | undefined;

  private index = 0;

  constructor(password: string, salt: string, header: string) {
    const saltUint = sodium.from_base64(salt, sodium.base64_variants.URLSAFE_NO_PADDING);
    const headerUint = sodium.from_base64(header, sodium.base64_variants.URLSAFE_NO_PADDING);

    this.streamController;
    this.stream = new ReadableStream({
      start: (controller) => {
        this.streamController = controller;
      },
    });

    this.key = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      saltUint,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    this.state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(headerUint, this.key);

    this.index = SIGNATURE.length + saltUint.length + headerUint.length;
  }

  static verifyPassword(hash: string, password: string) {
    return sodium.crypto_pwhash_str_verify(hash, password);
  }

  async decryptFile(file: Blob) {
    if (!this.streamController) {
      throw new Error('Encryption stream does not exist');
    }

    while (this.index < file.size) {
      const chunk = await file.slice(this.index, this.index + CHUNK_SIZE + sodium.crypto_secretstream_xchacha20poly1305_ABYTES).arrayBuffer();
      const decryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_pull(this.state, new Uint8Array(chunk));

      this.streamController.enqueue(decryptedChunk.message);

      this.index += CHUNK_SIZE + sodium.crypto_secretstream_xchacha20poly1305_ABYTES;
    }

    this.streamController.close();
  }

  async getDecryptedFile() {
    const response = new Response(this.stream);
    return response.blob();
  }

  getDecryptedMetaData(header: string, meta: string) {
    // Init fresh state
    const state = sodium.crypto_secretstream_xchacha20poly1305_init_pull(sodium.from_base64(header, sodium.base64_variants.URLSAFE_NO_PADDING), this.key);
    const decryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_pull(state, sodium.from_base64(meta, sodium.base64_variants.URLSAFE_NO_PADDING));

    if (!decryptedChunk) throw new Error('Unable to decrypt meta data');
    return JSON.parse(new TextDecoder().decode(decryptedChunk.message)) as DecryptedMetaData;
  }
}
