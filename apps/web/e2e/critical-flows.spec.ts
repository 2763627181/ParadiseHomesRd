import { expect, test } from "@playwright/test";

test.describe("Flujos críticos", () => {
  test("home carga y muestra el hero", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Encuentra tu lugar en República Dominicana/i }),
    ).toBeVisible();
  });

  test("búsqueda: home → listado", async ({ page }) => {
    await page.goto("/properties");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Debe haber al menos una card de propiedad
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("detalle de propiedad muestra precio, specs y CTA de contacto", async ({ page }) => {
    await page.goto("/properties");
    const firstCard = page.locator("article a").first();
    await firstCard.click();
    await expect(page).toHaveURL(/\/property\//);
    await expect(page.getByRole("button", { name: /Solicitar información/i }).first()).toBeVisible();
    await expect(page.getByText(/PH-/).first()).toBeVisible();
  });

  test("formulario de lead valida el consentimiento", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "El form vive en el drawer móvil");
    await page.goto("/properties");
    await page.locator("article a").first().click();
    await page.getByRole("button", { name: /Solicitar información/i }).first().click();
    await page.getByLabel("Nombre completo").fill("Ana Gómez");
    await page.getByLabel(/Teléfono/i).fill("809-123-4567");
    await page.getByRole("button", { name: /Solicitar información/i }).last().click();
    await expect(page.getByText(/Debes aceptar para continuar/i)).toBeVisible();
  });

  test("favoritos: guardar desde el listado", async ({ page }) => {
    await page.goto("/properties");
    await page.locator('button[aria-label="Guardar en favoritos"]').first().click();
    await page.goto("/favorites");
    await expect(page.getByRole("heading", { name: "Favoritos" })).toBeVisible();
  });

  test("proyecto: detalle con inventario por unidad", async ({ page }) => {
    await page.goto("/projects");
    await page.locator("article a").first().click();
    await expect(page).toHaveURL(/\/project\//);
    await expect(page.getByText(/Inventario por unidad/i)).toBeVisible();
  });
});
