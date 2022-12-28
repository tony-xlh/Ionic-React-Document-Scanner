import { useEffect, useRef } from "react";
import Dynamsoft from 'mobile-web-capture';
import { WebTwain } from "mobile-web-capture/dist/types/WebTwain";
import { ThumbnailViewer } from "mobile-web-capture/dist/types/WebTwain.Viewer";
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
  showCheckbox?: boolean;
}

let DWObject:WebTwain | undefined;
let DWObjectRemote:WebTwain | undefined;
let thumbnail:ThumbnailViewer | undefined;

const Scanner: React.FC<props> = (props: props) => {
  const containerID = "dwtcontrolContainer";
  
  const container = useRef<HTMLDivElement>(null);
  
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
    
    Dynamsoft.DWT.ResourcesPath = "assets/dwt-resources/";
    Dynamsoft.DWT.Load();
  }, []);

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