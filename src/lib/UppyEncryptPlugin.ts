import { UppyEncrypt } from './UppyEncrypt';
import { BasePlugin, type DefaultPluginOptions, Uppy } from '@uppy/core';

export default class UppyEncryptPlugin extends BasePlugin {
  constructor(uppy: Uppy, opts?: DefaultPluginOptions | undefined) {
    super(uppy, opts);
    this.id = opts?.id ?? 'UppyEncryptPlugin';
    this.type = 'modifier';
    this.encryptFiles = this.encryptFiles.bind(this);
  }

  async encryptFiles(fileIds: string[]) {
    for (const fileId of fileIds) {
      const file = this.uppy.getFile(fileId);
      const password = UppyEncrypt.generatePassword();
      const enc = new UppyEncrypt(this.uppy, file, password);
      if (await enc.encryptFile()) {
        this.uppy.emit('preprocess-complete', file);
        let blob = await enc.getEncryptedFile();
        this.uppy.setFileState(fileId, {
          type: 'application/octet-stream',
          data: blob,
          size: blob.size,
        });
      }
    }
  }

  install() {
    this.uppy.addPreProcessor(this.encryptFiles);
  }

  uninstall() {
    this.uppy.removePreProcessor(this.encryptFiles);
  }
}
