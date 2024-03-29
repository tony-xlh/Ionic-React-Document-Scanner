import { IonBackButton, IonButton, IonButtons, IonCheckbox, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonListHeader, IonPage, IonRadio, IonRadioGroup, IonSelect, IonSelectOption, IonTitle, IonToggle, IonToolbar } from "@ionic/react";
import { saveOutline } from "ionicons/icons";
import { RouteComponentProps } from "react-router";
import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import Dynamsoft from "mobile-web-capture";
import { Device } from "mobile-web-capture/dist/types/WebTwain.Acquire";

export interface ScanSettings{
  selectedIndex: number;
  showUI: boolean;
  autoFeeder: boolean;
  duplex: boolean;
  resolution: number;
  pixelType: number;
}

const Settings: React.FC<RouteComponentProps> = (props:RouteComponentProps) => {
  const [URL, setURL] = useState<string>("");
  const [license, setLicense] = useState<string>("");
  const [resolution, setResolution] = useState<number>(300);
  const [pixelType, setPixelType] = useState<number>(0);
  const [scanners, setScanners] = useState<string[]>([]);
  const [selectedScanner, setSelectedScanner] = useState<string>("");
  const [showUI, setShowUI] = useState(false);
  const [duplex, setDuplex] = useState(false);
  const [autoFeeder, setAutoFeeder] = useState(false);

  useEffect(() => {
    console.log("settings mount");
    let settingsAsJSON = localStorage.getItem("scanSettings");
    let selectedIndex = 0;
    if (settingsAsJSON) {
      const scanSettings: ScanSettings = JSON.parse(settingsAsJSON);
      selectedIndex = scanSettings.selectedIndex;
      setResolution(scanSettings.resolution);
      setShowUI(scanSettings.showUI);
      setAutoFeeder(scanSettings.autoFeeder);
      setDuplex(scanSettings.duplex);
      setURL(localStorage.getItem("URL")!);
      setLicense(localStorage.getItem("license")!);
      const updatePixelTypeRadio = () => {
        setPixelType(scanSettings.pixelType);
      }
      setTimeout(updatePixelTypeRadio,0);
    }

    const state = props.location.state as { scanners:[] };

    if (state && state.scanners) {
      setScanners(state.scanners);
      if (selectedIndex>=0 && selectedIndex<state.scanners.length) {
        setSelectedScanner(state.scanners[selectedIndex]);
      }
    }
    
  }, []);

  const save = () => {
    let selectedIndex = scanners.indexOf(selectedScanner);
    let scanSettings: ScanSettings = {
      selectedIndex: selectedIndex,
      showUI: showUI,
      autoFeeder: autoFeeder,
      duplex: duplex,
      resolution: resolution,
      pixelType: pixelType
    }
    localStorage.setItem("scanSettings",JSON.stringify(scanSettings));
    if (URL) {
      localStorage.setItem("URL",URL);
    }

    localStorage.setItem("license",license);
    props.history.replace({state:{settingsSaved:true,scanners:scanners}});
    props.history.goBack();
  };

  const reloadScanners = async (selectedIndex?:number) => {
    console.log("find devices from URL: "+URL);
    let devices:Device[] = await Dynamsoft.DWT.FindDevicesAsync(URL);
    console.log(devices);
    let scannersList:string[] = [];
    for (let index = 0; index < devices.length; index++) {
      const device = devices[index];
      scannersList.push(device.displayName);
      if (selectedIndex) {
        if (selectedIndex === index) {
          setSelectedScanner(device.displayName);
        }
      }else{
        if (index === 0) {
          setSelectedScanner(device.displayName);
        }
      }
    }
    setScanners(scannersList);
  }

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
          <IonItemDivider>License</IonItemDivider>
          <IonItem>
            <IonInput value={license} placeholder="" onIonChange={e => setLicense(e.detail.value!)}></IonInput>
            <IonButton onClick={()=> (window.open("https://www.dynamsoft.com/customer/license/trialLicense?product=dwt"))}>Get a license</IonButton>
          </IonItem>
          <IonItemDivider>Proxy URL</IonItemDivider>
          <IonItem>
            <IonInput value={URL} placeholder="http://192.168.1.1" onIonChange={e => setURL(e.detail.value!)}></IonInput>
            <IonButton onClick={() => reloadScanners()}>Reload</IonButton>
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
          </IonRadioGroup>
        </IonList>
      </IonContent>
    </IonPage>
  );
}

export default Settings;