import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TemplateState {
  name: string;
  subject: string;
  body: string;
  attachmentIds: string[];
  errors: string[];
}

const initialState: TemplateState = {
  name: '',
  subject: '',
  body: '',
  attachmentIds: [],
  errors: [],
};

export const templateSlice = createSlice({
  name: 'template',
  initialState,
  reducers: {
    setTemplateName(state, action: PayloadAction<string>) {
      state.name = action.payload;
    },
    setTemplateSubject(state, action: PayloadAction<string>) {
      state.subject = action.payload;
    },
    setTemplateBody(state, action: PayloadAction<string>) {
      state.body = action.payload;
    },
    setAttachmentIds(state, action: PayloadAction<string[]>) {
      state.attachmentIds = action.payload;
    },
    addAttachmentId(state, action: PayloadAction<string>) {
      if (!state.attachmentIds.includes(action.payload)) {
        state.attachmentIds.push(action.payload);
      }
    },
    removeAttachmentId(state, action: PayloadAction<string>) {
      state.attachmentIds = state.attachmentIds.filter(id => id !== action.payload);
    },
    setErrors(state, action: PayloadAction<string[]>) {
      state.errors = action.payload;
    },
    resetTemplateForm() {
      return initialState;
    },
  },
});

export const {
  setTemplateName,
  setTemplateSubject,
  setTemplateBody,
  setAttachmentIds,
  addAttachmentId,
  removeAttachmentId,
  setErrors,
  resetTemplateForm,
} = templateSlice.actions;

export default templateSlice.reducer;
