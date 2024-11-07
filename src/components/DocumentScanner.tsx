import { MutableRefObject, useEffect, useRef, useState } from 'react';
import './DocumentScanner.css';
import { DocumentNormalizer, intersectionOverUnion } from 'capacitor-plugin-dynamsoft-document-normalizer';
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
  onScanned?: (blob:Blob,detectionResults:DetectedQuadResultItem[]) => void;
  onStopped?: () => void;
  onPlayed?: (result:{orientation:"LANDSCAPE"|"PORTRAIT",resolution:string}) => void;
}

const DocumentScanner: React.FC<DocumentScannerProps> = (props:DocumentScannerProps) => {
  const container:MutableRefObject<HTMLDivElement|null> = useRef(null);
  const torchOn = useRef(false);
  const detecting = useRef(false);
  const previousResults = useRef<DetectedQuadResultItem[]>([])
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
      if (results.length>0) {
        checkIfSteady(results);
      }
    } catch (error) {
      console.log(error);
    }
    detecting.current = false;
  }

  const takePhotoAndStop = async () => {
    stopScanning();
    let blob:Blob|undefined;
    let detectionResults:DetectedQuadResultItem[] = [];
    if (Capacitor.isNativePlatform()) {
      let photo = await CameraPreview.takePhoto({includeBase64:true});
      blob = await getBlobFromBase64(photo.base64!);
      detectionResults = (await DocumentNormalizer.detect({path:photo.path})).results;
      console.log(detectionResults);
    }else{
      let photo = await CameraPreview.takePhoto({});
      console.log(photo);
      if (photo.blob) {
        blob = photo.blob;
      }else if (photo.base64) {
        blob = await getBlobFromBase64(photo.base64);
      }
      let img = await loadBlobAsImage(blob!);
      console.log(img);
      detectionResults = (await DocumentNormalizer.detect({source:img})).results;
    }
    if (props.onScanned && blob && detectionResults) {
      props.onScanned(blob,detectionResults);
    }
  }

  const getBlobFromBase64 = async (base64:string):Promise<Blob> => {
    if (!base64.startsWith("data")) {
      base64 = "data:image/jpeg;base64," + base64;
    }
    const response = await fetch(base64);
    const blob = await response.blob();
    return blob;
  }

  const loadBlobAsImage = (blob:Blob):Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      let img = document.createElement("img");
      img.onload = function(){
        resolve(img);
      };
      img.src = URL.createObjectURL(blob);
    });
  }

  const checkIfSteady = (results:DetectedQuadResultItem[]) => {
    console.log(results);
    if (results.length>0) {
      let result = results[0];
      if (previousResults.current.length >= 3) {
        if (steady() == true) {
          console.log("steady");
          takePhotoAndStop();
        }else{
          console.log("shift and add result");
          previousResults.current.shift();
          previousResults.current.push(result);
        }
      }else{
        console.log("add result");
        previousResults.current.push(result);
      }
    }
  }

  const steady = () => {
    if (previousResults.current[0] && previousResults.current[1] && previousResults.current[2]) {
      let iou1 = intersectionOverUnion(previousResults.current[0].location.points,previousResults.current[1].location.points);
      let iou2 = intersectionOverUnion(previousResults.current[1].location.points,previousResults.current[2].location.points);
      let iou3 = intersectionOverUnion(previousResults.current[2].location.points,previousResults.current[0].location.points);
      if (iou1>0.9 && iou2>0.9 && iou3>0.9) {
        return true;
      }else{
        return false;
      }
    }
    return false;
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