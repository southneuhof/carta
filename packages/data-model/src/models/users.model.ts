import type { ModelConfig } from "@southneuhof/is-data-model";
import { defineDataModel } from "../define-data-model";
import { z } from "zod";

const roleTypeOptions = [
  { id: "internal", name: "Internal" },
  { id: "external", name: "Eksternal" },
];

const statusCodeOptions = [
  { id: "email_unverified", name: "Email Belum Diverifikasi" },
  { id: "email_verified", name: "Email Terverifikasi" },
  { id: "user_active", name: "User Aktif" },
  { id: "user_nonactive", name: "User Tidak Aktif" },
  { id: "user_rejected", name: "User Ditolak" },
];

type UsersModelConfig = ModelConfig & {
  icon?: string;
  description?: string;
  order?: number;
};

const users: UsersModelConfig = defineDataModel({
  base: {
    name: "users",
    title: "Users",
    permission: "users",
    fields: [
      "fullname",
      "username",
      "email",
      "role_type",
      "created_at",
      "status_code",
      "updated_at",
    ],
    fieldsAlias: {
      email: "Email",
      role_type: "Tipe Role",
      role_id: "Role",
      employee_id: "Karyawan",
      img_photo_user: "Foto",
      username: "Username",
      email_verified_at: "Email Terverifikasi",
      last_login_at: "Login Terakhir",
      owner_id: "Perusahaan Asal",
      status_code: "Status",
      is_locked: "Status Kunci Akun",
    },
    view: {
      fieldsProxy: {
        employee_id: "rel_employee_id",
        owner_id: "rel_owner_id",
      },
      fieldsDictionary: {
        role_type: {
          internal: "Internal",
          external: "Eksternal",
        },
        status_code: {
          email_unverified: "Email Belum Diverifikasi",
          email_verified: "Email Terverifikasi",
          user_active: "User Aktif",
          user_nonactive: "User Tidak Aktif",
          user_rejected: "User Ditolak",
        },
      },
      fieldsType: {
        status_code: {
          type: "chip",
          props: {
            options: {
              email_unverified: {
                color: "error",
                label: "Email Belum Diverifikasi",
              },
              email_verified: {
                color: "warning",
                label: "Email Terverifikasi",
              },
              user_active: { color: "success", label: "User Aktif" },
              user_nonactive: { color: "error", label: "User Tidak Aktif" },
              user_rejected: { color: "error", label: "User Ditolak" },
              "Email Belum Diverifikasi": {
                color: "error",
                label: "Email Belum Diverifikasi",
              },
              "Email Terverifikasi": {
                color: "warning",
                label: "Email Terverifikasi",
              },
              "User Aktif": { color: "success", label: "User Aktif" },
              "User Tidak Aktif": { color: "error", label: "User Tidak Aktif" },
              "User Ditolak": { color: "error", label: "User Ditolak" },
            },
          },
        },
        img_photo_user: {
          type: "image",
        },
        role_type: {
          type: "chip",
          props: {
            options: {
              internal: { label: "Internal" },
              external: { label: "Eksternal" },
              Internal: { label: "Internal" },
              Eksternal: { label: "Eksternal" },
            },
          },
        },
      },
      list: {
        filter: {
          fields: [
            "active",
            "role_type",
            "status_code",
            "is_locked",
            "role_id",
          ],
          inputConfig: {
            role_type: {
              type: "radio",
              props: {
                data: roleTypeOptions,
              },
            },
            status_code: {
              type: "radio",
              props: {
                data: statusCodeOptions,
              },
            },
            is_locked: {
              type: "radio",
              props: {
                data: [
                  { id: true, name: "Terkunci" },
                  { id: false, name: "Tidak Terkunci" },
                ],
              },
            },
            role_id: {
              type: "select",
              props: {
                getAPI: "roles",
                view: "role_name",
                multi: true,
              },
            },
          },
        },
      },
    },
    transaction: {
      fields: [
        "role_type",
        "username",
        "fullname",
        "email",
        "role_id",
        "employee_id",
        "owner_id",
        "img_photo_user",
      ],
      inputConfig: {
        fullname: {
          type: "text",
          props: {
            required: true,
          },
          dependency: {
            fields: ["role_type"],
            visibility: {
              validator: ({ role_type }) => role_type === "external",
              default: false,
            },
          },
        },
        username: {
          type: "text",
          props: {
            required: true,
          },
        },
        email: {
          type: "text",
          props: {
            required: true,
            validation: z.string().email("Format email tidak valid!"),
          },
          dependency: {
            fields: ["role_type"],
            visibility: {
              validator: ({ role_type }) => role_type === "external",
              default: false,
            },
          },
        },
        img_photo_user: {
          type: "file",
        },
        role_type: {
          type: "select",
          props: {
            required: true,
            defaultValue: "internal",
            data: roleTypeOptions,
          },
        },
        employee_id: {
          type: "lookup",
          props: {
            getAPI: "employees",
            fields: ["fullname", "email", "rel_job_position_id"],
            searchParameters: {
              is_user: false,
              status_code: "employee",
            },
            required: true,
          },
          dependency: {
            fields: ["role_type"],
            visibility: {
              validator: ({ role_type }) => role_type === "internal",
              default: false,
            },
          },
        },
        role_id: {
          type: "lookup",
          props: {
            getAPI: "roles",
            fields: ["role_name"],
            view: "role_name",
            multi: true,
          },
          dependency: {
            fields: ["role_type"],
            visibility: {
              validator: ({ role_type }) => Boolean(role_type),
              default: false,
            },
            props: {
              generator: ({ role_type }) => ({
                searchParameters: role_type ? { role_type } : {},
              }),
              default: {},
            },
          },
        },
        owner_id: {
          type: "lookup",
          props: {
            getAPI: "toll-owners",
            fields: ["owner_name"],
            required: true,
          },
          dependency: {
            fields: ["role_type"],
            visibility: {
              validator: ({ role_type }) => role_type === "external",
              default: false,
            },
          },
        },
      },
    },
  },
  mobile: {
    icon: "team",
    description: "Manage application users.",
  },
});

export default users;
