import { IonActionSheet, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import DocumentBrowser from '../components/DocumentBrowser';
import { initDDV } from '../DDVUtils';
import { useEffect, useRef, useState } from 'react';
import { DDV, IDocument } from 'dynamsoft-document-viewer';
import DocumentCropper from '../components/DocumentCropper';
import DocumentScanner from '../components/DocumentScanner';
import { ellipsisHorizontal, ellipsisVertical} from 'ionicons/icons';
import DocumentEditor from '../components/DocumentEditor';
import { OverlayEventDetail } from '@ionic/core';

const Home: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialized,setInitialized] = useState(false);
  const initializing = useRef(false);
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
  },[])

  const startScanning = () => {
    setDisplayHeader(false);
    setScanning(true);
  }

  const stopScanning = () => {
    setDisplayHeader(true);
    setScanning(false);
  }

  const onScanned = (base64:string) => {
    stopScanning();
    loadImage(base64);
  }

  const loadImage = async (base64:string) => {
    if (!base64.startsWith("data")) {
      base64 = "data:image/jpeg;base64," + base64;
    }
    const response = await fetch(base64);
    const blob = await response.blob();
    doc.current?.loadSource(blob);
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
            <DocumentEditor docUid={uid} show={displayEditor}></DocumentEditor>
          </div>
          <div className={"cropper fullscreen" + (displayCropper?"":" hidden")}>
            <DocumentCropper docUid={uid} show={displayCropper}></DocumentCropper>
          </div>
          <div className={"browser" + (displayBrowser?"":" hidden")}>
            <DocumentBrowser docUid={uid} show={displayBrowser}></DocumentBrowser>
          </div>
        </>
      )
    }
  }

  const handleAction = (detail:OverlayEventDetail) => {
    console.log(detail);
    if (detail.data && detail.data.action != "cancel") {
      setDisplayHeader(false);
      setMode(detail.data.action);
    }
    setIsOpen(false);
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
        <div className="footer">
          <button className="shutter-button round" onClick={startScanning}>Scan</button>
        </div>
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
