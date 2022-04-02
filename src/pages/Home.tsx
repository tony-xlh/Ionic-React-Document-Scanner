import {  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { settingsOutline } from 'ionicons/icons';
import Scanner from "../components/Scanner";

const Home: React.FC = () => {

  const onScannerListLoaded = (list:string[]) => {
    console.log(list);
    console.log("loaded");
  };

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
        <Scanner width={"100%"} height={"100%"} license="t0068MgAAAExy2FbB64M66W+SDEtItxWS99eYMADOrOsQLTbVuxr+wOhL0MCWTpl2IdWnONvOUKjZCDWByYVC8KbVcsJ7t40=" onScannerListLoaded={onScannerListLoaded} >

        </Scanner>
      </IonContent>
    </IonPage>
  );
  
}

export default Home;