// Сохранения заметок, которые ещё идут на сервер. Если заметку закрыли и тут же открыли снова,
// загрузка ждёт окончания сохранения, иначе прочитается старая версия, а свежие правки «пропадут».

const pending = new Map<number, Promise<unknown>>();

export const trackSave = (noteId: number, promise: Promise<unknown>) => {
  pending.set(noteId, promise);
  void promise.finally(() => {
    if (pending.get(noteId) === promise) pending.delete(noteId);
  });
};

export const waitForSave = async (noteId: number) => {
  await pending.get(noteId)?.catch(() => {});
};
