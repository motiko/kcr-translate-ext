import { Commands, IOcrInputData, IOcrOutputData, ITranslateEngine } from "../const";

// Messages sent by content scripts reach every extension context, including the offscreen
// document. The service worker re-sends them with a `target`, and each context handles only
// the messages addressed to it.
export type MessageTarget = "offscreen" | "background";

interface IRoutedMessage {
  target?: MessageTarget;
  // tab the message is about, filled in by the service worker
  tabId?: number;
}

export interface IExtensionMountedMessage<ResponseType = boolean> extends IRoutedMessage {
  command: Commands.EXTENSION_MOUNTED;
  ocrLangs?: string;
}
export interface IExtensionUnmountedMessage<ResponseType = boolean> extends IRoutedMessage {
  command: Commands.EXTENSION_UNMOUNTED;
}
export interface ISettingsUpdatedMessage<ResponseType = boolean> extends IRoutedMessage {
  command: Commands.SETTINGS_UPDATED;
}
export interface IStartRecognitionMessage<ResponseType = IOcrOutputData> extends IRoutedMessage {
  command: Commands.START_RECOGNITION;
  payload: IOcrInputData;
  ocrLangs?: string;
}
export interface ISetProgressMessage<ResponseType = boolean> extends IRoutedMessage {
  command: Commands.SET_PROGRESS;
  payload: number;
}
export interface IGetSettingsMessage<ResponseType = ITranslateEngine> extends IRoutedMessage {
  command: Commands.GET_SETTINGS;
}
export type Message =
  | IExtensionMountedMessage
  | IExtensionUnmountedMessage
  | ISettingsUpdatedMessage
  | IStartRecognitionMessage
  | ISetProgressMessage
  | IGetSettingsMessage;

export class Messaging {
  async sendMessageToExtension<T>(message: Message): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (!chrome.runtime.lastError) {
            // if we have any response
            resolve(response);
          } else {
            console.log("sendMessageToExtension error, message was", message);
            // if we don't have any response it's ok, but we should actually handle it,
            // and we are doing this when we are examining chrome.runtime.lastError
            reject(chrome.runtime.lastError);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
  async sendMessageToTab<T>(tabId: number, message: Message): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (!chrome.runtime.lastError) {
            resolve(response);
          } else {
            console.log("sendMessageToTab error, message was", message);
            reject(chrome.runtime.lastError);
          }
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
