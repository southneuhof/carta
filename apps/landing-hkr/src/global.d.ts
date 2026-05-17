export {}

declare module 'debug'

declare global {
  const pannellum: {
    viewer: (id: string, config: Record<string, unknown>) => unknown;
  };

  declare module 'svelte-recaptcha-v2'
  type Operator = 'equals' | 'not' | 'in' | 'notIn' | 'lt' | 'lte' | 'gt' | 'gte' | 'contains' | 'some' | 'every' | 'startsWith' | 'endsWith' | 'isNull'

  type Condition<T> = {
    field: keyof T
    operator: Operator
    value?: any
  }

  type ArrayStrategy = 'first' | 'last' | 'all' | {
    where?: {
      field: string
      value: any
    }
  }

  type WhereConfig<T> = {
    AND?: Condition<T>[]
    OR?: Condition<T>[]
    NOT?: Condition<T>[]
  }
  type FieldType = 'file' | 'number' | 'string' | 'multi'

  type FieldTypeConfig =
    | {
        type: 'multi'
        params: {
          by: string
          [key: string]: any
        }
      }
    | {
        type: Exclude<FieldType, 'multi'>
        params?: {
          [key: string]: any
        }
      }
  
  type CustomFieldConfig = {
    name: string,        // Name of the field
    generator: (data: Record<string, any>) => any // Handler function to process the data
  }

}

// FORM EVENTS
export type FormInputEvent<T extends Event = Event> = T & {
	currentTarget: EventTarget & HTMLInputElement;
};
export type InputEvents = {
	blur: FormInputEvent<FocusEvent>;
	change: FormInputEvent<Event>;
	click: FormInputEvent<MouseEvent>;
	focus: FormInputEvent<FocusEvent>;
	focusin: FormInputEvent<FocusEvent>;
	focusout: FormInputEvent<FocusEvent>;
	keydown: FormInputEvent<KeyboardEvent>;
	keypress: FormInputEvent<KeyboardEvent>;
	keyup: FormInputEvent<KeyboardEvent>;
	mouseover: FormInputEvent<MouseEvent>;
	mouseenter: FormInputEvent<MouseEvent>;
	mouseleave: FormInputEvent<MouseEvent>;
	mousemove: FormInputEvent<MouseEvent>;
	paste: FormInputEvent<ClipboardEvent>;
	input: FormInputEvent<InputEvent>;
	wheel: FormInputEvent<WheelEvent>;
};
