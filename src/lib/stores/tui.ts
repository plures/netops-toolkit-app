/** Minimal boolean store that reflects whether the app is running in TUI (terminal) mode. */
type TuiModeSubscriber = (value: boolean) => void;

let tuiModeValue = false;
const tuiModeSubscribers = new Set<TuiModeSubscriber>();

export const tuiMode = {
  subscribe(run: TuiModeSubscriber): () => void {
    run(tuiModeValue);
    tuiModeSubscribers.add(run);
    return () => {
      tuiModeSubscribers.delete(run);
    };
  },
  set(value: boolean): void {
    if (value === tuiModeValue) return;
    tuiModeValue = value;
    for (const subscriber of tuiModeSubscribers) {
      subscriber(tuiModeValue);
    }
  },
  update(updater: (value: boolean) => boolean): void {
    tuiMode.set(updater(tuiModeValue));
  }
};
