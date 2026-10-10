import { expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';

const {
  verifyIdentity,
  installedFilesAt,
  RC_TARBALL,
  RC_VERSION,
  RC_NAME,
  RC_INTEGRITY,
} = await import(
  new URL('../../../scripts/verify-formicarium-rc.mjs', import.meta.url).href
);
async function fixture() {
  return {
    tarball: await readFile(process.env.FORMICARIUM_RC_TARBALL ?? RC_TARBALL),
    installedFiles: await installedFilesAt(),
    dependency: RC_VERSION,
    metadata: {
      name: RC_NAME,
      version: RC_VERSION,
      dist: {
        integrity: RC_INTEGRITY,
        tarball:
          'https://registry.npmjs.org/@aletheia-works/formicarium/-/formicarium-0.1.0-rc.1.tgz',
      },
    },
    lock: await readFile(new URL('../bun.lock', import.meta.url), 'utf8'),
  };
}
test('actual published pack matches installed files and fixed lock identity', async () => {
  expect(verifyIdentity(await fixture())).toMatchObject({
    version: RC_VERSION,
    fileCount: 24,
    integrity: RC_INTEGRITY,
  });
});
test('wrong version refuses', async () => {
  const f = await fixture();
  expect(() => verifyIdentity({ ...f, dependency: '^0.1.0-rc.1' })).toThrow(
    'version mismatch',
  );
});
test('wrong registry integrity refuses', async () => {
  const f = await fixture();
  f.metadata.dist.integrity = 'sha512-wrong';
  expect(() => verifyIdentity(f)).toThrow('integrity mismatch');
});
test('wrong compressed tarball SHA256 refuses', async () => {
  const f = await fixture();
  f.tarball[0] = f.tarball[0]! ^ 1;
  expect(() => verifyIdentity(f)).toThrow('SHA256 mismatch');
});
test('installed file drift refuses even when the package version matches', async () => {
  const f = await fixture();
  f.installedFiles.set('runtime/core.js', Buffer.from('changed'));
  expect(() => verifyIdentity(f)).toThrow('installed file mismatch');
});
