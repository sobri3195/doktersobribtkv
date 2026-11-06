import { test, expect } from "@playwright/test";
async function onboard(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByLabel("Nama panggilan").fill("Ayu");
  await page.getByRole("button", { name: "Mulai perjalanan belajar" }).click();
}
test("mobile study, bookmarks, persistence, statistics and routes", async ({
  page,
}) => {
  await onboard(page);
  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(nav.getByRole("link")).toHaveCount(5);
  await nav.getByRole("link", { name: "Materi" }).click();
  await page
    .getByRole("button", { name: "Penalaran Verbal", exact: true })
    .click();
  await expect(page.getByText("50 soal tersedia")).toBeVisible();
  await page.getByRole("button", { name: "Latihan 10 soal" }).click();
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  await page.locator(".option").first().click();
  await expect(page.getByText("Prinsip pembelajaran")).toBeVisible();
  await page.getByRole("button", { name: "Simpan bookmark" }).click();
  await page.reload();
  await expect(page.getByText("Prinsip pembelajaran")).toBeVisible();
  await page.getByRole("button", { name: "Selesaikan sesi" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(
    page.getByRole("heading", { name: /\/ 10 benar/ }),
  ).toBeVisible();
  await nav.getByRole("link", { name: "Statistik" }).click();
  await expect(page.getByText("Akurasi per bidang")).toBeVisible();
  for (const path of ["/materi", "/tryout", "/statistik", "/profil"]) {
    await page.goto(path);
    await page.reload();
    await expect(page.locator("h1")).toBeVisible();
  }
  await page.getByLabel("Program belajar").selectOption("simak");
  await page.goto("/materi");
  await expect(page.getByText("50 soal tersedia")).toBeVisible();
  await page.getByLabel("Program belajar").selectOption("lpdp");
  await page.goto("/profil");
  await expect(
    page.getByText("1 bookmark · 1 sesi selesai · 0 soal lokal"),
  ).toBeVisible();
});
test("exam hides explanations, restores attempt, then separates SIMAK scores", async ({
  page,
}) => {
  await onboard(page);
  await page.getByLabel("Program belajar").selectOption("simak");
  await page.goto("/tryout");
  await expect(
    page.getByRole("button", { name: "Mulai simulasi lengkap" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Mulai tryout", exact: true }).click();
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama" }),
  ).toHaveCount(0);
  await page.locator(".option").first().click();
  await expect(page.getByText("Prinsip pembelajaran")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("input[type=radio]:checked")).toHaveCount(1);
  await expect(page.locator(".timer")).toBeVisible();
  await page.getByRole("button", { name: "Selesaikan sesi" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByText("PEKA:", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Prinsip pembelajaran")).toBeVisible();
});
test("PWA precaches routes for offline cold start", async ({
  page,
  context,
}) => {
  await onboard(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.goto("/materi");
  await expect(
    page.getByRole("heading", { name: "Ruang materi" }),
  ).toBeVisible();
  await expect(page.getByText("150 soal tersedia")).toBeVisible();
  await page.getByLabel("Program belajar").selectOption("btkv");
  await expect(page.getByText("150 soal tersedia")).toBeVisible();
  await page.getByRole("button", { name: "Latihan 10 soal" }).click();
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("heading", { name: "Clinical pearl" }),
  ).toBeVisible();
});
test("BTKV cases branch back on unsafe decision", async ({ page }) => {
  await onboard(page);
  await page.goto("/kasus");
  await page.getByRole("button", { name: "Mulai kasus" }).first().click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Tunda semua tindakan sampai CT elektif tersedia",
    })
    .click();
  await expect(page.getByRole("status")).toContainText("menunda");
  await page
    .getByRole("button", {
      name: "Evaluasi klinis segera sambil memanggil tim trauma",
    })
    .click();
  await page
    .getByRole("button", { name: "Pneumotoraks tensi", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Penanganan emergensi oleh tim terlatih sesuai protokol setempat",
    })
    .click();
  await expect(page.getByText("Hasil", { exact: true })).toBeVisible();
});
test("backup restore preview and local question management", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/profil");
  const backup = await page.evaluate(() => localStorage.getItem("nexam:data")!);
  await page.getByRole("button", { name: "Ekspor data belajar" }).click();
  await page.getByLabel("Pilih cadangan JSON").setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(page.getByText(/Pratinjau: profil Ayu/)).toBeVisible();
  await page.getByRole("button", { name: "Konfirmasi pulihkan" }).click();
  await page.getByRole("link", { name: "Kelola Soal", exact: true }).click();
  await page
    .getByRole("button", { name: "Buka format dari soal yang ada" })
    .click();
  const editor = page.getByRole("textbox", { name: "JSON soal" });
  const original = JSON.parse(await editor.inputValue());
  original.id = "LOCAL-INTEGRATION-TEST";
  original.question =
    "Soal lokal untuk memeriksa alur impor: berapakah dua ditambah dua?";
  original.options = [
    { id: "A", text: "4" },
    { id: "B", text: "3" },
    { id: "C", text: "5" },
    { id: "D", text: "6" },
    { id: "E", text: "7" },
  ];
  original.correctAnswer = "A";
  original.distractorExplanations = {
    B: "Dua ditambah dua bukan tiga.",
    C: "Dua ditambah dua bukan lima.",
    D: "Dua ditambah dua bukan enam.",
    E: "Dua ditambah dua bukan tujuh.",
  };
  await editor.fill(JSON.stringify(original));
  await page.getByRole("button", { name: "Validasi & pratinjau" }).click();
  await expect(page.getByText("Pratinjau 1 soal")).toBeVisible();
  await page.getByRole("button", { name: "Konfirmasi impor" }).click();
  await expect(
    page.getByRole("heading", { name: original.question }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: original.question }),
  ).toBeVisible();
});
test("expired exam automatically submits after refresh", async ({ page }) => {
  await onboard(page);
  await page.goto("/tryout");
  await page.getByRole("button", { name: "Mulai tryout", exact: true }).click();
  await page.evaluate(() => {
    const d = JSON.parse(localStorage.getItem("nexam:data")!);
    d.attempt.deadline = Date.now() - 1000;
    localStorage.setItem("nexam:data", JSON.stringify(d));
  });
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "0 / 10 benar" }),
  ).toBeVisible();
  await expect(page.getByText("0 salah · 10 kosong")).toBeVisible();
});
test("BTKV category study, clinical explanations, persistence and real statistics", async ({
  page,
}) => {
  await onboard(page);
  await page.getByLabel("Program belajar").selectOption("btkv");
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Materi" })
    .click();
  await expect(page.getByText("150 soal tersedia")).toBeVisible();
  for (const label of ["Bedah Toraks", "Bedah Kardiak", "Bedah Vaskular"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.getByText("50 soal tersedia")).toBeVisible();
  }
  await page.getByRole("button", { name: "Latihan 10 soal" }).click();
  await expect(page.getByRole("radio")).toHaveCount(5);
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("heading", { name: "Clinical pearl" }),
  ).toBeVisible();
  await expect(page.getByText(/Status editorial: needs_review/)).toBeVisible();
  await page.getByRole("button", { name: "Simpan bookmark" }).click();
  await page
    .getByLabel("Catatan pribadi")
    .fill("Tinjau kembali mekanisme klinis.");
  await page.reload();
  await expect(page.getByLabel("Catatan pribadi")).toHaveValue(
    "Tinjau kembali mekanisme klinis.",
  );
  await page.getByRole("button", { name: "Selesaikan sesi" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByText(/Skor latihan:/)).toBeVisible();
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Statistik" })
    .click();
  await expect(page.getByText("Akurasi per bidang")).toBeVisible();
});
test("BTKV category tryout uses five options, configurable scoring and no early answer keys", async ({
  page,
}) => {
  await onboard(page);
  await page.getByLabel("Program belajar").selectOption("btkv");
  await page.goto("/tryout");
  await page.getByLabel("Skor benar").fill("2");
  await page.getByLabel("Skor salah").fill("-1");
  await page
    .getByRole("combobox", { name: "Soal", exact: true })
    .selectOption("50");
  await page
    .getByRole("button", { name: "Tryout Bedah Toraks", exact: true })
    .click();
  await expect(page.getByText("thoracic · Soal 1 dari 50")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(5);
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("heading", { name: "Clinical pearl" }),
  ).toHaveCount(0);
  await expect(page.getByText("Referensi dan status verifikasi")).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Selesaikan sesi" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByText(/Benar 2, salah -1, kosong 0/)).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nexam:data")!).history.at(-1),
  );
  expect(saved.durationSeconds).toBeGreaterThanOrEqual(0);
  expect(saved.practiceScore).toBeDefined();
  await expect(
    page.getByRole("heading", { name: "Clinical pearl" }),
  ).toBeVisible();
});
test("LPDP full 2026 simulation locks sections, restores answers and reports actual subtest scores", async ({
  page,
}) => {
  await onboard(page);
  await page.goto("/tryout");
  await expect(
    page.getByRole("heading", {
      name: "Simulasi Tes Bakat Skolastik LPDP 2026",
    }),
  ).toBeVisible();
  await expect(page.getByText(/LPDP_TBS_2026/)).toBeVisible();
  await page.getByRole("button", { name: "Mulai simulasi lengkap" }).click();
  await expect(page.getByText("verbal · Soal 1 dari 23")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(5);
  await page.getByRole("radio").first().check();
  await expect(page.getByText("Langkah penyelesaian")).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("radio", { checked: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Kunci bagian & lanjut" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(page.getByText("quantitative · Soal 1 dari 25")).toBeVisible();
  await expect(page.locator(".timer")).toContainText("39:");
  await page.getByRole("radio").first().check();
  await expect(page.getByText("Langkah penyelesaian")).toHaveCount(0);
  await page.getByRole("button", { name: "Kunci bagian & lanjut" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(
    page.getByText("problem-solving · Soal 1 dari 12"),
  ).toBeVisible();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Selesaikan sesi" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await expect(
    page.getByRole("heading", { name: "Skor per subtes" }),
  ).toBeVisible();
  const d = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nexam:data")!),
  );
  const h = d.history.at(-1);
  expect(h.total).toBe(60);
  expect(h.blank).toBe(57);
  expect(h.practiceScore).toBe(h.correct * 5);
  expect(h.subtests.map((s: { category: string }) => s.category)).toEqual([
    "verbal",
    "quantitative",
    "problem-solving",
  ]);
  expect(
    h.subtests.reduce((n: number, s: { score: number }) => n + s.score, 0),
  ).toBe(h.practiceScore);
  expect(d.attempt.blueprintId).toBe("LPDP_TBS_2026");
  await page
    .getByRole("navigation", { name: "Navigasi utama" })
    .getByRole("link", { name: "Statistik" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Waktu dan kesulitan LPDP" }),
  ).toBeVisible();
  await page.goto("/profil");
  await page.getByRole("button", { name: "Reset kemajuan belajar" }).click();
  await page.getByRole("button", { name: "Ya, hapus" }).click();
  await page.getByLabel("Pilih cadangan JSON").setInputFiles({
    name: "lpdp-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(d)),
  });
  await page.getByRole("button", { name: "Konfirmasi pulihkan" }).click();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("nexam:data")!).history.at(-1)
          .practiceScore,
    ),
  ).toBe(h.practiceScore);
});
test("LPDP shared passages and labelled data tables remain available offline", async ({
  page,
  context,
}) => {
  await onboard(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  await page.goto("/materi");
  await page
    .getByLabel("Cari soal atau topik")
    .fill("alasan utama layanan tatap muka");
  await page
    .getByRole("button", { name: "Latihan 1 soal", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Layanan digital dan akses warga" }),
  ).toBeVisible();
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("heading", { name: "Langkah penyelesaian" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Selesaikan sesi" }).click();
  await page.getByRole("button", { name: "Ya, lanjutkan" }).click();
  await page.goto("/materi");
  await page.getByLabel("Cari soal atau topik").fill("LPDP-QDATA-01");
  await page
    .getByRole("button", { name: "Latihan 1 soal", exact: true })
    .click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Produksi", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Langkah penyelesaian" }),
  ).toHaveCount(0);
  await page.getByRole("radio").first().check();
  await expect(
    page.getByRole("heading", { name: "Hasil akhir & pemeriksaan" }),
  ).toBeVisible();
});
