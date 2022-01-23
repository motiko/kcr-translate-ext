import React from "react";
import {
  IKindleCloudReaderListenerProps,
  IKindleCloudReaderListenerState,
} from "./KCRListener/types";

interface IProviderContext
  extends IKindleCloudReaderListenerProps,
    IKindleCloudReaderListenerState {
  onTranslationFinish: (text: string) => void;
}

// todo: find better name @p-mazhnik
export const ProviderContext = React.createContext<IProviderContext>({} as IProviderContext);
