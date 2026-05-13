import {
  defineDataModelForPlatform,
  type DataModelDefinition,
} from "./define-data-model.shared";
import type { ModelConfig } from "@southneuhof/is-data-model";

export function defineDataModel<TBase extends ModelConfig>(
  definition: DataModelDefinition<TBase>
) {
  return defineDataModelForPlatform(definition, definition.mobile);
}
