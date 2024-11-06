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
  const [scanning,setScanning] = useState(false);
  const doc = useRef<IDocument|undefined>();
  useEffect(()=>{
    console.log("mounted");
    const init = async () => {
      const result = await initDDV();
      doc.current = DDV.documentManager.createDocument();
      setInitialized(result);
    }
    init();
  },[])

  const startScanning = () => {
    setScanning(true);
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
            <DocumentScanner></DocumentScanner>
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
