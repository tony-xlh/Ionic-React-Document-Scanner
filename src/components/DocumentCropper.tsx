import { useEffect, useRef } from 'react'
import { DDV, PerspectiveViewer, UiConfig } from 'dynamsoft-document-viewer';
import "dynamsoft-document-viewer/dist/ddv.css";
import "./DocumentCropper.css";

export interface DocumentCropperProps {
  docUid:string;
  show:boolean;
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
    perspectiveViewer.current = new DDV.PerspectiveViewer({
      container: "perspectiveViewer"
    });
    perspectiveViewer.current.openDocument(props.docUid);
    perspectiveViewer.current.show();
  }

  return (
    <div id="perspectiveViewer"></div>
  )
};

export default DocumentCropper;