// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
import { getIframeBody } from "../plugins/utils";
import { kindleContentScriptMountId } from "../../chrome/const";

Cypress.Commands.add(
  "openBook",
  (domain: string, email: string, password: string, bookId: string) => {
    cy.visit(`https://${domain}/`);

    cy.get("input[name=email]").type(email, { log: false });
    cy.get("input[name=password]").type(password, { log: false });

    cy.get("input[type=submit]").click();
    cy.wait(2000);
    cy.get("body").then((body) => {
      if (body.find("input[id=auth-captcha-guess]").length > 0) {
        // captcha :(
        // re-typing password
        cy.get("input[name=password]").type(password, { log: false });
        cy.get("input[id=auth-captcha-guess]").focus().pause();
        // waiting for manual resolution
      }
    });
    cy.wait(2000);
    cy.visit(`https://${domain}/?asin=${bookId}`);
    // https://read.amazon.com/kindle-library?returnFromLogin=1&
    cy.wait(5000); // ensure page is loaded
    getIframeBody("#KindleReaderIFrame").find("#kindleReader_content").should("exist");
    // check if extension loaded
    const reactRoot = "#" + kindleContentScriptMountId;
    cy.get(reactRoot).should("exist");
    cy.wait(6000); // ensure worker is ready
  }
);

Cypress.Commands.add("initPuppeteer", () => cy.task("initPuppeteer"));
Cypress.Commands.add("setExtensionSettings", (settings) =>
  cy.task("setExtensionSettings", settings)
);
Cypress.Commands.add("restoreDefaultSettings", () => cy.task("restoreDefaultSettings"));
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
