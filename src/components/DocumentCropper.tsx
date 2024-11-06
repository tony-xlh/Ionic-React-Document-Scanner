import { useEffect, useRef } from 'react'
import { DDV, PerspectiveViewer, UiConfig } from 'dynamsoft-document-viewer';
import "dynamsoft-document-viewer/dist/ddv.css";
import "./DocumentCropper.css";

export interface DocumentCropperProps {
  docUid:string;
}

const DocumentCropper: React.FC<DocumentCropperProps> = (props:DocumentCropperProps) => {
  const initializing = useRef(false);
  const perspectiveViewer = useRef<PerspectiveViewer|undefined>();
  useEffect(()=>{
    if (initializing.current == false) {
      initializing.current = true;
      initPerspectiveViewer();
    }
  },[])

  const initPerspectiveViewer = async () => {    
    perspectiveViewer.current = new DDV.PerspectiveViewer({
      container: "container"
    });
    perspectiveViewer.current.openDocument(props.docUid);
  }

  return (
    <div id="container"></div>
  )
};

export default DocumentCropper;