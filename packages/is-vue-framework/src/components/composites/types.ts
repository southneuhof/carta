export type TableResult<TRecord extends Record<string, any> = Record<string, any>> = {
  data: TRecord[]
  total?: number
  totalPage?: number
}

export type TableLoad<TRecord extends Record<string, any> = Record<string, any>> = (
  query: Record<string, any>,
) => Promise<TableResult<TRecord>>

export type DetailLoad<TRecord extends Record<string, any> = Record<string, any>> = () => Promise<TRecord | undefined>

export type FormLoad<TForm extends Record<string, any> = Record<string, any>> = () => Promise<Partial<TForm> | undefined>

export type FormSubmit<TForm extends Record<string, any> = Record<string, any>, TResult = unknown> = (data: TForm) => Promise<TResult>
