import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StarRating from "./StarRating";

describe("<StarRating />", () => {
  it("renders five star buttons", () => {
    render(<StarRating value={null} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it("calls onChange with the clicked star value", async () => {
    const onChange = vi.fn();
    render(<StarRating value={null} onChange={onChange} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Rate 4 out of 5"));

    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("clears the rating when clicking the currently active star", async () => {
    const onChange = vi.fn();
    render(<StarRating value={3} onChange={onChange} />);
    const user = userEvent.setup();

    await user.click(screen.getByLabelText("Rate 3 out of 5"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("does not invoke onChange when readOnly", async () => {
    const onChange = vi.fn();
    render(<StarRating value={2} onChange={onChange} readOnly />);
    const user = userEvent.setup();

    // Disabled buttons reject clicks
    await user.click(screen.getByLabelText("Rate 4 out of 5"));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("disables buttons when readOnly is true", () => {
    render(<StarRating value={2} readOnly />);
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });
});
