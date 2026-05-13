import { mergeModelConfig, type ModelConfig } from "@southneuhof/is-data-model";

type AnyObject = Record<string, any>;

export type DataModelOverride<T> = T extends (...args: any[]) => any
  ? T
  : T extends Array<infer U>
  ? Array<DataModelOverride<U>>
  : T extends object
  ? { [K in keyof T]?: DataModelOverride<T[K]> } & AnyObject
  : T;

export type DataModelDefinition<TBase extends ModelConfig> = {
  base: TBase;
  web?: DataModelOverride<TBase>;
  mobile?: DataModelOverride<TBase>;
  server?: DataModelOverride<TBase>;
};

export function defineDataModelForPlatform<TBase extends ModelConfig>(
  definition: DataModelDefinition<TBase>,
  override: undefined
): TBase;
export function defineDataModelForPlatform<
  TBase extends ModelConfig,
  TOverride extends DataModelOverride<TBase>
>(
  definition: DataModelDefinition<TBase>,
  override: TOverride
): TBase & TOverride;
export function defineDataModelForPlatform<TBase extends ModelConfig>(
  definition: DataModelDefinition<TBase>,
  override: DataModelOverride<TBase> | undefined
): TBase & DataModelOverride<TBase>;
export function defineDataModelForPlatform<TBase extends ModelConfig>(
  definition: DataModelDefinition<TBase>,
  override?: DataModelOverride<TBase>
): TBase {
  return mergeModelConfig(definition.base, override) as TBase;
}
