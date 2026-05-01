const vscode = acquireVsCodeApi();

window.addEventListener("load", main);

function main() {
  const PauseTimerButton = document.getElementById("pause_timer");
  PauseTimerButton.addEventListener("click", PauseTimerClick);

  const ExportLogsButton = document.getElementById("export_logs");
  ExportLogsButton.addEventListener("click", ExportLogsClick);

  const AskAIButton = document.getElementById("ask_ai");
  AskAIButton.addEventListener("click", AskAIClick);

  const SearchTextBox = document.getElementById("search_text");
  SearchTextBox.addEventListener("keydown", SearchTextBoxKeyDown);

  const HideTextBox = document.getElementById("hide_text");
  HideTextBox.addEventListener("keydown", HideTextBoxKeyDown);

  const FilterTextBox = document.getElementById("filter_text");
  FilterTextBox.addEventListener("keydown", FilterTextBoxKeyDown);

  const RefreshButton = document.getElementById("refresh");
  RefreshButton.addEventListener("click", RefreshButtonClick);

  const WrapCheckbox = document.getElementById("wrap_text");
  WrapCheckbox.addEventListener("change", WrapCheckboxChange);

  const UseDateTimeFilterCheckbox = document.getElementById("use_datetime_filter");
  UseDateTimeFilterCheckbox.addEventListener("change", UseDateTimeFilterCheckboxChange);

  const FilterStartDate = document.getElementById("filter_start_date");
  FilterStartDate.addEventListener("change", DateTimeFilterChange);

  const FilterStartTime = document.getElementById("filter_start_time");
  FilterStartTime.addEventListener("change", DateTimeFilterChange);

  // Catch Enter presses from vscode-textfield internals (shadow DOM) reliably.
  document.addEventListener("keydown", GlobalEnterKeyDown, true);
}

function RefreshButtonClick() {
  const SearchTextBox = document.getElementById("search_text");
  const HideTextBox = document.getElementById("hide_text");
  const FilterTextBox = document.getElementById("filter_text");
  const WrapCheckbox = document.getElementById("wrap_text");
  const UseDateTimeFilterCheckbox = document.getElementById("use_datetime_filter");
  const FilterStartDate = document.getElementById("filter_start_date");
  const FilterStartTime = document.getElementById("filter_start_time");

  vscode.postMessage({
    command: "refresh",
    search_text: GetTextFieldValue(SearchTextBox),
    hide_text: GetTextFieldValue(HideTextBox),
    filter_text: GetTextFieldValue(FilterTextBox),
    wrap_text: WrapCheckbox.checked,
    use_datetime_filter: UseDateTimeFilterCheckbox.checked,
    filter_start_date: FilterStartDate.value,
    filter_start_time: FilterStartTime.value
  });
}

function RefreshNoLogLoad() {
  const SearchTextBox = document.getElementById("search_text");
  const HideTextBox = document.getElementById("hide_text");
  const FilterTextBox = document.getElementById("filter_text");
  const WrapCheckbox = document.getElementById("wrap_text");
  const UseDateTimeFilterCheckbox = document.getElementById("use_datetime_filter");
  const FilterStartDate = document.getElementById("filter_start_date");
  const FilterStartTime = document.getElementById("filter_start_time");

  vscode.postMessage({
    command: "refresh_nologload",
    search_text: GetTextFieldValue(SearchTextBox),
    hide_text: GetTextFieldValue(HideTextBox),
    filter_text: GetTextFieldValue(FilterTextBox),
    wrap_text: WrapCheckbox.checked,
    use_datetime_filter: UseDateTimeFilterCheckbox.checked,
    filter_start_date: FilterStartDate.value,
    filter_start_time: FilterStartTime.value
  });
}

function GetTextFieldValue(textField) {
  if (!textField) {
    return "";
  }

  if (typeof textField.value === "string") {
    return textField.value;
  }

  if (typeof textField._value === "string") {
    return textField._value;
  }

  return "";
}

function PauseTimerClick() {
  vscode.postMessage({
    command: "pause_timer"
  });
}

function ExportLogsClick() {
  vscode.postMessage({
    command: "export_logs"
  });
}

function AskAIClick() {
  vscode.postMessage({
    command: "ask_ai"
  });
}

function WrapCheckboxChange(e) {
  vscode.postMessage({
    command: "toggle_wrap",
    wrap_text: e.target.checked
  });
}

function SearchTextBoxKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    RefreshNoLogLoad();
  }
}

function HideTextBoxKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    RefreshNoLogLoad();
  }
}

function FilterTextBoxKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    RefreshNoLogLoad();
  }
}

function GlobalEnterKeyDown(e) {
  if (e.defaultPrevented || e.key !== "Enter") {
    return;
  }

  if (!IsFilterInputEvent(e)) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();
  RefreshNoLogLoad();
}

function IsFilterInputEvent(e) {
  const ids = new Set(["search_text", "filter_text", "hide_text"]);
  const target = e.target;
  if (target && ids.has(target.id)) {
    return true;
  }

  const path = typeof e.composedPath === "function" ? e.composedPath() : [];
  for (const node of path) {
    if (node && ids.has(node.id)) {
      return true;
    }
  }

  return false;
}

function UseDateTimeFilterCheckboxChange(e) {
  // Enable/disable the date and time inputs
  const FilterStartDate = document.getElementById("filter_start_date");
  const FilterStartTime = document.getElementById("filter_start_time");

  FilterStartDate.disabled = !e.target.checked;
  FilterStartTime.disabled = !e.target.checked;

  vscode.postMessage({
    command: "toggle_datetime_filter",
    use_datetime_filter: e.target.checked
  });
}

function DateTimeFilterChange() {
  const FilterStartDate = document.getElementById("filter_start_date");
  const FilterStartTime = document.getElementById("filter_start_time");

  vscode.postMessage({
    command: "update_datetime_filter",
    filter_start_date: FilterStartDate.value,
    filter_start_time: FilterStartTime.value
  });
}
