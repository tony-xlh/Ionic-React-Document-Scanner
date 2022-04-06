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
  const [pixelTypeName, setPixelTypeName] = useState<string>("color");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showUI, setShowUI] = useState(false);

  useEffect(() => {
    console.log("settings mount");
    const scanSettings: ScanSettings = JSON.parse(localStorage.getItem("settings")!);
    
    console.log(scanSettings);

    setSelectedIndex(scanSettings.selectedIndex);
    setResolution(scanSettings.resolution);
    let name = "";
    if (scanSettings.pixelType == 0) {
      name = "bw";
    } else if (scanSettings.pixelType == 1){
      name = "gray";
    }else{
      name = "color";
    }
    console.log(name);
    setPixelTypeName(name);
    
    setShowUI(scanSettings.showUI);
    setIP(scanSettings.IP);
  }, []);

  useEffect(() => {
    const state = props.location.state as { scanners:string[] };
    
  }, [props.location.state]);


  
  const convertPixelNameToValue = (name:string) => {
    let value = 0;
    if (name == "bw") {
      value = 0;
    } else if (name == "gray"){
      value = 1;
    }else{
      value = 2;
    }
    return value
  }

  const save = () =>{
    const pixelType = convertPixelNameToValue(pixelTypeName);
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
          <IonRadioGroup value={pixelTypeName} onIonChange={e => setPixelTypeName(e.detail.value)}>
            <IonListHeader>
              <IonLabel>Pixel type:</IonLabel>
            </IonListHeader>

            <IonItem>
              <IonLabel>Black & White</IonLabel>
              <IonRadio slot="start" value="bw" />
            </IonItem>

            <IonItem>
              <IonLabel>Gray</IonLabel>
              <IonRadio slot="start" value="gray" />
            </IonItem>

            <IonItem>
              <IonLabel>Color</IonLabel>
              <IonRadio slot="start" value="color" />
            </IonItem>
            <IonItemDivider>Your Selection</IonItemDivider>
            <IonItem>{pixelTypeName ?? '(none selected'}</IonItem>
          </IonRadioGroup>
        </IonList>
      </IonContent>
    </IonPage>
  );
}

export default Settings;