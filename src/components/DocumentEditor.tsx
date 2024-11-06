import { useEffect, useRef, useState } from 'react'
import { DDV, EditViewer, UiConfig } from 'dynamsoft-document-viewer';
import "dynamsoft-document-viewer/dist/ddv.css";
import "./DocumentEditor.css";

export interface DocumentEditorProps {
  docUid:string;
}

const DocumentEditor: React.FC<DocumentEditorProps> = (props:DocumentEditorProps) => {
  const initializing = useRef(false);
  const editViewer = useRef<EditViewer|undefined>();
  useEffect(()=>{
    if (initializing.current == false) {
      initializing.current = true;
      initEditViewer();
    }
  },[])

  const initEditViewer = async () => {    
    const config = DDV.getDefaultUiConfig("editViewer", {includeAnnotationSet: true}) as UiConfig;
    // Create an edit viewer
    editViewer.current = new DDV.EditViewer({
      container: "container",
      uiConfig: config,
    });
    editViewer.current.openDocument(props.docUid);
  }

  return (
    <div id="container"></div>
  )
};

export default DocumentEditor;