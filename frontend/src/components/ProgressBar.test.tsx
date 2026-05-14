import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "./ProgressBar";

describe("<ProgressBar />", () => {
  it("computes a percentage from current/total", () => {
    render(<ProgressBar current={60} total={300} />);
    expect(screen.getByText(/20%/)).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText(/\/ 300 pages/)).toBeInTheDocument();
  });

  it("clamps values above 100% to 100", () => {
    render(<ProgressBar current={500} total={300} />);
    expect(screen.getByText(/100%/)).toBeInTheDocument();
  });

  it("treats null current as 0", () => {
    render(<ProgressBar current={null} total={100} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it("shows a 'no page count' placeholder when total is null", () => {
    render(<ProgressBar current={20} total={null} />);
    expect(screen.getByText(/No page count yet/i)).toBeInTheDocument();
  });

  it("hides the label in compact mode", () => {
    render(<ProgressBar current={50} total={100} compact />);
    expect(screen.queryByText(/pages/i)).toBeNull();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("treats total = 0 as unknown to avoid divide-by-zero", () => {
    render(<ProgressBar current={5} total={0} />);
    expect(screen.getByText(/No page count yet/i)).toBeInTheDocument();
  });
});
