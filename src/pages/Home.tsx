import { IonActionSheet, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonLoading, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import DocumentBrowser from '../components/DocumentBrowser';
import { useEffect, useRef, useState } from 'react';
import { DDV, EditViewer, IDocument, PerspectiveViewer, Quad } from 'dynamsoft-document-viewer';
import DocumentCropper from '../components/DocumentCropper';
import DocumentScanner from '../components/DocumentScanner';
import { ellipsisHorizontal, ellipsisVertical} from 'ionicons/icons';
import DocumentEditor from '../components/DocumentEditor';
import { OverlayEventDetail } from '@ionic/core';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer'
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { DocumentNormalizer } from 'capacitor-plugin-dynamsoft-document-normalizer';

const Home: React.FC = () => {
  const ionBackground = useRef("");
  const [isOpen, setIsOpen] = useState(false);
  const [initialized,setInitialized] = useState(false);
  const initializing = useRef(false);
  const perspectiveViewer = useRef<PerspectiveViewer|undefined>();
  const [scanning,setScanning] = useState(false);
  const [displayHeader,setDisplayHeader] = useState(true);
  const stayInEditViewer = useRef(false);
  const [mode,setMode] = useState<"browse"|"edit"|"crop">("browse");
  const doc = useRef<IDocument|undefined>();
  const groupUid = useRef("ID");
  useEffect(()=>{
    const init = async () => {
      console.log("init DDV and DDN");
      try {
        DDV.Core.license = "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="; // Public trial license which is valid for 24 hours
        DDV.Core.engineResourcePath = "assets/ddv-resources/engine";// Lead to a folder containing the distributed WASM files
        await DDV.Core.loadWasm();
        await DDV.Core.init(); 
        // Configure image filter feature which is in edit viewer
        DDV.setProcessingHandler("imageFilter", new DDV.ImageFilter());
        await DocumentNormalizer.initLicense({license:"DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="});  
        doc.current = DDV.documentManager.createDocument();
        setInitialized(true);
      } catch (error) {
        alert(error);
      }
    }
    if (initializing.current === false) {
      initializing.current = true;
      init();
    }
    ionBackground.current = document.documentElement.style.getPropertyValue('--ion-background-color');
    return () => {
      document.documentElement.style.setProperty('--ion-background-color', ionBackground.current);
    }
  },[])

  const startScanning = () => {
    document.documentElement.style.setProperty('--ion-background-color', 'transparent');
    setDisplayHeader(false);
    setScanning(true);
  }

  const stopScanning = () => {
    document.documentElement.style.setProperty('--ion-background-color', ionBackground.current);
    if (stayInEditViewer.current === false) {
      setDisplayHeader(true);
    }
    setScanning(false);
  }

  const onScanned = async (blob:Blob,detectionResults:DetectedQuadResultItem[]) => {
    stopScanning();
    await doc.current?.loadSource(blob);
    showCropper(detectionResults);
  }

  const showCropper = (detectionResults?:DetectedQuadResultItem[]) => {
    setDisplayHeader(false);
    setMode("crop");
    console.log(detectionResults);
    if (detectionResults && perspectiveViewer.current && doc.current) {
      if (detectionResults.length>0) {
        let result = detectionResults[0];
        let points = result.location.points;
        let quad:Quad = [
          [points[0].x,points[0].y],
          [points[1].x,points[1].y],
          [points[2].x,points[2].y],
          [points[3].x,points[3].y]
        ];
        perspectiveViewer.current.goToPage(doc.current.pages.length - 1)
        perspectiveViewer.current.setQuadSelection(quad);
      }
    }
  }

  const returnToPrevious = (fromEditViewer?:boolean) => {
    if (stayInEditViewer.current === false || fromEditViewer === true) {
      setDisplayHeader(true);
      setMode("browse");
    } else {
      setDisplayHeader(false);
      setMode("edit");
    }
  }


  const renderViewers = () => {
    if (initialized && doc.current) {
      let uid = doc.current.uid;
      let displayEditor = false;
      let displayCropper = false;
      let displayBrowser = false;
      if (mode === "browse") {
        displayBrowser = true;
      }else if (mode === "crop") {
        displayCropper = true;
      }else if (mode === "edit") {
        displayEditor = true;
      }
      return (
        <>
          <div className={"editor fullscreen" + (displayEditor?"":" hidden")}>
            <DocumentEditor 
              docUid={uid} 
              show={displayEditor} 
              groupUid={groupUid.current}
              onScanRequired={()=>{
                stayInEditViewer.current = true;
                startScanning();
              }}
              onBack={()=>{returnToPrevious(true)}}>
            </DocumentEditor>
          </div>
          <div className={"cropper fullscreen" + (displayCropper?"":" hidden")}>
            <DocumentCropper 
              docUid={uid}
              groupUid={groupUid.current}
              show={displayCropper} 
              onBack={returnToPrevious} 
              onInitialized={(viewer:PerspectiveViewer)=>{perspectiveViewer.current = viewer;}}>
            </DocumentCropper>
          </div>
          <div className={"browser" + ((displayBrowser && !scanning)?"":" hidden")}>
            <DocumentBrowser 
              docUid={uid} 
              groupUid={groupUid.current}
              show={displayBrowser}>
            </DocumentBrowser>
          </div>
        </>
      )
    }
  }

  const handleAction = (detail:OverlayEventDetail) => {
    console.log(detail);
    if (detail.data && detail.data.action != "cancel") {
      if (detail.data.action === "download") {
        downloadAsPDF();
      }else{
        stayInEditViewer.current = false;
        setDisplayHeader(false);
        setMode(detail.data.action);
      }
    }
    setIsOpen(false);
  }

  const downloadAsPDF = async () => {
    if (doc.current) {
      let blob = await doc.current.saveToPdf();
      if (Capacitor.isNativePlatform()) {
        let fileName = "scanned.pdf";
        let dataURL = await blobToDataURL(blob);
        let writingResult = await Filesystem.writeFile({
          path: fileName,
          data: dataURL,
          directory: Directory.Cache
        });
        Share.share({
          title: fileName,
          text: fileName,
          url: writingResult.uri,
        });
      }else{
        const imageURL = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = imageURL;
        link.download = 'scanned.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }

  const blobToDataURL = (blob:Blob):Promise<string> => {
    return new Promise<string>((resolve) => {
      var reader = new FileReader();
      reader.onload = function(e) {
        resolve(e.target!.result as string);
      };
      reader.readAsDataURL(blob);
    })
  }

  return (
    <IonPage>
      {displayHeader &&
        <>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Document Scanner</IonTitle>
              <IonButtons slot="primary">
                <IonButton onClick={()=>{setIsOpen(true)}}>
                  <IonIcon slot="icon-only" ios={ellipsisHorizontal} md={ellipsisVertical}></IonIcon>
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
        </>
      }
      <IonContent fullscreen>
        <IonLoading isOpen={!initialized} message="Loading..." />
        {renderViewers()}
        {scanning &&
          <div className="scanner fullscreen">
            <DocumentScanner onStopped={stopScanning} onScanned={onScanned} ></DocumentScanner>
          </div>
        }
        {!scanning &&
          <div className="footer">
            <button className="shutter-button round" onClick={startScanning}>Scan</button>
          </div>
        }
        <IonActionSheet
          isOpen={isOpen}
          header="Actions"
          buttons={[
            {
              text: 'Edit',
              data: {
                action: 'edit',
              },
            },
            {
              text: 'Crop',
              data: {
                action: 'crop',
              },
            },
            {
              text: 'Download as PDF',
              data: {
                action: 'download',
              },
            },
            {
              text: 'Cancel',
              role: 'cancel',
              data: {
                action: 'cancel',
              },
            },
          ]}
          onDidDismiss={({ detail }) => handleAction(detail)}
        ></IonActionSheet>
      </IonContent>
    </IonPage>
  );
};

export default Home;
