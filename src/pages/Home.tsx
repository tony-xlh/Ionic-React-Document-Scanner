import { IonActionSheet, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import DocumentBrowser from '../components/DocumentBrowser';
import { initDDV } from '../DDVUtils';
import { useEffect, useRef, useState } from 'react';
import { DDV, IDocument, PerspectiveViewer, Quad } from 'dynamsoft-document-viewer';
import DocumentCropper from '../components/DocumentCropper';
import DocumentScanner from '../components/DocumentScanner';
import { ellipsisHorizontal, ellipsisVertical} from 'ionicons/icons';
import DocumentEditor from '../components/DocumentEditor';
import { OverlayEventDetail } from '@ionic/core';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer'
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const Home: React.FC = () => {
  const ionBackground = useRef("");
  const [isOpen, setIsOpen] = useState(false);
  const [initialized,setInitialized] = useState(false);
  const initializing = useRef(false);
  const perspectiveViewer = useRef<PerspectiveViewer|undefined>();
  const [scanning,setScanning] = useState(false);
  const [displayHeader,setDisplayHeader] = useState(true);
  const [mode,setMode] = useState<"browse"|"edit"|"crop">("browse")
  const doc = useRef<IDocument|undefined>();
  useEffect(()=>{
    const init = async () => {
      console.log("init DDV");
      const result = await initDDV();
      doc.current = DDV.documentManager.createDocument();
      setInitialized(result);
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
    setDisplayHeader(true);
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

  const returnToBrowseViewer = () => {
    setDisplayHeader(true);
    setMode("browse");
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
            <DocumentEditor docUid={uid} show={displayEditor} onBack={returnToBrowseViewer}></DocumentEditor>
          </div>
          <div className={"cropper fullscreen" + (displayCropper?"":" hidden")}>
            <DocumentCropper docUid={uid} show={displayCropper} onBack={returnToBrowseViewer} onInitialized={(viewer:PerspectiveViewer)=>{perspectiveViewer.current = viewer;}}></DocumentCropper>
          </div>
          <div className={"browser" + ((displayBrowser && !scanning)?"":" hidden")}>
            <DocumentBrowser docUid={uid} show={displayBrowser}></DocumentBrowser>
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
        let writingResult = await Filesystem.writeFile({
          path: fileName,
          data: blob,
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
