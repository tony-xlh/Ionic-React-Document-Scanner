import { IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonListHeader, IonPage, IonRadio, IonRadioGroup, IonTitle, IonToggle, IonToolbar } from "@ionic/react";
import { saveOutline } from "ionicons/icons";
import { RouteComponentProps } from "react-router";
import { useEffect, useState } from "react";

export interface ScanSettings{
  selectedIndex: number;
  IP: string;
  showUI: boolean;
  resolution: number;
  pixelType: number;
}

const Settings: React.FC<RouteComponentProps> = (props:RouteComponentProps) => {
  const [IP, setIP] = useState<string>("");
  const [resolution, setResolution] = useState<number>(300);
  const [pixelType, setPixelType] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    console.log("settings mount");
    const scanSettings: ScanSettings = JSON.parse(localStorage.getItem("settings")!);
    
    console.log(scanSettings);

    setSelectedIndex(scanSettings.selectedIndex);
    setResolution(scanSettings.resolution);
    
    setShowUI(scanSettings.showUI);
    setIP(scanSettings.IP);
    const updatePixelTypeRadio = () => {
      setPixelType(scanSettings.pixelType);
    }
    setTimeout(updatePixelTypeRadio,0);
  }, []);

  useEffect(() => {
    const state = props.location.state as { scanners:string[] };
    
  }, [props.location.state]);

  const save = () =>{
    let scanSettings: ScanSettings = {
      selectedIndex: selectedIndex,
      IP: IP,
      showUI: showUI,
      resolution: resolution,
      pixelType: pixelType
    }
    localStorage.setItem("settings",JSON.stringify(scanSettings));
    props.history.replace({state:{settingsSaved:true}});
    props.history.goBack();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={save}>
              <IonIcon slot="icon-only" icon={saveOutline}/>
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonItemDivider>IP address</IonItemDivider>
          <IonItem>
            <IonInput value={IP} placeholder="192.168.1.1" onIonChange={e => setIP(e.detail.value!)}></IonInput>
          </IonItem>
          <IonItemDivider>Resolution</IonItemDivider>
          <IonItem>
            <IonInput type="number" value={resolution} placeholder="300" onIonChange={e => setResolution(e.detail.value as unknown as number)}></IonInput>
          </IonItem>
          <IonItemDivider>ShowUI</IonItemDivider>
          <IonItem>
            <IonToggle checked={showUI} onIonChange={e => setShowUI(e.detail.checked)} />
          </IonItem>
          <IonRadioGroup value={pixelType} onIonChange={e => setPixelType(e.detail.value)}>
            <IonListHeader>
              <IonLabel>Pixel type:</IonLabel>
            </IonListHeader>

            <IonItem>
              <IonLabel>Black & White</IonLabel>
              <IonRadio slot="start" value="0" />
            </IonItem>

            <IonItem>
              <IonLabel>Gray</IonLabel>
              <IonRadio slot="start" value="1" />
            </IonItem>

            <IonItem>
              <IonLabel>Color</IonLabel>
              <IonRadio slot="start" value="2" />
            </IonItem>
            <IonItemDivider>Your Selection</IonItemDivider>
            <IonItem>{pixelType ?? '(none selected'}</IonItem>
          </IonRadioGroup>
        </IonList>
      </IonContent>
    </IonPage>
  );
}

export default Settings;