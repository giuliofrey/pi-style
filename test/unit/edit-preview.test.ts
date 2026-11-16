import { initTheme } from "@earendil-works/pi-coding-agent";
import { afterEach, expect, it, vi } from "vitest";
import { editTool } from "../../extension-src/pi-style/features/tools/boxed/edit.js";
import {
	clearEditPreview,
	getEditPreview,
	setEditPreview,
} from "../../extension-src/pi-style/features/tools/boxed/edit-preview.js";
import type { BoxedToolContext } from "../../extension-src/pi-style/features/tools/boxed/shared.js";
import { stripAnsi, visibleWidth } from "../../extension-src/pi-style/shared/ansi.js";
import { createFakeTheme } from "../helpers/fake-theme.js";

afterEach(() => clearEditPreview());

it("invalidates only the owning tool and releases callbacks on completion/reset", () => {
	const first = vi.fn();
	const second = vi.fn();
	expect(getEditPreview("first", first)).toBeUndefined();
	setEditPreview("first", { path: "main.tex", diff: "-old\n+new" });
	expect(first).toHaveBeenCalledTimes(1);
	expect(getEditPreview("first", first)?.diff).toBe("-old\n+new");
	getEditPreview("second", second);
	clearEditPreview("first");
	expect(getEditPreview("first", first)).toBeUndefined();
	clearEditPreview("first");
	setEditPreview("first", { path: "main.tex", diff: "replacement" });
	expect(first).toHaveBeenCalledTimes(1);
	setEditPreview("second", { path: "other.tex", diff: "another" });
	expect(second).toHaveBeenCalledTimes(1);
	clearEditPreview();
	setEditPreview("second", { path: "other.tex", diff: "late" });
	expect(second).toHaveBeenCalledTimes(1);
});

it("escapes terminal controls but preserves newlines and tabs", () => {
	setEditPreview("unsafe", { path: "main.tex", diff: "-old\n+\t\x1b[2Jnew\u009b" });
	expect(getEditPreview("unsafe", () => {})?.diff).toBe("-old\n+\t\\u001b[2Jnew\\u009b");
});

it("renders a proposed diff inside the pending Edit card and hides it after completion", () => {
	initTheme("dark", false);
	const theme = createFakeTheme();
	const context: BoxedToolContext = {
		args: { path: "fixture.txt" },
		toolCallId: "preview",
		invalidate: vi.fn(),
		state: {},
		cwd: "/fake",
		executionStarted: true,
		argsComplete: true,
		isPartial: true,
		expanded: false,
		showImages: false,
		isError: false,
		lastComponent: undefined,
	};
	setEditPreview("preview", { path: "fixture.txt", diff: "-1 old-value\n+1 new-value" });
	const call = editTool.call(context.args, theme, context);
	const text = call.render(80).map(stripAnsi).join("\n");
	expect(text).toContain("Proposed edit");
	expect(text).toContain("old-value");
	expect(text).toContain("new-value");
	for (const width of [0, 1, 20, 40, 80, 160]) {
		for (const line of call.render(width)) expect(visibleWidth(line)).toBeLessThanOrEqual(Math.max(12, width));
	}
	for (const phase of [{ isPartial: false }, { isError: true }, { argsComplete: false }, { executionStarted: false }]) {
		const settled = editTool.call(context.args, theme, { ...context, ...phase });
		expect(settled.render(80).map(stripAnsi).join("\n")).not.toContain("new-value");
	}
});
