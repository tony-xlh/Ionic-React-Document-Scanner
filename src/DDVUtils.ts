import { DDV } from 'dynamsoft-document-viewer';

let initialized = false;

export async function initDDV(){
  if (initialized == false) {
    DDV.Core.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="; // Public trial license which is valid for 24 hours
    DDV.Core.engineResourcePath = "assets/ddv-resources/engine";// Lead to a folder containing the distributed WASM files
    await DDV.Core.loadWasm();
    await DDV.Core.init(); 
    // Configure image filter feature which is in edit viewer
    DDV.setProcessingHandler("imageFilter", new DDV.ImageFilter());
    initialized = true;
  }
  return true;
}