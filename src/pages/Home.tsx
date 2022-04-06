import {  IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from "@ionic/react";
import { cameraOutline, documentOutline, documentTextOutline, settingsOutline } from 'ionicons/icons';
import { DeviceConfiguration } from "mobile-web-capture/dist/types/WebTwain.Acquire";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import Scanner from "../components/Scanner";
import { ScanSettings } from "./Settings";

let scanners:string[] = [];

const Home: React.FC<RouteComponentProps> = (props:RouteComponentProps) => {
  const [scan,setScan] = useState(false);
  const [remoteScan,setRemoteScan] = useState(false);
  const [remoteIP,setRemoteIP] = useState("");
  const [deviceConfiguration, setDeviceConfiguration] = useState<DeviceConfiguration|undefined>(undefined);

  const loadSettings = () => {
    let settings = JSON.parse(localStorage.getItem("settings")!);
    let deviceConfig:DeviceConfiguration = {
      SelectSourceByIndex: settings.selectedIndex,
      ShowRemoteScanUI: settings.showUI,
      IfShowUI: settings.showUI,
      PixelType: settings.pixelType,
      Resolution: settings.resolution,
    }
    setDeviceConfiguration(deviceConfig);
    const IP = localStorage.getItem("IP");
    if (IP) {
      setRemoteIP(IP);
    }
  }

  useEffect(() => {
    console.log("on mount");
    loadSettings();
  }, []);

  useEffect(() => {
    const state = props.location.state as { settingsSaved:boolean };
    console.log("update settings");
    console.log(state);
    if (state && state.settingsSaved == true) {
     loadSettings();
    }
  }, [props.location.state]);

  const onScannerListLoaded = (list:string[]) => {
    console.log("onScannerListLoaded");
    console.log(list);
    scanners = list;
  };

  const goToSettings = () => {
    props.history.push("settings",{scanners:scanners});
  }

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
            <IonButton onClick={goToSettings} color="secondary">
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
         remoteIP={remoteIP}
         deviceConfig={deviceConfiguration}
         onScannerListLoaded={onScannerListLoaded} 
         onScanned={() => setScan(false)} 
        />
        <IonFab style={{display:"flex"}} vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton style={{marginRight:"10px"}} onClick={() => {
            setRemoteScan(true);
            resetScanStateDelayed();
          }} >
            <IonIcon icon={documentOutline} />
          </IonFabButton>
          <IonFabButton onClick={() => {
            setScan(true);
            resetScanStateDelayed();                           
          }} >
            <IonIcon icon={cameraOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
  
}

export default Home;