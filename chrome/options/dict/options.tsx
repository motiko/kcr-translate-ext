import { Engines, IEngineOptionsProps } from '../../const'
import React, { ChangeEventHandler } from 'react'

export const DictCCEngineOptions = ({ selectedEngine, onEngineUpdate }: IEngineOptionsProps) => {
  const { url: selectedEngineUrl, name } = selectedEngine;
  if (name !== Engines.DICT_CC) {
    return null;
  }
  const onDictChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const dictName = event.target.value;
    const newUrl = `http://${dictName}.pocket.dict.cc/?s=`;
    onEngineUpdate({
      ...selectedEngine,
      url: newUrl,
    })
  }
  const match = selectedEngineUrl.match(/:\/\/([a-zA-z-]+)\.pocket/);
  return (
    <div id="dictcc_lang_controls">
      <label htmlFor="dict_cc_dictionaries">Dictionary</label>
      <select id="dict_cc_dictionaries" value={match?.[1]} onChange={onDictChange}>
        <option value="deen">DE &lt;&gt; EN</option>
        <option value="de-en">DE –&gt; EN</option>
        <option value="en-de">EN –&gt; DE</option>
        <option value="deen">-----</option>
        <option value="deen">DE &lt;&gt; EN</option>
        <option value="deen">-----</option>
        <option value="debg">DE &lt;&gt; BG</option>
        <option value="debs">DE &lt;&gt; BS</option>
        <option value="decs">DE &lt;&gt; CS</option>
        <option value="deda">DE &lt;&gt; DA</option>
        <option value="deel">DE &lt;&gt; EL</option>
        <option value="deeo">DE &lt;&gt; EO</option>
        <option value="dees">DE &lt;&gt; ES</option>
        <option value="defi">DE &lt;&gt; FI</option>
        <option value="defr">DE &lt;&gt; FR</option>
        <option value="dehr">DE &lt;&gt; HR</option>
        <option value="dehu">DE &lt;&gt; HU</option>
        <option value="deis">DE &lt;&gt; IS</option>
        <option value="deit">DE &lt;&gt; IT</option>
        <option value="dela">DE &lt;&gt; LA</option>
        <option value="denl">DE &lt;&gt; NL</option>
        <option value="deno">DE &lt;&gt; NO</option>
        <option value="depl">DE &lt;&gt; PL</option>
        <option value="dept">DE &lt;&gt; PT</option>
        <option value="dero">DE &lt;&gt; RO</option>
        <option value="deru">DE &lt;&gt; RU</option>
        <option value="desk">DE &lt;&gt; SK</option>
        <option value="desq">DE &lt;&gt; SQ</option>
        <option value="desr">DE &lt;&gt; SR</option>
        <option value="desv">DE &lt;&gt; SV</option>
        <option value="detr">DE &lt;&gt; TR</option>
        <option value="deen">-----</option>
        <option value="enbg">EN &lt;&gt; BG</option>
        <option value="enbs">EN &lt;&gt; BS</option>
        <option value="encs">EN &lt;&gt; CS</option>
        <option value="enda">EN &lt;&gt; DA</option>
        <option value="enel">EN &lt;&gt; EL</option>
        <option value="eneo">EN &lt;&gt; EO</option>
        <option value="enes">EN &lt;&gt; ES</option>
        <option value="enfi">EN &lt;&gt; FI</option>
        <option value="enfr">EN &lt;&gt; FR</option>
        <option value="enhr">EN &lt;&gt; HR</option>
        <option value="enhu">EN &lt;&gt; HU</option>
        <option value="enis">EN &lt;&gt; IS</option>
        <option value="enit">EN &lt;&gt; IT</option>
        <option value="enla">EN &lt;&gt; LA</option>
        <option value="ennl">EN &lt;&gt; NL</option>
        <option value="enno">EN &lt;&gt; NO</option>
        <option value="enpl">EN &lt;&gt; PL</option>
        <option value="enpt">EN &lt;&gt; PT</option>
        <option value="enro">EN &lt;&gt; RO</option>
        <option value="enru">EN &lt;&gt; RU</option>
        <option value="ensk">EN &lt;&gt; SK</option>
        <option value="ensq">EN &lt;&gt; SQ</option>
        <option value="ensr">EN &lt;&gt; SR</option>
        <option value="ensv">EN &lt;&gt; SV</option>
        <option value="entr">EN &lt;&gt; TR</option>
      </select>
    </div>
  )
}
