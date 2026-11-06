import { it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Materials } from "../pages/Materials";
import { defaults } from "../services/model";
import { useStore } from "../stores/useStore";
beforeEach(() => {
  cleanup();
  localStorage.clear();
  useStore.setState({ data: defaults(), error: "" });
});
it("filters questions and persists a bookmark", () => {
  render(
    <MemoryRouter>
      <Materials />
    </MemoryRouter>,
  );
  expect(screen.getByText("30 soal tersedia")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Cari soal atau topik"), {
    target: { value: "kompas" },
  });
  expect(screen.getByText("1 soal tersedia")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Bookmark LPDP/ }));
  expect(useStore.getState().data.bookmarks).toHaveLength(1);
});
