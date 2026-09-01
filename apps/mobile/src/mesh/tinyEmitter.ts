// React Native has no "node:events" module (Hermes isn't Node), so this is
// a minimal stand-in for the one thing MeshRouter needs: a single "event" channel.
export class TinyEmitter<T> {
  private listeners = new Set<(payload: T) => void>();

  on(listener: (payload: T) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(payload: T): void {
    for (const listener of this.listeners) listener(payload);
  }
}
