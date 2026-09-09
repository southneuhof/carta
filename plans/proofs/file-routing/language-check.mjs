// Proof command. A shipped Sprindle command would own this call.
import { language } from './language-core.mjs';
const service=language(process.cwd());
try {
  const errors=service.diagnostics();
  for (const error of errors) console.log(JSON.stringify(error));
  process.exitCode=errors.length?1:0;
} finally {service.close();}
