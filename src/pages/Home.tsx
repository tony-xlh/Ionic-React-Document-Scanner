import {  IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { settingsOutline } from 'ionicons/icons';
import { useState } from "react";
import Scanner from "../components/Scanner";

const Home: React.FC = () => {
  const [scan,setScan] = useState(false);
  const [remoteScan,setRemoteScan] = useState(false);
  const onScannerListLoaded = (list:string[]) => {
    console.log(list);
    console.log("loaded");
  };

  const resetScanStateDelayed = () => {
    const reset = () => {
      setScan(false);
      setRemoteScan(false);
    }
    setTimeout(reset,1000);
  }

  return (
   <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="end">
            <IonButton routerLink="/settings" color="secondary">
              <IonIcon slot="icon-only"  icon={settingsOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Document Scanner</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ height: "100%" }}>
        <Scanner scan={scan} 
         remoteScan={remoteScan} 
         width={"100%"} 
         height={"100%"} 
         license="t0068dAAAAEi808f38Qi4z18MUrhsfNJ+UOug9kkM1lbZjOk51s6dnZAxWMisFml7l6ijQh/tot6A5ndw4T6JDlhJ+0lmR1s="
         remoteIP="192.168.8.65"
         onScannerListLoaded={onScannerListLoaded} 
         onScanned={() => setScan(false)} 
        />
        <IonFab style={{display:"flex"}} vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton style={{marginRight:"10px"}} onClick={() => {
            setRemoteScan(true);
            resetScanStateDelayed();
          }} >
            Scan
          </IonFabButton>
          <IonFabButton onClick={() => {
            setScan(true);
            resetScanStateDelayed();                           
          }} >
            Camera
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
  
}

export default Home;