import { skipOn } from '@cypress/skip-test';

const getIframeDocument = (iframeSelector) => {
  return cy
    .get(iframeSelector)
    // Cypress yields jQuery element, which has the real
    // DOM element under property "0".
    // From the real DOM iframe element we can get
    // the "document" element, it is stored in "contentDocument" property
    // Cypress "its" command can access deep properties using dot notation
    // https://on.cypress.io/its
    .its('0.contentDocument').should('exist')
}

const getIframeBody = (iframeSelector) => {
  // get the document
  return getIframeDocument(iframeSelector)
    // automatically retries until body is loaded
    .its('body').should('not.be.undefined')
    // wraps "body" DOM element to allow
    // chaining more Cypress commands, like ".find(...)"
    .then(cy.wrap)
}

skipOn(
  Cypress.env('password') === "" ||
  Cypress.env('email') === "" ||
  Cypress.env('bookId') === "",
  () => {
  describe('check extension in kindle cloud reader',  () => {
    before(() => {
      cy.openBook(Cypress.env('email'), Cypress.env('password'), Cypress.env('bookId'));
    })

    it('Check if the book is open', () => {
      cy.wait(5000); // ensure page is loaded
      getIframeBody('#KindleReaderIFrame')
        .find('#kindleReader_content').should('exist');

      // check if extension loaded
      cy.get('[data-cy=kcr-translate-ext-iframe]').should('exist');

      cy.window().then((win) => {
        cy.stub(win, 'open', url => {
          win.location.href = 'https://the-internet.herokuapp.com/';
        }).as("popup");
      });

      // show progress when selecting text
      getIframeBody('#KindleReaderIFrame')
        .find('#kindleReader_content')
        .find(".kg-client-dictionary[data-index=0]")
        .trigger('mousedown', { which: 1, pageX: 0, pageY: 0 });
      getIframeBody('#KindleReaderIFrame')
        .find('#kindleReader_content')
        .trigger('mousemove', { which: 1, pageX: 100, pageY: 100 })
        .trigger('mouseup');

      cy.wait(5000);
    })
  })
})
