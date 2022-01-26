import { skipOn } from "@cypress/skip-test";
import { kindleContentScriptMountId } from "../../chrome/const";

const getIframeDocument = (iframeSelector) => {
  return (
    cy
      .get(iframeSelector)
      // Cypress yields jQuery element, which has the real
      // DOM element under property "0".
      // From the real DOM iframe element we can get
      // the "document" element, it is stored in "contentDocument" property
      // Cypress "its" command can access deep properties using dot notation
      // https://on.cypress.io/its
      .its("0.contentDocument")
      .should("exist")
  );
};

const getIframeBody = (iframeSelector) => {
  // get the document
  return (
    getIframeDocument(iframeSelector)
      // automatically retries until body is loaded
      .its("body")
      .should("not.be.undefined")
      // wraps "body" DOM element to allow
      // chaining more Cypress commands, like ".find(...)"
      .then(cy.wrap)
  );
};

skipOn(
  Cypress.env("password") === "" || Cypress.env("email") === "" || Cypress.env("bookId") === "",
  () => {
    const reactRoot = "#" + kindleContentScriptMountId;
    describe("check extension in kindle cloud reader", () => {
      before(() => {
        const domain = "read.amazon.com";
        cy.openBook(domain, Cypress.env("email"), Cypress.env("password"), Cypress.env("bookId"));
        cy.wait(5000); // ensure page is loaded
        getIframeBody("#KindleReaderIFrame").find("#kindleReader_content").should("exist");
        // check if extension loaded
        cy.get(reactRoot).should("exist");
        cy.wait(5000); // ensure worker is ready
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
        cy.pause();
      });
    });
  }
);
