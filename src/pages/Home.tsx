import { IonButton, IonButtons, IonContent, IonFab, IonFabButton, IonHeader, IonIcon, IonInput, IonItem, IonItemDivider, IonLabel, IonList, IonModal, IonPage, IonTitle, IonToolbar, isPlatform, useIonActionSheet, useIonModal, useIonToast } from "@ionic/react";
import { cameraOutline, documentOutline,  ellipsisVerticalOutline,  imageOutline,  settingsOutline, shareOutline } from 'ionicons/icons';
import Dynamsoft from 'mobile-web-capture';
import { WebTwain } from "mobile-web-capture/dist/types/WebTwain";
import { DynamsoftEnumsDWT } from 'mobile-web-capture/dist/types/Dynamsoft.Enum';
import { Device, DeviceConfiguration } from "mobile-web-capture/dist/types/WebTwain.Acquire";
import { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router";
import Scanner from "../components/Scanner";
import { ScanSettings } from "./Settings";
import { AndroidPermissions } from '@awesome-cordova-plugins/android-permissions/';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from "@capacitor/core";
import { Toast } from '@capacitor/toast';
import { Base64Result } from "mobile-web-capture/dist/types/WebTwain.IO";
import "../styles/Scanner.css";
import ReactDOM from "react-dom";
import { DocumentConfiguration } from "mobile-web-capture/dist/types/Addon.Camera";

let scanners:Device[] = [];
let currentURL = "";
let DWObject:WebTwain;

const Home: React.FC<RouteComponentProps> = (props:RouteComponentProps) => {
  const [present, dismiss] = useIonActionSheet();
  const [showCheckbox,setShowCheckbox] = useState(false);
  const [license,setLicense] = useState("");
  const [usePublicTrial,setUsePublicTrial] = useState(false);
  const [deviceConfiguration, setDeviceConfiguration] = useState<DeviceConfiguration|undefined>(undefined);

  const loadSettings = () => {
    const settingsAsJSON = localStorage.getItem("scanSettings");
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
        RemoteScan: true
      }
      setDeviceConfiguration(deviceConfig);
    }
    loadScanners(localStorage.getItem("URL"));
  }

  const loadScanners = async (URL:string|null) => {
    if (URL) {
      if (currentURL != URL) {
        scanners = await Dynamsoft.DWT.FindDevicesAsync(URL);
        currentURL = URL;
      }
      
    }
  }

  const remoteScan = () => {
    if (DWObject) {
      if (deviceConfiguration && deviceConfiguration.SelectSourceByIndex != undefined) {
        let scanner = scanners[deviceConfiguration.SelectSourceByIndex];
        if (scanner) {
          scanner.acquireImage(deviceConfiguration,DWObject);
        }else{
          alert("Scanner not available.");  
        }
      }else{
        alert("Not configured.");
      }
    }
  }

  const getScannerNames = () => {
    let scannerNames:string[] = [];
    for (let index = 0; index < scanners.length; index++) {
      const scanner = scanners[index];
      scannerNames.push(scanner.displayName);
    }
    return scannerNames;
  }

  const loadLicense = () => {
    const previousLicense = localStorage.getItem("license");
    if (previousLicense) {
      setLicense(previousLicense);
    }
    return previousLicense;
  }

  const checkAndRequestCameraPermission = async () => {
    let result = await AndroidPermissions.checkPermission(AndroidPermissions.PERMISSION.CAMERA);
    if (result.hasPermission == false) {
      let response = await AndroidPermissions.requestPermission(AndroidPermissions.PERMISSION.CAMERA);
      console.log(response.hasPermission);
    }
  }

  useEffect(() => {
    console.log("on mount");
    if (isPlatform("android")) {
      checkAndRequestCameraPermission();
    }

    const previousLicense = loadLicense();

    if (!previousLicense) {
      const enablePublicTrial = () => {
        setUsePublicTrial(true);
      }
      present({
        buttons: [{ text: 'Set a license', handler: goToSettings }, 
                  { text: 'Use public trial', handler: enablePublicTrial }, ],
        header: 'License not set'
      })
    }
  }, []);

  useEffect(() => {
    const state = props.location.state as { settingsSaved:boolean };
    console.log(state);
    
    if (state && state.settingsSaved == true) {
      console.log(state.settingsSaved);
      loadSettings();
      loadLicense();
    }
  }, [props.location.state]);

  const goToSettings = () => {
    props.history.push("settings",{scanners:getScannerNames()});
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
    const toggleMultipleSelection = () => {
      setShowCheckbox(!showCheckbox);
    }

    const deleteSelected = () => {
      if (DWObject) {
        DWObject.RemoveAllSelectedImages();
      }
    }

    const editSelected = () => {
      if (DWObject) {
        let container = document.createElement("div");
        container.className = "fullscreen";
        document.body.appendChild(container);
        const funcConfirmExitAfterSave = () => {
          container.remove();
        };
        const funcConfirmExit = (bChanged: boolean, previousViewerName: string):Promise<number | DynamsoftEnumsDWT.EnumDWT_ConfirmExitType> =>  {
          container.remove();
          return Promise.resolve(Dynamsoft.DWT.EnumDWT_ConfirmExitType.Exit);
        };
        let config:DocumentConfiguration = {
          documentEditorSettings:{
            element:container,
            funcConfirmExit:funcConfirmExit,
            funcConfirmExitAfterSave:funcConfirmExitAfterSave
          }
        };
        let documentEditor = DWObject.Viewer.createDocumentEditor(config);
        documentEditor.show();
      }
    }

    present({
      buttons: [{ text: 'Toggle multiple selection', handler: toggleMultipleSelection }, 
                { text: 'Delete selected', handler: deleteSelected }, 
                { text: 'Edit selected', handler: editSelected }, 
                { text: 'Cancel' } ],
      header: 'Select an action'
    })
  }

  const loadFile = () => {
    if (DWObject) {
      present({
        buttons: 
        [{ text: 'PDF', handler: () => {
          DWObject.LoadImageEx("", Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF);
        } }, 
        { text: 'Image', handler: () => {
          DWObject.LoadImageEx("", Dynamsoft.DWT.EnumDWT_ImageType.IT_ALL);
        }}, 
        { text: 'Cancel' } ],
        header: 'Select file type'
      })
    }
  }

  const showShareActionSheet = () => {
    const save = () => {
      if (DWObject) {
        if (Capacitor.isNativePlatform()) {
          const OnSuccess = async (result:Base64Result, indices:number[], type:number) => {
            console.log('successful');
            let writingResult = await Filesystem.writeFile({
              path: getFormattedDate()+".pdf",
              data: result.getData(0,result.getLength()),
              directory: Directory.External
            })
            await Toast.show({
              text: "File is written to "+writingResult.uri,
              duration: "long"
            });
          }
    
          const OnFailure = () => {
            console.log('error');
          }
          DWObject.ConvertToBase64(getImageIndices(),Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,OnSuccess,OnFailure)
          
        }else{
          const OnSuccess = () => {
            console.log('successful');
          }
    
          const OnFailure = () => {
            console.log('error');
          }
          DWObject.SaveAllAsPDF("Scanned.pdf",OnSuccess,OnFailure);
        }
      }
    }

    const getFormattedDate = () => {
      let date = new Date();

      let month = date.getMonth() + 1;
      let day = date.getDate();
      let hour = date.getHours();
      let min = date.getMinutes();
      let sec = date.getSeconds();

      let monthStr = (month < 10 ? "0" : "") + month;
      let dayStr = (day < 10 ? "0" : "") + day;
      let hourStr = (hour < 10 ? "0" : "") + hour;
      let minStr = (min < 10 ? "0" : "") + min;
      let secStr = (sec < 10 ? "0" : "") + sec;

      var str = date.getFullYear().toString() + monthStr + dayStr + hourStr + minStr + secStr;

      return str;
  }
    const share = () => {
      console.log("share");
      if (Capacitor.isNativePlatform()) {
        const success = async (result:Base64Result, indices:number[], type:number) => {
          let fileName = getFormattedDate()+".pdf";
          let writingResult = await Filesystem.writeFile({
            path: fileName,
            data: result.getData(0,result.getLength()),
            directory: Directory.Cache
          });
          Share.share({
            title: fileName,
            text: fileName,
            url: writingResult.uri,
          });
        }
        
        const failure = (errorCode:number, errorString:string) => {
          console.log(errorString);
        }

        if (DWObject) {
          DWObject.ConvertToBase64(getImageIndices(),Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,success,failure)
        }
      }else{
        if (window.location.protocol == "http:") {
          alert("Only available to secure context.");
          return;
        }
        const success = async (result:Blob, indices:number[], type:number) => {
          let pdf:File = new File([result],"scanned.pdf");
          const data:ShareData = {files:[pdf]};
          await navigator.share(data);
        }
        
        const failure = (errorCode:number, errorString:string) => {
          console.log(errorString);
        }
        if (DWObject) {
          DWObject.ConvertToBlob(getImageIndices(),Dynamsoft.DWT.EnumDWT_ImageType.IT_PDF,success,failure)
        }
      }
      
    }
    
    present({
      buttons: [{ text: 'Save as PDF', handler:save }, { text: 'Export to PDF and share', handler:share }, { text: 'Cancel' } ],
      header: 'Select an action'
    })
  }
  
  const startCamera = () => {
    if (DWObject) {
      let container = document.createElement("div");
      container.className = "fullscreen";
      document.body.appendChild(container);

      const funcConfirmExit = (bExistImage:boolean):Promise<boolean> => {
        container.remove();
        return Promise.resolve(true);
      }

      const funcConfirmExitAfterSave = () => {
        container.remove();
      };

      let showVideoConfigs:DocumentConfiguration = {
        scannerViewer:{
          element: container,
          continuousScan: false,
          funcConfirmExit: funcConfirmExit,
        },
        documentEditorSettings:{
          element:container,
          funcConfirmExitAfterSave:funcConfirmExitAfterSave
        }
      };
      DWObject.Addon.Camera.scanDocument(showVideoConfigs);
    }
  }

  const renderScanner = () => {
    if (!license && usePublicTrial === false) {
      return (
        <>
          <p>Please set a license. Refresh may be needed to update a license.</p>
        </>
      );
    }else{
      console.log("use license: "+license);
      return (
        <>
          <Scanner 
            width={"100%"} 
            height={"100%"} 
            license={license}
            onWebTWAINReady={(dwt) =>{ DWObject = dwt; loadSettings(); }}
            showCheckbox={showCheckbox}
          />
        </>
      )
    }
    
  }

  return (
   <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle slot="start">Docs Scan</IonTitle>
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
        {renderScanner()}
        <IonFab style={{display:"flex"}} vertical="bottom" horizontal="start" slot="fixed">
          <IonFabButton style={{marginRight:"10px"}} onClick={() => {
            remoteScan();
          }} >
            <IonIcon icon={documentOutline} />
          </IonFabButton>
          <IonFabButton style={{marginRight:"10px"}} onClick={() => {
            startCamera();
          }} >
            <IonIcon icon={cameraOutline} />
          </IonFabButton>
          <IonFabButton onClick={loadFile} >
            <IonIcon icon={imageOutline} />
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