import { ITranslateEngine } from "../../chrome/const";

export interface ISettingsPuppeteer {
  ocrLangs?: string;
  translationEnabled?: boolean;
  selectedEngine?: Partial<ITranslateEngine>;
}
