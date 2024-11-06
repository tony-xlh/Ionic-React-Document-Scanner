import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import DocumentBrowser from '../components/DocumentBrowser';
import { initDDV } from '../DDVUtils';
import { useEffect, useRef, useState } from 'react';
import { DDV, IDocument } from 'dynamsoft-document-viewer';
import DocumentCropper from '../components/DocumentCropper';
import DocumentScanner from '../components/DocumentScanner';

const Home: React.FC = () => {
  const [initialized,setInitialized] = useState(false);
  const initializing = useRef(false);
  const [scanning,setScanning] = useState(false);
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
    setScanning(true);
  }

  const stopScanning = () => {
    setScanning(false);
  }

  const onScanned = (base64:string) => {
    setScanning(false);
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

  return (
    <IonPage>
      {!scanning &&
        <>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Document Scanner</IonTitle>
            </IonToolbar>
          </IonHeader>
        </>
      }
      <IonContent fullscreen>
        {(initialized && doc.current) &&
          <div className="browser">
            <DocumentBrowser docUid={doc.current?.uid}></DocumentBrowser>
          </div>          
        }
        {scanning &&
          <div className="scanner fullscreen">
            <DocumentScanner onStopped={stopScanning} onScanned={onScanned} ></DocumentScanner>
          </div>
        }
        <div className="footer">
          <button className="shutter-button round" onClick={startScanning}>Scan</button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Home;
