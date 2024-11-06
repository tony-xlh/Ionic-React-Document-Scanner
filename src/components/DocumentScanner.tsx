import { MutableRefObject, useEffect, useRef, useState } from 'react';
import './DocumentScanner.css';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';
import { CameraPreview } from 'capacitor-plugin-camera';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer'
import { IonFab, IonFabButton, IonIcon, IonFabList } from '@ionic/react';
import {
  chevronUpCircle,
  flashlight,
  closeCircle,
  camera,
  stop,
} from 'ionicons/icons';

export interface DocumentScannerProps {
  onScanned?: (detectedResult:DetectedQuadResultItem,imageBase64:string) => void;
  onStopped?: () => void;
  onPlayed?: (result:{orientation:"LANDSCAPE"|"PORTRAIT",resolution:string}) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = (props:DocumentScannerProps) => {
  const container:MutableRefObject<HTMLDivElement|null> = useRef(null);
  const torchOn = useRef(false);
  const detecting = useRef(false);
  const interval = useRef<any>();
  const onPlayedListener = useRef<PluginListenerHandle|undefined>();
  const [initialized,setInitialized] = useState(false);
  const initializing = useRef(false);
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
    
    if (initializing.current === false) {
      initializing.current = true;
      init();
    }
    
    return ()=>{
      console.log("unmount and stop scan");
      if (onPlayedListener.current) {
        onPlayedListener.current.remove();
      }
      stopScanning();
      if (initialized) {
        CameraPreview.stopCamera();
      }
    }
  }, []);

  const stopCamera = () => {
    if (props.onStopped) {
      props.onStopped();
    }
  }

  const startScanning = () => {
    stopScanning();
    if (!interval.current) {
      interval.current = setInterval(captureAndDetect,100);
    }
  }
  
  const stopScanning = () => {
    clearInterval(interval.current);
    interval.current = null;
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
        if (container.current) {
          let video = container.current.getElementsByTagName("video")[0] as any;
          let response = await DocumentNormalizer.detect({source:video});
          results = response.results;
        }
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


  const switchCamera = async () => {
    let currentCamera = (await CameraPreview.getSelectedCamera()).selectedCamera;
    let result = await CameraPreview.getAllCameras();
    let cameras = result.cameras;
    let currentCameraIndex = cameras.indexOf(currentCamera);
    let desiredIndex = 0
    if (currentCameraIndex < cameras.length - 1) {
      desiredIndex = currentCameraIndex + 1;
    }
    await CameraPreview.selectCamera({cameraID:cameras[desiredIndex]});
  }

  const toggleTorch = () => {
    if (initialized) {
      if (torchOn.current === true) {
        CameraPreview.toggleTorch({on:true});
      }else{
        CameraPreview.toggleTorch({on:false});
      }
    }
  }
  
  return (
    <div className="container" ref={container}>
      <div className="dce-video-container"></div>
      <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton>
            <IonIcon icon={chevronUpCircle}></IonIcon>
          </IonFabButton>
          <IonFabList side="top">
            <IonFabButton>
              <IonIcon icon={stop} onClick={stopCamera}></IonIcon>
            </IonFabButton>
            <IonFabButton>
              <IonIcon icon={camera} onClick={switchCamera}></IonIcon>
            </IonFabButton>
            <IonFabButton>
              <IonIcon icon={flashlight} onClick={toggleTorch}></IonIcon>
            </IonFabButton>
          </IonFabList>
        </IonFab>
    </div>
  );
};

export default DocumentScanner;