setTimeout(() => inject(bookmarklet), 5000);
function inject(fn) {
  var script = document.createElement("script");
  script.setAttribute("type", "application/javascript");
  script.textContent = "(" + fn + ")();";
  document.body.appendChild(script); // run the script
  document.body.removeChild(script); // clean up
}

/* based on https://learnoutlive.com/apps/kindle_hack.js */
function bookmarklet() {
  var w = null;
  var kDoc = null;
  var kObj = null;

  if (typeof window.KindleReaderContextMenu !== "undefined") {
    w = window;
  } else if (window.length) {
    for (var i = 0; i < window.length; i++) {
      if (typeof window[i].KindleReaderContextMenu !== "undefined") {
        w = window[i];
        break;
      }
    }
  }
  if (typeof w === "object") {
    kObj = w.KindleReaderContextMenu;
    kDoc = w.document;

    if (typeof kObj.ACRExtensions === "undefined") {
      kObj.ACRExtensions = true;
      kObj.show = function() {
        var txtDoc = null;
        var r = null;

        if (
          typeof arguments[3] !== "undefined" &&
          typeof arguments[3]["start"] !== "undefined"
        ) {
          var sId = arguments[3]["start"];
          var eId = arguments[3]["end"];

          $("iframe", kDoc).each(function(j, textIframe) {
            var textIFrameDoc = $(textIframe)
              .contents()
              .get(0);
            if ($("#" + sId, textIFrameDoc).get(0)) {
              txtDoc = textIFrameDoc;
              return false;
            }
          });

          if (txtDoc) {
            r = txtDoc.createRange();
            r.setStartBefore($("#" + sId, txtDoc).get(0));
            r.setEndAfter($("#" + eId, txtDoc).get(0));
            var newW = window.open(
              "https://translate.google.com/?hl=en#auto/en/" + r,
              "Google Translate",
              "height=400,width=776,location=0,menubar=0,scrollbars=1,toolbar=0"
            );
          }
        }
      };

      console.log("Kindle Translator Extension is now active.");
    } else {
      console.log("Kindle Translator Extension is already active.");
    }
  } else {
    console.log(
      "Error: Kindle Translator Extension is not active. The Amazon Cloud Reader window could not be found."
    );
  }
}
