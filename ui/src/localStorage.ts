import { initialState as settingsInitialState, SettingsState } from "./reducers/settingsReducer"

const LOCAL_STORAGE_KEY = "asynqmon:state";

export function loadState(): { settings?: SettingsState } {
  try {
    const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (serializedState === null) {
      return {};
    }
    const savedState = JSON.parse(serializedState);
    return {
      settings: {
        ...settingsInitialState,
        ...(savedState.settings || {}),
      }
    }
  } catch (err) {
    console.log("loadState: could not load state ", err)
    return {};
  }
}

export function saveState(state: { settings: SettingsState }) {
  try {
    const serializedState = JSON.stringify({ settings: state.settings });
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  } catch (err) {
    console.error("saveState: could not save state: ", err);
  }
}
