/// <reference types="cypress" />

// ***********************************************************
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import '@cypress/skip-test/support'
// Import commands.js using ES2015 syntax:
import './commands'

declare namespace Cypress {
  interface Chainable {
    openBook(email: string, password: string, bookId: string): Chainable
  }
}
