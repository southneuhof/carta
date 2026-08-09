<script setup lang="ts" generic="TRecord extends object = Record<string, unknown>, TQuery extends object = Record<string, unknown>">
/**
 * Collection surface shell.
 *
 * Owns Card, page title, toolbar, and filter region; `Table` still owns every
 * piece of data state. `table` prop is
 * forwarded with `v-bind` and never translated, so a resource prop factory
 * result binds directly.
 */
import { computed, getCurrentInstance, ref, useSlots, watch } from "vue";
import { toast } from "vue-sonner";
import type {
  FieldsInput,
  QueryValues,
  RecordIdentity,
  TableProps,
  ValidationSchema,
} from "../../contracts";
import type {
  ListCapableResource,
  TableSurfaceArguments,
} from "../../resources/defineResource";
import { resolveFields } from "../../fields";
import { useNamespacedQuery } from "../../query";
import Table from "../core/Table.vue";
import Form from "../core/Form.vue";
import Button from "../base/Button.vue";
import Card from "../base/Card.vue";
import Dialog from "../base/Dialog.vue";
import Icon from "../base/Icon.vue";
import Popover from "../base/Popover.vue";
import SearchBox from "../composites/SearchBox.vue";
import Switch from "../inputs/Switch.vue";
import {
  createWorkbook,
  downloadWorkbook,
  type ListExportOptions,
} from "../../services";
import { useTablePreferences } from "../core/useTablePreferences";

export interface ListFilters<TQuery extends object = Record<string, unknown>> {
  fields: FieldsInput<TQuery, TQuery>;
  schema?: ValidationSchema<TQuery>;
  defaults?: Partial<TQuery>;
  label?: string;
  resetLabel?: string;
}

type ListViewProps = {
  title?: string;
  description?: string;
  /** Controlled user collection state. Search/filter values belong here. */
  query?: QueryValues;
  /** Explicit query fields for live filtering; record fields are never inferred. */
  filters?: ListFilters<TQuery>;
  export?: ListExportOptions<TRecord, TQuery> | false;
} & (
  | {
      resource: ListCapableResource<TRecord, TQuery>;
      table?: never;
      tableOptions?: TableSurfaceArguments<TQuery>;
    }
  | { table: TableProps; resource?: never; tableOptions?: never }
);

const props = defineProps<ListViewProps>();
const emit = defineEmits<{
  (event: "update:query", query: QueryValues): void;
  (event: "export-error", error: unknown): void;
}>();
const slots = useSlots();

type ListViewSurface = {
  table: TableProps;
  createRoute: import("vue-router").RouteLocationRaw | undefined;
  detailRoute:
    | ((record: Record<string, unknown>) => import("vue-router").RouteLocationRaw | undefined)
    | undefined;
  updateRoute:
    | ((record: Record<string, unknown>) => import("vue-router").RouteLocationRaw | undefined)
    | undefined;
  canDelete: ((record: Record<string, unknown>) => boolean) | undefined;
  deleteRecord: ((record: Record<string, unknown>) => Promise<unknown>) | undefined;
};

const surface = computed<ListViewSurface>(() =>
  props.resource
    ? props.resource.table(props.tableOptions) as unknown as ListViewSurface
    : {
        table: props.table!,
        createRoute: undefined,
        detailRoute: undefined,
        updateRoute: undefined,
        canDelete: undefined,
        deleteRecord: undefined,
      },
);

const hasQueryBinding = "query" in (getCurrentInstance()?.vnode.props ?? {});
const queryDefaults = computed<QueryValues>(() => ({
  page: 1,
  limit: 10,
  ...(props.filters?.defaults ?? {}),
}));
const localQuery = ref<QueryValues>({
  ...queryDefaults.value,
  ...(props.query ?? {}),
});
const tableNamespace = computed(() => surface.value.table.namespace);
const queryState = useNamespacedQuery({
  namespace: computed(() => tableNamespace.value ?? "table"),
  defaults: queryDefaults,
  local: hasQueryBinding || !tableNamespace.value ? localQuery : undefined,
});
const queryValues = queryState.values;

watch(
  () => props.query,
  (value) => {
    if (!hasQueryBinding) return;
    localQuery.value = { ...queryDefaults.value, ...(value ?? {}) };
  },
);

function updateQuery(patch: QueryValues) {
  queryState.update(patch);
  emit("update:query", queryValues.value);
}

function updateFilters(next: Record<string, unknown>) {
  updateQuery({ ...next, page: 1 });
}

function resetFilters() {
  const preserved = {
    search: queryValues.value.search,
    limit: queryValues.value.limit,
  };
  queryState.reset();
  queryState.update({ ...preserved, page: 1 });
  emit("update:query", queryValues.value);
}

const passthroughSlots = computed(() =>
  Object.entries(slots).filter(
    ([name]) =>
      ![
        "header",
        "controls",
        "filters",
        "body",
        "footer",
        "row-actions",
      ].includes(name),
  ),
);

const deleting = ref(false);
const exporting = ref(false);
const tableRef = ref<{ refresh: () => Promise<unknown> }>();
const columnFields = computed(() =>
  resolveFields({ fields: surface.value.table.fields, surface: "table" }),
);
const columnKeys = computed(() => columnFields.value.map((field) => field.key));
const columnPreferences = useTablePreferences(
  tableNamespace,
  columnKeys,
  computed(() => surface.value.table.minColumnWidth ?? 96),
);
const columnSizing = ref<Record<string, number>>({
  ...columnPreferences.sizes.value,
});
watch(columnPreferences.sizes, (sizes) => {
  columnSizing.value = { ...sizes };
});

function setVisibleColumns(next: string[]) {
  const normalized = columnKeys.value.filter((key) => next.includes(key));
  const hasActions = Boolean(
    slots["row-actions"] ||
    surface.value.detailRoute ||
    surface.value.updateRoute ||
    surface.value.canDelete,
  );
  if (!hasActions && normalized.length === 0 && columnKeys.value.length) return;
  columnPreferences.setVisible(normalized);
}

function setColumnSizing(next: Record<string, number>) {
  columnSizing.value = { ...next };
  columnPreferences.setSizes(next);
}

function resetColumns() {
  columnPreferences.resetColumns();
  columnSizing.value = {};
}

async function remove(
  record: Record<string, unknown>,
  close: (value: boolean) => void,
) {
  if (deleting.value) return;
  deleting.value = true;
  try {
    await surface.value.deleteRecord?.(record);
    close(false);
    toast.success("Record deleted.");
  } catch {
    toast.error("Could not delete record.");
  } finally {
    deleting.value = false;
  }
}

async function exportRows() {
  if (props.export === false || exporting.value) return;
  exporting.value = true;
  try {
    const { page: _page, limit: _limit, ...activeQuery } = queryValues.value;
    const options = (props.export ?? {}) as ListExportOptions;
    const searchParameters = surface.value.table.searchParameters ?? {};
    let rows: Record<string, unknown>[];
    if (options.load) {
      const result = await options.load({
        query: activeQuery,
        searchParameters,
      });
      rows = Array.isArray(result) ? result : result.data;
    } else if (surface.value.table.data) rows = [...surface.value.table.data];
    else if (surface.value.table.load) {
      const pageSize =
        Number.isInteger(options.pageSize) && options.pageSize! > 0
          ? options.pageSize!
          : 500;
      rows = [];
      let page = 1;
      const seen = new Set<string>();
      while (page <= 10_000) {
        const result = await surface.value.table.load({
          query: { ...activeQuery, page, limit: pageSize },
          searchParameters,
        } as never);
        const batch = result.data ?? [];
        const signature = JSON.stringify(batch.map((row) => row));
        if (seen.has(signature))
          throw new Error("[is-vue-framework] Export loader repeated a page.");
        seen.add(signature);
        rows.push(...batch);
        const meta = result.meta;
        if (meta?.totalPage != null) {
          if (meta.totalPage < 0 || page >= meta.totalPage) break;
        } else if (meta?.total != null) {
          if (meta.total < 0 || rows.length >= meta.total) break;
        } else if (batch.length < pageSize) break;
        page += 1;
      }
    } else return;
    const fields = columnFields.value.filter((field) =>
      columnPreferences.visibleKeys.value.includes(field.key),
    );
    if (!fields.length)
      throw new Error("[is-vue-framework] Export requires one visible column.");
    const workbook = createWorkbook(rows, fields, options);
    const fallback =
      `${surface.value.table.namespace ?? "export"}-${Date.now()}`.replace(
        /[^a-zA-Z0-9._-]/g,
        "-",
      );
    const filename =
      typeof options.filename === "function"
        ? options.filename({ query: activeQuery })
        : (options.filename ?? fallback);
    downloadWorkbook(workbook, filename);
    toast.success("Export created.");
  } catch (error) {
    toast.error("Could not create export.");
    emit("export-error", error);
  } finally {
    exporting.value = false;
  }
}

const canExport = computed(
  () =>
    props.export !== false &&
    Boolean(surface.value.table.data || surface.value.table.load),
);
</script>

<template>
  <section class="is-list-view flex flex-col gap-2">
    <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
      <header class="flex flex-col gap-4 px-5 py-4 sm:px-6 sm:py-5">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
            <slot name="header">
              <div class="min-w-0">
                <h1 v-if="title" class="text-lg font-semibold tracking-tight text-on-surface">
                  {{ title }}
                </h1>
                <p v-if="description" class="mt-1 text-sm text-on-surface-variant">
                  {{ description }}
                </p>
              </div>
            </slot>
            <div class="flex flex-wrap items-center gap-2">
              <SearchBox
                :model-value="String(queryValues.search ?? '')"
                @update:model-value="
                  (search: string) =>
                    updateQuery({ search: search || undefined, page: 1 })
                "
              />
              <Popover v-if="filters">
                <template #trigger>
                  <Button kind="icon" variant="standard" aria-label="Filter">
                    <template #icon><Icon name="filter" /></template>
                  </Button>
                </template>
                <template #content>
                  <Form
                    :fields="filters.fields"
                    :schema="filters.schema"
                    :model-value="queryValues"
                    @update:model-value="updateFilters"
                  />
                  <Button
                    type="button"
                    variant="text"
                    @click="resetFilters"
                    >{{ filters.resetLabel ?? "Reset filter" }}</Button
                  >
                </template>
              </Popover>
              <Dialog>
                <template #trigger>
                  <Button kind="icon" variant="standard" aria-label="Columns">
                    <template #icon><Icon name="table" /></template>
                  </Button>
                </template>
                <template #title>Columns</template>
                <template #content>
                  <slot
                    name="column-dialog"
                    :fields="columnFields"
                    :reset="resetColumns"
                  >
                    <label
                      v-for="field in columnFields"
                      :key="field.key"
                      class="flex items-center justify-between gap-4"
                    >
                      <span>{{ field.label ?? field.key }}</span>
                      <Switch
                        :model-value="
                          columnPreferences.visibleKeys.value.includes(field.key)
                        "
                        @update:model-value="
                          (visible) =>
                            setVisibleColumns(
                              visible
                                ? [
                                    ...columnPreferences.visibleKeys.value,
                                    field.key,
                                  ]
                                : columnPreferences.visibleKeys.value.filter(
                                    (key) => key !== field.key,
                                  ),
                            )
                        "
                      />
                    </label>
                    <Button type="button" variant="text" @click="resetColumns"
                      >Reset columns</Button
                    >
                  </slot>
                </template>
              </Dialog>
              <slot
                name="export-controls"
                :export="exportRows"
                :exporting="exporting"
              >
                <Button
                  v-if="canExport"
                  kind="icon"
                  variant="standard"
                  aria-label="Export Excel"
                  :disabled="exporting"
                  @click="exportRows"
                >
                  <template #icon><Icon name="file-excel" /></template>
                </Button>
              </slot>
            </div>
          </div>
          <RouterLink v-if="surface.createRoute" :to="surface.createRoute">
            <Button>
              <template #icon><Icon name="add" /></template>Create
            </Button>
          </RouterLink>
          <slot name="controls" />
        </div>
      </header>

      <div
        v-if="$slots.filters"
        class="border-t border-outline-variant px-5 py-3 sm:px-6"
      >
        <slot name="filters" />
      </div>
    </Card>

    <Card variant="outlined" color="surfaceContainer" class="gap-0 p-0">
      <slot name="body" v-bind="{ table: surface.table }">
        <div class="p-3 sm:p-4">
          <Table
            ref="tableRef"
            v-bind="surface.table"
            :query="queryValues"
            :visible-columns="columnPreferences.visibleKeys.value"
            :column-sizing="columnSizing"
            @update:query="updateQuery"
            @update:visible-columns="setVisibleColumns"
            @update:column-sizing="setColumnSizing"
          >
            <template
              v-if="
                $slots['row-actions'] ||
                surface.detailRoute ||
                surface.updateRoute ||
                surface.canDelete
              "
              #row-actions="{ record }"
            >
              <div
                class="flex items-center justify-end gap-1"
                aria-label="Row actions"
              >
                <RouterLink
                  v-if="surface.detailRoute?.(record)"
                  v-slot="{ href, navigate }"
                  custom
                  :to="surface.detailRoute(record)!"
                >
                  <Button
                    kind="icon"
                    variant="standard"
                    :href="href"
                    aria-label="View"
                    @click.stop="navigate"
                  >
                    <template #icon><Icon name="eye" size="base" /></template>
                  </Button>
                </RouterLink>
                <RouterLink
                  v-if="surface.updateRoute?.(record)"
                  v-slot="{ href, navigate }"
                  custom
                  :to="surface.updateRoute(record)!"
                >
                  <Button
                    kind="icon"
                    variant="standard"
                    :href="href"
                    aria-label="Edit"
                    @click.stop="navigate"
                  >
                    <template #icon><Icon name="edit" size="base" /></template>
                  </Button>
                </RouterLink>
                <Dialog v-if="surface.canDelete?.(record)">
                  <template #trigger>
                    <Button
                      kind="icon"
                      variant="standard"
                      color="error"
                      aria-label="Delete"
                      @click.stop
                    >
                      <template #icon
                        ><Icon name="delete-bin" size="base"
                      /></template>
                    </Button>
                  </template>
                  <template #title>Delete record?</template>
                  <template #description
                    >This action cannot be undone.</template
                  >
                  <template #footer="{ setOpen }">
                    <div class="flex w-full justify-end gap-2">
                      <Button
                        type="button"
                        variant="text"
                        :disabled="deleting"
                        @click="setOpen(false)"
                        >Cancel</Button
                      >
                      <Button
                        type="button"
                        color="error"
                        :disabled="deleting"
                        @click="remove(record, setOpen)"
                        >Delete</Button
                      >
                    </div>
                  </template>
                </Dialog>
                <slot name="row-actions" v-bind="{ record }" />
              </div>
            </template>
            <template
              v-for="([name], index) in passthroughSlots"
              #[name]="slotProps"
              :key="index"
            >
              <slot :name="name" v-bind="slotProps ?? {}" />
            </template>
          </Table>
        </div>
      </slot>

      <footer
        v-if="$slots.footer"
        class="border-t border-outline-variant px-5 py-3"
      >
        <slot name="footer" />
      </footer>
    </Card>
  </section>
</template>
