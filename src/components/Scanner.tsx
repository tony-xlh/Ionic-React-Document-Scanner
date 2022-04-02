import { useEffect, useRef } from "react";
import Dynamsoft from 'mobile-web-capture';
import { WebTwain } from "mobile-web-capture/dist/types/WebTwain";

interface props {
  license:string,
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

  let container = useRef<HTMLDivElement>(null);

  const CreateDWT = () => {
    return new Promise(function (resolve, reject) {
      let success = function (obj:WebTwain) {
        DWObject = obj;
        if (container.current) {
          DWObject.Viewer.bind(container.current);
          
          if (props.height) {
            DWObject.Viewer.height = props.height;
            container.current.style.height = props.height as string;
          }
          if (props.width) {
            DWObject.Viewer.width = props.width;
            container.current.style.width = props.width as string;
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
          DWObject.Viewer.show();
          resolve(true);
        }
        resolve(false);
      };

      let error = function (err:any) {
        resolve(false);
      };
      Dynamsoft.DWT.UseLocalService = false;
      Dynamsoft.DWT.ProductKey = props.license;
      Dynamsoft.DWT.CreateDWTObjectEx({
          WebTwainId: 'dwtcontrol'
      },
        success,
        error
      );
    })
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
    const init = async () =>{
      await CreateDWT();
      loadScanners();
    }
    init();
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
        let showVideoConfigs = {
          scannerViewer:{
            autoDetect:{
              enableAutoDetect: true
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
    <div ref={container}></div>
  );
}
  
export default Scanner;