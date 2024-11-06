import { useEffect, useRef } from 'react'
import { DDV, BrowseViewer, UiConfig } from 'dynamsoft-document-viewer';
import "dynamsoft-document-viewer/dist/ddv.css";
import "./DocumentBrowser.css";

export interface DocumentBrowserProps {
  docUid:string;
}

const DocumentBrowser: React.FC<DocumentBrowserProps> = (props:DocumentBrowserProps) => {
  const initializing = useRef(false);
  const browseViewer = useRef<BrowseViewer|undefined>();
  useEffect(()=>{
    if (initializing.current == false) {
      initializing.current = true;
      initBrowseViewer();
    }
  },[])

  const initBrowseViewer = async () => {    
    browseViewer.current = new DDV.BrowseViewer({
      container: "container"
    });
    browseViewer.current.openDocument(props.docUid);
  }

  return (
    <div id="container"></div>
  )
};

export default DocumentBrowser;