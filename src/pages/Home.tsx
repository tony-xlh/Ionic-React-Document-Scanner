import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import './Home.css';
import DocumentBrowser from '../components/DocumentBrowser';
import { initDDV } from '../DDVUtils';
import { useEffect, useRef, useState } from 'react';
import { DDV, IDocument } from 'dynamsoft-document-viewer';
import DocumentCropper from '../components/DocumentCropper';

const Home: React.FC = () => {
  const [initialized,setInitialized] = useState(false);
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
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Document Scanner</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Document Scanner</IonTitle>
          </IonToolbar>
        </IonHeader>
        {(initialized && doc.current) &&
          <DocumentCropper docUid={doc.current?.uid}></DocumentCropper>
        }
      </IonContent>
    </IonPage>
  );
};

export default Home;
