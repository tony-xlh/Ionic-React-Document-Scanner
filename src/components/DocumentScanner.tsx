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
import SVGOverlay from './SVGOverlay';

export interface DocumentScannerProps {
  onScanned?: (blob:Blob,detectionResults:DetectedQuadResultItem[]) => void;
  onStopped?: () => void;
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
  const [quadResultItem,setQuadResultItem] = useState<DetectedQuadResultItem|undefined>()
  const [viewBox,setViewBox] = useState("0 0 720 1280");
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
        console.log("played");
        await updateViewBox();
        startScanning();
      });
      await CameraPreview.startCamera();
      setInitialized(true);
    }
    
    if (initializing.current === false) {
      initializing.current = true;
      init();
    }
    
    return ()=> {
      console.log("unmount and stop scan");
      stopCamera(false);
    }
  }, []);

  const stopCamera = async (manual:boolean) => {
    if (onPlayedListener.current) {
      onPlayedListener.current.remove();
    }
    stopScanning();
    if (initialized || Capacitor.isNativePlatform()) {
      await CameraPreview.stopCamera();
    }
    if (props.onStopped && manual) {
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
        setQuadResultItem(results[0]);
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
      torchOn.current = !torchOn.current;
      CameraPreview.toggleTorch({on:torchOn.current});
    }
  }

  const updateViewBox = async () => {
    let res = (await CameraPreview.getResolution()).resolution;
    let width = parseInt(res.split("x")[0]);
    let height = parseInt(res.split("x")[1]);
    let orientation = (await CameraPreview.getOrientation()).orientation;
    let box:string;
    if (orientation === "PORTRAIT") {
      box = "0 0 "+height+" "+width;
    }else{
      box = "0 0 "+width+" "+height;
    }
    console.log(box);
    setViewBox(box);
  }
  
  return (
    <div className="container" ref={container}>
      <div className="dce-video-container"></div>
      {quadResultItem &&
        <SVGOverlay viewBox={viewBox} quad={quadResultItem}></SVGOverlay>
      }
      <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton>
            <IonIcon icon={chevronUpCircle}></IonIcon>
          </IonFabButton>
          <IonFabList side="top">
            <IonFabButton>
              <IonIcon icon={stop} onClick={()=>{stopCamera(true)}}></IonIcon>
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