import { useEffect, useRef } from "react";
import Dynamsoft from 'mobile-web-capture';
import { WebTwain } from "mobile-web-capture/dist/types/WebTwain";
import { ScanConfiguration } from "mobile-web-capture/dist/types/Addon.Camera";
import { DeviceConfiguration } from "mobile-web-capture/dist/types/WebTwain.Acquire";
import { EditorSettings, ThumbnailViewer } from "mobile-web-capture/dist/types/WebTwain.Viewer";
import { isPlatform } from "@ionic/react";

interface props {
  license?:string;
  onWebTWAINReady?: (dwt:WebTwain) => void;
  onScannerListLoaded?: (list:string[]) => void;
  onScanned?: (success:boolean) => void;
  onCameraClosed?: (success:boolean) => void;
  onRemoteServiceConnected?: (success:boolean) => void;
  width?: string|number;
  height?: string|number;
  deviceConfig?: DeviceConfiguration;
  remoteScan?: boolean;
  remoteIP?: string;
  scan?: boolean;
  showEditor?: boolean;
  showCheckbox?: boolean;
}

let DWObject:WebTwain | undefined;
let DWObjectRemote:WebTwain | undefined;
let thumbnail:ThumbnailViewer | undefined;

const Scanner: React.FC<props> = (props: props) => {
  const containerID = "dwtcontrolContainer";
  
  const container = useRef<HTMLDivElement>(null);
  
  const initializeDWObjectRemote = () => {
    Dynamsoft.DWT.DeleteDWTObject("remoteScan");
    DWObjectRemote = undefined;
    if (props.remoteIP == "") {
      return;
    }
    if (props.remoteIP) {
      console.log("initializing");
      var dwtConfig = {
        WebTwainId: "remoteScan",
        Host: props.remoteIP,
        Port: "18622",
        PortSSL: "18623",
        UseLocalService: "true",
      };
      Dynamsoft.DWT.CreateDWTObjectEx(
        dwtConfig,
        function (dwt) {
          if (props.onRemoteServiceConnected) {
            props.onRemoteServiceConnected(true);
          }
          DWObjectRemote = dwt;
          bindDWObjects();
          console.log("service connected!");
          // List the available scanners
          DWObjectRemote.GetSourceNamesAsync(false).then(
            function (devices) {
              let scanners:string[] = [];
              for (let i = 0; i < devices.length; i++) {
                  scanners.push(devices[i].toString());
              }
              if (props.onScannerListLoaded){
                props.onScannerListLoaded(scanners);
              }
            },
            function (error){
              console.log(error);
            }
          );
        },
        function (error) {
          console.log(error);
          if (props.onRemoteServiceConnected) {
            props.onRemoteServiceConnected(false);
          }
        }
      );
    }
  }

  const bindDWObjects = () => {
    if (DWObjectRemote && DWObject) {
      DWObjectRemote.RegisterEvent("OnPostTransferAsync", function (outputInfo) {
        DWObjectRemote!.ConvertToBlob(
          [DWObjectRemote!.ImageIDToIndex(outputInfo.imageId)],
          Dynamsoft.DWT.EnumDWT_ImageType.IT_PNG,
          function (result, indices, type) {
            DWObject!.LoadImageFromBinary(
              result,
              function () {
                console.log("LoadImageFromBinary success");
                DWObjectRemote!.RemoveImage(
                  DWObjectRemote!.ImageIDToIndex(outputInfo.imageId)
                );
              },
              function (errorCode, errorString) {
                console.log(errorString);
              }
            );
          },
          function (errorCode, errorString) {
            console.log(errorString);
          }
        );
      });
    }
  }

  const OnWebTWAINReady = () => {
    DWObject = Dynamsoft.DWT.GetWebTwain(containerID);
    if (props.onWebTWAINReady) {
      props.onWebTWAINReady(DWObject);
    }
    if (container.current) {
      if (props.height) {
        DWObject.Viewer.height = props.height;
        container.current.style.height = props.height as string;
      }
      if (props.width) {
        DWObject.Viewer.width = props.width;
        container.current.style.width = props.width as string;
      }
    }

    let thumbnailViewerSettings = {
        location: 'left',
        size: '100%',
        columns: 2,
        rows: 3,
        scrollDirection: 'vertical', // 'horizontal'
        pageMargin: 10,
        background: "rgb(255, 255, 255)",
        border: '',
        allowKeyboardControl: true,
        allowPageDragging: true,
        allowResizing: false,
        showPageNumber: true,
        pageBackground: "transparent",
        pageBorder: "1px solid rgb(238, 238, 238)",
        hoverBackground: "rgb(239, 246, 253)",
        hoverPageBorder: "1px solid rgb(238, 238, 238)",
        placeholderBackground: "rgb(251, 236, 136)",
        selectedPageBorder: "1px solid rgb(125,162,206)",
        selectedPageBackground: "rgb(199, 222, 252)"
    };
    thumbnail = DWObject.Viewer.createThumbnailViewer(thumbnailViewerSettings);
    thumbnail.show();
  }

  useEffect(() => {
    console.log("on mount");
    Dynamsoft.DWT.RegisterEvent('OnWebTwainReady', () => {
      OnWebTWAINReady();
    });
    if (props.license) {
      Dynamsoft.DWT.ProductKey = props.license;
    }
    Dynamsoft.DWT.UseLocalService = false;
    Dynamsoft.DWT.Containers = [{
        WebTwainId: 'dwtObject',
        ContainerId: containerID,
        Width: '300px',
        Height: '400px'
    }];
    
    const checkResourcesExists = () => {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', 'Resources/src/dynamsoft.viewer.css',false)
      xhr.send();
      if (xhr.responseText.indexOf("dvs-ui") != -1) {
        return true;
      }else{
        return false;
      }
    }
    
    const RemoteResourcesPath = "https://unpkg.com/dwt@17.2.5/dist";
    if (isPlatform("ios") == true) {
      Dynamsoft.DWT.ResourcesPath = RemoteResourcesPath;
    }else{
      if (checkResourcesExists() == false) {
        Dynamsoft.DWT.ResourcesPath = RemoteResourcesPath;
      }
    }
    Dynamsoft.DWT.Load();
  }, []);

  useEffect(() => {
    if (props.remoteScan == true) {
      if (DWObjectRemote) {
        const OnAcquireImageSuccess = function () {
          if (props.onScanned) {
            props.onScanned(true);
          }
          DWObjectRemote!.CloseSource();
        };
        const OnAcquireImageFailure = function () {
          if (props.onScanned) {
            props.onScanned(false);
          }
          DWObjectRemote!.CloseSource();
        };
        let deviceConfiguration:DeviceConfiguration;
        if (props.deviceConfig) {
          deviceConfiguration = props.deviceConfig;
        }else{
          deviceConfiguration = {
            SelectSourceByIndex: 0,
            IfShowUI: false,
            PixelType: Dynamsoft.DWT.EnumDWT_PixelType.TWPT_RGB,
            Resolution: 300,
            IfFeederEnabled: false,
            IfDuplexEnabled: false,
            IfDisableSourceAfterAcquire: true,
            RemoteScan: true,
            ShowRemoteScanUI: false,
          };
        }

        DWObjectRemote.AcquireImage(
          deviceConfiguration,
          OnAcquireImageSuccess,
          OnAcquireImageFailure
        );
      } else {
        if (props.onScanned) {
          props.onScanned(false);
        }
      }
    }
  }, [props.remoteScan]);

  useEffect(() => {
    initializeDWObjectRemote();
  }, [props.remoteIP]);

  useEffect(() => {
    if (props.scan == true) {
      if (DWObject) {
        let cameraContainer = document.createElement("div");
        cameraContainer.className = "fullscreen";
        document.body.appendChild(cameraContainer);

        const funcConfirmExit = (bExistImage:boolean):boolean => {
          if (props.onCameraClosed) {
            props.onCameraClosed(true);
          }
          cameraContainer.remove();
          return true;
        }
        let showVideoConfigs:ScanConfiguration = {
          element: cameraContainer,
          scannerViewer:{
            autoDetect:{
              enableAutoDetect: false
            },
            funcConfirmExit: funcConfirmExit,
            continuousScan:{
              visibility: false,
              enableContinuousScan: false,
            }
          },
          filterViewer: {
            exitDocumentScanAfterSave: false
          }
        };

        DWObject.Addon.Camera.scanDocument(showVideoConfigs).then(
          function(){
            console.log("OK");
          }, 
          function(error){
            console.log(error.message);
          });
      }
    }
  }, [props.scan]);

  useEffect(() => {
    if (props.showEditor == true) {
      if (DWObject) {

        let settings:EditorSettings = {};

        let editorContainer = document.createElement("div");
        editorContainer.className = "fullscreen";
        document.body.appendChild(editorContainer);
        settings.element = editorContainer as HTMLDivElement;
        settings.width = "100%";
        settings.height = "100%";

        let imageEditor = DWObject.Viewer.createImageEditor(settings);
        imageEditor.show();

        const onImageEditorUIClosed = () => {
          editorContainer.remove();
        };
        DWObject.RegisterEvent('CloseImageEditorUI', onImageEditorUIClosed);
      }
    }
  }, [props.showEditor]);

  useEffect(() => {
    if (thumbnail && props.showCheckbox != undefined) {
      thumbnail.showCheckbox = props.showCheckbox;
    }
  }, [props.showCheckbox]);

  return (
    <div ref={container} id={containerID}></div>
  );
}
  
export default Scanner;