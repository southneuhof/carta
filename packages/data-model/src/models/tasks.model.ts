import type { ModelConfig } from "@southneuhof/is-data-model";
import { defineDataModel } from "../define-data-model";

const tasks = defineDataModel({
  base: {
    name: "tasks",
    title: "Tasks",
    fields: ["task_code", "task_name", "task_group", "table_name", "active"],
    fieldsAlias: {
      task_code: "Kode Permission",
      task_name: "Nama Permission",
      task_group: "Grup Permission",
      table_name: "Nama Tabel",
    },
    view: {
      list: {
        filter: {
          fields: ["active"],
        },
      },
    },
    transaction: {
      inputConfig: {
        task_code: {
          type: "text",
          props: {
            required: true,
          },
        },
        task_name: {
          type: "text",
          props: {
            required: true,
          },
        },
        task_group: {
          type: "text",
          props: {
            required: true,
          },
        },
        table_name: {
          type: "text",
          props: {
            required: true,
          },
        },
      },
    },
  } satisfies ModelConfig,
});

export default tasks;
