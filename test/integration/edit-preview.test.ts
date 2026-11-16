import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { clearEditPreview, getEditPreview } from "../../extension-src/pi-style/features/tools/boxed/edit-preview.js";
import piStyleExtension from "../../extension-src/pi-style/pi/index.js";
import { FakePiHost } from "../helpers/fake-pi-host.js";

afterEach(() => clearEditPreview());

it("prepares a native Edit preview without changing the file, then clears it on completion", async () => {
	const cwd = await mkdtemp(join(tmpdir(), "pi-style-preview-"));
	try {
		await writeFile(join(cwd, "fixture.txt"), "old-value\n");
		const host = new FakePiHost({ cwd });
		host.allTools = [{ name: "edit", sourceInfo: { source: "builtin", path: "builtin:edit" } }];
		piStyleExtension(host.extensionApi);
		await host.emit("tool_execution_start", {
			type: "tool_execution_start",
			toolCallId: "preview",
			toolName: "edit",
			args: { path: "fixture.txt", edits: [{ oldText: "old-value", newText: "new-value" }] },
		});
		expect(await readFile(join(cwd, "fixture.txt"), "utf8")).toBe("old-value\n");
		expect(getEditPreview("preview", () => {})?.diff).toContain("new-value");
		await host.emit("tool_execution_end", {
			type: "tool_execution_end",
			toolCallId: "preview",
			toolName: "edit",
			result: { content: [], details: undefined },
			isError: false,
		});
		expect(getEditPreview("preview", () => {})).toBeUndefined();
	} finally {
		await rm(cwd, { recursive: true, force: true });
	}
});

it.each(["rpc", "json", "print"] as const)("does not prepare previews in %s mode", async (mode) => {
	const host = new FakePiHost({ mode });
	host.allTools = [{ name: "edit", sourceInfo: { source: "builtin", path: "builtin:edit" } }];
	piStyleExtension(host.extensionApi);
	const tools = vi.spyOn(host.extensionApi, "getAllTools");
	await host.emit("tool_execution_start", {
		type: "tool_execution_start",
		toolCallId: "preview",
		toolName: "edit",
		args: { path: "missing.txt", edits: [{ oldText: "old", newText: "new" }] },
	});
	expect(getEditPreview("preview", () => {})).toBeUndefined();
	expect(tools).not.toHaveBeenCalled();
});
