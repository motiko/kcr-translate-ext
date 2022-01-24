import { Commands, IOcrInputData, IOcrOutputData } from "../const";

export interface IExtensionMountedMessage<ResponseType = boolean> {
  command: Commands.EXTENSION_MOUNTED;
}
export interface IExtensionUnmountedMessage<ResponseType = boolean> {
  command: Commands.EXTENSION_UNMOUNTED;
}
export interface ISettingsUpdatedMessage<ResponseType = boolean> {
  command: Commands.SETTINGS_UPDATED;
}
export interface IStartRecognitionMessage<ResponseType = IOcrOutputData> {
  command: Commands.START_RECOGNITION;
  payload: IOcrInputData;
}
export interface ISetProgressMessage<ResponseType = boolean> {
  command: Commands.SET_PROGRESS;
  payload: number;
}
export type Message =
  | IExtensionMountedMessage
  | IExtensionUnmountedMessage
  | ISettingsUpdatedMessage
  | IStartRecognitionMessage
  | ISetProgressMessage;

const getActiveTab = (winId?: number): Promise<chrome.tabs.Tab> => {
  const config = { active: true, currentWindow: true };
  if (winId) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config.windowId = winId;
  }
  return new Promise((resolve) => {
    chrome.tabs.query(config, (tabs) => {
      resolve(tabs[0]);
    });
  });
};

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
  async sendMessageToActiveTab<T>(message: Message) {
    const tab = await getActiveTab();
    return this.sendMessageToTab<T>(tab.id!, message);
  }
}
