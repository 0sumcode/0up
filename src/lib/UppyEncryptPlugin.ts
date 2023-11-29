import { UppyEncrypt } from './UppyEncrypt';
import { BasePlugin, type DefaultPluginOptions, Uppy, type UppyFile } from '@uppy/core';
import _sodium from 'libsodium-wrappers-sumo';

export default class UppyEncryptPlugin extends BasePlugin {
  constructor(uppy: Uppy, opts?: DefaultPluginOptions | undefined) {
    super(uppy, opts);
    this.id = opts?.id ?? 'UppyEncryptPlugin';
    this.type = 'modifier';
    this.encryptFiles = this.encryptFiles.bind(this);
  }

  async encryptFiles(fileIds: string[]) {
    //init sodium
    await _sodium.ready;
    const sodium = _sodium;

    for (const fileId of fileIds) {
      const file = this.uppy.getFile(fileId);
      const password = 'applesapples'; //sodium.to_base64(sodium.randombytes_buf(16), sodium.base64_variants.URLSAFE_NO_PADDING);
      const enc = new UppyEncrypt(this.uppy, sodium, file, password);
      await enc.encryptFile();
      this.uppy.emit('preprocess-complete', file);
      let blob = await enc.getEncryptedFile();
      this.uppy.setFileState(fileId, {
        name: 'test.enc',
        // meta: {
        //   name: 'test.enc',
        // },
        type: 'application/octet-stream',
        data: blob,
        size: blob.size,
      });
      console.log(this.uppy.getFile(fileId), enc.getSalt(), enc.getEncryptedFilename());

      // let link = document.createElement('a');
      // link.href = window.URL.createObjectURL(blob);
      // link.download = 'test2.enc';
      // document.body.appendChild(link);
      // link.click();
    }
  }

  install() {
    this.uppy.addPreProcessor(this.encryptFiles);
  }

  uninstall() {
    this.uppy.removePreProcessor(this.encryptFiles);
  }
}
