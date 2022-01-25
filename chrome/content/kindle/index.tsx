import React from "react";
import ReactDOM from "react-dom";
import KindleContentScript from "./kindle";

const mountId = "kindleContentScript";
const element = document.createElement("div");
element.setAttribute("id", mountId);
document.body.appendChild(element);
ReactDOM.render(<KindleContentScript />, document.getElementById(mountId));
