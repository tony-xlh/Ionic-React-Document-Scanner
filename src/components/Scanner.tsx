import { useEffect, useRef } from "react";
import Dynamsoft from 'mobile-web-capture';
import { WebTwain } from "mobile-web-capture/dist/types/WebTwain";
import { ScanConfiguration } from "mobile-web-capture/dist/types/Addon.Camera";

interface props {
  license?:string,
  onScannerListLoaded?: (list:string[]) => void;
  onScanned?: (success:boolean) => void;
  width?: string|number;
  height?: string|number;
  scanOptions?: ScanOptions;
  remoteScan?: boolean;
  scan?: boolean;
}

export interface ScanOptions {
  selectedIndex:number;
}

let DWObject:WebTwain | undefined;

const Scanner: React.FC<props> = (props: props) => {
  const containerID = "dwtcontrolContainer";
  
  let container = useRef<HTMLDivElement>(null);

  const OnWebTWAINReady = () => {
    DWObject = Dynamsoft.DWT.GetWebTwain(containerID);
    loadScanners();
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

  const loadScanners = () => {
    if (props.onScannerListLoaded && DWObject) {
      let scanners = [];
      if (DWObject) {
        let count = DWObject.SourceCount;
        for (let i = 0; i < count; i++) {
            scanners.push(DWObject.GetSourceNameItems(i));
        }
      }
      props.onScannerListLoaded(scanners);
    }
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
      if (DWObject) {
        DWObject.SelectSource(
          function() {
            if (DWObject) {
              DWObject.OpenSource();
              DWObject.AcquireImage();
            }
          },
          function() {
              console.log("SelectSource failed!");
          });
      }
    }
  }, [props.remoteScan]);

  useEffect(() => {
    if (props.scan == true) {
      if (DWObject) {
        let showVideoConfigs:ScanConfiguration = {
          element: undefined,
          scannerViewer:{
            autoDetect:{
              enableAutoDetect: false
            },
            continuousScan:{   //Only applicable to video scanning.
              visibility: true,   //Whether to display the continuous scan icon. The default value is true.
              enableContinuousScan: false,  //Whether to enable continuous scan. The default value is true.
            }
          },
          filterViewer: {
            exitDocumentScanAfterSave: true
          }
            };

        DWObject.Addon.Camera.scanDocument().then(
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