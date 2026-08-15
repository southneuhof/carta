import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp, h, nextTick, ref } from "vue";
import Button from "../Button.vue";
import Dialog from "../Dialog.vue";
import Disclosure from "../Disclosure.vue";
import Menu from "../Menu.vue";
import Popover from "../Popover.vue";
import Tabs from "../../composites/Tabs.vue";

vi.mock("vue-router", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useRoute: () => ({ name: "browser-tabs", query: {} }),
}));

const apps: Array<ReturnType<typeof createApp>> = [];

async function settle() {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
}

function visible(element: Element | null) {
  if (!(element instanceof HTMLElement)) return false;
  let current: HTMLElement | null = element;
  while (current) {
    const style = getComputedStyle(current);
    if (
      current.hidden ||
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    )
      return false;
    current = current.parentElement;
  }
  return true;
}

function mount(
  component: any,
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {},
) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({ render: () => h(component, props, slots) });
  app.mount(host);
  apps.push(app);
  return host;
}

afterEach(() => {
  apps.splice(0).forEach((app) => app.unmount());
  document.body.innerHTML = "";
});

describe("shared primitive browser behavior", () => {
  it("opens the dialog in the body and closes it from the close control", async () => {
    const host = mount(
      Dialog,
      {},
      {
        trigger: () => h("button", { type: "button" }, "Open dialog"),
        title: () => "Dialog title",
        description: () => "Dialog description",
        content: () => h("p", "Dialog content"),
      },
    );

    host.querySelector("button")!.click();
    await settle();

    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(host.contains(dialog)).toBe(false);
    expect(dialog?.textContent).toContain("Dialog title");
    expect(dialog?.textContent).toContain("Dialog content");
    expect(visible(dialog)).toBe(true);

    const close = Array.from(dialog!.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Close"),
    );
    expect(close).not.toBeUndefined();
    close!.click();
    await settle();

    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it("opens the popover in the body and closes it from outside", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const outside = document.createElement("button");
    outside.type = "button";
    outside.textContent = "Outside";
    document.body.append(outside);
    const open = ref(false);
    const app = createApp({
      render: () =>
        h(
          Popover,
          {
            modelValue: open.value,
            "onUpdate:modelValue": (value: boolean) => (open.value = value),
          },
          {
            trigger: () => h("button", { type: "button" }, "Open popover"),
            content: () => h("p", { role: "status" }, "Popover content"),
          },
        ),
    });
    app.mount(host);
    apps.push(app);

    host.querySelector("button")!.click();
    await settle();

    const content = document.body.querySelector('[role="status"]');
    expect(content).not.toBeNull();
    expect(host.contains(content)).toBe(false);
    expect(visible(content)).toBe(true);

    outside.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    outside.click();
    await settle();
    expect(document.body.querySelector('[role="status"]')).toBeNull();
  });

  it("opens the menu and runs its action", async () => {
    const action = vi.fn();
    const host = mount(
      Menu,
      { items: [{ name: "Archive", action }] },
      { trigger: () => h("button", { type: "button" }, "Open menu") },
    );

    host.querySelector("button")!.click();
    await settle();

    const item = document.body.querySelector('[role="menuitem"]');
    expect(item?.textContent).toContain("Archive");
    expect(visible(item)).toBe(true);
    item!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await settle();

    expect(action).toHaveBeenCalledOnce();
  });

  it("keeps disclosure content mounted while toggling its visibility", async () => {
    const host = mount(
      Disclosure,
      { title: "Advanced", description: "More filters" },
      { default: () => h("p", { role: "region" }, "Disclosure content") },
    );
    await settle();
    const trigger = host.querySelector("button")!;
    const content = host.querySelector('[role="region"]');

    expect(content).not.toBeNull();
    expect(visible(content)).toBe(false);

    trigger.click();
    await settle();
    expect(visible(content)).toBe(true);

    trigger.click();
    await settle();
    expect(host.contains(content)).toBe(true);
    expect(visible(content)).toBe(false);
  });

  it("opens and closes the split-button menu through its slot callback", async () => {
    const host = mount(
      Button,
      { kind: "split", type: "button", menuAriaLabel: "More save options" },
      {
        default: () => "Save",
        menu: ({ open, close }: { open: boolean; close: () => void }) =>
          h(
            "button",
            { type: "button", onClick: close },
            open ? "Menu open" : "Menu closed",
          ),
      },
    );
    const trailing = host.querySelectorAll("button")[1];

    expect(trailing.getAttribute("aria-expanded")).toBe("false");
    trailing.click();
    await settle();

    expect(trailing.getAttribute("aria-expanded")).toBe("true");
    const menu = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent === "Menu open",
    );
    expect(menu).not.toBeUndefined();
    expect(host.contains(menu!)).toBe(false);
    expect(visible(menu!)).toBe(true);

    menu!.click();
    await settle();
    expect(trailing.getAttribute("aria-expanded")).toBe("false");
    expect(document.body.contains(menu!)).toBe(false);
  });

  it("selects a tab through its accessible state and bound model", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const model = ref(0);
    const changes: number[] = [];
    const app = createApp({
      render: () =>
        h(Tabs, {
          modelValue: model.value,
          "onUpdate:modelValue": (value: number) => (model.value = value),
          onChange: (value: number) => changes.push(value),
          name: "browser-tabs",
          config: [{ name: "One" }, { name: "Two" }],
          static: true,
          ignoreQuery: true,
          variant: "pill",
        }),
    });
    app.mount(host);
    apps.push(app);
    await settle();

    const tabs = host.querySelectorAll('[role="tab"]');
    expect(tabs).toHaveLength(2);
    (tabs[1] as HTMLElement).click();
    await settle();

    expect(model.value).toBe(1);
    expect(changes).toContain(1);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
  });
});
