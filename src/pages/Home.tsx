import {  IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar, useIonActionSheet } from "@ionic/react";
import { cameraOutline, documentOutline,  ellipsisVerticalOutline,  settingsOutline, shareOutline } from 'ionicons/icons';
import Dynamsoft from 'mobile-web-capture';
import { WebTwain } from "mobile-web-capture/dist/types/WebTwain";
import { DeviceConfiguration } from "mobile-web-capture/dist/types/WebTwain.Acquire";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import Scanner from "../components/Scanner";
import { ScanSettings } from "./Settings";

let scanners:string[] = [];
let DWObject:WebTwain;

const Home: React.FC<RouteComponentProps> = (props:RouteComponentProps) => {
  const [present, dismiss] = useIonActionSheet();
  const [scan,setScan] = useState(false);
  const [download,setDownload] = useState(false);
  const [remoteScan,setRemoteScan] = useState(false);
  const [remoteIP,setRemoteIP] = useState(""); // leave the value empty
  const [deviceConfiguration, setDeviceConfiguration] = useState<DeviceConfiguration|undefined>(undefined);

  const loadSettings = () => {
    const settingsAsJSON = localStorage.getItem("settings");
    if (settingsAsJSON) {
      let settings:ScanSettings = JSON.parse(settingsAsJSON);
      let deviceConfig:DeviceConfiguration = {
        SelectSourceByIndex: settings.selectedIndex,
        ShowRemoteScanUI: settings.showUI,
        IfShowUI: settings.showUI,
        IfFeederEnabled: settings.autoFeeder,
        IfDuplexEnabled: settings.duplex,
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

  const getImageIndices = () => {
    var indices = [];
    if (DWObject) {
      for (var i=0;i<DWObject.HowManyImagesInBuffer;i++){
        indices.push(i)
      }
    }
    return indices;
  }

  const showImageActionSheet = () => {
    const deleteSelected = () => {
      if (DWObject) {
        DWObject.RemoveAllSelectedImages();
      }
    }

    const editSelected = () => {
      if (DWObject) {
        DWObject.ShowImageEditor();
      }
    }

    present({
      buttons: [{ text: 'Delete selected', handler:deleteSelected }, { text: 'Edit selected', handler:editSelected }, { text: 'Cancel' } ],
      header: 'Select an action'
    })
  }
  const showShareActionSheet = () => {
    const downloadAll = () => {
      setDownload(true);
      resetScanStateDelayed();
    }

    const share = () => {
      console.log("share");
      const success = (result:Blob, indices:number[], type:number) => {
        console.log(result);
        let pdf:File = new File([result],"scanned.pdf");
        const data:ShareData = {files:[pdf]};
        navigator.share(data);
      }
      
      const failure = (errorCode:number, errorString:string) => {
        console.log(errorString);
      }
      if (DWObject) {
        DWObject.ConvertToBlob(getImageIndices(),Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,success,failure)
      }
    }
    
    present({
      buttons: [{ text: 'Download as PDF', handler:downloadAll }, { text: 'Export to PDF and share', handler:share }, { text: 'Cancel' } ],
      header: 'Select an action'
    })
  }

  return (
   <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle slot="start">Document Scanner</IonTitle>
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
         onWebTWAINReady={(dwt) =>{ DWObject = dwt }}
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
        <IonFab style={{display:"flex"}} vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={showImageActionSheet}>
            <IonIcon icon={ellipsisVerticalOutline} />
          </IonFabButton>
        </IonFab>
      </IonContent>
    </IonPage>
  );
  
}

export default Home;