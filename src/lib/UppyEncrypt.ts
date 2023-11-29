import { BasePlugin, type DefaultPluginOptions, Uppy, type UppyFile } from '@uppy/core';
import _sodium from 'libsodium-wrappers-sumo';

const CHUNK_SIZE = 10000; //64 * 1024 * 1024;

class UppyEncrypt {
  private uppy: Uppy;
  private sodium: typeof _sodium;
  private salt: Uint8Array;
  private key: Uint8Array;
  private state: _sodium.StateAddress;
  private header: Uint8Array;
  private file: UppyFile<Record<string, unknown>, Record<string, unknown>>;
  private stream: ReadableStream;
  private streamController: ReadableStreamDefaultController | undefined;

  private index = 0;

  constructor(uppy: Uppy, sodium: typeof _sodium, file: UppyFile<Record<string, unknown>, Record<string, unknown>>, password: string) {
    this.uppy = uppy;
    this.sodium = sodium;
    this.file = file;

    this.streamController;
    this.stream = new ReadableStream({
      start: (controller) => {
        this.streamController = controller;
      },
    });

    this.salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    this.key = sodium.crypto_pwhash(
      sodium.crypto_secretstream_xchacha20poly1305_KEYBYTES,
      password,
      this.salt,
      sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
      sodium.crypto_pwhash_ALG_ARGON2ID13
    );

    let res = sodium.crypto_secretstream_xchacha20poly1305_init_push(this.key);
    this.state = res.state;
    this.header = res.header;
  }

  async encryptFile() {
    const sodium = this.sodium;

    if (!this.streamController) {
      throw new Error('Encryption stream does not exist');
    }

    while (this.index < this.file.size) {
      // If first chunk
      if (this.index === 0) {
        // const SIGNATURE = new Uint8Array(
        //   config.encoder.encode(config.sigCodes["v2_symmetric"])
        // );
        //streamController.enqueue(SIGNATURE);
        this.streamController.enqueue(this.salt);
        this.streamController.enqueue(this.header);
      }

      const tag =
        this.index + CHUNK_SIZE < this.file.size
          ? sodium.crypto_secretstream_xchacha20poly1305_TAG_MESSAGE
          : sodium.crypto_secretstream_xchacha20poly1305_TAG_FINAL;

      const chunk = await this.file.data.slice(this.index, this.index + CHUNK_SIZE).arrayBuffer();
      const encryptedChunk = sodium.crypto_secretstream_xchacha20poly1305_push(this.state, new Uint8Array(chunk), null, tag);

      this.streamController.enqueue(new Uint8Array(encryptedChunk));

      this.uppy.emit('preprocess-progress', this.file, {
        mode: 'determinate',
        message: `Encrypting ${this.file.name}...`,
        value: this.index / this.file.size,
      });

      this.index += CHUNK_SIZE;
    }

    this.uppy.emit('preprocess-progress', this.file, {
      mode: 'determinate',
      message: `Encrypting ${this.file.name}...`,
      value: 1,
    });

    this.streamController.close();
  }

  async getEncryptedFile() {
    const response = new Response(this.stream);
    return response.blob();
  }

  getSalt() {
    return this.salt;
  }
}

export default class UppyEncryptPlugin extends BasePlugin {
  constructor(uppy: Uppy, opts?: DefaultPluginOptions | undefined) {
    super(uppy, opts);
    this.id = opts?.id ?? 'UppyEncryptPlugin';
    this.type = 'modifier';
    this.encryptFiles = this.encryptFiles.bind(this);
  }

  async encryptFiles(fileIds: string[]) {
    //init sodium
    let sodium;
    if (typeof sodium === 'undefined') {
      await _sodium.ready;
      sodium = _sodium;
    }

    for (const fileId of fileIds) {
      const file = this.uppy.getFile(fileId);
      const password = 'apples'; //sodium.to_base64(sodium.randombytes_buf(16), sodium.base64_variants.URLSAFE_NO_PADDING);
      const enc = new UppyEncrypt(this.uppy, sodium, file, password);
      await enc.encryptFile();
      this.uppy.emit('preprocess-complete', file);
      let blob = await enc.getEncryptedFile();
      this.uppy.setFileState(fileId, {
        name: 'test.enc',
        meta: {
          name: 'test.enc',
        },
        type: 'application/octet-stream',
        data: blob,
        size: blob.size,
      });
      console.log(this.uppy.getFile(fileId));
    }
  }

  install() {
    this.uppy.addPreProcessor(this.encryptFiles);
  }

  uninstall() {
    this.uppy.removePreProcessor(this.encryptFiles);
  }
}
