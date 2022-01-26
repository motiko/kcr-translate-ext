import React from "react";
import ReactDOM from "react-dom";
import KindleContentScript from "./kindle";
import { kindleContentScriptMountId } from "../../const";

// this script is executed in kindle book iframe
const parent = document.defaultView?.parent.document;
let element = parent?.getElementById(kindleContentScriptMountId);
if (!element) {
  element = document.createElement("div");
  element.setAttribute("id", kindleContentScriptMountId);
  parent!.body.appendChild(element);
}
ReactDOM.render(<KindleContentScript />, element);
