import { UppyDecrypt } from './UppyDecrypt';
import { UppyEncrypt } from './UppyEncrypt';
import { BasePlugin, type DefaultPluginOptions, Uppy, type UppyFile } from '@uppy/core';

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
      const password = 'applesapples'; //UppyEncrypt.generatePassword();
      const enc = new UppyEncrypt(this.uppy, file, password);
      if (await enc.encryptFile()) {
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

        //console.log(enc.getPasswordHash(), enc.getSalt(), enc.getHeader(), enc.getEncryptMetaData());
        const encMeta = enc.getEncryptMetaData();
        // const dec = new UppyDecrypt('applesapples', enc.getSalt(), enc.getHeader());
        // console.log(dec.getDecryptedMetaData(encMeta.header, encMeta.meta));
        // await dec.decryptFile(blob);
        // let decF = await dec.getDecryptedFile();

        //console.log(this.uppy.getFile(fileId), enc.getSalt(), enc.getHeader(), enc.getEncryptedFilename());
        //const dec = new UppyDecrypt('applesapples', enc.getPasswordHash(), enc.getSalt(), enc.getHeader());
        // let link = document.createElement('a');
        // link.href = window.URL.createObjectURL(decF);
        // link.download = 'test2.enc';
        // document.body.appendChild(link);
        // link.click();
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
