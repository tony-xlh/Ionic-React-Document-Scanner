import { useEffect, useRef, useState } from 'react'
import { DDV, EditViewer, UiConfig } from 'dynamsoft-document-viewer';
import "dynamsoft-document-viewer/dist/ddv.css";
import "./DocumentEditor.css";

export interface DocumentEditorProps {
  docUid:string;
  groupUid:string;
  show:boolean;
  onBack?: () => void;
  onScanRequired?: () => void;
  onInitialized?: (editViewer:EditViewer) => void;
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
    const config:UiConfig = {
        type: DDV.Elements.Layout,
        flexDirection: "column",
        className: "ddv-edit-viewer-mobile",
        children: [
            {
                type: DDV.Elements.Layout,
                className: "ddv-edit-viewer-header-mobile",
                children: [
                    {
                        // Add a "Back" buttom to header and bind click event to go back to the perspective viewer
                        // The event will be registered later.
                        type: DDV.Elements.Button,
                        className: "ddv-button-back",
                        events:{
                            click: "back"
                        }
                    },
                    DDV.Elements.Pagination,
                    {
                      // Add a "Back" buttom to header and bind click event to go back to the perspective viewer
                      // The event will be registered later.
                      type: DDV.Elements.Button,
                      className: "camera-icon",
                      events:{
                          click: "scan"
                      }
                  },
                ],
            },
            DDV.Elements.MainView,
            {
                type: DDV.Elements.Layout,
                className: "ddv-edit-viewer-footer-mobile",
                children: [
                    DDV.Elements.DisplayMode,
                    DDV.Elements.RotateLeft,
                    DDV.Elements.Crop,
                    DDV.Elements.Filter,
                    DDV.Elements.Undo,
                    DDV.Elements.Delete,
                    DDV.Elements.Load,
                ],
            },
        ],
    };
    // Create an edit viewer
    editViewer.current = new DDV.EditViewer({
      container: "editViewer",
      groupUid: props.groupUid,
      uiConfig: config,
    });
    editViewer.current.on("back" as any,() => {
      if (props.onBack) {
        props.onBack();
      }
    });
    editViewer.current.on("scan" as any,() => {
      if (props.onScanRequired) {
        props.onScanRequired();
      }
    });
    editViewer.current.openDocument(props.docUid);
  }

  return (
    <div id="editViewer"></div>
  )
};

export default DocumentEditor;