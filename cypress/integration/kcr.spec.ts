import { skipOn } from "@cypress/skip-test";
import { getIframeBody } from "../plugins/utils";
import { Engines } from "../../chrome/const";

const { email, password, bookId } = Cypress.env();

skipOn(!password || !email || !bookId, () => {
  describe("check extension in kindle cloud reader", () => {
    before(() => {
      cy.setExtensionSettings({
        translationEnabled: true,
        selectedEngine: { name: Engines.GOOGLE_TRANSLATE_EXT },
      });
      const domain = "read.amazon.com";
      cy.openBook(domain, email, password, bookId);
    });

    it("Check if translation started", () => {
      cy.get("[data-cy=kcrt-progress-container]").should("not.be.visible");
      // show progress when selecting text
      getIframeBody("#KindleReaderIFrame")
        .find("#kindleReader_content")
        .find(".kg-client-dictionary[data-index=0]")
        .trigger("mousedown", { which: 1, pageX: 0, pageY: 0 });
      getIframeBody("#KindleReaderIFrame")
        .find("#kindleReader_content")
        .trigger("mousemove", { which: 1, pageX: 100, pageY: 100 })
        .trigger("mouseup");
      cy.get("[data-cy=kcrt-progress-container]").should("be.visible");
    });
  });
  describe("with disabled translation", () => {
    it("selection shouldn't trigger translation", () => {
      // disable translation
      cy.setExtensionSettings({
        translationEnabled: false,
        selectedEngine: { name: Engines.GOOGLE_TRANSLATE_EXT },
      });
      const domain = "read.amazon.com";
      cy.openBook(domain, email, password, bookId);
      cy.get("[data-cy=kcrt-progress-container]").should("not.exist");
    });
  });
});
