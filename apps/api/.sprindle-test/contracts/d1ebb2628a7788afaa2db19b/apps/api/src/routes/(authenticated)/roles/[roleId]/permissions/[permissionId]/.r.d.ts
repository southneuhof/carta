
export * from '@southneuhof/sprindle'
import type { DefineFileCreate, DefineFileDelete, DefineFileDetail, DefineFileList, DefineFileRoute, DefineFileScope, DefineFileUpdate, ScopeView } from "../../../../../../../.__sprindle_route_definition"
type Parent = typeof import("./../../../+scope").default
type Params = {"roleId": string;"permissionId": string}
export declare const defineScope: DefineFileScope<Parent, Params>
export declare const defineRoute: DefineFileRoute<Parent, Params>
export declare const list: DefineFileList<Parent, Params>
export declare const detail: DefineFileDetail<Parent, Params>
export declare const create: DefineFileCreate<Parent, Params>
export declare const update: DefineFileUpdate<Parent, Params>
export declare const deleteRoute: DefineFileDelete<Parent, Params>
