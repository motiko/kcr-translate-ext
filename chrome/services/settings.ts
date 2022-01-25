import { Commands, defaultTranslateEngines, ITranslateEngine } from '../const'

interface IStorageObjects {
  readonly ocrLangs: string;
  readonly translateEngines: ITranslateEngine[];
  readonly translationEnabled: boolean;
}

export type TSettings = IStorageObjects & { selectedEngine: ITranslateEngine };

export class Settings {
  private ocrLangsKey = "ocrLangs";
  private translateEnginesKey = "translateEngines";
  private translationEnabledKey = "translationEnabled";

  static defaults: IStorageObjects = {
    translateEngines: defaultTranslateEngines as ITranslateEngine[],
    ocrLangs: "eng",
    translationEnabled: true,
  };

  async getAllSettings(): Promise<TSettings> {
    const translateEngines = await this.getTranslateEngines();
    const selectedEngine = translateEngines.find((e) => e.selected)!;
    return {
      translateEngines,
      translationEnabled: await this.getTranslationEnabled(),
      ocrLangs: await this.getOcrLangs(),
      selectedEngine,
    };
  }

  setTranslationEnabled(enabled: boolean): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set({ translationEnabled: enabled }, () => {
        chrome.runtime.sendMessage({ command: Commands.SETTINGS_UPDATED });
        resolve();
      });
    });
  }

  getTranslationEnabled(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      chrome.storage.sync.get(
        this.translationEnabledKey,
        ({ translationEnabled = Settings.defaults.translationEnabled }) => {
          resolve(translationEnabled);
        }
      );
    });
  }

  getOcrLangs(): Promise<string> {
    return new Promise<string>((resolve) => {
      chrome.storage.sync.get(
        this.ocrLangsKey,
        ({ ocrLangs = Settings.defaults.ocrLangs }) => {
          resolve(ocrLangs);
        }
      );
    });
  }

  getTranslateEngines(): Promise<ITranslateEngine[]> {
    return new Promise<ITranslateEngine[]>((resolve) => {
      chrome.storage.sync.get(
        this.translateEnginesKey,
        ({ translateEngines }) => {
          const result: ITranslateEngine[] =
            translateEngines || Settings.defaults.translateEngines;
          const curTranslateEnginesNames = result.map((e) => e.name);
          Settings.defaults.translateEngines.forEach((engine) => {
            // check if `result` have all default engines
            if (!curTranslateEnginesNames.includes(engine.name)) {
              result.push(engine);
            }
          });
          resolve(result);
        }
      );
    });
  }

  async updateValues(
    engines: ITranslateEngine[],
    ocrLangs: string
  ): Promise<void> {
    return new Promise<void>((resolve) => {
      chrome.storage.sync.set(
        {
          translateEngines: engines,
          ocrLangs,
        },
        () => {
          chrome.runtime.sendMessage({ command: Commands.SETTINGS_UPDATED });
          resolve();
        }
      );
    });
  }

  async restoreDefaultSettings(): Promise<IStorageObjects> {
    return new Promise<IStorageObjects>((resolve) => {
      chrome.storage.sync.set(Settings.defaults, () => {
        chrome.runtime.sendMessage({ command: Commands.SETTINGS_UPDATED });
        resolve(Settings.defaults);
      });
    });
  }
}
