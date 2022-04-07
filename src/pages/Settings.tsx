import { IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonListHeader, IonPage, IonRadio, IonRadioGroup, IonSelect, IonSelectOption, IonTitle, IonToggle, IonToolbar } from "@ionic/react";
import { saveOutline } from "ionicons/icons";
import { RouteComponentProps } from "react-router";
import { useEffect, useState } from "react";

export interface ScanSettings{
  selectedIndex: number;
  showUI: boolean;
  autoFeeder: boolean;
  duplex: boolean;
  resolution: number;
  pixelType: number;
  
}

const Settings: React.FC<RouteComponentProps> = (props:RouteComponentProps) => {
  const [IP, setIP] = useState<string>("");
  const [resolution, setResolution] = useState<number>(300);
  const [pixelType, setPixelType] = useState<number>(0);
  const [scanners, setScanners] = useState<string[]>([]);
  const [selectedScanner, setSelectedScanner] = useState<string>("");
  const [showUI, setShowUI] = useState(false);
  const [duplex, setDuplex] = useState(false);
  const [autoFeeder, setAutoFeeder] = useState(false);

  useEffect(() => {
    console.log("settings mount");
    const state = props.location.state as { scanners:string[] };
    setScanners(state.scanners);
    let settingsAsJSON = localStorage.getItem("settings");
    let selectedIndex = 0;
    if (settingsAsJSON) {
      const scanSettings: ScanSettings = JSON.parse(settingsAsJSON);
      selectedIndex = scanSettings.selectedIndex;
      setResolution(scanSettings.resolution);
      setShowUI(scanSettings.showUI);
      setAutoFeeder(scanSettings.autoFeeder);
      setDuplex(scanSettings.duplex);
      setIP(localStorage.getItem("IP")!);
      const updatePixelTypeRadio = () => {
        setPixelType(scanSettings.pixelType);
      }
      setTimeout(updatePixelTypeRadio,0);
    }
    if (state.scanners.length>0) {
      setSelectedScanner(state.scanners[selectedIndex]);
    }
  }, []);

  const save = () =>{
    const selectedIndex = Math.max(0, scanners.indexOf(selectedScanner));
    let scanSettings: ScanSettings = {
      selectedIndex: selectedIndex,
      showUI: showUI,
      autoFeeder: autoFeeder,
      duplex: duplex,
      resolution: resolution,
      pixelType: pixelType
    }
    localStorage.setItem("settings",JSON.stringify(scanSettings));
    if (IP) {
      localStorage.setItem("IP",IP);
    }
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
          <IonItem>
            <IonLabel>Scanner:</IonLabel>
            <IonSelect value={selectedScanner} placeholder="Scanners" onIonChange={e => setSelectedScanner(e.detail.value)}>
              {scanners.map((scanner,idx) => (
                <IonSelectOption key={idx} value={scanner}>{scanner}</IonSelectOption>
              ))}              
            </IonSelect>
          </IonItem>
          <IonItemDivider>Resolution</IonItemDivider>
          <IonItem>
            <IonInput type="number" value={resolution} placeholder="300" onIonChange={e => setResolution(e.detail.value as unknown as number)}></IonInput>
          </IonItem>
          <IonItem>
            <IonLabel>Show UI</IonLabel>
            <IonToggle slot="end" checked={showUI} onIonChange={e => setShowUI(e.detail.checked)} />
          </IonItem>
          <IonItem>
            <IonLabel>Duplex</IonLabel>
            <IonToggle slot="end" checked={duplex} onIonChange={e => setDuplex(e.detail.checked)} />
          </IonItem>
          <IonItem>
            <IonLabel>Auto Feeder (ADF)</IonLabel>
            <IonToggle slot="end" checked={autoFeeder} onIonChange={e => setAutoFeeder(e.detail.checked)} />
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