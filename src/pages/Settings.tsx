import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from "@ionic/react";


const Settings: React.FC = () => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton />
        </IonButtons>
        <IonTitle>Settings</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent>
      
    </IonContent>
  </IonPage>
);

export default Settings;