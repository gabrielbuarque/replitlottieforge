declare module 'adm-zip' {
  class AdmZip {
    constructor(buffer?: Buffer);
    getEntries(): Array<{
      entryName: string;
      getData(): Buffer;
    }>;
    addFile(entryName: string, content: Buffer): void;
    toBuffer(): Buffer;
  }
  export = AdmZip;
}