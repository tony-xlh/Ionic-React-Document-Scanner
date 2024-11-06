import { useEffect, useRef, useState } from 'react'
import { DDV, EditViewer, UiConfig } from 'dynamsoft-document-viewer';
import "dynamsoft-document-viewer/dist/ddv.css";
import "./DocumentEditor.css";

export interface DocumentEditorProps {
  docUid:string;
  show:boolean;
}

const DocumentEditor: React.FC<DocumentEditorProps> = (props:DocumentEditorProps) => {
  const initializing = useRef(false);
  const editViewer = useRef<EditViewer|undefined>();
  useEffect(()=>{
    if (initializing.current == false) {
      initializing.current = true;
      initEditViewer();
    }
    editViewer.current?.show();
    return ()=>{
      if (editViewer.current) {
        editViewer.current.hide();
      }
    }
  },[])

  useEffect(() => {
    if (editViewer.current) {
      if (props.show) {
        editViewer.current.show();
      }else{
        editViewer.current.hide();
      }
      window.dispatchEvent(new Event('resize'));
    }
  }, [props.show]);

  const initEditViewer = async () => {    
    const config = DDV.getDefaultUiConfig("editViewer", {includeAnnotationSet: true}) as UiConfig;
    // Create an edit viewer
    editViewer.current = new DDV.EditViewer({
      container: "editViewer",
      uiConfig: config,
    });
    editViewer.current.openDocument(props.docUid);
  }

  return (
    <div id="editViewer"></div>
  )
};

export default DocumentEditor;