import { useEffect, useRef } from 'react'
import { DDV, PerspectiveViewer, UiConfig } from 'dynamsoft-document-viewer';
import "dynamsoft-document-viewer/dist/ddv.css";
import "./DocumentCropper.css";

export interface DocumentCropperProps {
  docUid:string;
  groupUid:string;
  show:boolean;
  onInitialized?: (perspectiveViewer:PerspectiveViewer) => void;
  onBack?: () => void;
}

const DocumentCropper: React.FC<DocumentCropperProps> = (props:DocumentCropperProps) => {
  const initializing = useRef(false);
  const perspectiveViewer = useRef<PerspectiveViewer|undefined>();
  useEffect(()=>{
    if (initializing.current == false) {
      initializing.current = true;
      initPerspectiveViewer();
    }
    perspectiveViewer.current?.show();
    return ()=>{
      if (perspectiveViewer.current) {
        perspectiveViewer.current.hide();
      }
    }
  },[])

  useEffect(() => {
    if (perspectiveViewer.current) {
      if (props.show) {
        perspectiveViewer.current.show();
      }else{
        perspectiveViewer.current.hide();
      }
      window.dispatchEvent(new Event('resize'));
    }
  }, [props.show]);

  const initPerspectiveViewer = async () => {    
    const uiConfig:UiConfig = {
        type: DDV.Elements.Layout,
        flexDirection: "column",
        children: [
            {
                type: DDV.Elements.Layout,
                className: "ddv-perspective-viewer-header-mobile",
                children: [
                    {
                        type: DDV.Elements.Button,
                        className: "ddv-button-back",
                        events:{
                            click: "back"
                        }
                    },
                    DDV.Elements.Pagination,
                    {   
                        type: DDV.Elements.Button,
                        className: "ddv-button-done",
                        events:{
                            click: "apply"
                        }
                    },
                ],
            },
            DDV.Elements.MainView,
            {
                type: DDV.Elements.Layout,
                className: "ddv-perspective-viewer-footer-mobile",
                children: [
                    DDV.Elements.FullQuad,
                    DDV.Elements.RotateLeft,
                    DDV.Elements.RotateRight,
                    DDV.Elements.DeleteCurrent,
                    DDV.Elements.DeleteAll,
                ],
            },
        ],
    };
    perspectiveViewer.current = new DDV.PerspectiveViewer({
      uiConfig: uiConfig,
      groupUid: props.groupUid,
      container: "perspectiveViewer"
    });
    perspectiveViewer.current.on("back" as any,() => {
      if (props.onBack) {
        props.onBack();
      }
    });
    perspectiveViewer.current.on("apply" as any,() => {
      let quad = perspectiveViewer.current?.getQuadSelection();
      if (quad) {
        perspectiveViewer.current?.applyPerspective(quad);
      }
      if (props.onBack) {
        props.onBack();
      }
    });
    perspectiveViewer.current.openDocument(props.docUid);
    perspectiveViewer.current.show();
    if (props.onInitialized) {
      props.onInitialized(perspectiveViewer.current);
    }
  }

  return (
    <div id="perspectiveViewer"></div>
  )
};

export default DocumentCropper;