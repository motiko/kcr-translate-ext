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
Cypress.Commands.add('openBook', (email: string, password: string, bookId: string) => {
  cy.visit('https://read.amazon.com/');

  cy.get('input[name=email]').type(email, { log: false });
  cy.get('input[name=password]').type(password, { log: false });

  cy.get("input[type=submit]").click();

  cy.get('body').then((body) => {
    if (body.find('input[id=auth-captcha-guess]').length > 0) {
      // captcha :(
      // re-typing password
      cy.get('input[name=password]').type(password, { log: false });
      cy.get("input[id=auth-captcha-guess]").focus().pause();
      // waiting for manual resolution
    }
  });
  cy.wait(2000);
  cy.visit(`https://read.amazon.com/?asin=${bookId}`);
  // https://read.amazon.com/kindle-library?returnFromLogin=1&
})
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
