import { useEffect, useRef } from "react";
import Dynamsoft from 'mobile-web-capture';
import { WebTwain } from "mobile-web-capture/dist/types/WebTwain";
import { ScanConfiguration } from "mobile-web-capture/dist/types/Addon.Camera";
import { DeviceConfiguration } from "mobile-web-capture/dist/types/WebTwain.Acquire";

interface props {
  license?:string,
  onWebTWAINReady?: (dwt:WebTwain) => void;
  onScannerListLoaded?: (list:string[]) => void;
  onScanned?: (success:boolean) => void;
  width?: string|number;
  height?: string|number;
  deviceConfig?: DeviceConfiguration;
  remoteScan?: boolean;
  remoteIP?: string;
  scan?: boolean;
  download?: boolean;
}

let DWObject:WebTwain | undefined;
let DWObjectRemote:WebTwain | undefined;

const Scanner: React.FC<props> = (props: props) => {
  const containerID = "dwtcontrolContainer";
  
  let container = useRef<HTMLDivElement>(null);
  
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
        UseLocalService: "false",
      };
      Dynamsoft.DWT.CreateDWTObjectEx(
        dwtConfig,
        function (dwt) {
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
          localStorage.removeItem("IP");
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
    let thumbnail = DWObject.Viewer.createThumbnailViewer(thumbnailViewerSettings);
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
    Dynamsoft.DWT.Load();
  }, []);

  useEffect(() => {
    if (props.remoteScan == true) {
      if (DWObjectRemote) {
        let OnAcquireImageSuccess,
        OnAcquireImageFailure = function () {
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
      }
    }
  }, [props.remoteScan]);

  useEffect(() => {
    initializeDWObjectRemote();
  }, [props.remoteIP]);

  useEffect(() => {
    if (props.download == true && DWObject) {
      console.log("download");
      const OnSuccess = () => {
        console.log('successful');
      }

      const OnFailure = () => {
        console.log('error');
      }
      DWObject.IfShowFileDialog = true;
      DWObject.SaveAllAsPDF("Scanned.pdf",OnSuccess,OnFailure);
    }
  }, [props.download]);

  useEffect(() => {
    if (props.scan == true) {
      if (DWObject) {
        let showVideoConfigs:ScanConfiguration = {
          element: undefined,
          scannerViewer:{
            autoDetect:{
              enableAutoDetect: false
            },
            continuousScan:{
              visibility: false,
              enableContinuousScan: false,
            }
          },
          filterViewer: {
            exitDocumentScanAfterSave: true
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

  return (
    <div ref={container} id={containerID}></div>
  );
}
  
export default Scanner;