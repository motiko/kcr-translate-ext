import { Engines, IEngineOptionsProps } from '../../const'
import React, { ChangeEventHandler } from 'react'
import { getLanguagesFromGoogleUrl, google_languages, IGoogleLanguage } from './languages'
import { showMessage } from '../utils'

interface IGoogleTranslateLanguageSelectProps {
  value: string,
  type: 'from' | 'to',
  onLanguageChange: (type: string, newLanguageCode: string) => void,
}

const customLanguage: IGoogleLanguage = { language_name: "Custom", language_code: "custom" };

const GoogleTranslateLanguageSelect = ({ value, type, onLanguageChange }: IGoogleTranslateLanguageSelectProps) => {
  const selectId = `translate_${type}`;
  const onChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const languageCode = event.target.value;
    onLanguageChange(type, languageCode)
  }
  return (
    <>
      <label htmlFor={selectId}>Translate {type}</label>
      <select id={selectId} value={value} onChange={onChange}>
        {[...google_languages, customLanguage].map(lang => (
          <option key={lang.language_code} value={lang.language_code} hidden={lang.language_code === customLanguage.language_code}>
            {lang.language_name}
          </option>
        ))}
      </select>
    </>
  )
}

export const GoogleTranslateEngineOptions = ({ selectedEngine, onEngineUpdate }: IEngineOptionsProps) => {
  const { url: selectedEngineUrl, autoread, name } = selectedEngine;
  if (name !== Engines.GOOGLE_TRANSLATE) {
    return null;
  }
  const onAutoreadChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onEngineUpdate({
      ...selectedEngine,
      autoread: e.target.checked,
    })
  }
  const onLanguageChange = (type: string, langCode: string) => {
    const prevUrl = selectedEngineUrl;
    let newUrl: string;
    if (type === 'to') {
      newUrl = prevUrl.replace(/(#\w+\/)\w+\//, `$1${langCode}/`);
    } else {
      newUrl = prevUrl.replace(/\#\w+\//, `#${langCode}/`)
    }
    onEngineUpdate({
      ...selectedEngine,
      url: newUrl,
    })
  }
  let from, to;
  try {
    const languages = getLanguagesFromGoogleUrl(selectedEngineUrl);
    from = languages.from;
    to = languages.to;
  } catch (e) {
    console.log(`Error: ${(e as Error).message}`)
    showMessage('error_message');
    from = to = customLanguage.language_code;
  }
  return (
    <div id="google_lang_controls">
      <GoogleTranslateLanguageSelect type="from" value={from} onLanguageChange={onLanguageChange} />
      <GoogleTranslateLanguageSelect type="to" value={to} onLanguageChange={onLanguageChange} />
      <div>
        <input type="checkbox" id="auto_read" checked={autoread} onChange={onAutoreadChange}/>
        <label htmlFor="auto_read">Autoread</label>
      </div>
    </div>
  )
}

