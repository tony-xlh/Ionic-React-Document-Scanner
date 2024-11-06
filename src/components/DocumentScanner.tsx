import { MutableRefObject, useEffect, useRef, useState } from 'react';
import './DocumentScanner.css';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { CameraPreview } from 'capacitor-plugin-camera';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer'

export interface DocumentScannerProps {
  torchOn?: boolean;
  onScanned?: (detectedResult:DetectedQuadResultItem,imageBase64:string) => void;
  onPlayed?: (result:{orientation:"LANDSCAPE"|"PORTRAIT",resolution:string}) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = (props:DocumentScannerProps) => {
  const container:MutableRefObject<HTMLDivElement|null> = useRef(null);
  const detecting = useRef(false);
  const interval = useRef<any>();
  const onPlayedListener = useRef<PluginListenerHandle|undefined>();
  const [initialized,setInitialized] = useState(false);
  useEffect(() => {
    const init = async () => {
      if (container.current && Capacitor.isNativePlatform() === false) {
        await CameraPreview.setElement(container.current);
      }
      await CameraPreview.initialize();
      await CameraPreview.requestCameraPermission();
      await DocumentNormalizer.initialize();
      if (onPlayedListener.current) {
        onPlayedListener.current.remove();
      }
      onPlayedListener.current = await CameraPreview.addListener("onPlayed", async () => {
        startScanning();
        const orientation = (await CameraPreview.getOrientation()).orientation;
        const resolution = (await CameraPreview.getResolution()).resolution;
        if (props.onPlayed) {
          props.onPlayed({orientation:orientation,resolution:resolution});
        }
      });
      await CameraPreview.startCamera();
      setInitialized(true);
    }
    init();
    return ()=>{
      if (initialized) {
        console.log("unmount and stop scan");
        stopScanning();
        CameraPreview.stopCamera();
      }
    }
  }, []);

  const startScanning = () => {
    stopScanning();
    interval.current = setInterval(captureAndDetect,100);
  }
  
  const stopScanning = () => {
    clearInterval(interval.current);
  }
  
  const captureAndDetect = async () => {
    if (detecting.current === true) {
      return;
    }
    let results:DetectedQuadResultItem[] = [];
    detecting.current = true;
    try {
      if (Capacitor.isNativePlatform()) {
        await CameraPreview.saveFrame();
        results = (await DocumentNormalizer.detectBitmap({})).results;
      }else{
        let video = container.current?.getElementsByTagName("video")[0] as any;
        let response = await DocumentNormalizer.detect({source:video});
        results = response.results;
      }
      checkIfSteady(results);
    } catch (error) {
      console.log(error);
    }
    detecting.current = false;
  }

  const checkIfSteady = (results:DetectedQuadResultItem[]) => {
    console.log(results);
  }


  useEffect(() => {
    if (initialized) {
      if (props.torchOn === true) {
        CameraPreview.toggleTorch({on:true});
      }else{
        CameraPreview.toggleTorch({on:false});
      }
    }
  }, [props.torchOn]);
  
  return (
    <div className="container" ref={container}>
      <div className="dce-video-container"></div>
    </div>
  );
};

export default DocumentScanner;