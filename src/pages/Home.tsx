import {  IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, useIonActionSheet } from "@ionic/react";
import { cameraOutline, documentOutline, documentTextOutline, downloadOutline, ellipseOutline, ellipsisVerticalOutline, settingsOutline, shareOutline } from 'ionicons/icons';
import { DeviceConfiguration } from "mobile-web-capture/dist/types/WebTwain.Acquire";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import Scanner from "../components/Scanner";

let scanners:string[] = [];

const Home: React.FC<RouteComponentProps> = (props:RouteComponentProps) => {
  const [present, dismiss] = useIonActionSheet();
  const [scan,setScan] = useState(false);
  const [download,setDownload] = useState(false);
  const [remoteScan,setRemoteScan] = useState(false);
  const [remoteIP,setRemoteIP] = useState("");
  const [deviceConfiguration, setDeviceConfiguration] = useState<DeviceConfiguration|undefined>(undefined);

  const loadSettings = () => {
    const settingsAsJSON = localStorage.getItem("settings");
    if (settingsAsJSON) {
      let settings = JSON.parse(settingsAsJSON);
      let deviceConfig:DeviceConfiguration = {
        SelectSourceByIndex: settings.selectedIndex,
        ShowRemoteScanUI: settings.showUI,
        IfShowUI: settings.showUI,
        PixelType: settings.pixelType,
        Resolution: settings.resolution,
      }
      setDeviceConfiguration(deviceConfig);
    }
    
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
      setDownload(false);
    }
    setTimeout(reset,1000);
  }

  const showShareActionSheet = () => {
    const downloadAll = () => {
      setDownload(true);
      resetScanStateDelayed();
    }
    present({
      buttons: [{ text: 'Download as PDF',handler:downloadAll }, { text: 'Cancel' }],
      header: 'Select an action'
    })
  }

  return (
   <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Document Scanner</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={showShareActionSheet} color="secondary">
              <IonIcon slot="icon-only"  icon={shareOutline} />
            </IonButton>
            <IonButton onClick={goToSettings} color="secondary">
              <IonIcon slot="icon-only"  icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent style={{ height: "100%" }}>
        <Scanner scan={scan} 
         remoteScan={remoteScan} 
         download={download}
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