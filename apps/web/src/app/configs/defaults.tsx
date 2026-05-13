/* @jsxImportSource vue */
import type { InputConfig } from '@southneuhof/is-data-model'
import { z } from 'zod'

export const defaultGlobalConfig: {
  fieldSlots: Record<string, any>
  fieldsProxy: Record<string, string>
  inputConfig: InputConfig
  fieldsParse: Record<string, string>
  fieldsAlias: Record<string, string>
  fieldsType: Record<string, { type: string; props?: any }>
} = {
  fieldSlots: {},
  fieldsProxy: {
    created_by: 'rel_created_by',
    updated_by: 'rel_updated_by',
  },
  inputConfig: {
    title: { type: 'text', props: { required: true } },
    name: { type: 'text', props: { required: true } },
    fullname: { type: 'text', props: { required: true } },
    username: { type: 'text', props: { required: true } },
    code: { type: 'text', props: { required: true } },
    email: {
      type: 'text',
      props: {
        required: true,
        validation: z.string().email('Format email tidak valid!'),
      },
    },
    telephone: { type: 'text', props: { required: true } },
    description: { type: 'textarea' },
    active: {
      type: 'radio',
      props: {
        required: true,
        defaultValue: true,
        data: [
          { name: 'Aktif', id: true },
          { name: 'Nonaktif', id: false },
        ],
      },
    },
    status_code: {
      type: 'radio',
      props: {
        required: true,
        data: [
          { name: 'Aktif', id: 'active' },
          { name: 'Nonaktif', id: 'non_active' },
          { name: 'Kadaluwarsa', id: 'expired' },
          { name: 'Akan Kadaluwarsa', id: 'expiring_soon' },
        ],
      },
    },
    start_date: { type: 'date' },
    end_date: { type: 'date' },
    year: { type: 'year' },
  },
  fieldsAlias: {
    name: 'Nama',
    code: 'Kode',
    file: 'File',
    description: 'Keterangan',
    active: 'Status',
    created_at: 'Dibuat',
    updated_at: 'Diperbarui Pada',
    updated_by: 'Diperbarui Oleh',
    rel_created_by: 'Dibuat Oleh',
    rel_updated_by: 'Diperbarui Oleh',
    department_id: 'Unit Kerja',
    created_by: 'Dibuat Oleh',
    year: 'Tahun',
    number: 'Nomor',
    section_name: 'Ruas',
    section_id: 'Ruas',
    gate_name: 'Gerbang',
    gate_id: 'Gerbang',
    status_code: 'Status',
    date: 'Tanggal',
    start_date: 'Tanggal Mulai',
    end_date: 'Tanggal Selesai',
    published_at: 'Diterbitkan Pada',
    title: 'Judul',
    start_month: 'Periode Mulai',
    end_month: 'Periode Selesai',
    approval_description: 'Keterangan',
    array_approval_attachment: 'Lampiran',
    verification_description: 'Keterangan',
    array_verification_attachment: 'Lampiran',
    submission_description: 'Keterangan',
    array_submission_attachment: 'Lampiran',
  },
  fieldsParse: {
    created_at: 'datetime',
    updated_at: 'datetime',
    published_at: 'datetime',
    date: 'date',
  },
  fieldsType: {
    approval_description: { type: 'html' },
    verification_description: { type: 'html' },
    submission_description: { type: 'html' },
    array_approval_attachment: { type: 'file' },
    array_verification_attachment: { type: 'file' },
    array_submission_attachment: { type: 'file' },
    active: {
      type: 'chip',
      props: {
        options: {
          true: { color: 'success', label: 'Aktif' },
          false: { color: 'error', label: 'Nonaktif' },
        },
      },
    },
    status_code: {
      type: 'chip',
      props: {
        options: {
          active: { color: 'success', label: 'Aktif' },
          non_active: { color: 'neutral', label: 'Nonaktif' },
          expired: { color: 'error', label: 'Kadaluwarsa' },
          expiring_soon: { color: 'warning', label: 'Akan Kadaluwarsa' },
        },
      },
    },
    // status_code: {
    //   type: 'chip',
    //   props: {
    //     options: {
    //       waiting: {color:'neutral', label: 'Menunggu Verifikasi'},
    //       approved: {color:'success', label: 'Disetujui'},
    //       rejected: {color:'error', label: 'Ditolak'},
    //       draft: {color: 'neutral', label: 'Draft'},
    //       on_verification: {color: 'warning', label: 'Menunggu Verifikasi'},
    //       verified: {color: 'success', label: 'Diverifikasi'},
    //     }
    //   }
    // }
  },
}

export const defaultTableConfig: {
  fieldSlots: Record<string, any>
  fieldsProxy: Record<string, string>
  fieldsAlias: Record<string, string>
  fieldsClass: Record<string, string>
  fieldsHeaderClass: Record<string, string>
  fieldsParse: Record<string, string>
  fieldsType: Record<string, { type: string; props?: any }>
  fieldsAlign: Record<string, 'start' | 'center' | 'end'>
} = {
  fieldSlots: defaultGlobalConfig.fieldSlots,
  fieldsProxy: defaultGlobalConfig.fieldsProxy,
  fieldsAlias: defaultGlobalConfig.fieldsAlias,
  fieldsType: defaultGlobalConfig.fieldsType,
  fieldsParse: defaultGlobalConfig.fieldsParse,
  fieldsClass: {
    created_at: 'min-w-max whitespace-nowrap',
    updated_at: 'min-w-max whitespace-nowrap',
    published_at: 'min-w-max whitespace-nowrap',
    description: 'line-clamp-3 overflow-ellipsis',
    section_id: 'w-max max-w-sm',
    date: 'w-max max-w-sm',
    asset_id: 'w-max max-w-sm',
    location_id: 'w-max max-w-sm',
  },
  fieldsHeaderClass: {},
  fieldsAlign: {
    status_code: 'center',
    status: 'center',
  },
}

export const defaultDetailConfig: {
  fieldSlots: Record<string, any>
  fieldsProxy: Record<string, string>
  fieldsAlias: Record<string, string>
  fieldsParse: Record<string, string>
  fieldsType: Record<string, { type: string; props?: any }>
} = {
  fieldSlots: defaultGlobalConfig.fieldSlots,
  fieldsProxy: defaultGlobalConfig.fieldsProxy,
  fieldsAlias: defaultGlobalConfig.fieldsAlias,
  fieldsParse: defaultGlobalConfig.fieldsParse,
  fieldsType: {
    ...defaultGlobalConfig.fieldsType,
    array_clauses: { type: 'array-clauses' },
  },
}

export const defaultFormConfig: {
  inputConfig: InputConfig
  fieldsAlias: Record<string, string>
} = {
  inputConfig: {
    ...defaultGlobalConfig.inputConfig,
    status_code: {
      type: 'radio',
      props: {
        required: true,
        defaultValue: true,
        data: [
          { name: 'Aktif', id: 'active' },
          { name: 'Nonaktif', id: 'non_active' },
        ],
      },
    },
  },
  fieldsAlias: defaultGlobalConfig.fieldsAlias,
}
