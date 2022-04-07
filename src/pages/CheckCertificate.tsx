import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonRadioGroup, IonListHeader, IonLabel, IonItem, IonRadio, IonItemDivider, IonBackButton, IonButtons } from '@ionic/react';
import Iframe from 'react-iframe'
import { RouteComponentProps } from 'react-router';

const CheckCertificate: React.FC<RouteComponentProps> = (props:RouteComponentProps) => {
  console.log("re render");
  const [URL,setURL] = useState<string>("");

  useEffect(() => {
    const state = props.location.state as {RemoteURL:string};
    console.log(state);
    if (state && state.RemoteURL) {
      console.log(state.RemoteURL);
      console.log(state);
      setURL(state.RemoteURL);
    }
  }, [props.location.state]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <Iframe url={URL} width="100%" height="100%"/>
      </IonContent>
    </IonPage>
  );
};

export default CheckCertificate;