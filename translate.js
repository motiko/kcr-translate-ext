setTimeout(() => inject(bookmarklet), 5000)
function inject(fn) {
  var script = document.createElement("script");
  script.setAttribute("type", "application/javascript");
  script.textContent = "(" + fn + ")();";
  document.body.appendChild(script); // run the script
  document.body.removeChild(script); // clean up
}

/* based on ACRExtensions via https://github.com/binarycrafts/ACRExtensions */
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
  debugger;
  if (typeof w === "object") {
    kObj = w.KindleReaderContextMenu;
    kDoc = w.document;

    if (typeof kObj.ACRExtensions === "undefined") {
      kObj.ACRExtensions = true;
      var oldMethod = kObj.show;
      kObj.show = function() {
        var res = oldMethod.apply(kObj, arguments);
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
          }
        }

        $("#ACRExtensions_copyB_sep", kDoc).remove();
        $("#ACRExtensions_copyB", kDoc).remove();
        $("#ACRExtensions_copyC", kDoc).remove();
        var styles = $(
          "<style>.spinner, .dictionary.i18n.expanded {display:none !important;} div#kindleReader_menu_contextMenu { max-height: 35px;}</style>"
        );
        var sepEl = $(
          '<div id="ACRExtensions_copyB_sep" class="kindle_menu_separator"></div>'
        );
        var copyB = $(
          '<div id="ACRExtensions_copyB" class="kindle_menu_button button_enabled ui-corner-left">dict.cc</div>'
        );
        var copyC = $(
          '<div id="ACRExtensions_copyC" class="kindle_menu_button button_enabled ui-corner-left">Google</div>'
        );
        $("#kindle_menu_border", kDoc)
          .append(sepEl)
          .append(copyB)
          .append(sepEl)
          .append(copyC)
          .append(styles);
        setTimeout(function() {
          sepEl.show();
          copyB.removeClass("button_hidden");
          copyC.removeClass("button_hidden");
        }, 1);
        $("#ACRExtensions_copyB", kDoc).click(function(evt) {
          if (r) {
            var newW = window.open(
              "http://pocket.dict.cc/?s=" + r,
              "dict.cc",
              "height=400,width=448,location=0,menubar=0,scrollbars=1,toolbar=0"
            );
          }
        });

        $("#ACRExtensions_copyC", kDoc).click(function(evt) {
          if (r) {
            var newW = window.open(
              "https://translate.google.com/?hl=en#auto/en/" + r,
              "Google Translate",
              "height=400,width=776,location=0,menubar=0,scrollbars=1,toolbar=0"
            );
          }
        });

        return res;
      };

      alert("Kindle Translator Extension is now active.");
    } else {
      alert("Kindle Translator Extension is already active.");
    }
  } else {
    alert(
      "Error: Kindle Translator Extension is not active. The Amazon Cloud Reader window could not be found."
    );
  }
}
