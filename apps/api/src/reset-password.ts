import { createDatabaseAuth } from './auth.ts';
import { loadConfig } from './config.ts';
import { createDatabase } from './db/client.ts';
import { PasswordResetError, resetPassword } from './password-reset.ts';

// Sets a new password for a user and signs them out everywhere. Without outgoing email, this is
// the way back in after a forgotten password. It runs on the server, so it needs shell access.
//
//   docker compose exec api node dist/reset-password.js <email>
//   pnpm user:reset-password <email>
//
// The password is asked for, never taken as an argument: arguments end up in shell history and
// process lists.

const [email, ...extra] = process.argv.slice(2);
if (!email || extra.length > 0) {
  console.error('Usage: reset-password <email>');
  process.exit(2);
}
if (!process.stdin.isTTY) {
  console.error('Run this in a terminal. It asks for the new password and does not read it from a pipe.');
  process.exit(2);
}

const config = loadConfig();
const database = createDatabase(config.DATABASE_URL);

try {
  const first = await askHidden('New password: ');
  const second = await askHidden('Type it again: ');
  if (first !== second) throw new PasswordResetError('The two passwords are different. Nothing was changed.');

  const result = await resetPassword(createDatabaseAuth(database, config), email, first);
  console.log(`Password reset for ${result.email}. All of their sessions have ended.`);
} catch (error) {
  console.error(error instanceof PasswordResetError ? error.message : error);
  process.exitCode = 1;
} finally {
  await database.close();
}

/** Reads one line from the terminal without showing it. node:readline has no hidden input. */
function askHidden(prompt: string): Promise<string> {
  const { stdin, stdout } = process;
  return new Promise((resolve, reject) => {
    let value = '';
    const finish = () => {
      stdin.off('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
    };
    const onData = (chunk: string) => {
      for (const character of chunk) {
        if (character === '\r' || character === '\n') {
          finish();
          resolve(value);
          return;
        }
        if (character === '\u0003' || character === '\u0004') {
          // Ctrl+C or Ctrl+D.
          finish();
          reject(new PasswordResetError('Cancelled. Nothing was changed.'));
          return;
        }
        if (character === '\u007f' || character === '\b') {
          value = Array.from(value).slice(0, -1).join('');
        } else if (character >= ' ') {
          value += character;
        }
      }
    };

    stdout.write(prompt);
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}
