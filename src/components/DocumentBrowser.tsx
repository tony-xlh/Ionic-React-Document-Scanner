import { useEffect, useRef } from 'react'
import { DDV, BrowseViewer, UiConfig } from 'dynamsoft-document-viewer';
import "dynamsoft-document-viewer/dist/ddv.css";
import "./DocumentBrowser.css";

export interface DocumentBrowserProps {
  docUid:string;
  show:boolean;
}

const DocumentBrowser: React.FC<DocumentBrowserProps> = (props:DocumentBrowserProps) => {
  const initializing = useRef(false);
  const browseViewer = useRef<BrowseViewer|undefined>();
  useEffect(()=>{
    if (initializing.current == false) {
      initializing.current = true;
      initBrowseViewer();
    }
    browseViewer.current?.show();
    return ()=>{
      if (browseViewer.current) {
        browseViewer.current.hide();
      }
    }
  },[])

  useEffect(() => {
    if (browseViewer.current) {
      if (props.show) {
        browseViewer.current.show();
      }else{
        browseViewer.current.hide();
      }
      window.dispatchEvent(new Event('resize'));
    }
  }, [props.show]);

  const initBrowseViewer = async () => {    
    browseViewer.current = new DDV.BrowseViewer({
      container: "browseViewer"
    });
    browseViewer.current.openDocument(props.docUid);
  }

  return (
    <div id="browseViewer"></div>
  )
};

export default DocumentBrowser;