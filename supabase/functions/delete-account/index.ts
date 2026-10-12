// Permanently deletes the caller's account: their photos and avatar in
// Storage, then the auth user, which cascades to every row they own.
import { callerClient, handle, json, serviceClient } from '../_shared/common.ts';

async function removeFolder(bucket: string, folder: string) {
  const admin = serviceClient();
  for (;;) {
    const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 100 });
    if (error) throw error;
    if (!data?.length) return;
    const { error: removeError } = await admin.storage.from(bucket).remove(data.map((f) => `${folder}/${f.name}`));
    if (removeError) throw removeError;
  }
}

Deno.serve(
  handle(async (req) => {
    const { userId } = await callerClient(req);
    await removeFolder('request-photos', userId);
    await removeFolder('avatars', userId);
    const { error } = await serviceClient().auth.admin.deleteUser(userId);
    if (error) throw error;
    return json({ deleted: true });
  }),
);
