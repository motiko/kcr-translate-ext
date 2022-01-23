/// <reference types="Cypress" />

context("Navigation", () => {
  beforeEach(() => {
    cy.visit("https://read.amazon.com/");
    cy.get(".navbar-nav").contains("Commands").click();
    cy.get(".dropdown-menu").contains("Navigation").click();
  });

  it("cy.visit() - visit a remote url", () => {});
});
