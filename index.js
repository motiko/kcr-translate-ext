inject(main);

function inject(fn) {
  var script = document.createElement("script");
  script.setAttribute("type", "application/javascript");
  script.textContent = "(" + fn + ")();";
  document.body.appendChild(script); // run the script
  document.body.removeChild(script); // clean up
}

function main() {
  const getWindowWithKindleReader = () => {
    if (typeof window.KindleReaderContextMenu !== "undefined") {
      return window;
    } else if (window.length) {
      for (var i = 0; i < window.length; i++) {
        if (typeof window[i].KindleReaderContextMenu !== "undefined") {
          return window[i];
        }
      }
    }
  };

  const windowWithKindleReader = getWindowWithKindleReader();
  if (!windowWithKindleReader) {
    console.log('Kindle Readed Widnow not found: trying again in 1 second..')
    setTimeout(main, 1000);
    return;
  }

  const { document: kDoc, KindleReaderContextMenu } = windowWithKindleReader;

  if (!KindleReaderContextMenu.MKTranslate) {
    KindleReaderContextMenu.MKTranslate = true;
    KindleReaderContextMenu.show = function() {
      var iframeWithText = null;
      var selectedText = null;

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
            iframeWithText = textIFrameDoc;
            return false;
          }
        });

        if (iframeWithText) {
          selectedText = iframeWithText.createRange();
          selectedText.setStartBefore($("#" + sId, iframeWithText).get(0));
          selectedText.setEndAfter($("#" + eId, iframeWithText).get(0));
          window.open(
            "https://translate.google.com/?hl=en#auto/en/" + selectedText,
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
}
