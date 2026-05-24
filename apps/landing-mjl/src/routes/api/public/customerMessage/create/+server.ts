import {POST as defaultCreatePOST} from '../../../[model]/create/+server'

export async function POST(props) {
  return await defaultCreatePOST({...props, params: {...props.params, model: 'customerMessage'}} as any)
}