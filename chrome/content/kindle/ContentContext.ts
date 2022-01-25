import React from "react";
import {
  IKindleCloudReaderListenerProps,
  IKindleCloudReaderListenerState,
} from "./KCRListener/types";

interface IContentContext extends IKindleCloudReaderListenerProps, IKindleCloudReaderListenerState {
  onTranslationFinish: (text: string) => void;
}

export const ContentContext = React.createContext<IContentContext>({} as IContentContext);
