import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CampaignState {
  templateId: string;
  csvFileId: string;
  columnMapping: Record<string, string>;
  emailColumn: string;
  autoSend: boolean;
  step: number;
}

const initialState: CampaignState = {
  templateId: '',
  csvFileId: '',
  columnMapping: {},
  emailColumn: '',
  autoSend: false,
  step: 1,
};

export const campaignSlice = createSlice({
  name: 'campaign',
  initialState,
  reducers: {
    setCampaignTemplateId(state, action: PayloadAction<string>) {
      state.templateId = action.payload;
    },
    setCampaignCsvFileId(state, action: PayloadAction<string>) {
      state.csvFileId = action.payload;
    },
    setColumnMapping(state, action: PayloadAction<Record<string, string>>) {
      state.columnMapping = action.payload;
    },
    updateColumnMappingEntry(state, action: PayloadAction<{ key: string; value: string }>) {
      state.columnMapping[action.payload.key] = action.payload.value;
    },
    setEmailColumn(state, action: PayloadAction<string>) {
      state.emailColumn = action.payload;
    },
    setCampaignAutoSend(state, action: PayloadAction<boolean>) {
      state.autoSend = action.payload;
    },
    setCampaignStep(state, action: PayloadAction<number>) {
      state.step = action.payload;
    },
    resetCampaignForm() {
      return initialState;
    },
  },
});

export const {
  setCampaignTemplateId,
  setCampaignCsvFileId,
  setColumnMapping,
  updateColumnMappingEntry,
  setEmailColumn,
  setCampaignAutoSend,
  setCampaignStep,
  resetCampaignForm,
} = campaignSlice.actions;

export default campaignSlice.reducer;
