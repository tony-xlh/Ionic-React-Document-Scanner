import {  IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { settingsOutline } from 'ionicons/icons';
import { useState } from "react";
import Scanner from "../components/Scanner";

const Home: React.FC = () => {
  const [scan,setScan] = useState(false);
  const onScannerListLoaded = (list:string[]) => {
    console.log(list);
    console.log("loaded");
  };

  const resetScanStateDelayed = () => {
    const reset = () => {
      setScan(false);
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
        <Scanner onScanned={() => setScan(false)} scan={scan} width={"100%"} height={"100%"} license="t0068MgAAAExy2FbB64M66W+SDEtItxWS99eYMADOrOsQLTbVuxr+wOhL0MCWTpl2IdWnONvOUKjZCDWByYVC8KbVcsJ7t40=" onScannerListLoaded={onScannerListLoaded} />
        <IonFab vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton onClick={() => {
            setScan(true);
            resetScanStateDelayed();                           
          }} >
            Scan
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
  
}

export default Home;